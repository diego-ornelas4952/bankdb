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

// Solicitud de préstamo por parte del cliente
router.post('/solicitar', async (req, res) => {
    const { client_id, amount, months } = req.body;

    // Validaciones básicas de negocio
    if (amount <= 0 || months <= 0) {
        return res.status(400).json({ message: "Datos inválidos" });
    }

    try {
        // Insertamos en 'loans'. 
        // Nota: cap_balance inicia igual al monto original. tolerance inicia en 0.
        const sql = `
            INSERT INTO loans 
            (client_id, amount_org, cap_balance, month_term, interest_rate, tolerance, approve_date) 
            VALUES (?, ?, ?, ?, 15.0, 0, NULL)
        `;
        // Asumimos una tasa fija del 15.0% por ahora
        await db.query(sql, [client_id, amount, amount, months]);

        res.json({ message: "Solicitud enviada a revisión" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;