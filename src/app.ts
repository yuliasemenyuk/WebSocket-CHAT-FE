import "./app.css";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { User } from "./types";

console.log(process.env.HOST);

//Connecting to server
const socket = io(process.env.HOST);

// DOM elements
const loginContainer = document.getElementById("login-container")!;
const chatContainer = document.getElementById("chat-container")!;
const chatMessages = document.getElementById("chat-messages")!;
const chatForm = document.getElementById("chat-form")! as HTMLFormElement;
const usernameInput = document.getElementById(
  "username-input"
)! as HTMLInputElement;
const messageInput = document.getElementById(
  "message-input"
)! as HTMLInputElement;
const loginButton = document.getElementById("login-button")!;
const voiceButton = document.getElementById("voice-button")!;
const statusDiv = document.getElementById("status")!;

let username = "";

loginButton.addEventListener("click", handleLogin);
// chatForm.addEventListener('submit', handleSendMessage);
// voiceButton.addEventListener('click', handleVoiceMessage);

socket.on("connect", () => {
const sessionToken = Cookies.get("sessionToken");
if (sessionToken) {
    socket.emit("login", (sessionToken))
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

socket.on("message", (message: any) => {
  console.log("New message:", message);
});

socket.on("message", (message: any) => {
  console.log("New message:", message);
});

// Function to send a message
function sendMessage(message: string) {
  socket.emit("message", message);
}

function handleLogin() {
  username = usernameInput.value.trim();
  if (username) {
    socket.emit("create", username);
    // loginContainer.style.display = 'none';
    // chatContainer.style.display = 'block';
  }
}

function updateUIWithUserInfo(user: { id: string; name: string }) {
  // Update UI to show logged in user's name
  console.log("Logged in as:", user.name);
  if (loginContainer && chatForm && statusDiv) {
    // Hide login container
    loginContainer.style.display = "none";

    // Show chat form
    chatForm.style.display = "block";

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
  if (chatContainer) {
    chatContainer.appendChild(userList);
  }
}
