import "./app.css";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { Message } from "./types";
import {
  updateUIWithUserInfo,
  updateConnectedUsersList,
  displayMessage,
  notification,
} from "./handlers";
import { textNotification } from "./utils";

//Connecting to server
export const socket = io(process.env.HOST, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

let isAuthenticated = false;

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
  updateConnectedUsersList(users);
});

socket.on(
  "loginSuccess",
  (data: { sessionToken: string; user: { id: string; name: string } }) => {
    Cookies.set("sessionToken", data.sessionToken, { expires: 30 });
    updateUIWithUserInfo(data.user);
    isAuthenticated = true;
  }
);

socket.on("loginError", () => {
  Cookies.remove("sessionToken");
  isAuthenticated = false;
  textNotification("Authentification failed, try again", "error");
  setTimeout(() => {
    location.reload();
  }, 1000);
});

socket.on("history", (history: Message[]) => {
  console.log(history, "histoty");
  history.map((msg) => displayMessage(msg));
});

socket.on("message", (message: Message) => {
  console.log("New message:", message);
  notification.play();
  displayMessage(message);
});

socket.on("messageError", () => {
  textNotification("Failed to send message", "error");
});

socket.on("messageSuccess", () => {
  const messageInput = document.getElementById(
    "message-input"
  )! as HTMLInputElement;
  textNotification("Message sent", "success");
  messageInput.value = "";
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
  textNotification(
    "Lost connection to server. Attempting to reconnect...",
    "error"
  );
});

socket.io.on("reconnect_attempt", (attemptNumber) => {
  console.log("Attempting to reconnect:", attemptNumber);
  textNotification(`Reconnection attempt ${attemptNumber}...`, "error");
});

socket.io.on("reconnect", (attemptNumber) => {
  console.log("Reconnected on attempt:", attemptNumber);
  textNotification("Reconnected to server", "success");
  const sessionToken = Cookies.get("sessionToken");
  if (sessionToken) {
    socket.emit("login", sessionToken);
  } else {
    location.reload();
  }
});

socket.io.on("reconnect_error", (error) => {
  console.error("Reconnection error:", error);
  textNotification(
    "Failed to reconnect. Please check your internet connection.",
    "error"
  );
});

socket.io.on("reconnect_failed", () => {
  console.error("Failed to reconnect");
  textNotification(
    "Failed to reconnect after multiple attempts. Please refresh the page or try again later.",
    "error"
  );
});
