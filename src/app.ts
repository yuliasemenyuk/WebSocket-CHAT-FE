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
export const socket = io(process.env.HOST);

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
  console.log("Received updated users list:", users);
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
  textNotification("Failed to login, try again", "error");
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
