const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/usuario/:client_id', async (req, res) => {
    const { client_id } = req.params;
    try {
        const [accounts] = await db.query(
            'SELECT * FROM accounts WHERE client_id = ?',
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
            'SELECT * FROM transactions WHERE account_id = ? ORDER BY date_time DESC LIMIT 10',
            [acc_id]
        );
        res.json(movimientos);
    } catch (error) {
        console.error('Error al obtener los movimientos:', error);
        res.status(500).json({ error: 'Error al obtener los movimientos' });
    }
});

module.exports = router;
