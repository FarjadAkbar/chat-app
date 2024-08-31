import { Request, Response } from "express";
import { Server, Socket } from 'socket.io';
import { socketMiddleware } from '../middleware/socketMiddleware';
import Chat from '../models/chatModel';
import Room from '../models/roomModel';
import User from '../models/userModel';


export const getRooms = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try{
    const rooms = await Room.find({ users: { $in: [userId] } });
    const roomsUnseenCount = await Promise.all(
      rooms.map(async (room) => {
        const receiverId = room.users.find(user => user.toString() !== userId.toString());
        const receiver = await User.findById(receiverId); // Fetch receiver details
        if (!receiver) {
          return res.status(404).json({ message: 'User not found' });
        }

        const unseenCount = await Chat.countDocuments({
          room: room._id,
          receiver: userId,
          status: 'sent'
        })
        const lastMessage = await Chat.findOne({ room: room._id }).sort({ createdAt: -1 }).exec();
        const lastMessageTimestamp = lastMessage ? lastMessage.createdAt : null;
    
        return {
          roomId: room._id,
          name: room.name,
          receiver: {
            id: receiver._id,
            name: receiver.name 
          },
          lastMessageTimestamp,
          unseenCount,
        };
      })
    )
    res.json(roomsUnseenCount);
  } catch(err){
    res.status(500).json({ message: 'Error fetching rooms' });
  }
}

export const getMessages = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { roomId } = req.params;
  try{
    const messages = await Chat.find({
      room: roomId,
      $or: [{ sender: userId }, { receiver: userId }]
    });
    
    res.json(messages);
  } catch(err){
    res.status(500).json({ message: 'Error fetching messages' });
  }
}

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
