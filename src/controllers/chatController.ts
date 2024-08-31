import { Server, Socket } from 'socket.io';
import { socketMiddleware } from '../middleware/socketMiddleware';
import Chat from '../models/chatModel';
import Room from '../models/roomModel';

// Initialize Socket.io and handle connections
export const initializeChatSocket = (io: Server) => {
  io.use(socketMiddleware);

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    console.log(socket.data.user)
    // Join a private room based on user IDs
    socket.on('joinRoom', async ({ senderId, receiverId }) => {
      const roomName = [senderId, receiverId].sort().join('-'); // Create a unique room name

      // Find or create a room entry in the database
      let room = await Room.findOne({ name: roomName });
      if (!room) {
        room = await Room.create({ name: roomName, users: [senderId, receiverId] });
      }

      socket.join(roomName);
      console.log(`User ${senderId} joined room: ${roomName}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      const roomName = [senderId, receiverId].sort().join('-'); // Create a unique room name
      const room = await Room.findOne({ name: roomName });

      // Save the message in the database
      const newChat = await Chat.create({ sender: senderId, receiver: receiverId, room: room?._id, content });

      // Emit the message to the specific room
      io.to(roomName).emit('receiveMessage', newChat); // Send the chat object to all users in the room
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
