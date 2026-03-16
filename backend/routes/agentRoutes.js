const express = require('express');
const router = express.Router();
const { handleQuery, getConversations, handleHumanReply } = require('../controllers/agentController');

// POST /api/agent/query — Main AI agent endpoint
router.post('/query', handleQuery);

// GET /api/agent/conversations — Fetch all conversation sessions (dashboard)
router.get('/conversations', getConversations);

// POST /api/agent/human-reply — Human agent sends a reply
router.post('/human-reply', handleHumanReply);

module.exports = router;
