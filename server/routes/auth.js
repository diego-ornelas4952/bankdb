const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Primero buscamos en la tabla de EMPLEADOS (usando el nombre o un email si tuvieran)
        // Nota: Tu tabla employees no tiene email, usaremos 'name' como usuario por ahora
        const [empleados] = await db.query(
            'SELECT * FROM employees WHERE name = ? AND password = ?',
            [email, password] // Aquí 'email' actúa como nombre de usuario
        );

        if (empleados.length > 0) {
            return res.json({
                success: true,
                role: 'admin',
                user: empleados[0],
                message: 'Bienvenido Ejecutivo'
            });
        }

        // 2. Si no es empleado, buscamos en CLIENTES (ellos sí tienen email)
        const [clientes] = await db.query(
            'SELECT * FROM clients WHERE email = ? AND password = ?',
            [email, password]
        );

        if (clientes.length > 0) {
            return res.json({
                success: true,
                role: 'client',
                user: clientes[0],
                message: 'Bienvenido Cliente'
            });
        }

        // 3. Si no se encuentra en ninguno
        res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;