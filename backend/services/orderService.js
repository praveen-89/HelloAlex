const orders = require('../database/orders.json');

// Active return requests (in-memory — in production this would be a DB)
const returnRequests = new Map();

/**
 * Find an order by its order ID (case-insensitive)
 */
function getOrderById(orderId) {
  if (!orderId) return null;
  const normalized = orderId.trim().toUpperCase();
  return orders.find((o) => o.order_id.toUpperCase() === normalized) || null;
}

/**
 * Find orders by product name (fuzzy match)
 */
function findOrderByProduct(productName) {
  if (!productName) return [];
  const lower = productName.toLowerCase();
  return orders.filter((o) => o.product.toLowerCase().includes(lower));
}

/**
 * Find orders by customer name
 */
function findOrderByCustomer(customerName) {
  if (!customerName) return [];
  const lower = customerName.toLowerCase();
  return orders.filter((o) => o.customer_name.toLowerCase().includes(lower));
}

/**
 * Extract order ID from user message
 */
function extractOrderId(message) {
  // Match ORD followed by 4+ digits
  const match = message.match(/\b(ORD\d{4,})\b/i);
  if (match) return match[1].toUpperCase();

  // Match "order 1001" or "order #1001"
  const numMatch = message.match(/order\s*#?\s*(\d{4,})/i);
  if (numMatch) return `ORD${numMatch[1]}`;

  return null;
}

/**
 * Create a return request for an order
 */
function createReturnRequest(orderId, reason = 'Customer requested return') {
  const order = getOrderById(orderId);

  if (!order) {
    return { success: false, message: `Order ${orderId} not found.` };
  }

  if (order.status === 'Cancelled') {
    return { success: false, message: `Order ${orderId} is already cancelled and cannot be returned.` };
  }

  if (order.status === 'Processing') {
    return {
      success: false,
      message: `Order ${orderId} is still processing. Please wait for delivery before requesting a return.`,
    };
  }

  if (order.status === 'Return Requested') {
    const existing = returnRequests.get(orderId);
    return {
      success: false,
      message: `A return has already been requested for order ${orderId}.`,
      returnId: existing?.returnId,
    };
  }

  const returnId = `RET${Date.now()}`;
  const returnEntry = {
    returnId,
    orderId,
    product: order.product,
    customerName: order.customer_name,
    reason,
    status: 'Return initiated — shipping label will be emailed within 24 hours',
    createdAt: new Date().toISOString(),
    estimatedRefund: `$${order.price.toFixed(2)}`,
    refundTimeline: '5-7 business days after item received',
  };

  returnRequests.set(orderId, returnEntry);

  return { success: true, ...returnEntry };
}

/**
 * Get order status summary for voice response
 */
function getOrderStatusSummary(order) {
  const statusMessages = {
    Processing: `Your order is currently being processed and will be shipped soon.`,
    Shipped: `Your order has been shipped and is on its way! Expected delivery: ${order.delivery_date}. Tracking: ${order.tracking_number}.`,
    'Out for Delivery': `Great news! Your order is out for delivery today. Keep an eye out for it!`,
    Delivered: `Your order was delivered on ${order.delivery_date}. We hope you love your ${order.product}!`,
    Cancelled: `Your order was cancelled. If you didn't request this, please contact us immediately.`,
    'Return Requested': `A return has been initiated for your order. You'll receive a shipping label by email within 24 hours.`,
  };

  return statusMessages[order.status] || `Your order status is: ${order.status}.`;
}

module.exports = {
  getOrderById,
  findOrderByProduct,
  findOrderByCustomer,
  extractOrderId,
  createReturnRequest,
  getOrderStatusSummary,
};
