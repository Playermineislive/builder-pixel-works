import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const users = /* @__PURE__ */ new Map();
const usersByEmail = /* @__PURE__ */ new Map();
const JWT_SECRET = process.env.JWT_SECRET || "secure-chat-secret-key-change-in-production";
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};
const getUserById = (id) => {
  const user = users.get(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
};
const handleSignup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const response2 = {
        success: false,
        message: "Email and password are required"
      };
      return res.status(400).json(response2);
    }
    if (usersByEmail.has(email)) {
      const response2 = {
        success: false,
        message: "User already exists with this email"
      };
      return res.status(409).json(response2);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id: v4(),
      email,
      passwordHash,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    users.set(user.id, user);
    usersByEmail.set(email, user);
    const token = generateToken(user.id);
    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error:", error);
    const response = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const response2 = {
        success: false,
        message: "Email and password are required"
      };
      return res.status(400).json(response2);
    }
    const user = usersByEmail.get(email);
    if (!user) {
      const response2 = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response2);
    }
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const response2 = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response2);
    }
    const token = generateToken(user.id);
    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };
    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};
const handleVerifyToken = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const response = {
      success: true,
      user
    };
    res.json(response);
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const pairingCodes = /* @__PURE__ */ new Map();
const connections = /* @__PURE__ */ new Map();
const userConnections = /* @__PURE__ */ new Map();
const generateUniqueCode = () => {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (pairingCodes.has(code));
  return code;
};
const cleanExpiredCodes = () => {
  const now = /* @__PURE__ */ new Date();
  for (const [code, pairingCode] of pairingCodes.entries()) {
    if (new Date(pairingCode.expiresAt) <= now) {
      pairingCodes.delete(code);
    }
  }
};
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  const user = getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  req.user = user;
  next();
};
const handleGenerateCode = (req, res) => {
  try {
    cleanExpiredCodes();
    const userId = req.user.id;
    const existingConnectionId = userConnections.get(userId);
    if (existingConnectionId) {
      const existingConnection = connections.get(existingConnectionId);
      if (existingConnection) {
        userConnections.delete(existingConnection.userId1);
        userConnections.delete(existingConnection.userId2);
        connections.delete(existingConnectionId);
        console.log(`Cleaned up stale connection ${existingConnectionId} for user ${userId}`);
      }
    }
    const code = generateUniqueCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3).toISOString();
    const pairingCode = {
      code,
      userId,
      expiresAt,
      isUsed: false
    };
    pairingCodes.set(code, pairingCode);
    const response = {
      success: true,
      code,
      expiresAt
    };
    res.json(response);
  } catch (error) {
    console.error("Generate code error:", error);
    const response = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};
const handleConnectCode = (req, res) => {
  try {
    cleanExpiredCodes();
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) {
      const response2 = {
        success: false,
        message: "Code is required"
      };
      return res.status(400).json(response2);
    }
    const existingConnectionId = userConnections.get(userId);
    if (existingConnectionId) {
      const existingConnection = connections.get(existingConnectionId);
      if (existingConnection) {
        userConnections.delete(existingConnection.userId1);
        userConnections.delete(existingConnection.userId2);
        connections.delete(existingConnectionId);
        console.log(`Cleaned up stale connection ${existingConnectionId} for user ${userId}`);
      }
    }
    const pairingCode = pairingCodes.get(code.toUpperCase());
    if (!pairingCode) {
      const response2 = {
        success: false,
        message: "Invalid or expired code"
      };
      return res.status(404).json(response2);
    }
    if (new Date(pairingCode.expiresAt) <= /* @__PURE__ */ new Date()) {
      pairingCodes.delete(code.toUpperCase());
      const response2 = {
        success: false,
        message: "Code has expired"
      };
      return res.status(410).json(response2);
    }
    if (pairingCode.isUsed) {
      const response2 = {
        success: false,
        message: "Code has already been used"
      };
      return res.status(410).json(response2);
    }
    if (pairingCode.userId === userId) {
      const response2 = {
        success: false,
        message: "You cannot connect to yourself"
      };
      return res.status(400).json(response2);
    }
    const partner = getUserById(pairingCode.userId);
    if (!partner) {
      const response2 = {
        success: false,
        message: "Partner user not found"
      };
      return res.status(404).json(response2);
    }
    const connectionId = v4();
    const connection = {
      id: connectionId,
      userId1: pairingCode.userId,
      userId2: userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: true
    };
    connections.set(connectionId, connection);
    userConnections.set(pairingCode.userId, connectionId);
    userConnections.set(userId, connectionId);
    pairingCode.isUsed = true;
    pairingCodes.delete(code.toUpperCase());
    const response = {
      success: true,
      partnerId: partner.id,
      partnerEmail: partner.email
    };
    res.json(response);
  } catch (error) {
    console.error("Connect code error:", error);
    const response = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};
const handleGetConnectionStatus = (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = userConnections.get(userId);
    if (!connectionId) {
      const response2 = {
        isConnected: false
      };
      return res.json(response2);
    }
    const connection = connections.get(connectionId);
    if (!connection || !connection.isActive) {
      userConnections.delete(userId);
      const response2 = {
        isConnected: false
      };
      return res.json(response2);
    }
    const partnerId = connection.userId1 === userId ? connection.userId2 : connection.userId1;
    const partner = getUserById(partnerId);
    const response = {
      isConnected: true,
      partnerId,
      partnerEmail: partner?.email,
      connectionId
    };
    res.json(response);
  } catch (error) {
    console.error("Get connection status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const handleDisconnect = (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = userConnections.get(userId);
    if (!connectionId) {
      return res.json({ success: true, message: "Already disconnected" });
    }
    const connection = connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      userConnections.delete(connection.userId1);
      userConnections.delete(connection.userId2);
    }
    res.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/auth/signup", handleSignup);
  app2.post("/api/auth/login", handleLogin);
  app2.get("/api/auth/verify", handleVerifyToken);
  app2.post("/api/pairing/generate-code", authenticateUser, handleGenerateCode);
  app2.post("/api/pairing/connect-code", authenticateUser, handleConnectCode);
  app2.get("/api/pairing/status", authenticateUser, handleGetConnectionStatus);
  app2.post("/api/pairing/disconnect", authenticateUser, handleDisconnect);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
