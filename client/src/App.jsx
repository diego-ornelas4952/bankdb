import React, { useState } from 'react';
import Dashboard from './pages/Dashboard'; // Admin panel
import Login from './pages/login'; // Login panel
import Register from './pages/Register'; // Registration panel
import ClientDashboard from './pages/ClientDashboard'; // Client panel

function App() {
    const [user, setUser] = useState(null); // Nobody logged in
    const [role, setRole] = useState('');   // 'admin' or 'client'
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

    // Simple routing logic
    if (!user) {
        if (isRegistering) {
            return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
        }
        return <Login onLogin={handleLogin} onRegister={() => setIsRegistering(true)} />;
    }

    if (role === 'admin') {
        return (
            <div>
                <Dashboard onLogout={handleLogout} />
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