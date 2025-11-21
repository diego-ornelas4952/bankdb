import React, { useState } from 'react';
import Dashboard from './pages/Dashboard'; // Tu panel de empleados actual
import Login from './pages/login';

function App() {
    const [user, setUser] = useState(null); // null = nadie logueado
    const [role, setRole] = useState('');   // 'admin' o 'client'

    const handleLogin = (usuarioDatos, rolUsuario) => {
        setUser(usuarioDatos);
        setRole(rolUsuario);
    };

    const handleLogout = () => {
        setUser(null);
        setRole('');
    };

    // Lógica de ruteo simple
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    if (role === 'admin') {
        return (
            <div>
                {/* Botón temporal para salir */}
                <button onClick={handleLogout} className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">Salir</button>
                <Dashboard />
            </div>
        );
    }

    if (role === 'client') {
        return (
            <div className="p-10 text-center">
                <h1 className="text-3xl">Hola, {user.name} {user.lastname}</h1>
                <p>Aquí iría tu saldo y movimientos (Próximamente)</p>
                <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Cerrar Sesión</button>
            </div>
        );
    }
}

export default App;