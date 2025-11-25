import React, { useState, useEffect } from 'react';

export default function Register({ onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [bgImage, setBgImage] = useState('');

    // Imágenes de fondo aleatorias (Temática: California)
    const images = [
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2000&auto=format&fit=crop', // Golden Gate
        'https://images.unsplash.com/photo-1540651810471-569907e18e90?q=80&w=2000&auto=format&fit=crop', // Hollywood Sign
        'https://images.unsplash.com/photo-1534050359320-02900022671e?q=80&w=2000&auto=format&fit=crop', // Santa Monica
        'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2000&auto=format&fit=crop', // Yosemite
        'https://images.unsplash.com/photo-1449516428743-27ad2b35bb5c?q=80&w=2000&auto=format&fit=crop'  // Highway 1
    ];

    useEffect(() => {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        setBgImage(randomImage);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, lastname, phone, email, password })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('¡Cuenta creada con éxito!');
                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            } else {
                setError(data.message || 'Error al registrarse');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Lado Izquierdo: Imagen Aleatoria */}
            <div
                className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-blue-900 bg-opacity-40 flex items-center justify-center">
                    <div className="text-white text-center p-12">
                        <h1 className="text-5xl font-bold mb-4">Únete a Nosotros</h1>
                        <p className="text-xl font-light">Comienza a construir tu patrimonio hoy mismo.</p>
                    </div>
                </div>
            </div>

            {/* Lado Derecho: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h2>
                        <p className="text-gray-500">Completa tus datos para registrarte</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-2xl shadow-xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Juan"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Pérez"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="555-123-4567"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="juan@ejemplo.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-200">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center border border-green-200 font-bold">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-300 font-bold shadow-lg transform hover:-translate-y-0.5"
                        >
                            Registrarse
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            onClick={onSwitchToLogin}
                            className="text-blue-600 hover:underline text-sm font-medium"
                        >
                            ← Volver al Inicio de Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}