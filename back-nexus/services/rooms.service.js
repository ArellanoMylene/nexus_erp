import db from "../config/db.js";

class RoomsService {
  // Get all rooms
  static getAllRooms() {
    return new Promise((resolve) => {
      const query = `
        SELECT r.*, d.department_name 
        FROM rooms r
        LEFT JOIN departments d ON r.department_id = d.department_id
        ORDER BY r.building, r.room_number
      `;
      db.query(query, (error, results) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else {
          resolve({ success: true, data: results });
        }
      });
    });
  }

  // Get rooms by department
  static getRoomsByDepartment(departmentId) {
    return new Promise((resolve) => {
      const query = `
        SELECT r.* 
        FROM rooms r
        WHERE r.department_id = ? AND r.status = 'Available'
        ORDER BY r.building, r.room_number
      `;
      db.query(query, [departmentId], (error, results) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else {
          resolve({ success: true, data: results });
        }
      });
    });
  }

  // Get room by ID
  static getRoomById(roomId) {
    return new Promise((resolve) => {
      const query = `
        SELECT r.*, d.department_name 
        FROM rooms r
        LEFT JOIN departments d ON r.department_id = d.department_id
        WHERE r.room_id = ?
      `;
      db.query(query, [roomId], (error, results) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else if (results.length === 0) {
          resolve({ success: false, message: "Room not found" });
        } else {
          resolve({ success: true, data: results[0] });
        }
      });
    });
  }

  // Create room
  static createRoom(roomData) {
    return new Promise((resolve) => {
      const query = `
        INSERT INTO rooms (room_number, building, floor, room_name, capacity, room_type, department_id, status, features)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        roomData.room_number,
        roomData.building,
        roomData.floor,
        roomData.room_name,
        roomData.capacity,
        roomData.room_type || "Classroom",
        roomData.department_id,
        roomData.status || "Available",
        roomData.features,
      ];

      db.query(query, values, (error, results) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else {
          resolve({
            success: true,
            message: "Room created successfully",
            data: { room_id: results.insertId, ...roomData },
          });
        }
      });
    });
  }

  // Update room
  static updateRoom(roomId, roomData) {
    return new Promise((resolve) => {
      const fields = [];
      const values = [];

      // Build dynamic UPDATE query
      Object.keys(roomData).forEach((key) => {
        if (roomData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(roomData[key]);
        }
      });

      if (fields.length === 0) {
        resolve({ success: false, message: "No fields to update" });
        return;
      }

      values.push(roomId);

      const query = `UPDATE rooms SET ${fields.join(", ")} WHERE room_id = ?`;

      db.query(query, values, (error) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else {
          resolve({ success: true, message: "Room updated successfully" });
        }
      });
    });
  }

  // Delete room
  static deleteRoom(roomId) {
    return new Promise((resolve) => {
      const query = "DELETE FROM rooms WHERE room_id = ?";
      db.query(query, [roomId], (error) => {
        if (error) {
          resolve({ success: false, message: error.message });
        } else {
          resolve({ success: true, message: "Room deleted successfully" });
        }
      });
    });
  }

  // Check room availability for a specific date/time
  static checkRoomAvailability(roomId, examDate, startTime, endTime) {
    return new Promise((resolve) => {
      const query = `
        SELECT COUNT(*) as conflict_count
        FROM exam_schedules es
        JOIN exams e ON es.exam_id = e.exam_id
        WHERE es.room_id = ? 
        AND es.exam_date = ?
        AND es.status != 'cancelled'
        AND (
          (es.start_time < ? AND es.end_time > ?)
          OR (es.start_time < ? AND es.end_time > ?)
          OR (es.start_time >= ? AND es.end_time <= ?)
        )
      `;
      db.query(
        query,
        [
          roomId,
          examDate,
          endTime,
          startTime,
          examDate,
          startTime,
          examDate,
          startTime,
          endTime,
        ],
        (error, results) => {
          if (error) {
            resolve({ success: false, message: error.message });
          } else {
            resolve({
              success: true,
              available: results[0].conflict_count === 0,
            });
          }
        },
      );
    });
  }
}

export default RoomsService;
