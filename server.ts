/**
 * Custom Next.js + Socket.io server (local / VM). Realtime does not run on Vercel serverless.
 * Run: npm run dev:full   or   npm run start:full
 * Plain `next dev` still works without WebSocket transport.
 *
 * HTTP POST /__moi/realtime/emit — internal broadcast when REST API runs elsewhere (set REALTIME_EMIT_URL + REALTIME_EMIT_SECRET on API host).
 */
import type { IncomingMessage } from "node:http";
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifyAccessToken } from "./src/lib/auth/jwt";
import { setSocketIo } from "./src/lib/socket/io-singleton";

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  let io: SocketIOServer | null = null;

  const server = createServer(async (req, res) => {
    const parsed = parse(req.url ?? "", true);

    if (req.method === "POST" && parsed.pathname === "/__moi/realtime/emit") {
      try {
        const secret = process.env.REALTIME_EMIT_SECRET;
        if (
          !secret ||
          typeof req.headers["x-moi-emit-secret"] !== "string" ||
          req.headers["x-moi-emit-secret"] !== secret
        ) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "text/plain");
          res.end("Unauthorized");
          return;
        }

        const raw = await readRequestBody(req);
        const body = JSON.parse(raw) as {
          room?: string;
          event?: string;
          payload?: unknown;
        };
        if (!body.room || typeof body.event !== "string") {
          res.statusCode = 400;
          res.end("Bad request");
          return;
        }
        if (!io) {
          res.statusCode = 503;
          res.end("Socket not ready");
          return;
        }
        io.to(body.room).emit(body.event, body.payload ?? null);
        res.statusCode = 204;
        res.end();
      } catch {
        res.statusCode = 500;
        res.end();
      }
      return;
    }

    void handle(req, res, parsed);
  });

  const corsOrigin =
    process.env.SOCKET_CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true;

  io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  });

  io.use((socket, nextCb) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        nextCb(new Error("Unauthorized"));
        return;
      }
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      nextCb();
    } catch {
      nextCb(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);

    socket.on("join:chat", (chatId: string) => {
      if (typeof chatId === "string" && chatId.length > 0) {
        void socket.join(`chat:${chatId}`);
      }
    });

    socket.on("leave:chat", (chatId: string) => {
      if (typeof chatId === "string") {
        void socket.leave(`chat:${chatId}`);
      }
    });

    socket.on("join:user", (targetUserId: string) => {
      if (typeof targetUserId === "string" && targetUserId === userId) {
        void socket.join(`user:${targetUserId}`);
      }
    });

    socket.on("leave:user", (targetUserId: string) => {
      if (typeof targetUserId === "string" && targetUserId === userId) {
        void socket.leave(`user:${targetUserId}`);
      }
    });

    socket.broadcast.emit("presence", {
      userId,
      status: "online",
      at: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      socket.broadcast.emit("presence", {
        userId,
        status: "offline",
        at: new Date().toISOString(),
      });
    });

    socket.on("presence", (payload: { status?: string }) => {
      const status = payload?.status === "offline" ? "offline" : "online";
      socket.broadcast.emit("presence", {
        userId,
        status,
        at: new Date().toISOString(),
      });
    });

    socket.on("typing", (payload: { chatId?: string; typing?: boolean }) => {
      if (!payload?.chatId) return;
      socket.to(`chat:${payload.chatId}`).emit("typing", {
        chatId: payload.chatId,
        userId,
        typing: Boolean(payload.typing),
        at: new Date().toISOString(),
      });
    });
  });

  setSocketIo(io);

  server.listen(port, () => {
    console.info(
      `> Ready on http://localhost:${port} (Socket.io at /socket.io; internal emit at POST /__moi/realtime/emit)`
    );
  });
});
