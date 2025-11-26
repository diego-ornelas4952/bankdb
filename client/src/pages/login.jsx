import React, { useState, useEffect } from 'react';

export default function Login({ onLogin, onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [bgImage, setBgImage] = useState('');

    // Imágenes de fondo
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

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                onLogin(data.user, data.role);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Error connecting to the server');
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
                        <h1 className="text-5xl font-bold mb-4">DB Bank</h1>
                        <p className="text-xl font-light">Your financial future, in our hands.</p>
                    </div>
                </div>
            </div>

            {/* Lado Derecho: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="bg-blue-900 p-3 rounded-xl inline-block mb-6 shadow-lg">
                            <img src="/dbbank-logo.png" alt="DB Bank" className="h-12 w-auto object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                        <p className="text-gray-500">Enter your credentials to access</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-xl">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Username / Email</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="ej. john.appleseed@mail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center border border-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-bold shadow-lg transform hover:-translate-y-0.5"
                        >
                            Login
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-gray-500 text-sm mb-2">Don't have an account?</p>
                        <button
                            onClick={onRegister}
                            className="text-blue-600 font-bold hover:underline transition"
                        >
                            Create an account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}