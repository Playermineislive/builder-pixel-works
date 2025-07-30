import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleDemo } from "./routes/demo";
import { 
  handleSignup, 
  handleLogin, 
  handleVerifyToken, 
  verifyToken, 
  getUserById 
} from "./routes/auth";
import { 
  handleGenerateCode, 
  handleConnectCode, 
  handleGetConnectionStatus, 
  handleDisconnect, 
  authenticateUser, 
  getPartnerIdForUser 
} from "./routes/pairing";
import { WebSocketMessage } from "@shared/api";

export function createAppServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Setup Socket.IO with CORS
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // In production, specify your domain
      methods: ["GET", "POST"]
    }
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);

  // Pairing routes (require authentication)
  app.post("/api/pairing/generate-code", authenticateUser, handleGenerateCode);
  app.post("/api/pairing/connect-code", authenticateUser, handleConnectCode);
  app.get("/api/pairing/status", authenticateUser, handleGetConnectionStatus);
  app.post("/api/pairing/disconnect", authenticateUser, handleDisconnect);

  // WebSocket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    const user = getUserById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    next();
  });

  // Store active socket connections
  const userSockets = new Map<string, string>(); // userId -> socketId

  // WebSocket connection handling
  io.on("connection", (socket: any) => {
    console.log(`User connected: ${socket.userEmail} (${socket.userId})`);
    
    // Store user's socket connection
    userSockets.set(socket.userId, socket.id);

    // Notify partner about connection
    const partnerId = getPartnerIdForUser(socket.userId);
    if (partnerId) {
      const partnerSocketId = userSockets.get(partnerId);
      if (partnerSocketId) {
        const message: WebSocketMessage = {
          type: "user_connected",
          data: { userId: socket.userId, email: socket.userEmail },
          timestamp: new Date().toISOString(),
        };
        io.to(partnerSocketId).emit("message", message);
      }
    }

    // Handle incoming messages
    socket.on("send_message", (data: { content: string; type: string }) => {
      try {
        const partnerId = getPartnerIdForUser(socket.userId);
        if (!partnerId) {
          socket.emit("error", { message: "No active connection" });
          return;
        }

        const partnerSocketId = userSockets.get(partnerId);
        if (!partnerSocketId) {
          socket.emit("error", { message: "Partner not online" });
          return;
        }

        const message: WebSocketMessage = {
          type: "message",
          data: {
            senderId: socket.userId,
            content: data.content,
            type: data.type || "text",
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        // Send to partner
        io.to(partnerSocketId).emit("message", message);
        
        // Send confirmation back to sender
        socket.emit("message_sent", { success: true });
      } catch (error) {
        console.error("Message sending error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data: { isTyping: boolean }) => {
      try {
        const partnerId = getPartnerIdForUser(socket.userId);
        if (!partnerId) return;

        const partnerSocketId = userSockets.get(partnerId);
        if (!partnerSocketId) return;

        const message: WebSocketMessage = {
          type: "typing",
          data: {
            userId: socket.userId,
            isTyping: data.isTyping,
          },
          timestamp: new Date().toISOString(),
        };

        io.to(partnerSocketId).emit("message", message);
      } catch (error) {
        console.error("Typing indicator error:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userEmail} (${socket.userId})`);
      
      // Remove from active connections
      userSockets.delete(socket.userId);

      // Notify partner about disconnection
      const partnerId = getPartnerIdForUser(socket.userId);
      if (partnerId) {
        const partnerSocketId = userSockets.get(partnerId);
        if (partnerSocketId) {
          const message: WebSocketMessage = {
            type: "user_disconnected",
            data: { userId: socket.userId, email: socket.userEmail },
            timestamp: new Date().toISOString(),
          };
          io.to(partnerSocketId).emit("message", message);
        }
      }
    });
  });

  return httpServer;
}

// For development with Vite
export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);

  // Pairing routes (require authentication)
  app.post("/api/pairing/generate-code", authenticateUser, handleGenerateCode);
  app.post("/api/pairing/connect-code", authenticateUser, handleConnectCode);
  app.get("/api/pairing/status", authenticateUser, handleGetConnectionStatus);
  app.post("/api/pairing/disconnect", authenticateUser, handleDisconnect);

  return app;
}
