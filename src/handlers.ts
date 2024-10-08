import { User, Message } from "./types";
import { formatMessageDate, textNotification } from "./utils";
import { socket } from "./app";
import { Howl} from "howler";
import notificationSound from "../notification.wav";
import Cookies from "js-cookie";

export const notification = new Howl({
  src: [notificationSound],
});

let username = "";
let currentUserId: string;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording: boolean = false;

// DOM elements
const loginContainer = document.getElementById(
  "login-container"
)! as HTMLDivElement;
const chatContainer = document.getElementById(
  "chat-container"
)! as HTMLDivElement;
const chatMessages = document.getElementById(
  "chat-messages"
)! as HTMLUListElement;
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

loginButton.addEventListener("click", handleLogin);
chatForm.addEventListener("submit", handleSendMessage);

function handleLogin() {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit("create", username);
  }
}

function handleSendMessage(e: Event) {
  e.preventDefault();
  // session Authentification
  const sessionToken = Cookies.get("sessionToken");
  if (!sessionToken) {
    textNotification("Session is not active", "error");
    setTimeout(() => {
      location.reload();
    }, 1500);
  } else {
    //Message sending
    const messageContent = messageInput.value.trim();
    if (messageContent && messageContent.length <= 1000) {
      const message = {
        type: "text",
        content: messageContent,
        timestamp: Date.now(),
        sessionToken: sessionToken,
      };
      socket.emit("message", message);
    } else if (!messageContent) {
      textNotification("Message can't be empty", "error");
    } else {
      textNotification("Message is too long", "error");
    }
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

export function updateUIWithUserInfo(user: { id: string; name: string }) {
  // Update UI to show logged in user's name
  console.log("Logged in as:", user.name);
  currentUserId = user.id;
  if (loginContainer && chatForm && statusDiv) {
    // Hide login container
    loginContainer.style.display = "none";

    // Update status with user info
    statusDiv.textContent = `Logged in as: ${user.name}`;
  }
}

export function updateConnectedUsersList(users: User[]) {
  const existingList = document.getElementById(
    "connected-users"
  ) as HTMLDivElement;
  let existingCount = 0;

  if (existingList) {
    const existingUl = existingList.querySelector("ul");
    existingCount = existingUl ? existingUl.childElementCount : 0;
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

  // Show user list changes notification
  const newCount = list.childElementCount;
  if (newCount > existingCount) {
    textNotification("New user connected", "success");
  } else if (newCount < existingCount) {
    textNotification("User disconnected", "success");
  } else {
    return;
  }

  // Remove existing user list if any
  if (existingList) {
    existingList.remove();
  }

  // Add the new list to the chat container
  chatContainer.appendChild(userList);

  console.log(`Previous user count: ${existingCount}`);
  console.log(`New user count: ${newCount}`);
}

export function displayMessage(message: Message) {
  const messageElement = document.createElement("li");
  messageElement.classList.add(
    "message",
    message.userId === currentUserId ? "my-message" : "other-message"
  );

  let contentHtml;
  if (message.type === "audio") {
    const audioBlob = new Blob([message.content], {
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
  // session Authentification
  const sessionToken = Cookies.get("sessionToken");
  if (!sessionToken) {
    textNotification("Session is not active", "error");
    setTimeout(() => {
      location.reload();
    }, 1500);
  } else {
    //Message sending
    const reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = reader.result as ArrayBuffer;
      const message = {
        type: "audio",
        content: arrayBuffer,
        timestamp: Date.now(),
        sessionToken: sessionToken,
      };
      socket.emit("message", message);
    };
    reader.readAsArrayBuffer(audioBlob);
  }
}

function sessionAuthentification(sessionToken: string) {
  if (!sessionToken) {
    textNotification("Session is not active", "error");
    return;
  }
}
