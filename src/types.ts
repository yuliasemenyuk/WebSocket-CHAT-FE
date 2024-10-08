export interface User {
  id: string;
  name: string;
}

export interface Message {
    userId: string;
    userName: string;
    type: "audio" | "text";
    content: string | ArrayBuffer;
    timestamp: number;
}
