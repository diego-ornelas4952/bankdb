const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/usuario/:client_id', async (req, res) => {
    const { client_id } = req.params;
    try {
        const [accounts] = await db.query(
            `SELECT a.*, t.type_name as acc_type 
             FROM account a 
             JOIN account_types t ON a.account_type_id = t.type_id 
             WHERE a.client_id = ?`,
            [client_id]
        );
        res.json(accounts);
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ error: 'Error getting accounts' });
    }
});

router.get('/:acc_id/transactions', async (req, res) => {
    const { acc_id } = req.params;
    try {
        const [transactions] = await db.query(
            'SELECT * FROM transactions WHERE acc_id = ? ORDER BY date_time DESC LIMIT 10',
            [acc_id]
        );
        res.json(transactions);
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ error: 'Error getting transactions' });
    }
});

// Get cards for a specific account
router.get('/:acc_id/cards', async (req, res) => {
    const { acc_id } = req.params;
    const [cards] = await db.query('SELECT * FROM card WHERE acc_id = ?', [acc_id]);
    res.json(cards);
});

// Create new transaction (Deposit or Withdrawal)
router.post('/transaction', async (req, res) => {
    const { acc_id, type, amount, description } = req.body;

    if (!acc_id || !type || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid data" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check balance if withdrawal
        // 1. Get account information
        const [accounts] = await connection.query('SELECT balance, account_type_id FROM account WHERE acc_id = ?', [acc_id]);
        if (accounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Account not found" });
        }
        const account = accounts[0];
        const currentBalance = parseFloat(account.balance);
        let txnAmount = parseFloat(amount);
        let finalInstallments = 1;
        let finalDesc = description;

        // 2. Validaciones según tipo de cuenta
        if (account.account_type_id === 3) { // Credit
            if (type === 'DEPOSIT') {
                await connection.rollback();
                return res.status(400).json({ message: "Deposits are not allowed for Credit Accounts. Use 'Pay Card' instead." });
            }
            // Apply installments logic
            if (type === 'WITHDRAWAL' && req.body.installments > 1) {
                finalInstallments = req.body.installments;
                txnAmount = txnAmount * 1.02; // Add 2% interest
                finalDesc = (description || 'Purchase') + ` (${finalInstallments} months)`;
            }
        }

        // 3. Check funds for withdrawal (applies to all)
        if (type === 'WITHDRAWAL') {
            if (currentBalance < txnAmount) {
                await connection.rollback();
                return res.status(400).json({ message: "Insufficient funds / Credit limit exceeded" });
            }
        }

        // 2. Update balance
        const operator = type === 'DEPOSIT' ? '+' : '-';
        await connection.query(`UPDATE account SET balance = balance ${operator} ? WHERE acc_id = ?`, [txnAmount, acc_id]);

        // 3. Register transaction
        await connection.query(
            'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount, installments) VALUES (?, ?, ?, ?, ?, ?)',
            [acc_id, type, finalDesc || (type === 'DEPOSIT' ? 'Deposit in Branch' : 'Withdrawal'), new Date(), txnAmount, finalInstallments]
        );

        await connection.commit();
        res.json({ message: "Transaction successful" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error in transaction:", error);
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Transfer between accounts
router.post('/transfer', async (req, res) => {
    const { origin_id, dest_id, amount } = req.body;

    if (!origin_id || !dest_id || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid transfer data" });
    }

    if (origin_id === dest_id) {
        return res.status(400).json({ message: "Cannot transfer to the same account" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check Origin Balance
        const [originAcc] = await connection.query('SELECT balance FROM account WHERE acc_id = ?', [origin_id]);
        if (originAcc.length === 0) throw new Error('Origin account not found');
        if (originAcc[0].balance < amount) throw new Error('Insufficient funds');

        // 2. Check Destination Account
        const [destAcc] = await connection.query('SELECT acc_id FROM account WHERE acc_id = ?', [dest_id]);
        if (destAcc.length === 0) throw new Error('Destination account not found');

        // 3. Deduct from Origin
        await connection.query('UPDATE account SET balance = balance - ? WHERE acc_id = ?', [amount, origin_id]);

        // 4. Add to Destination
        await connection.query('UPDATE account SET balance = balance + ? WHERE acc_id = ?', [amount, dest_id]);

        // 5. Record Transactions
        const date = new Date();
        // Withdrawal for Origin
        await connection.query(
            'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
            [origin_id, 'WITHDRAWAL', `Transfer to #${dest_id}`, date, amount]
        );
        // Deposit for Destination
        await connection.query(
            'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
            [dest_id, 'DEPOSIT', `Transfer from #${origin_id}`, date, amount]
        );

        await connection.commit();
        res.json({ success: true, message: "Transfer successful" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error in transfer:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Create new account
router.post('/create', async (req, res) => {
    const { client_id, acc_type, currency } = req.body;

    if (!client_id || !acc_type || !currency) {
        return res.status(400).json({ message: "Missing required data" });
    }

    try {
        // Check account limit
        const [existingAccounts] = await db.query('SELECT COUNT(*) as count FROM account WHERE client_id = ?', [client_id]);
        if (existingAccounts[0].count >= 5) {
            return res.status(400).json({ message: "Maximum account limit reached (5 accounts)" });
        }

        let typeId = 1; // Default Savings
        if (acc_type === 'Ahorro' || acc_type === 'Savings') typeId = 1;
        else if (acc_type === 'Inversión' || acc_type === 'Investment') typeId = 2;
        else if (acc_type === 'Credit' || acc_type === 'Crédito') typeId = 3;
        else if (acc_type === 'Cheques' || acc_type === 'Checking') typeId = 4;

        await db.query(
            'INSERT INTO account (client_id, balance, account_type_id, currency, branch_id) VALUES (?, ?, ?, ?, ?)',
            [client_id, 0, typeId, currency, 1]
        );
        res.json({ success: true, message: "Account created successfully" });
    } catch (error) {
        console.error("Error creating account:", error);
        res.status(500).json({ error: "Error creating account" });
    }
});

// Delete account (only if balance is 0 or no credit debt)
router.delete('/:acc_id', async (req, res) => {
    const { acc_id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [accounts] = await connection.query('SELECT * FROM account WHERE acc_id = ?', [acc_id]);
        if (accounts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Account not found" });
        }
        const account = accounts[0];

        // Check if it is a credit account (ID 3)
        // Use loose equality to handle string/number differences
        if (account.account_type_id == 3) {
            // Credit Account Logic
            // Calculate Debt: Total Withdrawals (Spends) - Total Deposits (Payments)
            const [rows] = await connection.query(`
                SELECT 
                    (IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = ? AND trn_type = 'WITHDRAWAL'), 0) - 
                     IFNULL((SELECT SUM(amount) FROM transactions WHERE acc_id = ? AND trn_type = 'DEPOSIT'), 0)) as debt
            `, [acc_id, acc_id]);

            const debt = parseFloat(rows[0].debt || 0);

            // If debt is positive, they owe money.
            if (debt > 0.01) {
                await connection.rollback();
                return res.status(400).json({ message: `Cannot delete credit account with outstanding debt of $${debt.toFixed(2)}` });
            }

            // If debt is 0 or negative (overpaid), we allow deletion.

            // Restore card request to PENDING so they can request again if they want
            await connection.query(`
                UPDATE card_requests 
                SET status = 'PENDING' 
                WHERE client_id = ? AND status = 'APPROVED' 
                ORDER BY request_date DESC LIMIT 1
            `, [account.client_id]);

        } else {
            // Savings/Checking/Investment Logic
            // Balance must be 0
            if (Math.abs(parseFloat(account.balance)) > 0.01) {
                await connection.rollback();
                return res.status(400).json({ message: "Cannot delete account with funds. Please empty the account first." });
            }
        }

        // Delete related data
        await connection.query('DELETE FROM transactions WHERE acc_id = ?', [acc_id]);
        await connection.query('DELETE FROM card WHERE acc_id = ?', [acc_id]);
        await connection.query('DELETE FROM account WHERE acc_id = ?', [acc_id]);

        await connection.commit();
        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Error deleting account" });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
