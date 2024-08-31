import request from 'supertest';
import http from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client'; // Import io from socket.io-client
import mongoose from 'mongoose';
import app from '../src/app'; // Make sure app exports an express instance
import { initializeChatSocket } from '../src/controllers/chatController';
import Chat from '../src/models/chatModel';
import Room from '../src/models/roomModel';
import User from '../src/models/userModel';

let server: http.Server;
let io: Server;
let senderId: string;
let receiverId: string;
let token: string;

jest.setTimeout(120000);
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI!);
    }

  const sender = await request(app).post("/api/auth/register").send({
    name: "sender",
    email: "sender@example.com",
    password: "sender123",
  });

  senderId = sender.body.data._id as string;

  const receiver = await request(app).post("/api/auth/register").send({
    name: "receiver",
    email: "receiver@example.com",
    password: "receiver123",
  });
  receiverId = receiver.body.data._id as string;

  const res = await request(app).post("/api/auth/login").send({
    email: "sender@example.com",
    password: "sender123"
  });

  token = res.body.token;

  
  // Initialize Socket.io
  server = http.createServer(app);
  io = new Server(server, { cors: { origin: '*' } });
  initializeChatSocket(io);
  server.listen(3001); // Use a random available port
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  server.close();
});


describe('Chat API and Socket.io', () => {
  it('should send a message and receive it through Socket.io', (done) => {
    const clientSocket: ClientSocket = Client('http://localhost:3001', {
      auth: { token },
    });

    clientSocket.emit('joinRoom', { senderId, receiverId });

    clientSocket.on('receiveMessage', (message: { sender: string; receiver: string; content: string }) => {
      expect(message.sender).toBe(senderId);
      expect(message.receiver).toBe(receiverId);
      expect(message.content).toBe('Test message');
      clientSocket.disconnect(); // Ensure client is disconnected after test
      done();
    });

    clientSocket.emit('sendMessage', {
      senderId,
      receiverId,
      content: 'Test message',
    });
  }, 10000); // Adjust timeout if needed


  // it('should fetch chats between users', async () => {
  //   const response = await request(app)
  //     .get(`/api/chat/${receiverId}`)
  //     .set('Authorization', `Bearer ${token}`);

  //   expect(response.status).toBe(200);
  //   expect(response.body.chats).toBeInstanceOf(Array);
  // });
});
