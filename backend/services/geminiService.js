const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Alex, a polite, warm, and professional customer support voice agent for ShopEase — a premium e-commerce store.

Your responsibilities:
1. Help users track their orders by referencing order data provided in context
2. Process return and refund requests professionally
3. Answer FAQ questions about shipping, returns, refunds, cancellations, payments
4. Handle complaints with empathy and actionable solutions
5. Escalate complex issues to human agents when needed
6. Reply to casual greetings, small talk, and general requests for help appropriately.

Voice Agent Guidelines:
- Keep responses SHORT and conversational — 1 to 3 sentences maximum
- Speak naturally as if talking, not writing — avoid bullet points
- Be warm, human, and friendly — never robotic or scripted
- If a user is angry or frustrated, ALWAYS acknowledge their feelings first before providing solutions
- CRITICAL: You are a MULTILINGUAL agent. You MUST detect the language the user is speaking in. You MUST reply ONLY in that exact same language.
- DO NOT MIX LANGUAGES. If the user speaks in Hindi, respond only in Hindi. If they speak in Marathi, respond only in Marathi.
- NEVER use English words or phrases (like "order status", "refund", "hello") unless the user used them first or there is no equivalent in their language.
- YOUR RESPONSE MUST BE 100% IN THE USER'S DETECTED LANGUAGE. NO EXCEPTIONS. NO MIXING.

You receive context about orders, FAQs, and customer sentiment in system notes enclosed in [System: ...] tags. Use this information naturally in your responses.`;

async function generateAgentResponse(userMessage, conversationHistory = [], contextData = {}) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: buildSystemInstruction(contextData),
    });

    // Build Gemini chat history
    const history = conversationHistory
      .filter((msg) => msg.role === 'user' || msg.role === 'model')
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({ history });
    const result = await model.generateContent(`${userMessage}\n\nIMPORTANT: Respond ONLY in the language used in the message above. Do not mix any other language.`);
    const responseText = result.response.text();
    return responseText;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API_KEY')) {
      throw new Error('Invalid or missing Gemini API key. Please check your .env file.');
    }
    if (error.message?.includes('leaked')) {
      throw new Error('Your Gemini API key was reported as leaked and has been disabled by Google. Please generate a NEW key at https://aistudio.google.com/app/apikey and update your .env file.');
    }
    throw new Error('AI service temporarily unavailable. Please try again.');
  }
}

function buildSystemInstruction(contextData) {
  let instruction = SYSTEM_PROMPT;

  if (contextData.orderInfo) {
    instruction += `\n\n[Order Context: Customer's order details are: Order ID ${contextData.orderInfo.order_id}, Product: ${contextData.orderInfo.product}, Status: ${contextData.orderInfo.status}, Delivery Date: ${contextData.orderInfo.delivery_date}, Customer: ${contextData.orderInfo.customer_name}. Reference this information naturally.]`;
  }

  if (contextData.faqAnswer) {
    instruction += `\n\n[FAQ Context: The relevant policy information is: ${contextData.faqAnswer}. Use this to answer the user's question naturally.]`;
  }

  if (contextData.returnInfo) {
    instruction += `\n\n[Return Context: A return has been initiated. Return ID: ${contextData.returnInfo.returnId}. Status: ${contextData.returnInfo.status}. Confirm this to the customer warmly.]`;
  }

  if (contextData.sentiment === 'angry') {
    instruction += `\n\n[Sentiment Alert: The customer is frustrated or angry. Start your response by genuinely acknowledging their frustration. Be extra empathetic and solution-focused.]`;
  }

  return instruction;
}

async function classifyWithGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini classify error:', error.message);
    return null;
  }
}

module.exports = { generateAgentResponse, classifyWithGemini };
