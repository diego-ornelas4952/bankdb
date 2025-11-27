const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Primero buscamos en la tabla de EMPLEADOS
        // Nota: Usamos first_name y last_name si es necesario, pero aquí asumimos que el usuario ingresa su nombre
        // Ojo: La tabla employees tiene first_name y last_name.
        // Si el usuario ingresa "Juan", buscaremos en first_name.
        const [employees] = await db.query(
            'SELECT * FROM employees WHERE first_name = ? AND password = ?',
            [email, password] // Aquí 'email' actúa como nombre de usuario
        );

        if (employees.length > 0) {
            return res.json({
                success: true,
                role: 'admin',
                user: employees[0],
                message: 'Welcome Executive!'
            });
        }

        // 2. If not employee, search in CLIENTS (they have email)
        const [clients] = await db.query(
            'SELECT * FROM clients WHERE email = ? AND password = ?',
            [email, password]
        );

        if (clients.length > 0) {
            return res.json({
                success: true,
                role: 'client',
                user: clients[0],
                message: 'Welcome Client!'
            });
        }

        // 3. Si no se encuentra en ninguno
        res.status(401).json({ success: false, message: 'Invalid credentials' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/register', async (req, res) => {
    const { name, lastname, lastname2, email, password, address, phone } = req.body;

    try {
        const [userExists] = await db.query('SELECT * FROM clients WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ success: false, message: 'The email is already registered' });
        }

        // Usamos first_name en lugar de name
        const sql = 'INSERT INTO clients (first_name, lastname, lastname2, email, password, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, lastname, lastname2, email, password, address, phone]);

        // Crear cuenta por defecto (Ahorro MXN) -> account_type_id = 1 (SAVINGS)
        const clientId = result.insertId;
        const [accResult] = await db.query(
            'INSERT INTO account (client_id, balance, account_type_id, currency, branch_id) VALUES (?, ?, ?, ?, ?)',
            [clientId, 0, 1, 'MXN', 1]
        );

        const accId = accResult.insertId;

        // Generar tarjeta de débito por defecto
        const cardNumber = '4' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
        const cvv = Math.floor(Math.random() * 900 + 100).toString();
        const today = new Date();
        const year = today.getFullYear() + 5;
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const expirationDate = `${year}-${month}-01`;

        await db.query(
            'INSERT INTO card (acc_id, card_num, cvv, exp_date, card_type) VALUES (?, ?, ?, ?, ?)',
            [accId, cardNumber, cvv, expirationDate, 'DEBIT'] // Enum es mayúsculas
        );

        res.json({ success: true, message: 'User created with default account!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;