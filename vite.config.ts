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
    outDir: "dist/spa",
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

        // Simple Socket.IO setup for development
        io.on('connection', (socket) => {
          console.log('Socket.IO client connected:', socket.id);

          socket.on('disconnect', () => {
            console.log('Socket.IO client disconnected:', socket.id);
          });

          // Echo messages for testing
          socket.on('send_message', (data) => {
            socket.emit('message', {
              type: 'message',
              data: {
                senderId: 'demo',
                content: data.content,
                timestamp: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
            });
          });
        });
      }
    },
  };
}
