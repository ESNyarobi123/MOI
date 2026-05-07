export const SOCKET_EVENTS = {
  PRESENCE_UPDATED: "presence.updated",
  TYPING_UPDATED: "typing.updated",
  READ_RECEIPT: "chat.read_receipt"
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
