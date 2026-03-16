/**
 * In-memory conversation memory store.
 * In production, this would be backed by Redis or a database.
 */

const conversations = new Map();

/**
 * Create a new conversation session
 */
function createConversation(conversationId) {
  const conv = {
    conversationId,
    messages: [],
    context: 'initial',        // Current state: initial | waiting_for_order_id | processing_return | faq_conversation | escalated
    intent: null,              // Last detected intent
    sentiment: 'neutral',     // Last detected sentiment
    orderContext: null,        // Currently referenced order
    isEscalated: false,
    ticketId: null,
    humanAgentName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };
  conversations.set(conversationId, conv);
  return conv;
}

/**
 * Retrieve a conversation by ID
 */
function getConversation(conversationId) {
  return conversations.get(conversationId) || null;
}

/**
 * Add a message to a conversation
 */
function addMessage(conversationId, role, content, metadata = {}) {
  let conv = conversations.get(conversationId);
  if (!conv) {
    conv = createConversation(conversationId);
  }

  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    role,   // 'user' | 'assistant' | 'human-agent'
    content,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  conv.messages.push(message);
  conv.messageCount++;
  conv.updatedAt = new Date().toISOString();
  conversations.set(conversationId, conv);

  return message;
}

/**
 * Update conversation context and metadata
 */
function updateContext(conversationId, updates = {}) {
  const conv = conversations.get(conversationId);
  if (!conv) return null;

  Object.assign(conv, { ...updates, updatedAt: new Date().toISOString() });
  conversations.set(conversationId, conv);
  return conv;
}

/**
 * Get Gemini-compatible chat history (user/model roles only)
 */
function getChatHistory(conversationId) {
  const conv = conversations.get(conversationId);
  if (!conv) return [];

  return conv.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20) // Keep last 20 messages for context window
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));
}

/**
 * Get all active conversations (for dashboard)
 */
function getAllConversations() {
  return Array.from(conversations.values()).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

/**
 * Get total conversation stats
 */
function getStats() {
  const all = getAllConversations();
  return {
    total: all.length,
    escalated: all.filter((c) => c.isEscalated).length,
    active: all.filter((c) => !c.isEscalated).length,
    byIntent: all.reduce((acc, c) => {
      if (c.intent) acc[c.intent] = (acc[c.intent] || 0) + 1;
      return acc;
    }, {}),
    bySentiment: all.reduce((acc, c) => {
      acc[c.sentiment] = (acc[c.sentiment] || 0) + 1;
      return acc;
    }, {}),
  };
}

module.exports = {
  createConversation,
  getConversation,
  addMessage,
  updateContext,
  getChatHistory,
  getAllConversations,
  getStats,
};
