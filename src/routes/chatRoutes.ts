import { Router } from "express";
import { getMessages, getRooms } from "../controllers/chatController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/:roomId", getMessages);
router.get("/", getRooms);

export default router;