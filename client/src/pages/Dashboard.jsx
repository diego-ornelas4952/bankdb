import React, { useEffect, useState } from 'react';

export default function Dashboard({ onLogout }) {
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);
    const [cardRequests, setCardRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', position: '', password: '' });

    const [activeTab, setActiveTab] = useState('loans');
    const [clientSearch, setClientSearch] = useState('');
    const [debugError, setDebugError] = useState(''); // Added debugError state

    const loadLoans = () => {
        fetch('http://127.0.0.1:3000/api/loans/pending')
            .then(res => {
                if (!res.ok) throw new Error('The service is not available');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setLoans(data);
                } else {
                    setLoans([]);
                }
            })
            .catch(err => console.error("Error loading data:", err));
    };

    const loadClients = () => {
        const timestamp = new Date().getTime(); // Prevent caching
        fetch(`http://127.0.0.1:3000/api/clients?t=${timestamp}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Clients loaded:", data); // Debug log
                if (Array.isArray(data)) {
                    setClients(data);
                    setDebugError('');
                } else {
                    console.error("Clients response is not an array:", data);
                    setDebugError('Data is not an array: ' + JSON.stringify(data));
                    setClients([]);
                }
            })
            .catch(err => {
                console.error("Error loading clients:", err);
                setDebugError('Fetch error: ' + err.message);
            });
    };

    const loadCardRequests = () => {
        fetch('http://127.0.0.1:3000/api/cards/requests')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCardRequests(data);
                } else {
                    setCardRequests([]);
                }
            })
            .catch(err => console.error("Error loading card requests:", err));
    };

    const loadEmployees = () => {
        fetch('http://127.0.0.1:3000/api/employees')
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error("Error loading employees:", err));
    };

    useEffect(() => {
        loadLoans();
        loadClients();
        loadCardRequests();
        loadEmployees();
    }, []);

    // ... (existing load functions)

    // Filter Clients
    const filteredClients = clients.filter(client =>
        (client.first_name && client.first_name.toLowerCase().includes(clientSearch.toLowerCase())) ||
        (client.lastname && client.lastname.toLowerCase().includes(clientSearch.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img src="/dbbank-logo.png" alt="DB Bank" className="h-10 object-contain" />
                    <div className="border-l border-blue-700 pl-3 ml-2">
                        <h1 className="text-lg font-bold leading-tight">Admin Console</h1>
                        <p className="text-xs text-blue-200">Employee Access</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                >
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                </button>
            </nav>

            <div className="max-w-7xl mx-auto p-6 space-y-8">

                {/* Stats / Welcome */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div onClick={() => setActiveTab('loans')} className={`cursor-pointer p-6 rounded-xl shadow-sm border transition ${activeTab === 'loans' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-gray-100 hover:border-blue-300'}`}>
                        <p className="text-gray-500 text-sm font-bold uppercase">Pending Loans</p>
                        <p className="text-3xl font-bold text-blue-900">{loans.length}</p>
                    </div>
                    <div onClick={() => setActiveTab('cards')} className={`cursor-pointer p-6 rounded-xl shadow-sm border transition ${activeTab === 'cards' ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200' : 'bg-white border-gray-100 hover:border-purple-300'}`}>
                        <p className="text-gray-500 text-sm font-bold uppercase">Card Requests</p>
                        <p className="text-3xl font-bold text-purple-900">{cardRequests.length}</p>
                    </div>
                    <div onClick={() => setActiveTab('clients')} className={`cursor-pointer p-6 rounded-xl shadow-sm border transition ${activeTab === 'clients' ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                        <p className="text-gray-500 text-sm font-bold uppercase">Total Clients</p>
                        <p className="text-3xl font-bold text-gray-800">{clients.length}</p>
                    </div>
                    <div onClick={() => setActiveTab('employees')} className={`cursor-pointer p-6 rounded-xl shadow-sm border transition ${activeTab === 'employees' ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200' : 'bg-white border-gray-100 hover:border-orange-300'}`}>
                        <p className="text-gray-500 text-sm font-bold uppercase">Employees</p>
                        <p className="text-3xl font-bold text-orange-600">{employees.length}</p>
                    </div>
                </div>

                {/* Tabs Navigation (Visual) */}
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('loans')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'loans' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Loans</button>
                    <button onClick={() => setActiveTab('cards')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'cards' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Cards</button>
                    <button onClick={() => setActiveTab('clients')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'clients' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Clients</button>
                    <button onClick={() => setActiveTab('employees')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'employees' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Employees</button>
                </div>

                {/* Section: Loans */}
                {activeTab === 'loans' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Loan Requests</h2>
                                <p className="text-sm text-gray-500">Review and approve pending personal loans</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                                {loans.length} Pending
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Client</th>
                                        <th className="p-4 font-semibold">Amount</th>
                                        <th className="p-4 font-semibold">Term</th>
                                        <th className="p-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loans.map((p) => (
                                        <tr key={p.loan_id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 text-gray-500 text-sm">#{p.loan_id}</td>
                                            <td className="p-4 font-bold text-gray-800">{p.nombre_completo}</td>
                                            <td className="p-4 text-blue-600 font-bold">${p.amount_org}</td>
                                            <td className="p-4">
                                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                                    {p.month_term} months
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRejectLoan(p.loan_id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-2 px-4 rounded shadow-sm transition"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(p.loan_id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {loans.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                                                No pending loan requests.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section: Cards */}
                {activeTab === 'cards' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Credit Card Requests</h2>
                                <p className="text-sm text-gray-500">Approve new credit card applications</p>
                            </div>
                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                                {cardRequests.length} Pending
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Req ID</th>
                                        <th className="p-4 font-semibold">Client</th>
                                        <th className="p-4 font-semibold">Date</th>
                                        <th className="p-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cardRequests.map((req) => (
                                        <tr key={req.request_id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 text-gray-500 text-sm">#{req.request_id}</td>
                                            <td className="p-4 font-bold text-gray-800">{req.name} {req.lastname}</td>
                                            <td className="p-4 text-gray-600 text-sm">{new Date(req.request_date).toLocaleDateString()}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRejectCard(req.request_id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-2 px-4 rounded shadow-sm transition"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveCard(req.request_id)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {cardRequests.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                                                No pending card requests.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section: Employees */}
                {activeTab === 'employees' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Employee Management</h2>
                                <p className="text-sm text-gray-500">Manage bank staff access</p>
                            </div>
                            <button
                                onClick={() => setIsEmployeeModalOpen(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Employee
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Name (User)</th>
                                        <th className="p-4 font-semibold">Position</th>
                                        <th className="p-4 font-semibold">Branch ID</th>
                                        <th className="p-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp) => (
                                        <tr key={emp.emp_id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 text-gray-500 text-sm">#{emp.emp_id}</td>
                                            <td className="p-4 font-bold text-gray-800">{emp.first_name} {emp.last_name}</td>
                                            <td className="p-4 text-gray-600 text-sm">{emp.position}</td>
                                            <td className="p-4 text-gray-600 text-sm">{emp.branch_id}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteEmployee(emp.emp_id)}
                                                    className="text-red-400 hover:text-red-600 font-bold text-xs transition border border-red-200 hover:border-red-400 px-3 py-1 rounded"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                                                No employees found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section: Clients */}
                {activeTab === 'clients' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Client Management</h2>
                                <p className="text-sm text-gray-500">Registered users database</p>
                                <p className="text-xs text-red-500">Debug: Clients: {clients.length}, Filtered: {filteredClients.length}, Search: "{clientSearch}"</p>
                                {debugError && <p className="text-xs text-red-700 font-bold bg-red-100 p-1 rounded mt-1">Error: {debugError}</p>}
                                <button
                                    onClick={loadClients}
                                    className="mt-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200"
                                >
                                    Force Reload
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search client..."
                                        className="border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                                    {filteredClients.length} Found
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Name</th>
                                        <th className="p-4 font-semibold">Email</th>
                                        <th className="p-4 font-semibold">Phone</th>
                                        <th className="p-4 font-semibold">Address</th>
                                        <th className="p-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClients.map((client) => (
                                        <tr key={client.client_id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 text-gray-500 text-sm">#{client.client_id}</td>
                                            <td className="p-4 font-bold text-gray-800">{client.first_name} {client.lastname}</td>
                                            <td className="p-4 text-blue-600 text-sm">{client.email}</td>
                                            <td className="p-4 text-gray-600 text-sm">{client.phone || '-'}</td>
                                            <td className="p-4 text-gray-600 text-sm truncate max-w-xs" title={client.address}>{client.address || '-'}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteClient(client.client_id)}
                                                    className="text-red-400 hover:text-red-600 font-bold text-xs transition border border-red-200 hover:border-red-400 px-3 py-1 rounded"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                                                No clients found matching "{clientSearch}".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Modal Add Employee */}
            {isEmployeeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-orange-500 p-4">
                            <h3 className="text-white font-bold text-lg">Add New Employee</h3>
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name (Username)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    value={newEmployee.name}
                                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="e.g. Manager, Teller"
                                    value={newEmployee.position}
                                    onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    value={newEmployee.password}
                                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEmployeeModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-lg shadow-md transition"
                                >
                                    Create Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}