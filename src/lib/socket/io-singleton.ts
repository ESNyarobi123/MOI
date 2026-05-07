import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setSocketIo(instance: SocketIOServer | null) {
  io = instance;
}

export function getSocketIo(): SocketIOServer | null {
  return io;
}
