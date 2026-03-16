let counter = 1000 + Math.floor(Math.random() * 100);

/**
 * Generate a unique support ticket ID
 * Format: TICKET-XXXX (incrementing, with randomization to avoid prediction)
 */
function generateTicketId() {
  counter += Math.floor(Math.random() * 3) + 1; // Non-sequential for security
  return `TICKET-${counter}`;
}

/**
 * Generate a return request ID
 */
function generateReturnId() {
  return `RET-${Date.now().toString(36).toUpperCase()}`;
}

module.exports = { generateTicketId, generateReturnId };
