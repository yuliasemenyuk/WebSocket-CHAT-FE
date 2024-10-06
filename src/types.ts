export interface User {
  id: string;
  name: string;
}

export interface Message {
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}
