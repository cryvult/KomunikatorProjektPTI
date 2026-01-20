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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'komunikator_db',
    multipleStatements: true
};

let dbConnection;

async function connectToDatabase() {
    try {
        dbConnection = await mysql.createPool(dbConfig);
        console.log("Połączono z bazą danych MySQL");

        // Init DB from file if needed (Code simplified, assuming manual init or pre-inited)
        // W środowisku dev można tu dodać auto-init, ale zostawmy to użytkownikowi/adminowi
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
        // Enforce ASCII names + timestamp to avoid encoding issues
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + safeName);
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

// Pobieranie historii wiadomości dla DOWOLNEGO pokoju
app.get('/messages/:room', async (req, res) => {
    const { room } = req.params;
    try {
        if (!dbConnection) return res.json([]);

        const [messages] = await dbConnection.execute(`
            SELECT m.*, u.username as sender_name 
            FROM messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.room_name = ? 
            ORDER BY m.created_at ASC
        `, [room]);

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd pobierania wiadomości' });
    }
});

// Endpoint uploadu plików
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
        filePath: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype
    });
});


io.on('connection', (socket) => {
    console.log(`Użytkownik połączony: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Użytkownik ${socket.id} dołączył do pokoju: ${room}`);
    });

    socket.on('send_message', async (data) => {
        const { sender_id, content, room, file_path, file_type } = data;
        try {
            if (dbConnection) {
                const [result] = await dbConnection.execute(
                    'INSERT INTO messages (sender_id, room_name, content, file_path, file_type) VALUES (?, ?, ?, ?, ?)',
                    [sender_id, room, content, file_path || null, file_type || null]
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
