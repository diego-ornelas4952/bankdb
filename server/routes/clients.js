const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clients');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verificar si tiene dinero en alguna cuenta
        const [accounts] = await connection.query('SELECT balance FROM account WHERE client_id = ?', [id]);
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        if (totalBalance > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cannot delete client with active funds. Please withdraw all funds first.' });
        }

        // 2. Eliminar dependencias (Cascada manual)
        // Obtener IDs de cuentas para borrar sus transacciones y tarjetas
        const [accIds] = await connection.query('SELECT acc_id FROM account WHERE client_id = ?', [id]);
        const ids = accIds.map(a => a.acc_id);

        if (ids.length > 0) {
            await connection.query(`DELETE FROM transactions WHERE acc_id IN (?)`, [ids]);
            await connection.query(`DELETE FROM card WHERE acc_id IN (?)`, [ids]);
            await connection.query(`DELETE FROM account WHERE client_id = ?`, [id]);
        }

        await connection.query('DELETE FROM insurance WHERE client_id = ?', [id]);
        await connection.query('DELETE FROM loans WHERE client_id = ?', [id]);

        // 3. Eliminar Cliente
        const [result] = await connection.query('DELETE FROM clients WHERE client_id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Client not found' });
        }

        await connection.commit();
        res.json({ success: true, message: 'Client and all related data deleted successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error deleting client: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, lastname, lastname2, phone, address } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE clients SET name = ?, lastname = ?, lastname2 = ?, phone = ?, address = ? WHERE client_id = ?',
            [name, lastname, lastname2, phone, address, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Devolver los datos actualizados para actualizar el frontend
        const [updatedUser] = await db.query('SELECT * FROM clients WHERE client_id = ?', [id]);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating profile: ' + error.message });
    }
});

module.exports = router;