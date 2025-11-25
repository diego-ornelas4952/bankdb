import React, { useEffect, useState } from 'react';

export default function Dashboard() {
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);

    const loadLoans = () => {
        fetch('http://localhost:3000/api/loans/pending')
            .then(res => {
                if (!res.ok) throw new Error('The service is not available');
                return res.json();
            })
            .then(data => {
                console.log("Data received:", data);
                if (Array.isArray(data)) {
                    setLoans(data);
                } else {
                    console.error("The data format is not an array:", data);
                    setLoans([]);
                }
            })
            .catch(err => console.error("Error loading data:", err));
    };

    const loadClients = () => {
        fetch('http://localhost:3000/api/clients')
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error("Error loading clients:", err));
    };

    useEffect(() => {
        loadLoans();
        loadClients();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve this loan?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/loans/approve/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // No enviamos body extra por ahora
            });

            if (response.ok) {
                alert("¡Loan approved!");
                loadLoans(); // Recargamos la tabla para que desaparezca el aprobado
            } else {
                alert("Error approving loan");
            }
        } catch (error) {
            console.error("Error approving loan:", error);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                loadClients();
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("Error deleting client");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900">Bank - Admin Panel</h1>
                <p className="text-gray-600">Loan requests to approve</p>
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
                        {loans.map((p) => (
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
                                        <span className="relative">{p.month_term} months</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button
                                        onClick={() => handleApprove(p.loan_id)}
                                        className="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md">
                                        Approve
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loans.length === 0 && (
                    <div className="p-10 text-center text-gray-500 text-lg">
                        ✅ No requests to approve.
                    </div>
                )}
            </div>

            <header className="mb-8 mt-12">
                <h1 className="text-3xl font-bold text-blue-900">User Management</h1>
                <p className="text-gray-600">Registered clients list</p>
            </header>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Address
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <tr key={client.client_id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-500">
                                    #{client.client_id}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-bold text-gray-800">
                                    {client.name} {client.lastname}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-blue-600">
                                    {client.email}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-600">
                                    {client.phone}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-600">
                                    {client.address}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button
                                        onClick={() => handleDeleteClient(client.client_id)}
                                        className="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-3 rounded transition duration-300 shadow-sm text-xs">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {clients.length === 0 && (
                    <div className="p-10 text-center text-gray-500 text-lg">
                        ✅ No registered clients.
                    </div>
                )}
            </div>
        </div>
    );
}