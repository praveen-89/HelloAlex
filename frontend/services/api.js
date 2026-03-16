const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Send a query to the AI agent
 * @param {string} message - User message text
 * @param {string|null} conversationId - Existing conversation ID or null for new
 */
export async function sendQuery(message, conversationId = null) {
  const res = await fetch(`${API_BASE}/api/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Server error ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch all conversations for the dashboard
 */
export async function getConversations() {
  const res = await fetch(`${API_BASE}/api/agent/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

/**
 * Human agent sends a reply
 */
export async function sendHumanReply(conversationId, message, agentName = 'Support Agent') {
  const res = await fetch(`${API_BASE}/api/agent/human-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, agentName }),
  });
  if (!res.ok) throw new Error('Failed to send human reply');
  return res.json();
}

/**
 * Health check
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/test`);
  return res.json();
}
