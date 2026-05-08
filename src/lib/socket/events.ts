export const SOCKET_EVENTS = {
  PRESENCE_UPDATED: "presence.updated",
  TYPING_UPDATED: "typing.updated",
  READ_RECEIPT: "chat.read_receipt",
  MATCH_CREATED: "match.created",
  NEW_MESSAGE: "chat.message",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
