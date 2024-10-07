import "./app.css";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { Howl, Howler } from "howler";
import { User, Message } from "./types";
import { formatMessageDate } from "./utils";
import notificationSound from "../notification.wav";

const notification = new Howl({
  src: [notificationSound],
});

//Connecting to server
const socket = io(process.env.HOST);

// DOM elements
const loginContainer = document.getElementById(
  "login-container"
)! as HTMLDivElement;
const chatContainer = document.getElementById(
  "chat-container"
)! as HTMLDivElement;
const chatMessages = document.getElementById(
  "chat-messages"
)! as HTMLDivElement;
const chatForm = document.getElementById("chat-form")! as HTMLFormElement;
const usernameInput = document.getElementById(
  "username-input"
)! as HTMLInputElement;
const messageInput = document.getElementById(
  "message-input"
)! as HTMLInputElement;
const loginButton = document.getElementById(
  "login-button"
)! as HTMLButtonElement;
const voiceButton = document.getElementById(
  "voice-button"
)! as HTMLButtonElement;
const statusDiv = document.getElementById("status")! as HTMLDivElement;

let isAuthenticated = false;
let username = "";
let currentUserId: string;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording: boolean = false;

loginButton.addEventListener("click", handleLogin);
chatForm.addEventListener("submit", handleSendMessage);
// voiceButton.addEventListener('click', handleVoiceMessage);

socket.on("connect", () => {
  if (!isAuthenticated) {
    const sessionToken = Cookies.get("sessionToken");
    if (sessionToken) {
      socket.emit("login", sessionToken);
    }
  }
  console.log("Connected to server");
});

socket.on("usersList", (users: Array<{ id: string; name: string }>) => {
  console.log("Received updated users list:", users);
  updateConnectedUsersList(users);
});

socket.on(
  "loginSuccess",
  (data: { sessionToken: string; user: { id: string; name: string } }) => {
    Cookies.set("sessionToken", data.sessionToken, { expires: 30 });
    updateUIWithUserInfo(data.user);
  }
);

socket.on("message", (message: Message) => {
  console.log("New message:", message);
  notification.play();
  displayMessage(message);
});

function handleLogin() {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit("create", username);
    // loginContainer.style.display = 'none';
    // chatContainer.style.display = 'block';
  }
}

function handleSendMessage(e: Event) {
  e.preventDefault();
  const messageContent = messageInput.value.trim();
  if (messageContent) {
    const message = {
      content: messageContent,
      timestamp: Date.now(),
    };
    socket.emit("message", message);
    messageInput.value = "";
  }
}

voiceButton.addEventListener("mousedown", () => {
  startRecording();
  isRecording = true;
});

voiceButton.addEventListener("mouseup", () => {
  if (isRecording) {
    stopRecording();
    isRecording = false;
  }
});

function startRecording() {
  voiceButton.innerHTML = "&#128308";
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        sendAudioMessage(audioBlob);
      });

      mediaRecorder.start();
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
      stopRecording();
    });
}

function stopRecording() {
  voiceButton.innerHTML = "&#127908";
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
}

function updateUIWithUserInfo(user: { id: string; name: string }) {
  // Update UI to show logged in user's name
  console.log("Logged in as:", user.name);
  currentUserId = user.id;
  isAuthenticated = true;
  if (loginContainer && chatForm && statusDiv) {
    // Hide login container
    loginContainer.style.display = "none";

    // Update status with user info
    statusDiv.textContent = `Logged in as: ${user.name}`;
  }
}

function updateConnectedUsersList(users: User[]) {
  // Remove existing user list if any
  const existingList = document.getElementById("connected-users");
  if (existingList) {
    existingList.remove();
  }

  // Create new user list
  const userList = document.createElement("div");
  userList.id = "connected-users";
  userList.innerHTML = "<h3>Connected Users:</h3>";

  const list = document.createElement("ul");
  users.forEach((user) => {
    const listItem = document.createElement("li");
    listItem.textContent = user.name;
    list.appendChild(listItem);
  });

  userList.appendChild(list);

  // Add the new list to the chat container
  notification.play();
  chatContainer.appendChild(userList);
}

function displayMessage(message: Message) {
    console.log(message, "message")
  const chatMessages = document.getElementById(
    "chat-messages"
  ) as HTMLDivElement;
  const messageElement = document.createElement("div");
  messageElement.classList.add(
    "message",
    message.userId === currentUserId ? "my-message" : "other-message"
  );

  let contentHtml;
  if (message.type === "audio") {
    const audioBlob = new Blob([message.content as ArrayBuffer], {
      type: "audio/webm",
    });
    const audioUrl = URL.createObjectURL(audioBlob);
    contentHtml = `<audio controls src="${audioUrl}"></audio>`;
  } else {
    contentHtml = `<p>${message.content}</p>`;
  }

  messageElement.innerHTML = `
      <span class="message-user">${message.userName}</span>
      ${contentHtml}
      <span class="message-time">${formatMessageDate(message.timestamp)}</span>
    `;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendAudioMessage(audioBlob: Blob) {
  const reader = new FileReader();
  reader.onload = function () {
    const arrayBuffer = reader.result as ArrayBuffer;
    const message = {
      type: "audio",
      content: arrayBuffer,
      timestamp: Date.now(),
    };
    socket.emit("message", message);
  };
  reader.readAsArrayBuffer(audioBlob);
}
