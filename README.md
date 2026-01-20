# Projekt Komunikator
Artur Krywult 
Jakub Bednarz

## Protokół Komunikacji
Aplikacja wykorzystuje technologię **WebSocket** (przy użyciu biblioteki Socket.IO) do zapewnienia dwukierunkowej komunikacji w czasie rzeczywistym między klientem a serwerem.
- **Zdarzenia (Events):**
    - `send_message`: Klient wysyła wiadomość do serwera.
    - `receive_message`: Serwer przesyła nową wiadomość do odpowiednich klientów (broadcast dla publicznego, unicast dla prywatnego).
    - `user_login`: Uwierzytelnienie użytkownika.
    - `file_upload`: Przesyłanie plików (HTTP POST, a następnie powiadomienie przez Socket.IO).

## Baza Danych
Aplikacja korzysta z relacyjnej bazy danych **MySQL**.
Struktura bazy danych znajduje się w pliku `server/database.sql`.

## Zabezpieczenia
- Hasła użytkowników są haszowane przy użyciu algorytmu **bcrypt**.
- Ochrona przed SQL Injection poprzez stosowanie zapytań parametryzowanych.
- Walidacja danych wejściowych po stronie serwera.

## Instrukcja Uruchomienia

### 1. Baza Danych (MySQL)
Uruchom plik `server/database.sql` w swojej bazie danych MySQL, aby utworzyć wymagane tabele.
Upewnij się, że w pliku `server/.env` (lub w kodzie `server.js`) skonfigurowane są poprawne dane dostępowe do bazy.

### 2. Serwer (Backend)
```bash
cd server
npm install
npm start
```
Serwer uruchomi się na porcie 3001.

### 3. Klient (Frontend)
```bash
cd client
npm install
npm run dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:5173`.
