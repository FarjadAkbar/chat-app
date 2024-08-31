import app from './app';
import http from 'http';
import { initializeChatSocket } from './controllers/chatController';
import { Server } from 'socket.io';

const server = http.createServer(app); // Create an HTTP server instance
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust CORS settings as needed
  },
});

// Initialize Socket.io chat logic
initializeChatSocket(io);


// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
