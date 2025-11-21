const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/pending', async (req, res) => {
    try {
        const sql =
            'SELECT p.loan_id, c.client_id, p.amount_org, p.interest_rate, p.month_term, CONCAT(c.name, " ", c.lastname, " ", c.lastname2) as nombre_completo FROM loans p JOIN clients c ON p.client_id = c.client_id WHERE p.approve_date IS NULL';
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id_approved = 1;
        const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        try {
            await db.query(
                'UPDATE loans SET approve_date = ?, emp_id_approved = ? WHERE loan_id = ?',
                [todayDate, emp_id_approved, id]
            );
            res.json({ message: 'Loan approved successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;