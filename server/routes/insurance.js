const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Contract new insurance
router.post('/contract', async (req, res) => {
    const { client_id, ins_type, premium, beneficiary, duration } = req.body;

    if (!client_id || !ins_type || !premium || !beneficiary || !duration) {
        return res.status(400).json({ message: "Missing required data" });
    }

    try {
        // Check limit (Max 3 insurances)
        const [existing] = await db.query('SELECT COUNT(*) as count FROM insurance WHERE client_id = ?', [client_id]);
        if (existing[0].count >= 3) {
            return res.status(400).json({ message: "Maximum insurance limit reached (3 policies)" });
        }

        // Calculate opening commission (e.g. 5% of the premium)
        const opening_comm = parseFloat(premium) * 0.05;

        await db.query(
            'INSERT INTO insurance (client_id, ins_type, premium, beneficiary, opening_comm, duration_months) VALUES (?, ?, ?, ?, ?, ?)',
            [client_id, ins_type, premium, beneficiary, opening_comm, duration]
        );

        res.json({ success: true, message: "Insurance contract successfully" });
    } catch (error) {
        console.error("Error contracting insurance:", error);
        res.status(500).json({ error: "Error contracting insurance" });
    }
});

// Get user insurances
router.get('/user/:client_id', async (req, res) => {
    try {
        const [insurances] = await db.query('SELECT * FROM insurance WHERE client_id = ?', [req.params.client_id]);
        res.json(insurances);
    } catch (error) {
        console.error("Error contracting insurance:", error);
        res.status(500).json({ error: "Error contracting insurance" });
    }
});

// Cancel insurance
router.delete('/:ins_id', async (req, res) => {
    const { ins_id } = req.params;
    try {
        await db.query('DELETE FROM insurance WHERE ins_id = ?', [ins_id]);
        res.json({ success: true, message: "Insurance cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling insurance:", error);
        res.status(500).json({ error: "Error cancelling insurance" });
    }
});

module.exports = router;
