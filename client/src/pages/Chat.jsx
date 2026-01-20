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

    // Inicjalizacja Socket.io
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Obsługa pokoju i wiadomości
    useEffect(() => {
        if (!socket) return;

        socket.emit('join_room', currentRoom);

        // Pobierz historię
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

    // Scroll do dołu
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

    const joinCustomRoom = () => {
        if (customRoomInput.trim()) {
            setCurrentRoom(customRoomInput.trim());
            setCustomRoomInput('');
        }
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', padding: '20px', boxSizing: 'border-box', gap: '20px' }}>

            {/* Sidebar - Lista Pokoi */}
            <div className="glass-panel" style={{ width: '250px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Pokoje</h3>

                <button
                    className="btn"
                    style={{ marginBottom: '1rem', background: currentRoom === 'public' ? 'var(--accent-hover)' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => setCurrentRoom('public')}
                >
                    # Publiczny
                </button>

                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Dołącz do innego pokoju:</p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            className="input-field"
                            style={{ marginBottom: 0, padding: '0.5rem' }}
                            placeholder="Nazwa pokoju..."
                            value={customRoomInput}
                            onChange={(e) => setCustomRoomInput(e.target.value)}
                        />
                        <button className="btn" style={{ padding: '0.5rem', borderRadius: '8px' }} onClick={joinCustomRoom}>Go</button>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user.username[0].toUpperCase()}
                        </div>
                        <span>{user.username}</span>
                    </div>
                    <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                        Wyloguj
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>

                {/* Header */}
                <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                    <h3>#{currentRoom}</h3>
                </div>

                {/* Messages List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                                    {msg.username || msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: isMe ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                    borderBottomRightRadius: isMe ? '2px' : '12px',
                                    borderBottomLeftRadius: isMe ? '12px' : '2px',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.content}
                                    {msg.file_path && (
                                        <div style={{ marginTop: '10px' }}>
                                            {msg.file_type && msg.file_type.startsWith('image/') ? (
                                                <img src={msg.file_path} alt="attachment" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                            ) : (
                                                <a href={msg.file_path} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
                                                    📎 Pobierz plik
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
                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>

                    {showEmojiPicker && (
                        <div style={{ position: 'absolute', bottom: '80px', left: '20px', zIndex: 100 }}>
                            <EmojiPicker onEmojiClick={(emoji) => setInputMessage(prev => prev + emoji.emoji)} theme="dark" />
                        </div>
                    )}

                    <button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', filter: 'grayscale(100%) brightness(200%)' }}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😊
                    </button>

                    <button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', filter: 'grayscale(100%) brightness(200%)' }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        📎
                    </button>
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />

                    <input
                        className="input-field"
                        style={{ marginBottom: 0, borderRadius: '25px', padding: '10px 20px' }}
                        placeholder="Napisz wiadomość..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />

                    <button className="btn" onClick={sendMessage} style={{ borderRadius: '50%', padding: '12px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
