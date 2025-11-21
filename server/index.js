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

app.get('/', (req, res) => {
    res.send('BankDB Server is running correctly. Please use the client application to interact.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
