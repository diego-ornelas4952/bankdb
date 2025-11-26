const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Contratar un nuevo seguro
router.post('/contract', async (req, res) => {
    const { client_id, ins_type, premium, beneficiary } = req.body;

    if (!client_id || !ins_type || !premium || !beneficiary) {
        return res.status(400).json({ message: "Missing required data" });
    }

    try {
        // Calculate opening commission (e.g. 5% of the premium)
        const opening_comm = parseFloat(premium) * 0.05;

        await db.query(
            'INSERT INTO insurance (client_id, ins_type, premium, beneficiary, opening_comm) VALUES (?, ?, ?, ?, ?)',
            [client_id, ins_type, premium, beneficiary, opening_comm]
        );

        res.json({ success: true, message: "Insurance contract successfully" });
    } catch (error) {
        console.error("Error contracting insurance:", error);
        res.status(500).json({ error: "Error contracting insurance" });
    }
});

// Obtener seguros de un usuario
router.get('/user/:client_id', async (req, res) => {
    try {
        const [insurances] = await db.query('SELECT * FROM insurance WHERE client_id = ?', [req.params.client_id]);
        res.json(insurances);
    } catch (error) {
        console.error("Error contracting insurance:", error);
        res.status(500).json({ error: "Error contracting insurance" });
    }
});

// Cancelar seguro
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
