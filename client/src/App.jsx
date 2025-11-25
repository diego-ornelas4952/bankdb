import React, { useState } from 'react';
import Dashboard from './pages/Dashboard'; // Tu panel de empleados actual
import Login from './pages/login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';

function App() {
    const [user, setUser] = useState(null); // null = nadie logueado
    const [role, setRole] = useState('');   // 'admin' o 'client'
    const [isRegistering, setIsRegistering] = useState(false);

    const handleLogin = (userData, roleUser) => {
        setUser(userData);
        setRole(roleUser);
    };

    const handleUpdateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const handleLogout = () => {
        setUser(null);
        setRole('');
        setIsRegistering(false);
    };

    // Lógica de ruteo simple
    if (!user) {
        if (isRegistering) {
            return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
        }
        return <Login onLogin={handleLogin} onRegister={() => setIsRegistering(true)} />;
    }

    if (role === 'admin') {
        return (
            <div>
                {/* Botón temporal para salir */}
                <button onClick={handleLogout} className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                <Dashboard />
            </div>
        );
    }

    if (role === 'client') {
        return (
            <ClientDashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        );
    }
}

export default App;