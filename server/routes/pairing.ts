import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { 
  PairingCode, 
  GenerateCodeResponse, 
  ConnectCodeRequest, 
  ConnectCodeResponse,
  Connection,
  ConnectionStatus
} from "@shared/api";
import { verifyToken, getUserById } from "./auth";

// In-memory storage for demo (in production, use a real database)
const pairingCodes: Map<string, PairingCode> = new Map();
const connections: Map<string, Connection> = new Map();
const userConnections: Map<string, string> = new Map(); // userId -> connectionId

// Helper function to generate a unique 6-digit code
const generateUniqueCode = (): string => {
  let code: string;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (pairingCodes.has(code));
  return code;
};

// Helper function to clean expired codes
const cleanExpiredCodes = () => {
  const now = new Date();
  for (const [code, pairingCode] of pairingCodes.entries()) {
    if (new Date(pairingCode.expiresAt) <= now) {
      pairingCodes.delete(code);
    }
  }
};

// Middleware to authenticate requests
const authenticateUser = (req: any, res: any, next: any) => {
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

export const handleGenerateCode: RequestHandler = (req: any, res) => {
  try {
    // Clean expired codes first
    cleanExpiredCodes();

    const userId = req.user.id;

    // Check if user already has an active connection
    if (userConnections.has(userId)) {
      const response: GenerateCodeResponse = {
        success: false,
        message: "You are already connected to a partner",
      };
      return res.status(409).json(response);
    }

    // Generate unique code
    const code = generateUniqueCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const pairingCode: PairingCode = {
      code,
      userId,
      expiresAt,
      isUsed: false,
    };

    pairingCodes.set(code, pairingCode);

    const response: GenerateCodeResponse = {
      success: true,
      code,
      expiresAt,
    };

    res.json(response);
  } catch (error) {
    console.error("Generate code error:", error);
    const response: GenerateCodeResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};

export const handleConnectCode: RequestHandler = (req: any, res) => {
  try {
    // Clean expired codes first
    cleanExpiredCodes();

    const userId = req.user.id;
    const { code }: ConnectCodeRequest = req.body;

    if (!code) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "Code is required",
      };
      return res.status(400).json(response);
    }

    // Check if user already has an active connection
    if (userConnections.has(userId)) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "You are already connected to a partner",
      };
      return res.status(409).json(response);
    }

    // Find the pairing code
    const pairingCode = pairingCodes.get(code.toUpperCase());
    if (!pairingCode) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "Invalid or expired code",
      };
      return res.status(404).json(response);
    }

    // Check if code is expired
    if (new Date(pairingCode.expiresAt) <= new Date()) {
      pairingCodes.delete(code.toUpperCase());
      const response: ConnectCodeResponse = {
        success: false,
        message: "Code has expired",
      };
      return res.status(410).json(response);
    }

    // Check if code is already used
    if (pairingCode.isUsed) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "Code has already been used",
      };
      return res.status(410).json(response);
    }

    // Check if user is trying to connect to themselves
    if (pairingCode.userId === userId) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "You cannot connect to yourself",
      };
      return res.status(400).json(response);
    }

    // Get partner user
    const partner = getUserById(pairingCode.userId);
    if (!partner) {
      const response: ConnectCodeResponse = {
        success: false,
        message: "Partner user not found",
      };
      return res.status(404).json(response);
    }

    // Create connection
    const connectionId = uuidv4();
    const connection: Connection = {
      id: connectionId,
      userId1: pairingCode.userId,
      userId2: userId,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Store connection
    connections.set(connectionId, connection);
    userConnections.set(pairingCode.userId, connectionId);
    userConnections.set(userId, connectionId);

    // Mark code as used and remove it
    pairingCode.isUsed = true;
    pairingCodes.delete(code.toUpperCase());

    const response: ConnectCodeResponse = {
      success: true,
      partnerId: partner.id,
      partnerEmail: partner.email,
    };

    res.json(response);
  } catch (error) {
    console.error("Connect code error:", error);
    const response: ConnectCodeResponse = {
      success: false,
      message: "Internal server error",
    };
    res.status(500).json(response);
  }
};

export const handleGetConnectionStatus: RequestHandler = (req: any, res) => {
  try {
    const userId = req.user.id;
    const connectionId = userConnections.get(userId);

    if (!connectionId) {
      const response: ConnectionStatus = {
        isConnected: false,
      };
      return res.json(response);
    }

    const connection = connections.get(connectionId);
    if (!connection || !connection.isActive) {
      userConnections.delete(userId);
      const response: ConnectionStatus = {
        isConnected: false,
      };
      return res.json(response);
    }

    // Get partner info
    const partnerId = connection.userId1 === userId ? connection.userId2 : connection.userId1;
    const partner = getUserById(partnerId);

    const response: ConnectionStatus = {
      isConnected: true,
      partnerId,
      partnerEmail: partner?.email,
      connectionId,
    };

    res.json(response);
  } catch (error) {
    console.error("Get connection status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const handleDisconnect: RequestHandler = (req: any, res) => {
  try {
    const userId = req.user.id;
    const connectionId = userConnections.get(userId);

    if (!connectionId) {
      return res.json({ success: true, message: "Already disconnected" });
    }

    const connection = connections.get(connectionId);
    if (connection) {
      // Mark connection as inactive
      connection.isActive = false;
      
      // Remove both users from active connections
      userConnections.delete(connection.userId1);
      userConnections.delete(connection.userId2);
    }

    res.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Export middleware for use in other routes
export { authenticateUser };

// Export helper functions for WebSocket usage
export const getUserConnection = (userId: string): Connection | null => {
  const connectionId = userConnections.get(userId);
  if (!connectionId) return null;
  
  const connection = connections.get(connectionId);
  return connection?.isActive ? connection : null;
};

export const getPartnerIdForUser = (userId: string): string | null => {
  const connection = getUserConnection(userId);
  if (!connection) return null;
  
  return connection.userId1 === userId ? connection.userId2 : connection.userId1;
};
