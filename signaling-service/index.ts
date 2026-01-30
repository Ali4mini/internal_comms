import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = "my_super_secret_key_123";

// --- 1. Define Types ---

interface SignalingPayload {
  target: string;
  caller: string;
  sdp: RTCSessionDescriptionInit; // Built-in WebRTC type
}

interface IceCandidatePayload {
  target: string;
  candidate: RTCIceCandidateInit; // Built-in WebRTC type
}

// Events sending FROM Client TO Server
interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  offer: (payload: SignalingPayload) => void;
  answer: (payload: SignalingPayload) => void;
  "ice-candidate": (payload: IceCandidatePayload) => void;
}

// Events sending FROM Server TO Client
interface ServerToClientEvents {
  "user-connected": (userId: string) => void;
  offer: (payload: SignalingPayload) => void;
  answer: (payload: SignalingPayload) => void;
  "ice-candidate": (candidate: RTCIceCandidateInit) => void;
}

// Data attached to the Socket instance
interface InterServerEvents {}
interface SocketData {
  user: {
    username: string;
    role: string;
  };
}

// --- 2. Initialize Server with Generics ---
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(4000, {
  cors: { origin: "*" },
});

console.log("🎥 Signaling Service (TS) running on port 4000");

// --- 3. Middleware (Auth) ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return next(new Error("Authentication error"));
    socket.data.user = decoded; // Typed thanks to SocketData interface!
    next();
  });
});

// --- 4. Event Logic ---
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.user?.username} (${socket.id})`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", socket.id);
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => {
    io.to(payload.target).emit("ice-candidate", payload.candidate);
  });
});
