import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer, createAppServer } from "./server";
import { Server } from "socket.io";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(viteServer) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      viteServer.middlewares.use(app);

      // Add Socket.IO support
      const httpServer = viteServer.httpServer;
      if (httpServer) {
        const io = new Server(httpServer, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"]
          }
        });

        // Store connected users
        const connectedUsers = new Map();

        io.on('connection', (socket) => {
          console.log('Socket.IO client connected:', socket.id);

          // Store user info when they connect
          socket.on('user_join', (data) => {
            socket.userId = data.userId;
            socket.userEmail = data.userEmail;
            connectedUsers.set(data.userId, socket.id);
            console.log(`User joined: ${data.userEmail} (${data.userId})`);

            // Notify other users about new connection
            const otherUsers = Array.from(connectedUsers.entries()).filter(([userId, socketId]) =>
              userId !== socket.userId
            );

            otherUsers.forEach(([userId, socketId]) => {
              io.to(socketId).emit('message', {
                type: 'user_connected',
                data: { userId: socket.userId, email: socket.userEmail },
                timestamp: new Date().toISOString(),
              });
            });
          });

          socket.on('disconnect', () => {
            console.log('Socket.IO client disconnected:', socket.id);
            if (socket.userId) {
              // Notify other users about disconnection
              const otherUsers = Array.from(connectedUsers.entries()).filter(([userId, socketId]) =>
                userId !== socket.userId
              );

              otherUsers.forEach(([userId, socketId]) => {
                io.to(socketId).emit('message', {
                  type: 'user_disconnected',
                  data: { userId: socket.userId, email: socket.userEmail },
                  timestamp: new Date().toISOString(),
                });
              });

              connectedUsers.delete(socket.userId);
            }
          });

          // Handle messages between partners
          socket.on('send_message', (data) => {
            console.log('Message received from', socket.userId, ':', data.content);

            // Find all other connected users and send to them
            // In a real app, this would check the pairing/connection status
            const otherUsers = Array.from(connectedUsers.entries()).filter(([userId, socketId]) =>
              userId !== socket.userId
            );

            if (otherUsers.length > 0) {
              // Send message to all other connected users (for demo purposes)
              otherUsers.forEach(([userId, socketId]) => {
                io.to(socketId).emit('message', {
                  type: 'message',
                  data: {
                    senderId: socket.userId,
                    content: data.content,
                    timestamp: new Date().toISOString(),
                    type: data.type || 'text'
                  },
                  timestamp: new Date().toISOString(),
                });
                console.log(`Sent message from ${socket.userId} to ${userId}`);
              });
            }

            socket.emit('message_sent', { success: true });
          });

          // Handle typing indicators
          socket.on('typing', (data) => {
            console.log('Typing indicator from', socket.userId, ':', data.isTyping);

            // Send typing indicator to other users
            const otherUsers = Array.from(connectedUsers.entries()).filter(([userId, socketId]) =>
              userId !== socket.userId
            );

            otherUsers.forEach(([userId, socketId]) => {
              io.to(socketId).emit('message', {
                type: 'typing',
                data: {
                  userId: socket.userId,
                  isTyping: data.isTyping,
                },
                timestamp: new Date().toISOString(),
              });
            });
          });

          // Handle key exchange
          socket.on('key_exchange', (data) => {
            console.log('Key exchange from', socket.userId);

            // Send public key to other users
            const otherUsers = Array.from(connectedUsers.entries()).filter(([userId, socketId]) =>
              userId !== socket.userId
            );

            otherUsers.forEach(([userId, socketId]) => {
              io.to(socketId).emit('key_exchange', {
                publicKey: data.publicKey,
                userId: socket.userId
              });
            });
          });
        });
      }
    },
  };
}
