const startButton = document.getElementById('startButton');
const muteButton = document.getElementById('muteButton');
let localStream;
let isMuted = false;

// Подключение к WebSocket серверу
const socket = new WebSocket(`wss://${window.location.host}`);

// Когда соединение WebSocket открыто
socket.onopen = () => {
  console.log('Connected to WebSocket server');
};

// Когда приходит сообщение от WebSocket сервера
socket.onmessage = (event) => {
  console.log('Received message:', event.data);
};

// Функция для старта голосового чата
startButton.addEventListener('click', async () => {
  try {
    // Запрашиваем доступ к микрофону
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Audio stream started');
    muteButton.disabled = false;

    // Отправляем сообщение о подключении
    socket.send('User joined the chat');
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
});

// Функция для мьютирования микрофона
muteButton.addEventListener('click', () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
  socket.send(isMuted ? 'User muted' : 'User unmuted');
});
