const signalingServer = new WebSocket(`wss://${window.location.host}`); 
let localStream;
let peerConnection;
let userId;
let isMuted = false;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// HTML элементы
const usernameInput = document.getElementById('username');
const loginButton = document.getElementById('loginButton');
const muteButton = document.getElementById('muteButton');

// Авторизация пользователя
loginButton.addEventListener('click', () => {
  const username = usernameInput.value;
  if (username) {
    signalingServer.send(JSON.stringify({ type: 'login', username }));
  }
});

// Обработка сообщения об успешном логине
signalingServer.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  switch (data.type) {
    case 'login_success':
      userId = data.userId;
      loginButton.disabled = true;
      usernameInput.disabled = true;
      muteButton.disabled = false;
      startChat();
      break;

    case 'signal':
      handleSignal(data);
      break;

    case 'mute':
      console.log(`${data.username} is ${data.isMuted ? 'muted' : 'unmuted'}`);
      break;

    default:
      break;
  }
};

// Функция для старта чата
async function startChat() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ type: 'signal', signal: { candidate: event.candidate } }));
    }
  };

  peerConnection.ontrack = (event) => {
    const audioElement = new Audio();
    audioElement.srcObject = event.streams[0];
    audioElement.play();
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ type: 'signal', signal: { offer } }));
}

// Обработка сигналов от других клиентов
async function handleSignal(data) {
  if (data.signal.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signalingServer.send(JSON.stringify({ type: 'signal', signal: { answer } }));
  } else if (data.signal.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.answer));
  } else if (data.signal.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
  }
}

// Функция для мьюта
muteButton.addEventListener('click', () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  signalingServer.send(JSON.stringify({ type: 'mute', isMuted }));
  muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
});

// Обработка горячей клавиши "M"
document.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    muteButton.click();
  }
});
