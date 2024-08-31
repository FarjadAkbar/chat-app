import jwt from "jsonwebtoken";
import { Socket } from "socket.io";


export const socketMiddleware = (socket: Socket, next: any) => {
    const token = socket.handshake.auth.token;
    console.log(token);
    // if (!token) {
    //     return next(new Error("Authentication error"));
    // }

    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    //     socket.data.user = decoded;
        next(); 
    // } catch (error) {
    //     next(new Error("Authentication error"));
    // }
}