import { useState } from 'react';
import axios from 'axios';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Używamy IP serwera lub localhost
        const API_URL = 'http://localhost:3001';

        try {
            if (isLogin) {
                const res = await axios.post(`${API_URL}/login`, { username, password });
                onLogin(res.data);
            } else {
                await axios.post(`${API_URL}/register`, { username, password });
                setSuccess('Rejestracja udana! Możesz się zalogować.');
                setIsLogin(true);
                setUsername('');
                setPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Wystąpił błąd');
        }
    };

    return (
        <div className="glass-panel fade-in" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary-accent)', fontSize: '0.7rem', letterSpacing: '8px', marginBottom: '0.5rem', fontWeight: 'bold' }}>LAMBORGHINI</div>
            <h2 style={{ marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '3px' }}>{isLogin ? 'Automobili Login' : 'Create Account'}</h2>

            {error && (
                <div style={{
                    color: '#fff',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid var(--danger-color)',
                    padding: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    color: '#fff',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid var(--success-color)',
                    padding: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                }}>
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nazwa użytkownika"
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Hasło"
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                    {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
                </button>
            </form>

            <div style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
                <span
                    style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
                </span>
            </div>
        </div>
    );
}
