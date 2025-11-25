const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Primero buscamos en la tabla de EMPLEADOS (usando el nombre o un email si tuvieran)
        // Nota: Tu tabla employees no tiene email, usaremos 'name' como usuario por ahora
        const [employees] = await db.query(
            'SELECT * FROM employees WHERE name = ? AND password = ?',
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

        const sql = 'INSERT INTO clients (name, lastname, lastname2, email, password, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, lastname, lastname2, email, password, address, phone]);

        // Crear cuenta por defecto (Ahorro MXN)
        const clientId = result.insertId;
        await db.query(
            'INSERT INTO account (client_id, balance, acc_type, currency, branch_id) VALUES (?, ?, ?, ?, ?)',
            [clientId, 0, 'Ahorro', 'MXN', 1]
        );

        res.json({ success: true, message: 'User created with default account!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;