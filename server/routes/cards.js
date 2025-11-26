const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get client cards
router.get('/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT c.*, a.acc_type, a.currency FROM card c JOIN account a ON c.acc_id = a.acc_id WHERE a.client_id = ?',
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
            [acc_id, cardNumber, cvv, expirationDate, 'Debit']
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
        // Create table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS card_requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT,
                request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'Pending'
            )
        `);

        await db.query('INSERT INTO card_requests (client_id) VALUES (?)', [client_id]);

        res.json({ success: true, message: 'Credit card request sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending card requests (Admin)
router.get('/requests', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, c.name, c.lastname 
            FROM card_requests r 
            JOIN clients c ON r.client_id = c.client_id 
            WHERE r.status = 'Pending'
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

        // 2. Create Credit Account
        const [accResult] = await connection.query(
            'INSERT INTO account (client_id, balance, acc_type, currency, branch_id) VALUES (?, ?, ?, ?, ?)',
            [request.client_id, credit_limit, 'Credit', 'MXN', 1]
        );
        const accId = accResult.insertId;

        // 3. Create Credit Card
        const cardNumber = '5' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0'); // Visa/Mastercard start with 5 usually, but let's stick to 16 digits
        const cvv = Math.floor(Math.random() * 900 + 100).toString();
        const today = new Date();
        const year = today.getFullYear() + 5;
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const expirationDate = `${year}-${month}-01`;

        await connection.query(
            'INSERT INTO card (acc_id, card_num, cvv, exp_date, card_type) VALUES (?, ?, ?, ?, ?)',
            [accId, cardNumber, cvv, expirationDate, 'Credit']
        );

        // 4. Update Request Status
        await connection.query('UPDATE card_requests SET status = ? WHERE request_id = ?', ['Approved', id]);

        await connection.commit();
        res.json({ success: true, message: 'Credit card approved and created successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
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
