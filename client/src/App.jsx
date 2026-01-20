import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import { useState, useEffect } from 'react';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <BrowserRouter>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={user ? <Navigate to="/chat" /> : <Auth onLogin={handleLogin} />} />
                    <Route path="/chat" element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
