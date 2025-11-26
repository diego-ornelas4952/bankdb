const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar empleados
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM employees');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear empleado
router.post('/', async (req, res) => {
    const { name, position, branch_id, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: "Name and password are required" });
    }

    try {
        await db.query(
            'INSERT INTO employees (name, position, branch_id, password) VALUES (?, ?, ?, ?)',
            [name, position || 'Executive', branch_id || 1, password]
        );
        res.json({ success: true, message: "Employee created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar empleado
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Primero desvinculamos al empleado de los préstamos que haya aprobado
        await db.query('UPDATE loans SET emp_id_approved = NULL WHERE emp_id_approved = ?', [id]);

        // Ahora sí lo eliminamos
        await db.query('DELETE FROM employees WHERE emp_id = ?', [id]);

        res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
