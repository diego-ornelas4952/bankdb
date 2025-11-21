import React, { useEffect, useState } from 'react';

export default function Dashboard() {
    const [prestamos, setPrestamos] = useState([]);

    const cargarPrestamos = () => {
        fetch('http://localhost:3000/api/loans/pending')
            .then(res => {
                if (!res.ok) throw new Error('Error en la respuesta del servidor');
                return res.json();
            })
            .then(data => {
                console.log("Datos recibidos:", data);
                if (Array.isArray(data)) {
                    setPrestamos(data);
                } else {
                    console.error("El formato de datos no es un array:", data);
                    setPrestamos([]);
                }
            })
            .catch(err => console.error("Error cargando datos:", err));
    };

    useEffect(() => {
        cargarPrestamos();
    }, []);

    const handleAprobar = async (id) => {
        if (!window.confirm("¿Estás seguro de aprobar este crédito?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/loans/approve/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // No enviamos body extra por ahora
            });

            if (response.ok) {
                alert("¡Crédito aprobado!");
                cargarPrestamos(); // Recargamos la tabla para que desaparezca el aprobado
            } else {
                alert("Hubo un error al aprobar");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900">Banco - Panel Administrativo</h1>
                <p className="text-gray-600">Solicitudes de crédito por autorizar</p>
            </header>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Monto (MXN)
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Plazo
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {prestamos.map((p) => (
                            // OJO: Aquí usamos las keys que vienen de la nueva Query SQL
                            <tr key={p.loan_id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-500">
                                    #{p.loan_id}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-bold text-gray-800">
                                    {p.nombre_completo}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-blue-600 font-bold">
                                    ${p.amount_org}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                        <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                        <span className="relative">{p.month_term} meses</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button
                                        onClick={() => handleAprobar(p.loan_id)}
                                        className="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md">
                                        Autorizar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {prestamos.length === 0 && (
                    <div className="p-10 text-center text-gray-500 text-lg">
                        ✅ No hay solicitudes pendientes por revisar.
                    </div>
                )}
            </div>
        </div>
    );
}