const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get unread notifications for a client
router.get('/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE client_id = ? ORDER BY created_at DESC',
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all as read for a client
router.put('/read-all/:client_id', async (req, res) => {
    const { client_id } = req.params;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE client_id = ?', [client_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all notifications for a client
router.delete('/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM notifications WHERE client_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
