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

### Wymagania
- Node.js (v16 lub nowszy)
- MySQL (lub XAMPP z MySQL)
- Git

### 1. Sklonuj Repozytorium
```bash
git clone https://github.com/cryvult/KomunikatorProjektPTI.git
cd KomunikatorProjektPTI
```

### 2. Konfiguracja Bazy Danych (MySQL)
1. Uruchom MySQL (np. przez XAMPP)
2. Utwórz bazę danych i tabele uruchamiając plik `server/database.sql`:
   ```sql
   -- W phpMyAdmin lub MySQL Workbench wykonaj zawartość pliku server/database.sql
   ```
3. Skopiuj plik `.env.example` na `.env` w folderze `server/`:
   ```bash
   cd server
   cp .env.example .env
   ```
4. Edytuj `server/.env` i ustaw swoje dane dostępowe do MySQL:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=twoje_haslo
   DB_NAME=komunikator_db
   ```

### 3. Instalacja i Uruchomienie Serwera (Backend)
```bash
cd server
npm install
npm start
```
Serwer uruchomi się na porcie **3001**.

### 4. Instalacja i Uruchomienie Klienta (Frontend)
Otwórz nowe okno terminala:
```bash
cd client
npm install
npm run dev
```
Aplikacja będzie dostępna pod adresem **http://localhost:5173**.

### 5. Gotowe!
Otwórz przeglądarkę i przejdź do `http://localhost:5173`. Możesz się zarejestrować i zacząć czatować!
