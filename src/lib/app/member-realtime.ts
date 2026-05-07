"use client";

import { io, type Socket } from "socket.io-client";
import { getUserAccessToken } from "./user-session";

const activeChatRooms = new Set<string>();

let socket: Socket | null = null;
let inFlight: Promise<Socket | null> | null = null;

function bindRejoinOnConnect(s: Socket) {
  s.on("connect", () => {
    for (const id of activeChatRooms) {
      s.emit("join:chat", id);
    }
  });
}

export function memberJoinChat(chatId: string) {
  activeChatRooms.add(chatId);
  void getMemberSocket().then((s) => {
    if (s?.connected) s.emit("join:chat", chatId);
  });
}

export function memberLeaveChat(chatId: string) {
  activeChatRooms.delete(chatId);
  void getMemberSocket().then((s) => {
    if (s?.connected) s.emit("leave:chat", chatId);
  });
}

export type ChatMessageSocketPayload = {
  id: string;
  chatId: string;
  senderUserId: string;
  type: string;
  body: string | null;
  createdAt: string;
};

export type PresencePayload = {
  userId: string;
  status: "online" | "offline";
  at: string;
};

/** Same-origin Socket.io when running `npm run dev:full` / `start:full`. */
export async function getMemberSocket(): Promise<Socket | null> {
  if (typeof window === "undefined") return null;
  const token = getUserAccessToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (!inFlight) {
    inFlight = (async (): Promise<Socket | null> => {
      let s: Socket | null = null;
      try {
        if (socket) {
          socket.removeAllListeners();
          socket.disconnect();
          socket = null;
        }

        s = io(window.location.origin, {
          path: "/socket.io",
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 12,
          reconnectionDelay: 900,
          timeout: 20000,
        });

        bindRejoinOnConnect(s);

        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("socket connect timeout")), 20000);
          s!.once("connect", () => {
            clearTimeout(t);
            resolve();
          });
          s!.once("connect_error", (err) => {
            clearTimeout(t);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
        });

        socket = s;
        return s;
      } catch {
        s?.removeAllListeners();
        s?.disconnect();
        socket = null;
        return null;
      } finally {
        inFlight = null;
      }
    })();
  }

  return inFlight;
}
