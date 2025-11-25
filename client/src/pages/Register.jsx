import React, { useState } from 'react';

export default function Register({ onSwitchToLogin }) {
    // Estados para todos los campos necesarios en la BD
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            // 1. CAMBIO IMPORTANTE: La ruta ahora es /register
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 2. CAMBIO IMPORTANTE: Enviamos todos los datos
                body: JSON.stringify({ name, lastname, phone, email, password })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('¡Registro exitoso! Ahora puedes iniciar sesión.');
                // Limpiamos el formulario
                setName(''); setLastname(''); setPhone(''); setEmail(''); setPassword('');
            } else {
                setError(data.message || 'Error al registrarse');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-900 py-10">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Crear Cuenta</h2>
                    <p className="text-gray-500">Únete a Banco Seguro</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Input Nombre */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Ej. Juan"
                            required
                        />
                    </div>

                    {/* Input Apellidos */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Apellidos</label>
                        <input
                            type="text"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Ej. Pérez López"
                            required
                        />
                    </div>

                    {/* Input Teléfono */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Teléfono</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Ej. 555-1234"
                        />
                    </div>

                    {/* Input Email */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="juan@mail.com"
                            required
                        />
                    </div>

                    {/* Input Password */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="********"
                            required
                        />
                    </div>

                    {/* Mensajes de Error o Éxito */}
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">{error}</p>}
                    {successMessage && <p className="text-green-600 text-sm text-center bg-green-100 p-2 rounded font-bold">{successMessage}</p>}

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300 font-bold shadow-md"
                    >
                        Registrarse
                    </button>
                </form>

                {/* Botón para volver al Login */}
                <div className="mt-4 text-center">
                    <button
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        ¿Ya tienes cuenta? Inicia Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}