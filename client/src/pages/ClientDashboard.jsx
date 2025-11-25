import React, { useEffect, useState } from 'react';

export default function ClientDashboard({ user, onLogout }) {
    const [montoSolicitud, setMontoSolicitud] = useState(0);
    const [plazoSolicitud, setPlazoSolicitud] = useState(12);
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

    // 1. Al cargar, buscamos las cuentas de este usuario
    useEffect(() => {
        if (user && user.client_id) {
            fetch(`http://localhost:3000/api/cuentas/usuario/${user.client_id}`)
                .then(res => res.json())
                .then(data => {
                    setCuentas(data);
                    // Si tiene cuentas, seleccionamos la primera por defecto para ver sus movimientos
                    if (data.length > 0) {
                        setCuentaSeleccionada(data[0]);
                    }
                })
                .catch(err => console.error("Error cargando cuentas:", err));
        }
    }, [user]);

    // 2. Cada vez que cambiamos de cuenta, buscamos sus movimientos
    useEffect(() => {
        if (cuentaSeleccionada) {
            fetch(`http://localhost:3000/api/cuentas/${cuentaSeleccionada.acc_id}/movimientos`)
                .then(res => res.json())
                .then(data => setMovimientos(data))
                .catch(err => console.error("Error cargando movimientos:", err));
        }
    }, [cuentaSeleccionada]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barra Superior */}
            <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold">Banco Seguro</h1>
                    <p className="text-sm opacity-80">Bienvenido, {user?.name}</p>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition text-sm font-bold"
                >
                    Cerrar Sesión
                </button>
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
                {/* Sección de Préstamos */}
                <div className="md:col-span-3 mt-8 bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Solicitar Crédito Nuevo</h2>
                    <div className="flex gap-4 items-end">
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
                        <button
                            onClick={() => {
                                fetch('http://localhost:3000/api/prestamos/solicitar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        client_id: user.client_id, // Tu usuario logueado
                                        amount: montoSolicitud,
                                        months: plazoSolicitud
                                    })
                                })
                                    .then(res => res.json())
                                    .then(data => alert(data.message))
                                    .catch(err => console.error(err));
                            }}
                            className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-700 transition"
                        >
                            Solicitar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}