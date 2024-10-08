const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Инициализация приложения Express
const app = express();

// Подача статических файлов из папки "public"
app.use(express.static(path.join(__dirname, 'public')));

// Создание HTTP-сервера
const server = http.createServer(app);

// Инициализация WebSocket сервера
const wss = new WebSocket.Server({ server });

// Обработчик WebSocket-соединений
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message);

    // Рассылаем сообщение всем подключённым клиентам
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
