-- Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    floor INT,
    room_name VARCHAR(100),
    capacity INT,
    room_type ENUM('Classroom', 'Lab', 'Auditorium', 'Conference Room', 'Other') DEFAULT 'Classroom',
    department_id INT NOT NULL,
    status ENUM('Available', 'Maintenance', 'Inactive') DEFAULT 'Available',
    features TEXT,          -- e.g., projector, whiteboard, AC, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_per_dept (room_number, building, department_id)
);

-- Add room_id foreign key to exam_schedules if not already present
ALTER TABLE exam_schedules 
ADD CONSTRAINT fk_exam_schedules_room 
FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE SET NULL;
