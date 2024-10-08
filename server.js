const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const shortid = require('shortid');

// Создание приложения и HTTP-сервера
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.use(express.static('public')); // Подача статических файлов (HTML, JS, CSS)

// WebSocket обработчик
wss.on('connection', (ws) => {
  const userId = shortid.generate();
  clients.set(userId, ws);

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'login':
        ws.username = data.username;
        ws.send(JSON.stringify({ type: 'login_success', userId }));
        break;

      case 'signal':
        clients.forEach((client, id) => {
          if (id !== userId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'signal',
              signal: data.signal,
              from: userId,
              username: ws.username,
            }));
          }
        });
        break;

      case 'mute':
        clients.forEach((client, id) => {
          if (id !== userId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'mute',
              userId: userId,
              username: ws.username,
              isMuted: data.isMuted,
            }));
          }
        });
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`User ${ws.username} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
