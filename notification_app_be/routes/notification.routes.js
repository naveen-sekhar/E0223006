import { Router } from "express";
import {
  getAllNotifications,
  getPriorityNotifications,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", getAllNotifications);
router.get("/priority", getPriorityNotifications);

export default router;
