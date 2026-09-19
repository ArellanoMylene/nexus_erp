-- Create inventory_assets table
CREATE TABLE IF NOT EXISTS inventory_assets (
  asset_id INT AUTO_INCREMENT PRIMARY KEY,
  asset_name VARCHAR(255) NOT NULL,
  asset_type ENUM('equipment', 'furniture', 'electronics', 'vehicle', 'other') NOT NULL DEFAULT 'equipment',
  description TEXT,
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  location VARCHAR(255),
  status ENUM('available', 'in_use', 'maintenance', 'disposed') NOT NULL DEFAULT 'available',
  assigned_to VARCHAR(255),
  `condition` ENUM('excellent', 'good', 'fair', 'poor') NOT NULL DEFAULT 'good',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_asset_type (asset_type),
  INDEX idx_status (status),
  INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO inventory_assets (asset_name, asset_type, description, serial_number, purchase_date, purchase_price, current_value, location, status, assigned_to, `condition`) VALUES
('Dell Optiplex 7090', 'electronics', 'Desktop computer for faculty office', 'DO7090-2024-001', '2024-01-15', 45000.00, 42000.00, 'Faculty Office 201', 'in_use', 'Juan Dela Cruz', 'excellent'),
('HP LaserJet Pro', 'electronics', 'Printer for admin department', 'HPLJ-2023-045', '2023-06-20', 18000.00, 15000.00, 'Admin Office', 'in_use', 'Admin Department', 'good'),
('Office Desk', 'furniture', 'Standard office desk with drawers', 'OD-2024-125', '2024-02-10', 8500.00, 8000.00, 'Library Room 3', 'available', NULL, 'good'),
('Projector Epson EB-X49', 'electronics', 'Classroom projector', 'EPSON-2022-089', '2022-08-15', 28000.00, 20000.00, 'Room 305', 'maintenance', NULL, 'fair'),
('Toyota Hiace', 'vehicle', 'School service vehicle', 'TH-2020-001', '2020-03-01', 1200000.00, 950000.00, 'Parking Area', 'available', NULL, 'good'),
('Conference Table', 'furniture', 'Large conference table for meetings', 'CT-2023-012', '2023-04-12', 35000.00, 32000.00, 'Conference Room A', 'in_use', NULL, 'excellent'),
('Air Conditioning Unit', 'equipment', '2.5HP split-type aircon', 'AC-2024-078', '2024-05-20', 32000.00, 31000.00, 'Computer Lab 1', 'in_use', NULL, 'excellent'),
('Whiteboard', 'equipment', 'Magnetic whiteboard 4x6 feet', 'WB-2023-156', '2023-09-10', 4500.00, 4200.00, 'Room 402', 'available', NULL, 'good'),
('Filing Cabinet', 'furniture', '4-drawer steel filing cabinet', 'FC-2022-203', '2022-11-05', 6500.00, 5500.00, 'Registrar Office', 'in_use', 'Registrar', 'fair'),
('Laptop Lenovo ThinkPad', 'electronics', 'Portable laptop for presentations', 'LTP-2024-033', '2024-07-08', 55000.00, 54000.00, 'Admin Office', 'in_use', 'Maria Santos', 'excellent');
