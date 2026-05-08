import { getSocketIo } from "@/lib/socket/io-singleton";

/**
 * Emit to a Socket.io room. If this Node process has no `io` (e.g. serverless API),
 * optionally POST to REALTIME_EMIT_URL (must run MOI `server.ts`).
 */
export function emitToSocketRoom(room: string, event: string, payload: unknown): void {
  const io = getSocketIo();
  if (io) {
    io.to(room).emit(event, payload);
    return;
  }
  void emitToSocketRoomRemote(room, event, payload);
}

export function emitToChatRoom(chatId: string, event: string, payload: unknown): void {
  emitToSocketRoom(`chat:${chatId}`, event, payload);
}

export function emitToUserRoom(userId: string, event: string, payload: unknown): void {
  emitToSocketRoom(`user:${userId}`, event, payload);
}

async function emitToSocketRoomRemote(
  room: string,
  event: string,
  payload: unknown
): Promise<void> {
  const base = process.env.REALTIME_EMIT_URL?.replace(/\/$/, "");
  const secret = process.env.REALTIME_EMIT_SECRET;
  if (!base || !secret) return;

  try {
    const res = await fetch(`${base}/__moi/realtime/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-moi-emit-secret": secret
      },
      body: JSON.stringify({ room, event, payload })
    });
    if (!res.ok && process.env.NODE_ENV !== "production") {
      console.warn("[realtime] remote emit failed", res.status);
    }
  } catch {
    /* non-fatal: clients may use polling */
  }
}
