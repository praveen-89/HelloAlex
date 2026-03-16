const { classifyWithGemini } = require('./geminiService');

const VALID_INTENTS = ['order_status', 'return_request', 'faq', 'complaint', 'greeting', 'unknown'];

// Fast keyword-based pre-classification (fallback / speed boost)
function quickClassify(message) {
  const lower = message.toLowerCase();

  const patterns = {
    greeting: [
      'hello', 'hi ', 'hey', 'help', 'namaste', 'kem cho', 'hola', 'hallo', 'bonjour', 'sup', 'how are you', 'howdy', 'good morning', 'good afternoon', 'good evening', 'need your help', 'i need help', 'hii', 
      'annyeong', '안녕하세요', 'salut', 'ciao', 'privet', 'привет', 'nǐ hǎo', '你好', 'konnichiwa', 'こんにちは', 'guten tag'
    ],
    order_status: [
      'where is my order', 'order status', 'track', 'tracking', 'shipped',
      'delivery', 'when will', 'arrive', 'package', 'order id', 'ord',
    ],
    return_request: [
      'return', 'refund', 'send back', 'exchange', 'broken', 'damaged',
      'defective', 'wrong item', 'not working', 'give back', 'I want return', 'I want refund', 'I want to exchange my product',
    ],
    faq: [
      'how long', 'shipping policy', 'return policy', 'cancel', 'cancellation',
      'payment', 'promo code', 'warranty', 'international', 'how do i',
      'what is', 'do you', 'password', 'reset',
    ],
    complaint: [
      'terrible', 'awful', 'horrible', 'worst', 'unacceptable', 'disgusting',
      'angry', 'furious', 'disappointed', 'scam', 'fraud', 'lied', 'pathetic',
      'ridiculous', 'never again', 'complaint', 'complain',
    ],
  };

  let bestIntent = 'unknown';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(patterns)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return { intent: bestIntent, confidence: bestScore > 0 ? Math.min(0.6 + bestScore * 0.1, 0.9) : 0 };
}

async function detectIntent(message) {
  // Try fast classification first
  const quick = quickClassify(message);

  // If confident enough, skip Gemini call
  if (quick.confidence >= 0.7 && quick.intent !== 'unknown') {
    return quick;
  }

  // Use Gemini for ambiguous cases
  const prompt = `Classify the following customer support message into exactly one intent category.

Categories:
- greeting: Customer is saying hello, asking for help generally, or making casual conversation
- order_status: Customer wants to track, check, or inquire about an order's whereabouts or delivery
- return_request: Customer wants to return, exchange, or get a refund for a product
- faq: Customer has a general question about policies, shipping times, payment, warranties, accounts
- complaint: Customer is expressing dissatisfaction, frustration, or making a complaint about products/service
- unknown: Message doesn't fit any category or is too ambiguous

Customer message: "${message}"

Respond ONLY with valid JSON in this exact format:
{"intent": "<category>", "confidence": <number between 0 and 1>}`;

  const result = await classifyWithGemini(prompt);

  if (result && VALID_INTENTS.includes(result.intent)) {
    return { intent: result.intent, confidence: result.confidence || 0.8 };
  }

  return quick.intent !== 'unknown' ? quick : { intent: 'unknown', confidence: 0 };
}

module.exports = { detectIntent };
