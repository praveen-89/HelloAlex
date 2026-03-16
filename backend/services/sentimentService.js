// Keyword-based sentiment detection for fast, reliable classification
// Avoids extra Gemini API calls for this lightweight task

const ANGRY_SIGNALS = [
  'angry', 'furious', 'outraged', 'livid', 'mad',
  'terrible', 'awful', 'horrible', 'unacceptable', 'disgusting',
  'worst', 'pathetic', 'ridiculous', 'scam', 'fraud', 'lied',
  'never again', 'lawsuit', 'report', 'disappointed', 'fed up',
  'useless', 'incompetent', 'waste of time', 'absurd', 'ridiculous',
  'still waiting', 'weeks ago', 'months ago', 'no response',
  'no one helped', 'keep lying', 'false', 'misleading',
];

const POSITIVE_SIGNALS = [
  'thank', 'thanks', 'great', 'awesome', 'excellent', 'amazing',
  'fantastic', 'wonderful', 'love', 'perfect', 'happy', 'pleased',
  'satisfied', 'impressed', 'appreciate', 'helpful', 'brilliant',
  'super', 'glad', 'delighted', 'outstanding',
];

const FRUSTRATED_SIGNALS = [
  "still hasn't", 'still not', 'why is it', "can't believe",
  'how long', 'this is taking', 'been waiting', "doesn't work",
  "won't work", "didn't arrive", 'never arrived', 'not received',
];

function detectSentiment(message) {
  const lower = message.toLowerCase();

  const angryScore = ANGRY_SIGNALS.filter((w) => lower.includes(w)).length;
  const positiveScore = POSITIVE_SIGNALS.filter((w) => lower.includes(w)).length;
  const frustratedScore = FRUSTRATED_SIGNALS.filter((w) => lower.includes(w)).length;

  // Angry takes priority
  if (angryScore >= 1 || frustratedScore >= 2) {
    return 'angry';
  }

  if (frustratedScore >= 1) {
    return 'frustrated';
  }

  if (positiveScore >= 1 && angryScore === 0) {
    return 'positive';
  }

  return 'neutral';
}

function getEmpathyPrefix(sentiment) {
  const responses = {
    angry: [
      "I completely understand your frustration, and I'm truly sorry for the experience you've had.",
      "I sincerely apologize for this situation — your frustration is completely valid.",
      "I hear you, and I'm so sorry this has been your experience. Let me fix this right away.",
    ],
    frustrated: [
      "I understand this has been inconvenient, and I appreciate your patience.",
      "I'm sorry for the delay — let me get this sorted out for you immediately.",
    ],
  };

  const pool = responses[sentiment];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { detectSentiment, getEmpathyPrefix };
