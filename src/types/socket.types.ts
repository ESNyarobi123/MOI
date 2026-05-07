export type PresenceStatus = "online" | "offline";

export type PresencePayload = {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string;
};

export type TypingPayload = {
  chatId: string;
  userId: string;
  typing: boolean;
  at: string;
};

export type ReadReceiptPayload = {
  chatId: string;
  userId: string;
  seenCount: number;
  at: string;
};
