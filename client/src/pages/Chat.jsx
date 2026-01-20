import { useEffect, useState } from 'react';

export default function Chat({ user, onLogout }) {
    return (
        <div className="glass-panel fade-in" style={{ width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3>Witaj, {user.username}</h3>
                <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Wyloguj
                </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                Wybierz pokój lub rozpocznij czat...
            </div>
        </div>
    );
}
