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
    const { id } = req.params;
    const emp_id_approved = 1; // ID del empleado que aprueba (podría venir del token)

    let connection;

    try {
        // Obtenemos una conexión exclusiva para hacer una transacción segura
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Obtener datos del préstamo para saber monto y plazo
        const [loans] = await connection.query('SELECT * FROM loans WHERE loan_id = ?', [id]);

        if (loans.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Loan not found' });
        }
        const loan = loans[0];

        // 2. Calculate dates
        const today = new Date();
        const disburDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

        // Calcular vencimiento sumando los meses del plazo
        const expDate = new Date(today);
        expDate.setMonth(expDate.getMonth() + loan.month_term);
        const expirationDate = expDate.toISOString().slice(0, 10);

        // 3. Actualizar el préstamo (Aprobar, Desembolsar, Vencimiento)
        await connection.query(
            'UPDATE loans SET approve_date = ?, disbur_date = ?, expiration_date = ?, emp_id_approved = ? WHERE loan_id = ?',
            [disburDate, disburDate, expirationDate, emp_id_approved, id]
        );

        // 4. Lógica de Desembolso: Depositar el dinero en la cuenta del cliente
        // Buscamos la primera cuenta activa del cliente
        const [accounts] = await connection.query('SELECT acc_id FROM account WHERE client_id = ? LIMIT 1', [loan.client_id]);

        if (accounts.length > 0) {
            const acc_id = accounts[0].acc_id;

            // A) Actualizar saldo de la cuenta
            await connection.query('UPDATE account SET balance = balance + ? WHERE acc_id = ?', [loan.amount_org, acc_id]);

            // B) Registrar la transacción en el historial
            await connection.query(
                'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
                [acc_id, 'DEPOSIT', `Disbursement Loan #${id}`, new Date(), loan.amount_org]
            );
        }

        // Confirmar todos los cambios
        await connection.commit();
        res.json({ message: 'Loan approved and disbursed successfully' });

    } catch (error) {
        // Si algo falla, revertimos todo
        if (connection) await connection.rollback();
        console.error("Error in approval:", error);
        res.status(500).json({ error: error.message });
    } finally {
        // Liberar la conexión
        if (connection) connection.release();
    }
});

// Solicitud de préstamo por parte del cliente
router.post('/request', async (req, res) => {
    const { client_id, amount, months } = req.body;

    // Validaciones básicas de negocio
    if (amount <= 0 || months <= 0) {
        return res.status(400).json({ message: "Invalid data" });
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

        res.json({ message: "Loan request sent for approval" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM loans WHERE client_id = ? ORDER BY loan_id DESC', [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;