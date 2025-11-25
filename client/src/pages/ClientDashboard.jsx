import React, { useEffect, useState } from 'react';

export default function ClientDashboard({ user, onLogout, onUpdateUser }) {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [loans, setLoans] = useState([]);
    const [accSelected, setAccSelection] = useState(null);

    // Estados para Modals y Menú
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    // Estado para Solicitud de Préstamo
    const [loanAmount, setLoanAmount] = useState(0);
    const [loanTerm, setLoanTerm] = useState(12);

    // Estado para Nueva Transacción
    const [transactionType, setTransactionType] = useState('DEPOSIT');
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [descTrn, setDescTrn] = useState('');
    const [idAccTrn, setIdAccTrn] = useState('');

    // Estado para Abrir Nueva Cuenta
    const [newAccType, setNewAccType] = useState('Savings');
    const [currencyNewAccount, setCurrencyNewAccount] = useState('MXN');

    // Estado para Contratar Seguro
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [insuranceType, setInsuranceType] = useState('Life');
    const [annualPremium, setAnnualPremium] = useState('');
    const [beneficiaryInsurance, setBeneficiaryInsurance] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Estado para Edición de Perfil
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLastname, setEditLastname] = useState('');
    const [editLastname2, setEditLastname2] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Inicializar datos de edición al abrir el modal
    useEffect(() => {
        if (isProfileModalOpen && user) {
            setEditName(user.name);
            setEditLastname(user.lastname);
            setEditLastname2(user.lastname2 || '');
            setEditPhone(user.phone || '');
            setEditAddress(user.address || '');
            setIsEditingProfile(false);
        }
    }, [isProfileModalOpen, user]);

    const handleSaveProfile = () => {
        fetch(`http://localhost:3000/api/clients/${user.client_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editName,
                lastname: editLastname,
                lastname2: editLastname2,
                phone: editPhone,
                address: editAddress
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    onUpdateUser(data.user); // Actualizar estado global
                    setIsEditingProfile(false);
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(err => alert("Error updating profile: " + err.message));
    };

    // Función para refrescar datos de cuentas y movimientos
    const refreshData = () => {
        if (user && user.client_id) {
            fetch(`http://localhost:3000/api/accounts/usuario/${user.client_id}`)
                .then(res => res.json())
                .then(data => {
                    setAccounts(data);
                    // Si la cuenta seleccionada sigue existiendo, actualizarla, si no, seleccionar la primera
                    if (accSelected) {
                        const updatedAccount = data.find(c => c.acc_id === accSelected.acc_id);
                        if (updatedAccount) {
                            setAccSelection(updatedAccount);
                            setIdAccTrn(updatedAccount.acc_id); // Asegurar que el ID de transacción también se actualice
                            // Refrescar movimientos también
                            fetch(`http://localhost:3000/api/accounts/${updatedAccount.acc_id}/transactions`)
                                .then(res => res.json())
                                .then(movs => setTransactions(movs));
                        } else if (data.length > 0) {
                            setAccSelection(data[0]);
                            setIdAccTrn(data[0].acc_id);
                        } else {
                            setAccSelection(null);
                            setIdAccTrn('');
                            setTransactions([]);
                        }
                    } else if (data.length > 0) {
                        setAccSelection(data[0]);
                        setIdAccTrn(data[0].acc_id);
                    } else {
                        setAccSelection(null);
                        setIdAccTrn('');
                        setTransactions([]);
                    }
                })
                .catch(err => console.error("Error loading accounts:", err));

            // Cargar seguros
            fetch(`http://localhost:3000/api/insurance/user/${user.client_id}`)
                .then(res => res.json())
                .then(data => setInsurances(data))
                .catch(err => console.error("Error loading insurances:", err));

            // Cargar préstamos
            fetch(`http://localhost:3000/api/loans/client/${user.client_id}`)
                .then(res => res.json())
                .then(data => setLoans(data))
                .catch(err => console.error("Error loading loans:", err));
        }
    };


    // 1. Al cargar, buscamos las cuentas de este usuario
    useEffect(() => {
        refreshData();
    }, [user]);

    // 2. Cada vez que cambiamos de cuenta, buscamos sus movimientos
    useEffect(() => {
        if (accSelected) {
            fetch(`http://localhost:3000/api/accounts/${accSelected.acc_id}/transactions`)
                .then(res => res.json())
                .then(data => setTransactions(data))
                .catch(err => console.error("Error loading transactions:", err));
        } else {
            setTransactions([]); // Limpiar movimientos si no hay cuenta seleccionada
        }
    }, [accSelected]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barra Superior */}
            <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg relative z-20">
                <div>
                    <h1 className="text-2xl font-bold">DB Bank</h1>
                    <p className="text-sm opacity-80">Welcome, {user?.name}</p>
                </div>

                {/* Menú Desplegable */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition font-bold"
                    >
                        <span>Menu</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl py-2 text-gray-800 z-30">
                            <button
                                onClick={() => { setIsLoanModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                💰 Request Loan
                            </button>
                            <button
                                onClick={() => { setIsTransactionModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                🏧 Add Transaction
                            </button>
                            <button
                                onClick={() => { setIsAccountModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                💳 Open New Account
                            </button>
                            <button
                                onClick={() => { setIsInsuranceModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                🛡️ Contract Insurance
                            </button>
                            <button
                                onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                👤 My Profile
                            </button>
                            <div className="border-t my-1"></div>
                            <button
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition font-bold"
                            >
                                🚪 End Session
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Columna Izquierda: Mis Cuentas */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">My Accounts</h2>
                    {accounts.map(cuenta => (
                        <div
                            key={cuenta.acc_id}
                            onClick={() => setAccSelection(cuenta)}
                            className={`p-6 rounded-xl shadow-md cursor-pointer transition transform hover:scale-105 border-l-4 ${accSelected?.acc_id === cuenta.acc_id
                                ? 'bg-white border-blue-500 ring-2 ring-blue-100'
                                : 'bg-white border-transparent opacity-80'
                                }`}
                        >
                            <p className="text-gray-500 text-sm uppercase font-bold tracking-wider">{cuenta.acc_type}</p>
                            <p className="text-3xl font-bold text-gray-800 my-2">${cuenta.balance}</p>
                            <p className="text-gray-400 text-xs">Account: ****{cuenta.acc_id}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                                {cuenta.currency}
                            </span>
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <p className="text-gray-500 italic">No active accounts.</p>
                    )}

                    <h2 className="text-xl font-bold text-gray-700 mt-8 mb-4">My Insurances</h2>
                    {insurances.map(seguro => (
                        <div key={seguro.ins_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-800">{seguro.ins_type}</p>
                                <p className="text-xs text-gray-500">Beneficiary: {seguro.beneficiary}</p>
                            </div>
                            <span className="text-green-600 font-bold text-sm">${seguro.premium}</span>
                        </div>
                    ))}
                    {insurances.length === 0 && (
                        <p className="text-gray-500 italic text-sm">No insurance contracts.</p>
                    )}
                </div>

                {/* Columna Derecha: Historial de Movimientos */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-6 min-h-[500px]">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                            Recent Transactions
                            {accSelected && <span className="text-base font-normal text-gray-500 ml-2">(Account #{accSelected.acc_id})</span>}
                        </h2>

                        <div className="space-y-4">
                            {transactions.length > 0 ? (
                                transactions.map(mov => (
                                    <div key={mov.trn_id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg border-b border-gray-100 transition">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-full ${mov.trn_type === 'DEPOSIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {/* Icono simple dependiendo del tipo */}
                                                {mov.trn_type === 'DEPOSIT' ? '⬇' : '⬆'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{mov.description || 'Transferencia'}</p>
                                                <p className="text-xs text-gray-500">{new Date(mov.date_time).toLocaleDateString()} • {mov.trn_type}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-lg ${mov.trn_type === 'DEPOSIT' ? 'text-green-600' : 'text-gray-800'}`}>
                                            {mov.trn_type === 'DEPOSIT' ? '+' : '-'}${mov.amount}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    Select an account to view its transactions or there is no history available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Modal: Request Credit */}
            {isLoanModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Loans</h2>

                        {/* Lista de Préstamos Existentes */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">My Active Loans</h3>
                            {loans.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {loans.map(loan => (
                                        <div key={loan.loan_id} className="border p-3 rounded flex justify-between items-center bg-gray-50">
                                            <div>
                                                <p className="font-bold text-gray-800">${loan.amount_org} ({loan.month_term} months)</p>
                                                <p className="text-xs text-gray-500">
                                                    Status: {loan.approve_date ? <span className="text-green-600 font-bold">Active</span> : <span className="text-yellow-600 font-bold">Pending Approval</span>}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-900">Balance: ${loan.cap_balance}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-sm">No active loans.</p>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Request New Loan</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
                                    <input
                                        type="number"
                                        className="border rounded p-2 w-full"
                                        placeholder="Ej. 5000"
                                        onChange={(e) => setLoanAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Plazo (Meses)</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        onChange={(e) => setLoanTerm(e.target.value)}
                                        value={loanTerm}
                                    >
                                        <option value="6">6 Meses</option>
                                        <option value="12">12 Meses</option>
                                        <option value="24">24 Meses</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setIsLoanModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                                    <button
                                        onClick={() => {
                                            fetch('http://localhost:3000/api/loans/request', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ client_id: user.client_id, amount: loanAmount, months: loanTerm })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    alert(data.message);
                                                    setIsLoanModalOpen(false);
                                                    refreshData(); // Recargar préstamos
                                                })
                                                .catch(err => console.error(err));
                                        }}
                                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Make a Transaction */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Make a Transaction</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Account</label>
                                <select
                                    className="border rounded p-2 w-full"
                                    value={idAccTrn}
                                    onChange={(e) => setIdAccTrn(e.target.value)}
                                >
                                    {accounts.map(c => (
                                        <option key={c.acc_id} value={c.acc_id}>
                                            {c.acc_type} - ${c.balance} ({c.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Type</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                    >
                                        <option value="DEPOSIT">Deposit (+)</option>
                                        <option value="WITHDRAW">Withdraw (-)</option>
                                    </select>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Amount</label>
                                    <input
                                        type="number"
                                        className="border rounded p-2 w-full"
                                        placeholder="0.00"
                                        onChange={(e) => setTransactionAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                                <input
                                    type="text"
                                    className="border rounded p-2 w-full"
                                    placeholder="Purchase..."
                                    onChange={(e) => setDescTrn(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsTransactionModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                                <button
                                    onClick={() => {
                                        if (!idAccTrn) return alert("Select an account");
                                        fetch('http://localhost:3000/api/accounts/transaction', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ acc_id: idAccTrn, type: transactionType, amount: transactionAmount, description: descTrn })
                                        })
                                            .then(res => {
                                                if (!res.ok) return res.json().then(err => { throw new Error(err.message) });
                                                return res.json();
                                            })
                                            .then(data => {
                                                alert(data.message);
                                                setIsTransactionModalOpen(false);
                                                refreshData();
                                            })
                                            .catch(err => alert("Error in transaction: " + err.message));
                                    }}
                                    className="bg-purple-600 text-white font-bold px-4 py-2 rounded hover:bg-purple-700"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modal: Abrir Cuenta */}
            {
                isAccountModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Open New Account</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        value={newAccType}
                                        onChange={(e) => setNewAccType(e.target.value)}
                                    >
                                        <option value="Savings">Savings</option>
                                        <option value="Current">Current</option>
                                        <option value="Investment">Investment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Currency</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        value={currencyNewAccount}
                                        onChange={(e) => setCurrencyNewAccount(e.target.value)}
                                    >
                                        <option value="MXN">Mexican Pesos (MXN)</option>
                                        <option value="USD">US Dollars (USD)</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                                    <button
                                        onClick={() => {
                                            fetch('http://localhost:3000/api/accounts/create', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ client_id: user.client_id, acc_type: newAccType, currency: currencyNewAccount })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    alert(data.message);
                                                    if (data.success) {
                                                        setIsAccountModalOpen(false);
                                                        refreshData();
                                                    }
                                                })
                                                .catch(err => alert("Error: " + err.message));
                                        }}
                                        className="bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Perfil de Usuario */}
            {
                isProfileModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                                {!isEditingProfile && (
                                    <button
                                        onClick={() => {
                                            setIsEditingProfile(true);
                                            setEditName(user.name);
                                            setEditLastname(user.lastname);
                                            setEditLastname2(user.lastname2 || '');
                                            setEditPhone(user.phone || '');
                                            setEditAddress(user.address || '');
                                        }}
                                        className="text-blue-600 hover:underline text-sm font-bold"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {isEditingProfile ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-gray-500 text-xs font-bold uppercase">Name</label>
                                                <input
                                                    type="text"
                                                    className="border rounded p-1 w-full"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 text-xs font-bold uppercase">Lastname</label>
                                                <input
                                                    type="text"
                                                    className="border rounded p-1 w-full"
                                                    value={editLastname}
                                                    onChange={(e) => setEditLastname(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Second Lastname</label>
                                            <input
                                                type="text"
                                                className="border rounded p-1 w-full"
                                                value={editLastname2}
                                                onChange={(e) => setEditLastname2(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Phone</label>
                                            <input
                                                type="text"
                                                className="border rounded p-1 w-full"
                                                value={editPhone}
                                                onChange={(e) => setEditPhone(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Address</label>
                                            <input
                                                type="text"
                                                className="border rounded p-1 w-full"
                                                value={editAddress}
                                                onChange={(e) => setEditAddress(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                onClick={() => setIsEditingProfile(false)}
                                                className="px-3 py-1 text-gray-500 font-bold text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="bg-green-600 text-white font-bold px-3 py-1 rounded hover:bg-green-700 text-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Name</label>
                                            <p className="text-gray-800 font-medium text-lg">{user.name} {user.lastname} {user.lastname2}</p>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Email</label>
                                            <p className="text-gray-800 font-medium">{user.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Phone</label>
                                            <p className="text-gray-800 font-medium">{user.phone || 'Not registered'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-xs font-bold uppercase">Address</label>
                                            <p className="text-gray-800 font-medium">{user.address || 'Not registered'}</p>
                                        </div>

                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={() => setIsProfileModalOpen(false)}
                                                className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700 w-full"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Contratar Seguro */}
            {
                isInsuranceModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Contract Insurance</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Type of Insurance</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        value={insuranceType}
                                        onChange={(e) => setInsuranceType(e.target.value)}
                                    >
                                        <option value="Life">Life Insurance</option>
                                        <option value="Auto">Auto Insurance</option>
                                        <option value="Home">Home Insurance</option>
                                        <option value="Medical">Medical Insurance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Annual Premium</label>
                                    <input
                                        type="number"
                                        className="border rounded p-2 w-full"
                                        placeholder="Ej. 5000"
                                        value={annualPremium}
                                        onChange={(e) => setAnnualPremium(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Beneficiary</label>
                                    <input
                                        type="text"
                                        className="border rounded p-2 w-full"
                                        placeholder="Full name"
                                        value={beneficiaryInsurance}
                                        onChange={(e) => setBeneficiaryInsurance(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setIsInsuranceModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                                    <button
                                        onClick={() => {
                                            if (!annualPremium || !beneficiaryInsurance) return alert("All fields are required");
                                            fetch('http://localhost:3000/api/insurance/contract', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    client_id: user.client_id,
                                                    ins_type: insuranceType,
                                                    premium: annualPremium,
                                                    beneficiary: beneficiaryInsurance
                                                })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    alert(data.message);
                                                    if (data.success) {
                                                        setIsInsuranceModalOpen(false);
                                                        setAnnualPremium('');
                                                        setBeneficiaryInsurance('');
                                                    }
                                                })
                                                .catch(err => alert("Error: " + err.message));
                                        }}
                                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Contract
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>

    );
}