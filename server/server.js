const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL klienta Vite
        methods: ["GET", "POST"]
    }
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'komunikator_db'
};

let dbConnection;

async function connectToDatabase() {
    try {
        dbConnection = await mysql.createPool(dbConfig);
        console.log("Połączono z bazą danych MySQL");
    } catch (err) {
        console.error("Błąd połączenia z bazą danych:", err);
    }
}

connectToDatabase();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// --- ENDPOINTY ---

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) return res.status(400).json({ error: "Brak danych" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await dbConnection.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'Użytkownik zarejestrowany' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd rejestracji. Nazwa użytkownika może być zajęta.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await dbConnection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        res.json({ id: user.id, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd logowania' });
    }
});

app.get('/messages/:room', async (req, res) => {
    const { room } = req.params;
    try {
        if (!dbConnection) return res.json([]);

        if (room === 'public') {
            const [messages] = await dbConnection.execute(`
                SELECT m.*, u.username as sender_name 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id 
                WHERE m.recipient_id IS NULL 
                ORDER BY m.created_at ASC
            `);
            res.json(messages);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd pobierania wiadomości' });
    }
});

io.on('connection', (socket) => {
    console.log(`Użytkownik połączony: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
    });

    socket.on('send_message', async (data) => {
        const { sender_id, content, room } = data;
        try {
            if (dbConnection && room === 'public') {
                const [result] = await dbConnection.execute(
                    'INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, NULL, ?)',
                    [sender_id, content]
                );
                data.id = result.insertId;
            }
            io.to(room).emit('receive_message', data);
        } catch (err) {
            console.error("Błąd zapisu wiadomości:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik rozłączony', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
