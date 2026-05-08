import { EventEmitter } from "node:events";
import { SOCKET_EVENTS, type SocketEventName } from "@/lib/socket/events";
import type {
  PresencePayload,
  PresenceStatus,
  ReadReceiptPayload,
  TypingPayload
} from "@/types/socket.types";

export type MatchCreatedPayload = {
  matchId: string;
  matchedWith: {
    userId: string;
    name: string;
  };
  matchedAt: string;
};

class RealtimeGateway {
  private readonly bus = new EventEmitter();
  private readonly presence = new Map<string, PresencePayload>();
  private readonly typing = new Map<string, TypingPayload>();

  emitPresence(userId: string, status: PresenceStatus) {
    const payload: PresencePayload = {
      userId,
      status,
      lastSeenAt: new Date().toISOString()
    };
    this.presence.set(userId, payload);
    this.bus.emit(SOCKET_EVENTS.PRESENCE_UPDATED, payload);
    return payload;
  }

  emitTyping(chatId: string, userId: string, typing: boolean) {
    const key = `${chatId}:${userId}`;
    const payload: TypingPayload = {
      chatId,
      userId,
      typing,
      at: new Date().toISOString()
    };
    if (typing) this.typing.set(key, payload);
    if (!typing) this.typing.delete(key);
    this.bus.emit(SOCKET_EVENTS.TYPING_UPDATED, payload);
    return payload;
  }

  emitReadReceipt(chatId: string, userId: string, seenCount: number) {
    const payload: ReadReceiptPayload = {
      chatId,
      userId,
      seenCount,
      at: new Date().toISOString()
    };
    this.bus.emit(SOCKET_EVENTS.READ_RECEIPT, payload);
    return payload;
  }

  on(event: SocketEventName, listener: (...args: unknown[]) => void) {
    this.bus.on(event, listener);
    return () => this.bus.off(event, listener);
  }

  getPresence(userId: string) {
    return this.presence.get(userId) ?? null;
  }

  getTyping(chatId: string) {
    return [...this.typing.values()].filter((entry) => entry.chatId === chatId);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __moi_realtime__: RealtimeGateway | undefined;
}

export const realtimeGateway = global.__moi_realtime__ ?? new RealtimeGateway();

if (process.env.NODE_ENV !== "production") {
  global.__moi_realtime__ = realtimeGateway;
}
