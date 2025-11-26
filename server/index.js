const express = require('express');
const cors = require('cors');
const loansRoutes = require('./routes/loans');
const clientsRoutes = require('./routes/clients');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/loans', loansRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/employees', require('./routes/employees'));

app.get('/', (req, res) => {
    res.send('BankDB Server is running correctly. Please use the client application to interact.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use('/api/accounts', require('./routes/accounts'));

