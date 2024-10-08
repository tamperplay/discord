const signalingServer = new WebSocket(`wss://${window.location.host}`);
let localStream;
let peerConnection;
let isMuted = false;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// HTML элементы
const usernameInput = document.getElementById('username');
const loginButton = document.getElementById('loginButton');
const muteButton = document.getElementById('muteButton');

loginButton.addEventListener('click', async () => {
  const username = usernameInput.value;
  if (username) {
    signalingServer.send(JSON.stringify({ type: 'login', username }));
    loginButton.disabled = true;
    usernameInput.disabled = true;
    muteButton.disabled = false;
    startChat();
  }
});

muteButton.addEventListener('click', () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
});

async function startChat() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ type: 'signal', candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    const audioElement = new Audio();
    audioElement.srcObject = event.streams[0];
    audioElement.play();
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ type: 'signal', offer }));
}

signalingServer.onmessage = async (message) => {
  const data = JSON.parse(message.data);
  if (data.type === 'signal') {
    if (data.offer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      signalingServer.send(JSON.stringify({ type: 'signal', answer }));
    } else if (data.answer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
};
