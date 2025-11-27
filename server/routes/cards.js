const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get client cards
router.get('/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Join with account_types to get type_name
        const [rows] = await db.query(
            'SELECT c.*, at.type_name as acc_type, a.currency FROM card c JOIN account a ON c.acc_id = a.acc_id JOIN account_types at ON a.account_type_id = at.type_id WHERE a.client_id = ?',
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Debit Card
router.post('/create', async (req, res) => {
    const { acc_id } = req.body;
    try {
        const cardNumber = '4' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
        const cvv = Math.floor(Math.random() * 900 + 100).toString();
        const today = new Date();
        const year = today.getFullYear() + 5;
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const expirationDate = `${year}-${month}-01`;

        await db.query(
            'INSERT INTO card (acc_id, card_num, cvv, exp_date, card_type) VALUES (?, ?, ?, ?, ?)',
            [acc_id, cardNumber, cvv, expirationDate, 'DEBIT']
        );

        res.json({ success: true, message: 'Debit card created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request Credit Card
router.post('/request-credit', async (req, res) => {
    const { client_id } = req.body;
    try {
        // Check if user already has a CREDIT account (account_type_id = 3)
        const [existingAccounts] = await db.query('SELECT * FROM account WHERE client_id = ? AND account_type_id = 3', [client_id]);
        if (existingAccounts.length > 0) {
            return res.status(400).json({ message: "You already have an active Credit Card." });
        }

        // Check if user already has a PENDING request
        const [pendingRequests] = await db.query("SELECT * FROM card_requests WHERE client_id = ? AND status = 'PENDING'", [client_id]);
        if (pendingRequests.length > 0) {
            return res.status(400).json({ message: "You already have a pending Credit Card request." });
        }

        // Create table if not exists (Updated ENUM)
        await db.query(`
            CREATE TABLE IF NOT EXISTS card_requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT,
                request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING'
            )
        `);

        await db.query('INSERT INTO card_requests (client_id, status) VALUES (?, ?)', [client_id, 'PENDING']);

        res.json({ success: true, message: 'Credit card request sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending card requests (Admin)
router.get('/requests', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, c.first_name as name, c.lastname 
            FROM card_requests r 
            JOIN clients c ON r.client_id = c.client_id 
            WHERE r.status = 'PENDING'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get client requests
router.get('/requests/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM card_requests WHERE client_id = ?', [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve card request (Admin)
router.post('/approve/:id', async (req, res) => {
    const { id } = req.params;
    const { credit_limit } = req.body;

    if (!credit_limit) {
        return res.status(400).json({ error: 'Credit limit is required' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get request details
        const [requests] = await connection.query('SELECT * FROM card_requests WHERE request_id = ?', [id]);
        if (requests.length === 0) {
            throw new Error('Request not found');
        }
        const request = requests[0];

        // 2. Create Credit Account (account_type_id = 3 for CREDIT)
        const [accResult] = await connection.query(
            'INSERT INTO account (client_id, balance, account_type_id, currency, branch_id) VALUES (?, ?, ?, ?, ?)',
            [request.client_id, credit_limit, 3, 'MXN', 1]
        );
        const accId = accResult.insertId;

        // 3. Create Credit Card
        const cardNumber = '5' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
        const cvv = Math.floor(Math.random() * 900 + 100).toString();
        const today = new Date();
        const year = today.getFullYear() + 5;
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const expirationDate = `${year}-${month}-01`;

        await connection.query(
            'INSERT INTO card (acc_id, card_num, cvv, exp_date, card_type) VALUES (?, ?, ?, ?, ?)',
            [accId, cardNumber, cvv, expirationDate, 'CREDIT']
        );

        // 4. Update Request Status
        await connection.query('UPDATE card_requests SET status = ? WHERE request_id = ?', ['APPROVED', id]);

        // 5. Notify Client
        await connection.query(
            'INSERT INTO notifications (client_id, message, type) VALUES (?, ?, ?)',
            [request.client_id, `Your credit card request has been approved with a limit of $${credit_limit}.`, 'success']
        );

        await connection.commit();
        res.json({ success: true, message: 'Credit card approved and created successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Reject card request
router.post('/reject/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Get client_id before updating
        const [requests] = await db.query('SELECT client_id FROM card_requests WHERE request_id = ?', [id]);
        if (requests.length === 0) return res.status(404).json({ message: "Request not found" });

        const [result] = await db.query("UPDATE card_requests SET status = 'REJECTED' WHERE request_id = ? AND status = 'PENDING'", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found or already processed" });
        }

        await db.query(
            'INSERT INTO notifications (client_id, message, type) VALUES (?, ?, ?)',
            [requests[0].client_id, `Your credit card request has been rejected.`, 'error']
        );

        res.json({ success: true, message: "Card request rejected" });
    } catch (error) {
        console.error("Error rejecting card request:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete card
router.delete('/:card_num', async (req, res) => {
    const { card_num } = req.params;
    try {
        await db.query('DELETE FROM card WHERE card_num = ?', [card_num]);
        res.json({ success: true, message: "Card deleted successfully" });
    } catch (error) {
        console.error("Error deleting card:", error);
        res.status(500).json({ error: "Error deleting card" });
    }
});

module.exports = router;
