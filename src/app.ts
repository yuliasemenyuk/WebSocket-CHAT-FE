import './app.css';
import { io } from "socket.io-client";

console.log(process.env.HOST);

//Connecting to server
const socket = io(process.env.HOST);

// DOM elements
const loginContainer = document.getElementById('login-container')!;
const chatContainer = document.getElementById('chat-container')!;
const chatMessages = document.getElementById('chat-messages')!;
const chatForm = document.getElementById('chat-form')!;
const usernameInput = document.getElementById('username-input')! as HTMLInputElement;
const messageInput = document.getElementById('message-input')!;
const loginButton = document.getElementById('login-button')!;
const voiceButton = document.getElementById('voice-button')!;
const statusDiv = document.getElementById('status')!;

let username = '';

loginButton.addEventListener('click', handleLogin);
// chatForm.addEventListener('submit', handleSendMessage);
// voiceButton.addEventListener('click', handleVoiceMessage);

socket.on('connection', () => console.log("connected"));

function handleLogin() {
    username = usernameInput.value.trim();
    if (username) {
        socket.emit('user joined', username);
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'block';
    }
}


