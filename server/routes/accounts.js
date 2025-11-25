const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/usuario/:client_id', async (req, res) => {
    const { client_id } = req.params;
    try {
        const [accounts] = await db.query(
            'SELECT * FROM account WHERE client_id = ?',
            [client_id]
        );
        res.json(accounts);
    } catch (error) {
        console.error('Error al obtener las cuentas:', error);
        res.status(500).json({ error: 'Error al obtener las cuentas' });
    }
});

router.get('/:acc_id/movimientos', async (req, res) => {
    const { acc_id } = req.params;
    try {
        const [movimientos] = await db.query(
            'SELECT * FROM transactions WHERE acc_id = ? ORDER BY date_time DESC LIMIT 10',
            [acc_id]
        );
        res.json(movimientos);
    } catch (error) {
        console.error('Error al obtener los movimientos:', error);
        res.status(500).json({ error: 'Error al obtener los movimientos' });
    }
});

// Obtener tarjetas de una cuenta especifica
router.get('/:acc_id/tarjetas', async (req, res) => {
    const { acc_id } = req.params;
    const [tarjetas] = await db.query('SELECT * FROM card WHERE acc_id = ?', [acc_id]);
    res.json(tarjetas);
});

// Crear nueva transacción (Depósito o Retiro)
router.post('/transaction', async (req, res) => {
    const { acc_id, type, amount, description } = req.body;

    if (!acc_id || !type || !amount || amount <= 0) {
        return res.status(400).json({ message: "Datos inválidos" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verificar saldo si es retiro
        if (type === 'RETIRO') {
            const [accounts] = await connection.query('SELECT balance FROM account WHERE acc_id = ?', [acc_id]);
            if (accounts.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Cuenta no encontrada" });
            }
            if (accounts[0].balance < amount) {
                await connection.rollback();
                return res.status(400).json({ message: "Fondos insuficientes" });
            }
        }

        // 2. Actualizar saldo
        const operator = type === 'DEPOSITO' ? '+' : '-';
        await connection.query(`UPDATE account SET balance = balance ${operator} ? WHERE acc_id = ?`, [amount, acc_id]);

        // 3. Registrar transacción
        await connection.query(
            'INSERT INTO transactions (acc_id, trn_type, description, date_time, amount) VALUES (?, ?, ?, ?, ?)',
            [acc_id, type, description || (type === 'DEPOSITO' ? 'Depósito en Sucursal' : 'Retiro de Efectivo'), new Date(), amount]
        );

        await connection.commit();
        res.json({ message: "Transacción exitosa" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en transacción:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
