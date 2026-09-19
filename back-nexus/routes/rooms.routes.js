import express from "express";
import {
  getAllRooms,
  getRoomsByDepartment,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkRoomAvailability,
} from "../controllers/rooms.controller.js";

const router = express.Router();

// Get all rooms
router.get("/", getAllRooms);

// Get rooms by department
router.get("/department/:departmentId", getRoomsByDepartment);

// Get room by ID
router.get("/:roomId", getRoomById);

// Check room availability
router.get("/availability/check", checkRoomAvailability);

// Create room
router.post("/", createRoom);

// Update room
router.put("/:roomId", updateRoom);

// Delete room
router.delete("/:roomId", deleteRoom);

export default router;
