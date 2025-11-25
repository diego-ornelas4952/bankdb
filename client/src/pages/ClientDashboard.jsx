import React, { useEffect, useState } from 'react';

export default function ClientDashboard({ user, onLogout }) {
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

    // Estados para Modals y Menú
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    // Estado para Solicitud de Préstamo
    const [montoSolicitud, setMontoSolicitud] = useState(0);
    const [plazoSolicitud, setPlazoSolicitud] = useState(12);

    // Estado para Nueva Transacción
    const [tipoTransaccion, setTipoTransaccion] = useState('DEPOSITO');
    const [montoTransaccion, setMontoTransaccion] = useState(0);
    const [descTransaccion, setDescTransaccion] = useState('');
    const [idCuentaTransaccion, setIdCuentaTransaccion] = useState('');

    // Estado para Abrir Nueva Cuenta
    const [tipoCuentaNueva, setTipoCuentaNueva] = useState('Ahorro');
    const [monedaCuentaNueva, setMonedaCuentaNueva] = useState('MXN');

    // Función para refrescar datos de cuentas y movimientos
    const refreshData = () => {
        if (user && user.client_id) {
            fetch(`http://localhost:3000/api/accounts/usuario/${user.client_id}`)
                .then(res => res.json())
                .then(data => {
                    setCuentas(data);
                    // Si la cuenta seleccionada sigue existiendo, actualizarla, si no, seleccionar la primera
                    if (cuentaSeleccionada) {
                        const updatedAccount = data.find(c => c.acc_id === cuentaSeleccionada.acc_id);
                        if (updatedAccount) {
                            setCuentaSeleccionada(updatedAccount);
                            setIdCuentaTransaccion(updatedAccount.acc_id); // Asegurar que el ID de transacción también se actualice
                            // Refrescar movimientos también
                            fetch(`http://localhost:3000/api/accounts/${updatedAccount.acc_id}/movimientos`)
                                .then(res => res.json())
                                .then(movs => setMovimientos(movs));
                        } else if (data.length > 0) {
                            setCuentaSeleccionada(data[0]);
                            setIdCuentaTransaccion(data[0].acc_id);
                        } else {
                            setCuentaSeleccionada(null);
                            setIdCuentaTransaccion('');
                            setMovimientos([]);
                        }
                    } else if (data.length > 0) {
                        setCuentaSeleccionada(data[0]);
                        setIdCuentaTransaccion(data[0].acc_id);
                    } else {
                        setCuentaSeleccionada(null);
                        setIdCuentaTransaccion('');
                        setMovimientos([]);
                    }
                })
                .catch(err => console.error("Error cargando cuentas:", err));
        }
    };

    // 1. Al cargar, buscamos las cuentas de este usuario
    useEffect(() => {
        refreshData();
    }, [user]);

    // 2. Cada vez que cambiamos de cuenta, buscamos sus movimientos
    useEffect(() => {
        if (cuentaSeleccionada) {
            fetch(`http://localhost:3000/api/accounts/${cuentaSeleccionada.acc_id}/movimientos`)
                .then(res => res.json())
                .then(data => setMovimientos(data))
                .catch(err => console.error("Error cargando movimientos:", err));
        } else {
            setMovimientos([]); // Limpiar movimientos si no hay cuenta seleccionada
        }
    }, [cuentaSeleccionada]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barra Superior */}
            <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg relative z-20">
                <div>
                    <h1 className="text-2xl font-bold">Banco Seguro</h1>
                    <p className="text-sm opacity-80">Bienvenido, {user?.name}</p>
                </div>

                {/* Menú Desplegable */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition font-bold"
                    >
                        <span>Menú</span>
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
                                💰 Solicitar Crédito
                            </button>
                            <button
                                onClick={() => { setIsTransactionModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                🏧 Simular Transacción
                            </button>
                            <button
                                onClick={() => { setIsAccountModalOpen(true); setIsMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                💳 Abrir Nueva Cuenta
                            </button>
                            <div className="border-t my-1"></div>
                            <button
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition font-bold"
                            >
                                🚪 Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Columna Izquierda: Mis Cuentas */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Mis Cuentas</h2>
                    {cuentas.map(cuenta => (
                        <div
                            key={cuenta.acc_id}
                            onClick={() => setCuentaSeleccionada(cuenta)}
                            className={`p-6 rounded-xl shadow-md cursor-pointer transition transform hover:scale-105 border-l-4 ${cuentaSeleccionada?.acc_id === cuenta.acc_id
                                ? 'bg-white border-blue-500 ring-2 ring-blue-100'
                                : 'bg-white border-transparent opacity-80'
                                }`}
                        >
                            <p className="text-gray-500 text-sm uppercase font-bold tracking-wider">{cuenta.acc_type}</p>
                            <p className="text-3xl font-bold text-gray-800 my-2">${cuenta.balance}</p>
                            <p className="text-gray-400 text-xs">Cuenta: ****{cuenta.acc_id}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                                {cuenta.currency}
                            </span>
                        </div>
                    ))}

                    {cuentas.length === 0 && (
                        <p className="text-gray-500 italic">No tienes cuentas activas.</p>
                    )}
                </div>

                {/* Columna Derecha: Historial de Movimientos */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-6 min-h-[500px]">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                            Movimientos Recientes
                            {cuentaSeleccionada && <span className="text-base font-normal text-gray-500 ml-2">(Cuenta #{cuentaSeleccionada.acc_id})</span>}
                        </h2>

                        <div className="space-y-4">
                            {movimientos.length > 0 ? (
                                movimientos.map(mov => (
                                    <div key={mov.trn_id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg border-b border-gray-100 transition">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-full ${mov.trn_type === 'DEPOSITO' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {/* Icono simple dependiendo del tipo */}
                                                {mov.trn_type === 'DEPOSITO' ? '⬇' : '⬆'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{mov.description || 'Transferencia'}</p>
                                                <p className="text-xs text-gray-500">{new Date(mov.date_time).toLocaleDateString()} • {mov.trn_type}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-lg ${mov.trn_type === 'DEPOSITO' ? 'text-green-600' : 'text-gray-800'}`}>
                                            {mov.trn_type === 'DEPOSITO' ? '+' : '-'}${mov.amount}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    Selecciona una cuenta para ver sus movimientos o no hay historial disponible.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Modal: Solicitar Crédito */}
            {isLoanModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Solicitar Crédito</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Monto</label>
                                <input
                                    type="number"
                                    className="border rounded p-2 w-full"
                                    placeholder="Ej. 5000"
                                    onChange={(e) => setMontoSolicitud(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Plazo (Meses)</label>
                                <select
                                    className="border rounded p-2 w-full"
                                    onChange={(e) => setPlazoSolicitud(e.target.value)}
                                    value={plazoSolicitud}
                                >
                                    <option value="6">6 Meses</option>
                                    <option value="12">12 Meses</option>
                                    <option value="24">24 Meses</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsLoanModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                                <button
                                    onClick={() => {
                                        fetch('http://localhost:3000/api/loans/solicitar', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ client_id: user.client_id, amount: montoSolicitud, months: plazoSolicitud })
                                        })
                                            .then(res => res.json())
                                            .then(data => { alert(data.message); setIsLoanModalOpen(false); })
                                            .catch(err => console.error(err));
                                    }}
                                    className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Solicitar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Simular Transacción */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Simular Transacción</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Cuenta</label>
                                <select
                                    className="border rounded p-2 w-full"
                                    value={idCuentaTransaccion}
                                    onChange={(e) => setIdCuentaTransaccion(e.target.value)}
                                >
                                    {cuentas.map(c => (
                                        <option key={c.acc_id} value={c.acc_id}>
                                            {c.acc_type} - ${c.balance} ({c.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Tipo</label>
                                    <select
                                        className="border rounded p-2 w-full"
                                        value={tipoTransaccion}
                                        onChange={(e) => setTipoTransaccion(e.target.value)}
                                    >
                                        <option value="DEPOSITO">Depósito (+)</option>
                                        <option value="RETIRO">Retiro (-)</option>
                                    </select>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Monto</label>
                                    <input
                                        type="number"
                                        className="border rounded p-2 w-full"
                                        placeholder="0.00"
                                        onChange={(e) => setMontoTransaccion(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                                <input
                                    type="text"
                                    className="border rounded p-2 w-full"
                                    placeholder="Ej. Compra..."
                                    onChange={(e) => setDescTransaccion(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsTransactionModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                                <button
                                    onClick={() => {
                                        if (!idCuentaTransaccion) return alert("Selecciona una cuenta");
                                        fetch('http://localhost:3000/api/accounts/transaction', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ acc_id: idCuentaTransaccion, type: tipoTransaccion, amount: montoTransaccion, description: descTransaccion })
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
                                            .catch(err => alert("Error en transacción: " + err.message));
                                    }}
                                    className="bg-purple-600 text-white font-bold px-4 py-2 rounded hover:bg-purple-700"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Abrir Cuenta */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Abrir Nueva Cuenta</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Cuenta</label>
                                <select
                                    className="border rounded p-2 w-full"
                                    value={tipoCuentaNueva}
                                    onChange={(e) => setTipoCuentaNueva(e.target.value)}
                                >
                                    <option value="Ahorro">Ahorro</option>
                                    <option value="Corriente">Corriente</option>
                                    <option value="Inversion">Inversión</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Moneda</label>
                                <select
                                    className="border rounded p-2 w-full"
                                    value={monedaCuentaNueva}
                                    onChange={(e) => setMonedaCuentaNueva(e.target.value)}
                                >
                                    <option value="MXN">Pesos Mexicanos (MXN)</option>
                                    <option value="USD">Dólares Americanos (USD)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                                <button
                                    onClick={() => {
                                        fetch('http://localhost:3000/api/accounts/create', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ client_id: user.client_id, acc_type: tipoCuentaNueva, currency: monedaCuentaNueva })
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
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}