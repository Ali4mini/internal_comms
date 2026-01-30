import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";

// --- Types (Must match Server) ---
interface SignalingPayload {
  target: string;
  caller: string;
  sdp: RTCSessionDescriptionInit;
}

interface ServerToClientEvents {
  "user-connected": (userId: string) => void;
  offer: (payload: SignalingPayload) => void;
  answer: (payload: SignalingPayload) => void;
  "ice-candidate": (candidate: RTCIceCandidateInit) => void;
}

interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  offer: (payload: SignalingPayload) => void;
  answer: (payload: SignalingPayload) => void;
  "ice-candidate": (payload: {
    target: string;
    candidate: RTCIceCandidateInit;
  }) => void;
}

// Define the socket type
type MySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SIGNALING_URL = "http://localhost:4000";
const AUTH_URL = "http://localhost:3000";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  // State for Socket
  const [socket, setSocket] = useState<MySocket | null>(null);

  // State for Media
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Login
  const handleLogin = async () => {
    const user = prompt("Enter username:");
    if (!user) return;
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { username: user });
      setToken(res.data.token);
      setUsername(res.data.username);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  // 2. Connect to Socket
  useEffect(() => {
    if (!token) return;

    const newSocket: MySocket = io(SIGNALING_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Connected to Signaling");
      newSocket.emit("join-room", "room-1");
    });

    setSocket(newSocket);

    // Get Media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // 3. WebRTC Logic
  useEffect(() => {
    if (!socket || !myStream) return;

    socket.on("user-connected", (userId) => {
      console.log("User connected:", userId);
      createOffer(userId);
    });

    socket.on("offer", handleReceiveOffer);
    socket.on("answer", handleReceiveAnswer);
    socket.on("ice-candidate", handleNewICECandidateEvent);

    return () => {
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket, myStream]);

  // --- Functions ---

  const createPeerConnection = (targetSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add Tracks
    if (myStream) {
      myStream.getTracks().forEach((track) => pc.addTrack(track, myStream));
    }

    // Handle Remote Stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          target: targetSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const createOffer = async (targetSocketId: string) => {
    const pc = createPeerConnection(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      socket.emit("offer", {
        target: targetSocketId,
        caller: socket.id,
        sdp: offer,
      });
    }
  };

  const handleReceiveOffer = async (payload: SignalingPayload) => {
    const pc = createPeerConnection(payload.caller);
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socket) {
      socket.emit("answer", {
        target: payload.caller,
        caller: socket.id,
        sdp: answer,
      });
    }
  };

  const handleReceiveAnswer = async (payload: SignalingPayload) => {
    const pc = peerConnectionRef.current;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  };

  const handleNewICECandidateEvent = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  if (!token) {
    return <button onClick={handleLogin}>Login</button>;
  }

  return (
    <div>
      <h3>User: {username}</h3>
      <div style={{ display: "flex", gap: 10 }}>
        <video
          ref={myVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 300, border: "2px solid blue" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: 300, border: "2px solid red" }}
        />
      </div>
    </div>
  );
};

export default App;
