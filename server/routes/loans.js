const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/pending', async (req, res) => {
    try {
        const sql =
            'SELECT p.loan_id, c.client_id, p.amount_org, p.interest_rate, p.month_term, CONCAT(c.first_name, " ", c.lastname, " ", c.lastname2) as nombre_completo FROM loans p JOIN clients c ON p.client_id = c.client_id WHERE p.approve_date IS NULL';
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/approve/:id', async (req, res) => {
    const { id } = req.params;

    // Get a valid employee ID (temporary fix)
    const [emps] = await db.query('SELECT emp_id FROM employees LIMIT 1');
    const emp_id_approved = emps.length > 0 ? emps[0].emp_id : null;

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
        await connection.query(
            'INSERT INTO notifications (client_id, message, type) VALUES (?, ?, ?)',
            [loan.client_id, `Your loan of $${loan.amount_org} has been approved and disbursed!`, 'success']
        );

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

// Reject Loan (Delete request)
router.post('/reject/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Only delete if it hasn't been approved yet
        const [loans] = await db.query('SELECT client_id, amount_org FROM loans WHERE loan_id = ?', [id]);
        if (loans.length === 0) return res.status(404).json({ message: "Loan not found" });

        const [result] = await db.query('DELETE FROM loans WHERE loan_id = ? AND approve_date IS NULL', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Loan request not found or already approved" });
        }

        await db.query(
            'INSERT INTO notifications (client_id, message, type) VALUES (?, ?, ?)',
            [loans[0].client_id, `Your loan request for $${loans[0].amount_org} has been rejected.`, 'error']
        );

        res.json({ success: true, message: "Loan request rejected and removed" });
    } catch (error) {
        console.error("Error rejecting loan:", error);
        res.status(500).json({ error: error.message });
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
        // We want to show:
        // 1. Regular Loans
        // 2. Credit Card Balances (treated as loans for payment purposes)

        const sql = `
            SELECT 
                l.loan_id, 
                l.client_id, 
                l.amount_org, 
                l.cap_balance, 
                l.month_term, 
                l.interest_rate, 
                l.approve_date, 
                'Personal Loan' as type,
                NULL as acc_id,
                NULL as balance
            FROM loans l
            WHERE l.client_id = ?
            
            UNION ALL
            
            SELECT 
                a.acc_id as loan_id, 
                a.client_id, 
                (a.balance + IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = a.acc_id AND trn_type = 'WITHDRAWAL'), 0) - IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = a.acc_id AND trn_type = 'DEPOSIT'), 0)) as amount_org, -- Calculated Limit
                (IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = a.acc_id AND trn_type = 'WITHDRAWAL'), 0) - IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = a.acc_id AND trn_type = 'DEPOSIT'), 0)) as cap_balance, -- Debt
                1 as month_term, 
                0 as interest_rate, 
                a.opening_date as approve_date, 
                'Credit Card' as type,
                a.acc_id,
                a.balance
            FROM account a
            WHERE a.client_id = ? AND a.account_type_id = 3
        `;

        const [rows] = await db.query(sql, [id, id]);

        // Filter out credit cards with 0 or negative debt (overpaid) if desired, 
        // but showing them allows seeing the available credit too.
        // We will map them to ensure proper formatting.

        const results = rows.map(row => ({
            ...row,
            isCreditCard: row.type === 'Credit Card',
            // Ensure numbers are numbers
            amount_org: parseFloat(row.amount_org),
            cap_balance: parseFloat(row.cap_balance),
            balance: parseFloat(row.balance)
        })).filter(row => row.cap_balance > 0); // Only show active debts

        res.json(results);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pay Loan or Credit Card
router.post('/pay/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, acc_id, isCreditCard } = req.body;

    if (!amount || amount <= 0 || !acc_id) {
        return res.status(400).json({ error: 'Invalid payment data' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check Paying Account Balance
        const [accounts] = await connection.query('SELECT balance FROM account WHERE acc_id = ?', [acc_id]);
        if (accounts.length === 0) throw new Error('Paying account not found');
        if (accounts[0].balance < amount) throw new Error('Insufficient funds');

        if (isCreditCard) {
            // --- CREDIT CARD PAYMENT LOGIC ---
            // id is the Credit Account ID (acc_id)
            const creditAccId = id;

            // Check Credit Account
            const [creditAcc] = await connection.query('SELECT balance FROM account WHERE acc_id = ? AND account_type_id = 3', [creditAccId]);
            if (creditAcc.length === 0) throw new Error('Credit account not found');

            // Calculate current debt
            const [debtRows] = await connection.query(`
                SELECT 
                    (IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = ? AND trn_type = 'WITHDRAWAL'), 0) - 
                     IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = ? AND trn_type = 'DEPOSIT'), 0)) as debt
            `, [creditAccId, creditAccId]);

            const currentDebt = parseFloat(debtRows[0].debt || 0);

            if (amount > currentDebt) {
                throw new Error(`Payment amount ($${amount}) exceeds current debt ($${currentDebt.toFixed(2)})`);
            }

            // Deduct from Paying Account
            await connection.query('UPDATE account SET balance = balance - ? WHERE acc_id = ?', [amount, acc_id]);

            // Add to Credit Account (Increase available limit)
            await connection.query('UPDATE account SET balance = balance + ? WHERE acc_id = ?', [amount, creditAccId]);

            // Record Transactions
            const date = new Date();
            // Withdrawal from Paying Account
            await connection.query(
                'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
                [acc_id, 'WITHDRAWAL', `Payment to Credit Card #${creditAccId}`, date, amount]
            );
            // Deposit to Credit Account (Payment)
            await connection.query(
                'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
                [creditAccId, 'DEPOSIT', `Payment from Account #${acc_id}`, date, amount]
            );

            await connection.commit();
            res.json({ success: true, message: 'Credit card payment successful' });

        } else {
            // --- LOAN PAYMENT LOGIC ---

            // 2. Check Loan Balance
            const [loans] = await connection.query('SELECT cap_balance FROM loans WHERE loan_id = ?', [id]);
            if (loans.length === 0) throw new Error('Loan not found');
            const currentBalance = parseFloat(loans[0].cap_balance);

            // Prevent overpayment
            if (amount > currentBalance) {
                throw new Error(`Payment amount exceeds loan balance ($${currentBalance})`);
            }

            // 3. Deduct from Account
            await connection.query('UPDATE account SET balance = balance - ? WHERE acc_id = ?', [amount, acc_id]);

            // 4. Record Transaction
            await connection.query(
                'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
                [acc_id, 'WITHDRAWAL', `Loan Payment #${id}`, new Date(), amount]
            );

            // 5. Update Loan Balance
            await connection.query('UPDATE loans SET cap_balance = cap_balance - ? WHERE loan_id = ?', [amount, id]);

            // 6. Check if loan is fully paid
            const newBalance = currentBalance - amount;
            if (newBalance <= 0) {
                await connection.query('DELETE FROM loans WHERE loan_id = ?', [id]);
            }

            await connection.commit();
            res.json({ success: true, message: newBalance <= 0 ? 'Loan fully paid and closed!' : 'Payment successful' });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;