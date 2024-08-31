import { Server, Socket } from 'socket.io';
import { socketMiddleware } from '../middleware/socketMiddleware';
import Chat from '../models/chatModel';
import Room from '../models/roomModel';

// Initialize Socket.io and handle connections
export const initializeChatSocket = (io: Server) => {
  io.use(socketMiddleware);

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    const senderId = socket.data.userId;
    if (!senderId) {
      socket.disconnect();
      return;
    }

    // Join a private room based on user IDs
    socket.on('joinRoom', async ({ receiverId }) => {
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
    socket.on('sendMessage', async ({ receiverId, content }, ack) => {
      const roomName = [senderId, receiverId].sort().join('-'); // Create a unique room name
      const room = await Room.findOne({ name: roomName });

      // Save the message in the database
      const newChat = await Chat.create({ sender: senderId, receiver: receiverId, room: room?._id, content });

      // Emit the message to the specific room
      io.to(roomName).emit('receiveMessage', newChat._id, newChat, (ack: any) => {
        if(ack === "delivered") {
          console.log("delivered");
          newChat.status = "delivered";
          newChat.save();
        }
      }); 
    });    

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
