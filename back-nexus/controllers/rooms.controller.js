import RoomsService from "../services/rooms.service.js";

export const getAllRooms = async (req, res) => {
  try {
    const result = await RoomsService.getAllRooms();
    if (result.success) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getRoomsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const result = await RoomsService.getRoomsByDepartment(departmentId);
    if (result.success) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await RoomsService.getRoomById(roomId);
    if (result.success) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const result = await RoomsService.createRoom(req.body);
    if (result.success) {
      res
        .status(201)
        .json({ success: true, message: result.message, data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await RoomsService.updateRoom(roomId, req.body);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await RoomsService.deleteRoom(roomId);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { roomId, examDate, startTime, endTime } = req.query;
    const result = await RoomsService.checkRoomAvailability(
      roomId,
      examDate,
      startTime,
      endTime,
    );
    if (result.success) {
      res.status(200).json({ success: true, available: result.available });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
