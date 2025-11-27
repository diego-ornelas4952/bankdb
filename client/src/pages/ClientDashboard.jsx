import React, { useEffect, useState } from 'react';

export default function ClientDashboard({ user, onLogout, onUpdateUser }) {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [loans, setLoans] = useState([]);
    const [cards, setCards] = useState([]);
    const [cardRequests, setCardRequests] = useState([]);
    const [accSelected, setAccSelection] = useState(null);

    // Estados para Modals y Menú
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);

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

    // Estado para Tarjetas
    const [newCardAccId, setNewCardAccId] = useState('');
    const [visibleCardId, setVisibleCardId] = useState(null);

    // Estado para Pago de Préstamo
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAccId, setPaymentAccId] = useState('');
    const [selectedLoanId, setSelectedLoanId] = useState(null);

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
            setEditName(user.first_name);
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

            // Cargar tarjetas
            fetch(`http://localhost:3000/api/cards/client/${user.client_id}`)
                .then(res => res.json())
                .then(data => setCards(data))
                .catch(err => console.error("Error loading cards:", err));

            // Cargar solicitudes de tarjetas
            fetch(`http://localhost:3000/api/cards/requests/client/${user.client_id}`)
                .then(res => res.json())
                .then(data => setCardRequests(data))
                .catch(err => console.error("Error loading card requests:", err));
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
                <div className="flex items-center gap-3">
                    <img src="/dbbank-logo.png" alt="DB Bank" className="h-12 object-contain" />
                    <div>
                        <p className="text-sm opacity-80">Welcome, {user?.first_name}</p>
                    </div>
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
                                💰 Loans and Credit
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
                                onClick={() => { setIsCardsModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                💳 My Cards
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

            <div className="max-w-6xl mx-auto p-6 space-y-8">

                {/* Section 1: My Accounts (Horizontal Scroll) */}
                <div>
                    <h2 className="text-xl font-bold text-gray-700 mb-4">My Accounts</h2>
                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                        {accounts.map(cuenta => (
                            <div
                                key={cuenta.acc_id}
                                onClick={() => setAccSelection(cuenta)}
                                className={`min-w-[300px] p-6 rounded-xl shadow-md cursor-pointer transition transform hover:scale-105 border-l-4 relative ${accSelected?.acc_id === cuenta.acc_id
                                    ? 'bg-white border-blue-500 ring-2 ring-blue-100'
                                    : 'bg-white border-transparent opacity-80'
                                    }`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        if (cuenta.acc_type === 'Credit') {
                                            // Check debt from loans list
                                            const creditInfo = loans.find(l => l.acc_id === cuenta.acc_id && l.isCreditCard);
                                            // If creditInfo is not found, it might mean no debt or data not loaded, let backend handle it.
                                            // But if found and debt > 0, block it.
                                            if (creditInfo && creditInfo.cap_balance > 0.01) {
                                                alert(`Account must have no debt to be deleted. Current debt: $${creditInfo.cap_balance}`);
                                                return;
                                            }
                                        } else {
                                            if (parseFloat(cuenta.balance) !== 0) {
                                                alert("Account must have 0 funds to be deleted.");
                                                return;
                                            }
                                        }

                                        if (!confirm("Are you sure you want to delete this account?")) return;

                                        fetch(`http://localhost:3000/api/accounts/${cuenta.acc_id}`, { method: 'DELETE' })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.success) {
                                                    alert(data.message);
                                                    refreshData();
                                                } else {
                                                    alert(data.message || data.error);
                                                }
                                            })
                                            .catch(err => alert("Error: " + err.message));
                                    }}
                                    className="absolute top-2 right-2 text-red-300 hover:text-red-500 p-1 transition"
                                    title="Delete Account"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
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
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Cards & Insurances */}
                    <div className="md:col-span-1 space-y-6">

                        {/* Cards Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-700 mb-4">My Cards</h2>
                            {cards.map(card => (
                                <div key={card.card_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-2 relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${card.card_type === 'Debit' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {card.card_type}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newVisibleId = visibleCardId === card.card_id ? null : card.card_id;
                                                setVisibleCardId(newVisibleId);

                                                // Si se abre la tarjeta, cargar sus movimientos
                                                if (newVisibleId) {
                                                    // Buscar la cuenta asociada a esta tarjeta
                                                    const linkedAccount = accounts.find(a => a.acc_id === card.acc_id);
                                                    if (linkedAccount) {
                                                        setAccSelection(linkedAccount); // Esto disparará el useEffect que carga movimientos
                                                    }
                                                }
                                            }}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none transition"
                                            title={visibleCardId === card.card_id ? "Hide details" : "Show details"}
                                        >
                                            {visibleCardId === card.card_id ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!confirm("Are you sure you want to delete this card?")) return;
                                                fetch(`http://localhost:3000/api/cards/${card.card_num}`, { method: 'DELETE' })
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        if (data.success) {
                                                            alert(data.message);
                                                            refreshData();
                                                        } else {
                                                            alert(data.message || data.error);
                                                        }
                                                    })
                                                    .catch(err => alert("Error: " + err.message));
                                            }}
                                            className="text-red-300 hover:text-red-500 focus:outline-none transition ml-2"
                                            title="Delete Card"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    <p className="font-mono text-lg text-gray-800 tracking-wider mb-1">
                                        {visibleCardId === card.card_id
                                            ? (card.card_num.match(/.{1,4}/g) || []).join(' ')
                                            : `**** **** **** ${card.card_num.slice(-4)}`}
                                    </p>

                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>Exp: {new Date(card.exp_date).toLocaleDateString()}</span>
                                        {visibleCardId === card.card_id && (
                                            <span className="font-bold text-gray-700">CVV: {card.cvv}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Linked to: ****{card.acc_id}</p>
                                </div>
                            ))}
                            {cards.length === 0 && (
                                <p className="text-gray-500 italic text-sm">No cards available.</p>
                            )}
                        </div>

                        {/* Insurances Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-700 mb-4">My Insurances</h2>
                            {insurances.map(seguro => (
                                <div key={seguro.ins_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-gray-800">{seguro.ins_type}</p>
                                        <p className="text-xs text-gray-500">Beneficiary: {seguro.beneficiary}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-600 font-bold text-sm">${seguro.premium}</span>
                                        <button
                                            onClick={() => {
                                                if (!confirm("Are you sure you want to cancel this insurance policy?")) return;
                                                fetch(`http://localhost:3000/api/insurance/${seguro.ins_id}`, { method: 'DELETE' })
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        if (data.success) {
                                                            alert(data.message);
                                                            refreshData();
                                                        } else {
                                                            alert(data.message || data.error);
                                                        }
                                                    })
                                                    .catch(err => alert("Error: " + err.message));
                                            }}
                                            className="text-red-300 hover:text-red-500 transition"
                                            title="Cancel Insurance"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {insurances.length === 0 && (
                                <p className="text-gray-500 italic text-sm">No insurance contracts.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Transactions */}
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
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {loans.map(loan => (
                                        <div key={loan.loan_id} className={`border p-3 rounded ${loan.isCreditCard ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-800">
                                                        {loan.isCreditCard ? `Credit Card (****${loan.acc_id})` : `$${loan.amount_org} (${loan.month_term} months)`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {loan.isCreditCard ? (
                                                            <span className="text-purple-700 font-bold">Credit Limit: ${loan.amount_org}</span>
                                                        ) : (
                                                            <>Status: {loan.approve_date ? <span className="text-green-600 font-bold">Active</span> : <span className="text-yellow-600 font-bold">Pending Approval</span>}</>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-blue-900">
                                                        {loan.isCreditCard ? `Debt: $${loan.cap_balance}` : `Balance: $${loan.cap_balance}`}
                                                    </p>
                                                    {loan.isCreditCard && (
                                                        <p className="text-xs text-green-600">Available: ${loan.balance}</p>
                                                    )}
                                                    {((loan.approve_date && parseFloat(loan.cap_balance) > 0) || (loan.isCreditCard && parseFloat(loan.cap_balance) > 0)) && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLoanId(selectedLoanId === loan.loan_id ? null : loan.loan_id);
                                                                setPaymentAmount('');
                                                                setPaymentAccId('');
                                                            }}
                                                            className={`text-xs text-white px-2 py-1 rounded mt-1 ${loan.isCreditCard ? 'bg-purple-500 hover:bg-purple-600' : 'bg-green-500 hover:bg-green-600'}`}
                                                        >
                                                            {selectedLoanId === loan.loan_id ? 'Cancel' : (loan.isCreditCard ? 'Pay Card' : 'Pay Loan')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Formulario de Pago */}
                                            {selectedLoanId === loan.loan_id && (
                                                <div className="mt-3 p-3 bg-white border rounded shadow-inner">
                                                    <p className="text-xs font-bold text-gray-600 mb-2">
                                                        {loan.isCreditCard ? 'Pay Credit Card' : 'Make a Payment'}
                                                    </p>
                                                    <div className="flex gap-2 mb-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Amount"
                                                            className="border rounded p-1 text-sm w-1/3"
                                                            value={paymentAmount}
                                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                                        />
                                                        <select
                                                            className="border rounded p-1 text-sm w-2/3"
                                                            value={paymentAccId}
                                                            onChange={(e) => setPaymentAccId(e.target.value)}
                                                        >
                                                            <option value="">Select Account</option>
                                                            {accounts
                                                                .filter(acc => acc.acc_type !== 'Credit') // No pagar con crédito
                                                                .map(acc => (
                                                                    <option key={acc.acc_id} value={acc.acc_id}>
                                                                        {acc.acc_type} - ${acc.balance}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (!paymentAmount || !paymentAccId) return alert("Please fill all fields");

                                                            if (loan.isCreditCard) {
                                                                // Lógica para pagar tarjeta de crédito (Depósito a la cuenta de crédito)
                                                                // 1. Retiro de la cuenta origen
                                                                // 2. Depósito a la cuenta destino (la de crédito)

                                                                // Hacemos una transferencia normal
                                                                fetch('http://localhost:3000/api/accounts/transfer', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        origin_id: paymentAccId,
                                                                        dest_id: loan.acc_id,
                                                                        amount: paymentAmount
                                                                    })
                                                                })
                                                                    .then(res => res.json())
                                                                    .then(data => {
                                                                        if (data.success) {
                                                                            alert("Credit Card payment successful!");
                                                                            refreshData();
                                                                            setSelectedLoanId(null);
                                                                        } else {
                                                                            alert(data.message || "Error processing payment");
                                                                        }
                                                                    })
                                                                    .catch(err => alert(err.message));

                                                            } else {
                                                                // Lógica para pagar préstamo normal
                                                                fetch(`http://localhost:3000/api/loans/pay/${loan.loan_id}`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ amount: paymentAmount, acc_id: paymentAccId })
                                                                })
                                                                    .then(res => res.json())
                                                                    .then(data => {
                                                                        if (data.success) {
                                                                            alert(data.message);
                                                                            refreshData();
                                                                            setSelectedLoanId(null);
                                                                        } else {
                                                                            alert(data.error || data.message);
                                                                        }
                                                                    })
                                                                    .catch(err => alert(err.message));
                                                            }
                                                        }}
                                                        className={`w-full text-white text-xs font-bold py-1 rounded ${loan.isCreditCard ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    >
                                                        Confirm Payment
                                                    </button>
                                                </div>
                                            )}
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
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Term (Months)</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        onChange={(e) => setLoanTerm(e.target.value)}
                                        value={loanTerm}
                                    >
                                        <option value="6">6 Months</option>
                                        <option value="12">12 Months</option>
                                        <option value="24">24 Months</option>
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
                                            <p className="text-gray-800 font-medium text-lg">{user.first_name} {user.lastname} {user.lastname2}</p>
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
                                                        refreshData();
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

            {/* Modal: Cards */}
            {isCardsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Cards</h2>

                        <div className="space-y-6">
                            {/* Create Debit Card */}
                            <div className="border p-4 rounded-lg bg-gray-50">
                                <h3 className="font-bold text-gray-700 mb-2">Create Debit Card</h3>
                                <p className="text-sm text-gray-500 mb-3">Select an account to link your new debit card.</p>
                                <select
                                    className="border rounded p-2 w-full mb-3"
                                    value={newCardAccId}
                                    onChange={(e) => setNewCardAccId(e.target.value)}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.filter(acc => acc.acc_type !== 'CREDIT').map(acc => (
                                        <option key={acc.acc_id} value={acc.acc_id}>
                                            {acc.acc_type} - ${acc.balance} ({acc.currency})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => {
                                        if (!newCardAccId) return alert("Select an account");
                                        fetch('http://localhost:3000/api/cards/create', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ acc_id: newCardAccId })
                                        })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.success) {
                                                    alert(data.message);
                                                    refreshData();
                                                    setNewCardAccId('');
                                                } else {
                                                    alert(data.message || data.error || "Unknown error occurred");
                                                }
                                            })
                                            .catch(err => alert("Network error: " + err.message));
                                    }}
                                    className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
                                >
                                    Create Debit Card
                                </button>
                            </div>

                            {/* Request Credit Card */}
                            <div className="border p-4 rounded-lg bg-gray-50">
                                <h3 className="font-bold text-gray-700 mb-2">Request Credit Card</h3>
                                <p className="text-sm text-gray-500 mb-3">Submit a request for a credit card. An executive will review your application and assign a credit limit.</p>

                                {cardRequests.filter(r => r.status === 'Pending').length > 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
                                        <p className="text-sm text-yellow-800 font-bold mb-2">You have a pending request!</p>
                                        {cardRequests.filter(r => r.status === 'Pending').map(req => (
                                            <div key={req.request_id} className="flex justify-between items-center bg-white p-2 rounded border border-yellow-100">
                                                <span className="text-xs text-gray-500">Req #{req.request_id} - {new Date(req.request_date).toLocaleDateString()}</span>
                                                <button
                                                    onClick={() => {
                                                        // Simular aprobación automática con límite predefinido
                                                        const defaultLimit = 50000;

                                                        if (!confirm(`Activate your Credit Card with a pre-approved limit of $${defaultLimit}?`)) return;

                                                        fetch(`http://localhost:3000/api/cards/approve/${req.request_id}`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ credit_limit: defaultLimit })
                                                        })
                                                            .then(res => res.json())
                                                            .then(data => {
                                                                if (data.success) {
                                                                    alert("Success! Your credit card is now active.");
                                                                    refreshData();
                                                                } else {
                                                                    alert(data.error || data.message);
                                                                }
                                                            })
                                                            .catch(err => alert("Error: " + err.message));
                                                    }}
                                                    className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-green-700"
                                                >
                                                    Activate Card
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            fetch('http://localhost:3000/api/cards/request-credit', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ client_id: user.client_id })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    if (data.success) {
                                                        alert(data.message);
                                                        refreshData();
                                                    } else {
                                                        alert(data.message || data.error || "Unknown error occurred");
                                                    }
                                                })
                                                .catch(err => alert("Network error: " + err.message));
                                        }}
                                        className="w-full bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700"
                                    >
                                        Request Credit Card
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsCardsModalOpen(false)}
                                className="text-gray-500 font-bold px-4 py-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}