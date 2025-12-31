let localStream;
let remoteStream;
let peerConnection;
let socket;
let partnerId;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
};

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const searchUI = document.getElementById('search-ui');
const nextBtn = document.querySelector('.control-btn.next');

async function init() {
    try {
        // 1. Get User Media
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // 2. Connect to Signaling Server
        const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? undefined // Defaults to current domain for local testing
            : 'https://mixichat-signaling.onrender.com';

        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to signaling server');
            startSearch();
        });

        socket.on('match-found', async ({ partnerId: id, initiator }) => {
            console.log('Match found with:', id, 'Initiator:', initiator);
            partnerId = id;
            hideSearchUI();
            await createPeerConnection(initiator);
        });

        socket.on('signal', async ({ from, signal }) => {
            if (!peerConnection) return;

            if (signal.type === 'offer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('signal', { to: from, signal: peerConnection.localDescription });
            } else if (signal.type === 'answer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
            }
        });

        socket.on('partner-disconnected', () => {
            console.log('Partner disconnected');
            closeConnection();
            startSearch();
        });

    } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Could not access camera/microphone. Please check permissions.');
    }
}

function startSearch() {
    showSearchUI();
    socket.emit('find-match');
}

async function createPeerConnection(initiator) {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
    }

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: partnerId, signal: event.candidate });
        }
    };

    if (initiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('signal', { to: partnerId, signal: peerConnection.localDescription });
    }
}

function closeConnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }
}

function showSearchUI() {
    if (searchUI) searchUI.style.display = 'block';
    if (remoteVideo) remoteVideo.style.display = 'none';
}

function hideSearchUI() {
    if (searchUI) searchUI.style.display = 'none';
    if (remoteVideo) remoteVideo.style.display = 'block';
}

const toggleMicBtn = document.getElementById('toggle-mic');
const toggleVideoBtn = document.getElementById('toggle-video');

if (toggleMicBtn) {
    toggleMicBtn.addEventListener('click', () => {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            toggleMicBtn.classList.toggle('active', !audioTrack.enabled);
            toggleMicBtn.innerHTML = audioTrack.enabled ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
        }
    });
}

if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener('click', () => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            toggleVideoBtn.classList.toggle('active', !videoTrack.enabled);
            toggleVideoBtn.innerHTML = videoTrack.enabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        closeConnection();
        startSearch();
    });
}

// Start the app
init();
