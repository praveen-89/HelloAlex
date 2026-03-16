const { generateAgentResponse } = require('../services/geminiService');
const { detectIntent } = require('../services/intentService');
const { detectSentiment } = require('../services/sentimentService');
const {
  getOrderById,
  findOrderByProduct,
  extractOrderId,
  createReturnRequest,
  getOrderStatusSummary,
} = require('../services/orderService');
const {
  createConversation,
  getConversation,
  addMessage,
  updateContext,
  getChatHistory,
  getAllConversations,
  getStats,
} = require('../services/memoryService');
const { generateTicketId } = require('../utils/ticketGenerator');
const faq = require('../database/faq.json');
const crypto = require('crypto');

// ─── POST /api/agent/query ────────────────────────────────────────────────────
async function handleQuery(req, res) {
  try {
    const { message, conversationId: existingId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and cannot be empty.' });
    }

    const conversationId = existingId || crypto.randomUUID();
    let conv = getConversation(conversationId) || createConversation(conversationId);

    // Run intent detection and sentiment analysis concurrently
    const [intentResult, sentiment] = await Promise.all([
      detectIntent(message),
      Promise.resolve(detectSentiment(message)),
    ]);
    const { intent, confidence } = intentResult;

    // ── Human Escalation ───────────────────────────────────────────────────────
    if (intent === 'unknown' || confidence < 0.35) {
      const ticketId = generateTicketId();
      const escalationMsg =
        `I'm sorry, I wasn't able to fully understand your request. ` +
        `I've created a support ticket for you — **${ticketId}**. ` +
        `A human agent will reach out within 24 hours. Is there anything else I can help clarify?`;

      addMessage(conversationId, 'user', message, { intent, sentiment });
      addMessage(conversationId, 'assistant', escalationMsg, { isEscalation: true });
      updateContext(conversationId, {
        intent: 'unknown',
        sentiment,
        isEscalated: true,
        ticketId,
        context: 'escalated',
      });

      return res.json({
        conversationId,
        response: escalationMsg,
        intent: 'unknown',
        sentiment,
        confidence,
        isEscalated: true,
        ticketId,
      });
    }

    // ── Context Building ───────────────────────────────────────────────────────
    const contextData = { sentiment };

    // Order lookup — extract from message or previous conversation context
    let orderId = extractOrderId(message);

    // If we were waiting for an order ID from previous turn
    if (!orderId && conv.context === 'waiting_for_order_id') {
      const numMatch = message.match(/\b\d{4,}\b/);
      if (numMatch) orderId = `ORD${numMatch[0]}`;
    }

    if (orderId) {
      const order = getOrderById(orderId);
      if (order) {
        contextData.orderInfo = order;
        contextData.orderSummary = getOrderStatusSummary(order);
      }
    }

    // Product name lookup if no order ID found
    if (!contextData.orderInfo && (intent === 'order_status' || intent === 'return_request')) {
      const productWords = message.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
      if (productWords) {
        for (const word of productWords) {
          const found = findOrderByProduct(word);
          if (found.length > 0) {
            contextData.orderInfo = found[0];
            contextData.orderSummary = getOrderStatusSummary(found[0]);
            break;
          }
        }
      }
    }

    // Prompt for order ID if still missing
    if (!contextData.orderInfo && (intent === 'order_status' || intent === 'return_request')) {
      updateContext(conversationId, { context: 'waiting_for_order_id' });
    }

    // FAQ matching
    if (intent === 'faq') {
      const lower = message.toLowerCase();
      const matched = faq.find((f) => f.keywords.some((kw) => lower.includes(kw)));
      if (matched) contextData.faqAnswer = matched.answer;
    }

    // Return request handling
    if (intent === 'return_request' && contextData.orderInfo) {
      // Only create return if explicitly requested
      const returnSignals = ['return', 'send back', 'give back', 'exchange', 'refund'];
      const wantsReturn = returnSignals.some((s) => message.toLowerCase().includes(s));
      if (wantsReturn) {
        const returnResult = createReturnRequest(contextData.orderInfo.order_id, message);
        contextData.returnInfo = returnResult;
      }
    }

    // ── Build enriched message for Gemini ─────────────────────────────────────
    let enrichedMessage = message;
    if (contextData.orderSummary)
      enrichedMessage += `\n[System: ${contextData.orderSummary}]`;
    if (contextData.faqAnswer)
      enrichedMessage += `\n[System: Policy: ${contextData.faqAnswer}]`;
    if (contextData.returnInfo?.success)
      enrichedMessage += `\n[System: Return created — ID: ${contextData.returnInfo.returnId}, Refund: ${contextData.returnInfo.estimatedRefund} within ${contextData.returnInfo.refundTimeline}]`;
    if (contextData.returnInfo && !contextData.returnInfo.success)
      enrichedMessage += `\n[System: Return failed: ${contextData.returnInfo.message}]`;

    // ── Gemini AI Response ─────────────────────────────────────────────────────
    const chatHistory = getChatHistory(conversationId);
    addMessage(conversationId, 'user', message, { intent, sentiment });

    const aiResponse = await generateAgentResponse(enrichedMessage, chatHistory, contextData);

    addMessage(conversationId, 'assistant', aiResponse);
    updateContext(conversationId, {
      intent,
      sentiment,
      orderContext: contextData.orderInfo || conv.orderContext,
      context: contextData.orderInfo ? intent : conv.context === 'waiting_for_order_id' ? 'waiting_for_order_id' : intent,
    });

    return res.json({
      conversationId,
      response: aiResponse,
      intent,
      sentiment,
      confidence,
      isEscalated: false,
      orderInfo: contextData.orderInfo || null,
      returnInfo: contextData.returnInfo || null,
    });
  } catch (error) {
    console.error('❌ Query handler error:', error.message);
    const fallback = "I'm experiencing a technical issue right now. Please try again in a moment or contact support directly.";
    return res.status(500).json({
      error: 'Service error',
      response: fallback,
      message: error.message,
    });
  }
}

// ─── GET /api/agent/conversations ─────────────────────────────────────────────
async function getConversations(req, res) {
  try {
    const conversations = getAllConversations();
    const stats = getStats();
    res.json({ conversations, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// ─── POST /api/agent/human-reply ──────────────────────────────────────────────
async function handleHumanReply(req, res) {
  try {
    const { conversationId, message, agentName = 'Support Agent' } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ error: 'conversationId and message are required.' });
    }

    const conv = getConversation(conversationId);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    addMessage(conversationId, 'human-agent', message, { agentName });
    updateContext(conversationId, { humanAgentName: agentName, context: 'human_takeover' });

    res.json({
      success: true,
      conversationId,
      agentName,
      message: 'Human reply added successfully.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send human reply' });
  }
}

module.exports = { handleQuery, getConversations, handleHumanReply };
