/**
 * Custom Next.js + Socket.io server (local / VM). Realtime does not run on Vercel serverless.
 * Run: npm run dev:full   or   npm run start:full
 * Plain `next dev` still works without WebSocket transport.
 */
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifyAccessToken } from "./src/lib/auth/jwt";
import { setSocketIo } from "./src/lib/socket/io-singleton";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const corsOrigin = process.env.SOCKET_CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true;

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: { origin: corsOrigin, methods: ["GET", "POST"] }
  });

  io.use((socket, nextCb) => {
    try {
      // Client: io({ auth: { token: accessJwt } }) — same JWT as Bearer for REST.
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

    socket.on("presence", (payload: { status?: string }) => {
      const status = payload?.status === "offline" ? "offline" : "online";
      socket.broadcast.emit("presence", {
        userId,
        status,
        at: new Date().toISOString()
      });
    });

    socket.on("typing", (payload: { chatId?: string; typing?: boolean }) => {
      if (!payload?.chatId) return;
      socket.to(`chat:${payload.chatId}`).emit("typing", {
        chatId: payload.chatId,
        userId,
        typing: Boolean(payload.typing),
        at: new Date().toISOString()
      });
    });
  });

  setSocketIo(io);

  server.listen(port, () => {
    console.info(`> Ready on http://localhost:${port} (Socket.io at /socket.io)`);
  });
});
