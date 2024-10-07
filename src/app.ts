import "./app.css";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import {Howl, Howler} from 'howler';
import { User, Message } from "./types";
import { formatMessageDate } from "./utils";
import notificationSound from "../notification.wav";

const notification = new Howl({
    src: [notificationSound]
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

loginButton.addEventListener("click", handleLogin);
chatForm.addEventListener("submit", handleSendMessage);
// voiceButton.addEventListener('click', handleVoiceMessage);

socket.on("connect", () => {
    if (!isAuthenticated) {
  const sessionToken = Cookies.get("sessionToken");
  if (sessionToken) {
    socket.emit("login", sessionToken);
  }}
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

socket.on("message", (message: any) => {
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

function displayMessage(message: Message): void {
  const formattedDate = formatMessageDate(message.timestamp);

  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  // Add class based on message author
  if (message.userId === currentUserId) {
    messageElement.classList.add("my-message");
  } else {
    messageElement.classList.add("other-message");
  }

  messageElement.innerHTML = `
      <span class="message-user">${message.userName}</span>
      <span class="message-time">${formattedDate}</span>
      <div class="message-content">${message.content}</div>
    `;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
