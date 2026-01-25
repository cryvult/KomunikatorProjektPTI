import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

const SOCKET_URL = 'http://localhost:3001';

export default function Chat({ user, onLogout }) {
    const [socket, setSocket] = useState(null);
    const [currentRoom, setCurrentRoom] = useState('public');
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [customRoomInput, setCustomRoomInput] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_room', currentRoom);
        fetchHistory(currentRoom);

        const handleReceiveMessage = (data) => {
            if (data.room === currentRoom) {
                setMessages((prev) => [...prev, data]);
            }
        };
        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, currentRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchHistory = async (room) => {
        try {
            const res = await axios.get(`${SOCKET_URL}/messages/${room}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Błąd pobierania historii", err);
        }
    };

    const sendMessage = async () => {
        if (inputMessage.trim() === '') return;
        const messageData = {
            room: currentRoom,
            sender_id: user.id,
            username: user.username,
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        await socket.emit('send_message', messageData);
        setInputMessage('');
        setShowEmojiPicker(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${SOCKET_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const messageData = {
                room: currentRoom,
                sender_id: user.id,
                username: user.username,
                content: `Przesłano plik: ${res.data.fileName}`,
                file_path: res.data.filePath,
                file_type: res.data.fileType,
                created_at: new Date().toISOString(),
            };
            await socket.emit('send_message', messageData);
        } catch (err) {
            console.error("Upload error", err);
            alert("Błąd wysyłania pliku");
        }
    };

    const [savedRooms, setSavedRooms] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('saved_rooms');
        if (stored) {
            setSavedRooms(JSON.parse(stored));
        }
    }, []);

    const joinCustomRoom = () => {
        const roomName = customRoomInput.trim();
        if (roomName) {
            setCurrentRoom(roomName);
            setCustomRoomInput('');
            if (roomName !== 'public' && !savedRooms.includes(roomName)) {
                const newRooms = [...savedRooms, roomName];
                setSavedRooms(newRooms);
                localStorage.setItem('saved_rooms', JSON.stringify(newRooms));
            }
        }
    };

    const removeRoom = (roomName, e) => {
        e.stopPropagation();
        const newRooms = savedRooms.filter(r => r !== roomName);
        setSavedRooms(newRooms);
        localStorage.setItem('saved_rooms', JSON.stringify(newRooms));
        if (currentRoom === roomName) setCurrentRoom('public');
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', padding: '0', background: 'var(--bg-color)', overflow: 'hidden' }}>

            {/* Modern Sidebar */}
            <div className="sidebar" style={{ width: '300px', background: 'var(--panel-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--primary-accent)', fontSize: '0.6rem', letterSpacing: '6px', marginBottom: '0.2rem', fontWeight: 'bold' }}>LAMBORGHINI</div>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Comm Hub
                    </h2>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0 }}>Główne</h4>
                    <button
                        className={`btn room-btn ${currentRoom === 'public' ? 'active' : ''}`}
                        style={{
                            width: '100%',
                            marginBottom: '1rem',
                            background: currentRoom === 'public' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.02)',
                            color: currentRoom === 'public' ? 'black' : 'var(--text-primary)',
                            justifyContent: 'flex-start',
                            padding: '0.8rem 1.5rem',
                        }}
                        onClick={() => setCurrentRoom('public')}
                    >
                        # Publiczny
                    </button>

                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1.5rem' }}>Twoje Pokoje</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {savedRooms.map(room => (
                            <div key={room} style={{ display: 'flex', alignItems: 'center', group: 'room-item' }}>
                                <button
                                    className={`btn room-btn ${currentRoom === room ? 'active' : ''}`}
                                    style={{
                                        flex: 1,
                                        background: currentRoom === room ? 'var(--primary-accent)' : 'rgba(255,255,255,0.02)',
                                        color: currentRoom === room ? 'black' : 'var(--text-primary)',
                                        textAlign: 'left',
                                        padding: '0.6rem 1rem',
                                    }}
                                    onClick={() => setCurrentRoom(room)}
                                >
                                    # {room}
                                </button>
                                <button
                                    onClick={(e) => removeRoom(room, e)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--border-color)', cursor: 'pointer', padding: '0 10px', transition: 'color 0.2s' }}
                                    onMouseOver={(e) => e.target.style.color = 'var(--danger-color)'}
                                    onMouseOut={(e) => e.target.style.color = 'var(--border-color)'}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input-field"
                                style={{ paddingRight: '40px', marginBottom: 0, background: 'rgba(255,255,255,0.03)' }}
                                placeholder="Dodaj pokój..."
                                value={customRoomInput}
                                onChange={(e) => setCustomRoomInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && joinCustomRoom()}
                            />
                            <button
                                onClick={joinCustomRoom}
                                style={{
                                    position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'var(--primary-gradient)', border: 'none', width: '28px', height: '28px',
                                    borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '0', border: '1px solid var(--primary-accent)', background: 'transparent', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {user.username[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600' }}>{user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>Online</div>
                        </div>
                    </div>
                    <button onClick={onLogout} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        Wyloguj
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                {/* Header */}
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 2rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>#</span>
                            {currentRoom}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lista wiadomości</span>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: isMe ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                                        {isMe ? 'Ty' : msg.username || msg.sender_name}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="chat-bubble" style={{
                                    padding: '1rem 1.5rem',
                                    background: isMe ? 'var(--primary-accent)' : 'var(--panel-bg)',
                                    color: isMe ? 'black' : 'var(--text-primary)',
                                    border: isMe ? 'none' : '1px solid var(--border-color)',
                                    lineHeight: '1.5',
                                    fontWeight: isMe ? '600' : '400'
                                }}>
                                    {msg.content}
                                    {msg.file_path && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            {msg.file_type && msg.file_type.startsWith('image/') ? (
                                                <img src={msg.file_path} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                            ) : (
                                                <a href={msg.file_path} target="_blank" rel="noopener noreferrer" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📄</span> Pobierz plik
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-color)' }}>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '0' }}>
                        <button
                            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <span style={{ color: 'var(--text-secondary)' }}>📎</span>
                        </button>

                        <input
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', padding: '10px', outline: 'none', fontFamily: 'Outfit, sans-serif' }}
                            placeholder={`SYSTEM MESSAGE ON #${currentRoom.toUpperCase()}...`}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />

                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim()}
                            style={{
                                width: '45px', height: '45px', border: 'none',
                                background: inputMessage.trim() ? 'var(--primary-accent)' : '#222',
                                color: inputMessage.trim() ? 'black' : '#444',
                                cursor: inputMessage.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                fontWeight: 'bold'
                            }}
                        >
                            ➤
                        </button>
                    </div>

                    {showEmojiPicker && (
                        <div style={{ position: 'absolute', bottom: '100px', left: '80px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            <EmojiPicker onEmojiClick={(emoji) => setInputMessage(prev => prev + emoji.emoji)} theme="dark" />
                        </div>
                    )}

                    <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                </div>
            </div>
        </div>
    );
}
