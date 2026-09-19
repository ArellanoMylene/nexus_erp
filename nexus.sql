-- ===========================
-- Database: Nexus
-- ===========================
CREATE DATABASE IF NOT EXISTS nexus6;
USE nexus6;

-- ===========================
-- 1. Core Users Table
-- Stores common information for all roles (Student, Admin, Faculty, Staff)
-- Passwords stored as secure hashes
-- ===========================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each user
    email VARCHAR(255) NOT NULL UNIQUE,      -- Login email
    password_hash VARCHAR(255) NOT NULL,     -- Hashed password
    role ENUM('Student', 'Admin', 'Faculty', 'Staff',"HR","Accounting") NOT NULL,  -- User role
    
    first_name VARCHAR(100) NOT NULL,        -- First name
    middle_name VARCHAR(100),                -- Middle name (optional)
    last_name VARCHAR(100) NOT NULL,         -- Last name
    suffix VARCHAR(20),                      -- Suffix (Jr., Sr., III, etc.)
    
    date_of_birth DATE,                      -- DOB (optional)
    gender VARCHAR(50),                      -- Gender (could also use ENUM)
    phone VARCHAR(50),                        -- Contact number
    permanent_address TEXT,                  -- Permanent address
    profile_picture_url VARCHAR(255),        -- Optional URL to profile picture
    
    status VARCHAR(50) DEFAULT 'Active',     -- Account status (Active, Leave, Terminated)
    is_verified TINYINT(1) DEFAULT 0,        -- Email verification status (0 = Unverified, 1 = Verified)
    verification_code VARCHAR(6) DEFAULT NULL, -- 6-digit email OTP verification code
    verification_expires_at DATETIME DEFAULT NULL, -- Code expiration timestamp
    email_verified_at DATETIME DEFAULT NULL, -- Timestamp when email was verified
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Creation timestamp
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- 2. Student Details Table
-- 1-to-1 relationship with users table
-- Stores student-specific information
-- ===========================
CREATE TABLE student_details (
    user_id INT PRIMARY KEY,                  -- FK to users.user_id
    student_number VARCHAR(50) UNIQUE NOT NULL,  -- Unique student ID
    student_type VARCHAR(50),                 -- New Student, Old Student, or Transferree
    course VARCHAR(100),                      -- Student's course
    major VARCHAR(100),                       -- Major/track
    year_level VARCHAR(50),                   -- e.g., '1st Year', '4th Year'
    previous_school VARCHAR(255),             -- Previous school attended
    year_graduated YEAR,                      -- Year graduated from previous school
    mailing_address TEXT,                     -- Mailing address for student
    elementary_school_completed_at VARCHAR(255),
    elementary_school_year_graduated VARCHAR(20),
    junior_high_school_completed_at VARCHAR(255),
    junior_high_school_year_graduated VARCHAR(20),
    senior_high_school_completed_at VARCHAR(255),
    senior_high_school_year_graduated VARCHAR(20),
    college_program_course_attended VARCHAR(255),
    school_year_attended VARCHAR(20),

    father_name VARCHAR(200),                 -- Parent/guardian names
    mother_name VARCHAR(200),
    parent_phone VARCHAR(50),                 -- Parent contact number

    academic_year VARCHAR(20),                -- Active academic year at registration
    semester VARCHAR(50),                     -- Active semester at registration
    civil_status ENUM('Single','Married','Widowed','Separated','Others'),
    religion VARCHAR(100),
    is_pwd ENUM('Yes','No'),
    indigenous_people ENUM('Yes','No'),
    zip_code VARCHAR(20),
    date_registered DATE,

    permanent_sitio VARCHAR(150),
    permanent_barangay VARCHAR(150),
    permanent_city_municipality VARCHAR(150),
    permanent_province VARCHAR(150),

    present_sitio VARCHAR(150),
    present_barangay VARCHAR(150),
    present_city_municipality VARCHAR(150),
    present_province VARCHAR(150),

    birth_place VARCHAR(255),
    citizenship VARCHAR(100),

    father_status ENUM('Living','Deceased'),
    father_residence_street VARCHAR(150),
    father_residence_barangay VARCHAR(150),
    father_residence_city VARCHAR(150),
    father_residence_province VARCHAR(150),
    father_residence_zip_code VARCHAR(20),
    father_occupation VARCHAR(150),
    father_phone VARCHAR(50),

    mother_status ENUM('Living','Deceased'),
    mother_residence_street VARCHAR(150),
    mother_residence_barangay VARCHAR(150),
    mother_residence_city VARCHAR(150),
    mother_residence_province VARCHAR(150),
    mother_residence_zip_code VARCHAR(20),
    mother_occupation VARCHAR(150),
    mother_phone VARCHAR(50),

    guardian_name VARCHAR(200),
    guardian_relationship VARCHAR(100),
    guardian_residence_street VARCHAR(150),
    guardian_residence_barangay VARCHAR(150),
    guardian_residence_city VARCHAR(150),
    guardian_residence_province VARCHAR(150),
    guardian_residence_zip_code VARCHAR(20),
    guardian_occupation VARCHAR(150),
    guardian_phone VARCHAR(50),

    other_financial_assistance ENUM('Yes','No'),
    scholarship_assistance_1 VARCHAR(255),
    scholarship_assistance_2 VARCHAR(255),
    scholarship_assistance_3 VARCHAR(255),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE  -- Cascade delete if user removed
);

-- ===========================
-- 3. Employee Details Table
-- 1-to-1 relationship with users table
-- Stores faculty, staff, and admin-specific info
-- ===========================
CREATE TABLE employee_details (
    user_id INT PRIMARY KEY,                  -- FK to users.user_id
    employee_id VARCHAR(50) UNIQUE NOT NULL,  -- Unique employee ID
    department VARCHAR(100),                  -- Department or office
    position_title VARCHAR(100),              -- Job title
    date_hired DATE,                          -- Hiring date

    -- Faculty-specific fields
    specialization VARCHAR(150),              -- Area of expertise
    educational_attainment VARCHAR(150),     -- Degree or certifications
    license_number VARCHAR(50),               -- Professional license number

    -- Admin-specific fields
    access_level ENUM('Standard Admin', 'Super Admin'),  -- Admin access control

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===========================
-- 4. RBAC Permissions Table
-- Stores all possible permissions/features/modules
-- ===========================
CREATE TABLE rbac_permissions (
    permission_id VARCHAR(10) PRIMARY KEY,  -- Unique short code for permission
    name VARCHAR(100) NOT NULL,             -- Permission name
    description TEXT                         -- Optional description of permission
);

-- ===========================
-- 5. Role Permissions Mapping Table
-- Maps roles to permissions (many-to-many)
-- ===========================
CREATE TABLE role_permissions (
    role ENUM('Student', 'Admin', 'Faculty', 'Staff') NOT NULL,  -- Role
    permission_id VARCHAR(10) NOT NULL,                           -- Permission ID
    is_allowed BOOLEAN DEFAULT FALSE,                             -- Permission flag (true/false)
    PRIMARY KEY (role, permission_id),                            -- Composite primary key
    FOREIGN KEY (permission_id) REFERENCES rbac_permissions(permission_id) ON DELETE CASCADE
);

-- ===========================
-- 6. Sample Permissions Insert
-- Initial RBAC data
-- ===========================
INSERT INTO rbac_permissions (permission_id, name, description) VALUES
('C1', 'Can Manage Courses', 'Create, edit, and delete course offerings.'),
('S1', 'Can View Student Grades', 'Access student academic performance records.'),
('U1', 'Can Manage User Accounts', 'Create, edit, and delete non-Admin user accounts.'),
('A1', 'Can Access Audit Logs', 'View system activity and security logs.');
-- ===========================
-- 7. Departments Table
-- Stores all academic/administrative departments
-- ===========================
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,      -- Unique ID for department
    name VARCHAR(100) NOT NULL UNIQUE,               -- Department name
    description TEXT,                                -- Optional description
    head_user_id INT,                                -- FK: Department head (employee)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (head_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
ALTER TABLE departments ADD COLUMN status ENUM('Active','Inactive','Pending') DEFAULT 'Active';
-- ===========================
-- 8. Courses Table
-- Stores all courses offered by the institution
-- ===========================
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,       -- Unique ID for course
    code VARCHAR(20) NOT NULL UNIQUE,              -- Course code (e.g., CS101)
    title VARCHAR(100) NOT NULL,                   -- Course title
    description TEXT,                              -- Optional course description
    units INT DEFAULT 3, 
    hours INT NOT NULL,
    type ENUM('Major','Minor') NOT NULL,                           -- Course type
    department_id INT NOT NULL,                     -- FK to department offering the course
    instructor_id INT,                              -- FK to faculty member (user_id)
    semester_offer VARCHAR(100) NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 9. Programs/Degrees Table
-- Stores all academic programs offered by the institution
-- ===========================
CREATE TABLE programs (
    program_id INT AUTO_INCREMENT PRIMARY KEY,       -- Unique ID for program
    code VARCHAR(20) NOT NULL UNIQUE,                -- Program code (e.g., BSIT, BSCS)
    name VARCHAR(150) NOT NULL,                      -- Program name
    description TEXT,                                -- Program description
    degree_type ENUM('Bachelor', 'Associate', 'Certificate', 'Diploma') DEFAULT 'Bachelor',
    duration_years INT DEFAULT 4,                    -- Duration in years
    department_id INT,                               -- FK to department offering the program
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- ===========================
-- 10. Academic Years/Semesters Table
-- Stores school years and semesters for enrollment periods
-- ===========================
CREATE TABLE academic_periods (
    period_id INT AUTO_INCREMENT PRIMARY KEY,
    school_year VARCHAR(20) NOT NULL,                -- e.g., "2024-2025"
    semester ENUM('1st Semester', '2nd Semester', 'Summer') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,                 -- Only one period can be active at a time
    status ENUM('Upcoming', 'Active', 'Closed') DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_period (school_year, semester)
);

-- ===========================
-- 11. Prerequisites Table
-- Many-to-Many mapping between courses and their prerequisites
-- ===========================
CREATE TABLE prerequisites (
    prereq_link_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL, 
    prereq_course_id INT NOT NULL, 
    is_corequisite BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, prereq_course_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (prereq_course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- ===========================
-- 12. Enrollments Table
-- Tracks student course enrollments per academic period
-- ===========================
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                        -- FK to users.user_id (student)
    course_id INT NOT NULL,                         -- FK to courses.course_id
    period_id INT NOT NULL,                         -- FK to academic_periods.period_id
    enrollment_date DATE NOT NULL,                  -- Date student enrolled in course
    status ENUM('Enrolled', 'Dropped', 'Completed', 'Failed') DEFAULT 'Enrolled',
    -- Grades
    midterm_grade DECIMAL(5,2),                     -- Midterm grade (0-100 or 0.00-5.00)
    final_grade DECIMAL(5,2),                       -- Final grade
    remarks TEXT,                                    -- Additional notes or comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Prevent duplicate enrollments
    UNIQUE KEY unique_enrollment (student_id, course_id, period_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE
);

-- ===========================
-- 13. Admissions Table
-- Tracks student admission applications and status
-- ===========================
CREATE TABLE admissions (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Applicant Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(50),
    address TEXT,
    -- Academic Background
    previous_school VARCHAR(255),
    year_graduated YEAR,
    program_applied VARCHAR(150),                   -- Program/course applying for
    -- Application Details
    application_date DATE NOT NULL,
    entrance_exam_score DECIMAL(5,2),               -- Entrance exam score
    interview_date DATE,
    interview_notes TEXT,
    -- Status & Decision
    status ENUM('Pending', 'Under Review', 'Accepted', 'Rejected', 'Enrolled') DEFAULT 'Pending',
    decision_date DATE,
    decision_by INT,                                 -- FK to users.user_id (admin who decided)
    remarks TEXT,    
    -- Documents
    documents_submitted TEXT,                        -- JSON or comma-separated list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (decision_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 14. Course Transfers Table
-- Tracks course transfer and shifting requests
-- ===========================
CREATE TABLE course_transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                         -- FK to users.user_id
    -- Current & Target Information
    current_program VARCHAR(150),
    target_program VARCHAR(150) NOT NULL,
    reason TEXT,
    -- Request Details
    request_date DATE NOT NULL,
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Pending',
    -- Approval
    reviewed_by INT,                                 -- FK to users.user_id (admin/dean)
    review_date DATE,
    review_notes TEXT,    
    -- Effectivity
    effective_period_id INT,                         -- FK to academic_periods.period_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (effective_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL
);

-- ===========================
-- 15. Academic History Table
-- Tracks comprehensive academic history and milestones
-- ===========================
CREATE TABLE academic_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                         -- FK to users.user_id
    period_id INT NOT NULL,                          -- FK to academic_periods.period_id
    -- Academic Standing
    year_level VARCHAR(50),
    semester_gpa DECIMAL(4,2),                       -- GPA for the semester
    cumulative_gpa DECIMAL(4,2),                     -- Overall GPA
    units_taken INT,
    units_passed INT,
    -- Status & Remarks
    academic_status ENUM('Regular', 'Irregular', 'Probation', 'Dean''s List', 'Dismissed') DEFAULT 'Regular',
    honors VARCHAR(100),                             -- Dean's List, President's List, etc.
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_history (student_id, period_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE
);

-- ===========================
-- 16. Clearance Table
-- Tracks student clearance requirements and status
-- ===========================
CREATE TABLE clearances (
    clearance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,                         -- FK to users.user_id
    period_id INT NOT NULL,                          -- FK to academic_periods.period_id
    -- Clearance Requirements
    library_cleared BOOLEAN DEFAULT FALSE,
    registrar_cleared BOOLEAN DEFAULT FALSE,
    accounting_cleared BOOLEAN DEFAULT FALSE,
    dean_cleared BOOLEAN DEFAULT FALSE,
    guidance_cleared BOOLEAN DEFAULT FALSE,
    student_affairs_cleared BOOLEAN DEFAULT FALSE,
    -- Details
    library_remarks TEXT,
    registrar_remarks TEXT,
    accounting_remarks TEXT,
    dean_remarks TEXT,
    guidance_remarks TEXT,
    student_affairs_remarks TEXT,
    -- Overall Status
    overall_status ENUM('Incomplete', 'Pending', 'Cleared') DEFAULT 'Incomplete',
    cleared_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_clearance (student_id, period_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE
);

-- ===========================
-- FACULTY MANAGEMENT MODULE
-- Uses existing employee_details table for faculty information
-- ===========================

-- ===========================
-- 17. Faculty Course Assignments Table
-- Manages faculty teaching assignments
-- ===========================
CREATE TABLE IF NOT EXISTS faculty_course_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_user_id INT NOT NULL,                    -- FK to users.user_id (Faculty)
    course_id INT NOT NULL,
    academic_period_id INT NOT NULL,
    section VARCHAR(50),
    room VARCHAR(50),
    max_students INT,
    current_enrolled INT DEFAULT 0,
    assignment_status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    assigned_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE
);
CREATE TABLE faculty_assignment_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  schedule_day VARCHAR(50),
  schedule_time_start TIME,
  schedule_time_end TIME,
  FOREIGN KEY (assignment_id) REFERENCES faculty_course_assignments(assignment_id) ON DELETE CASCADE
);
-- ===========================
-- 18. Faculty Advisory Assignments Table
-- Faculty advisors for students
-- ===========================
CREATE TABLE IF NOT EXISTS faculty_advisory_assignments (
    advisory_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_user_id INT NOT NULL,                    -- FK to users.user_id (Faculty)
    student_id INT NOT NULL,                         -- FK to users.user_id (Student)
    program_id INT,
    year_level INT,
    academic_period_id INT NOT NULL,
    assignment_date DATE,
    status ENUM('active', 'completed', 'transferred') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE
);
ALTER TABLE faculty_advisory_assignments
ADD COLUMN advisory_type VARCHAR(50) DEFAULT 'Academic' AFTER student_id;
-- ===========================
-- 19. Faculty Evaluations Table
-- Faculty performance evaluations
-- ===========================
CREATE TABLE IF NOT EXISTS faculty_evaluations (
    evaluation_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_user_id INT NOT NULL,                    -- FK to users.user_id (Faculty)
    evaluator_id INT,                                -- FK to users.user_id (Evaluator)
    evaluator_type ENUM('student', 'peer', 'admin', 'self') NOT NULL,
    academic_period_id INT NOT NULL,
    course_id INT,
    evaluation_date DATE,
    -- Evaluation criteria (1-5 scale)
    teaching_effectiveness INT CHECK (teaching_effectiveness BETWEEN 1 AND 5),
    subject_knowledge INT CHECK (subject_knowledge BETWEEN 1 AND 5),
    classroom_management INT CHECK (classroom_management BETWEEN 1 AND 5),
    communication_skills INT CHECK (communication_skills BETWEEN 1 AND 5),
    professionalism INT CHECK (professionalism BETWEEN 1 AND 5),
    student_engagement INT CHECK (student_engagement BETWEEN 1 AND 5),
    overall_rating DECIMAL(3,2),
    comments TEXT,
    recommendations TEXT,
    status ENUM('draft', 'submitted', 'reviewed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- ===========================
-- 20. Faculty Schedules Table
-- Detailed schedule management for faculty
-- ===========================
CREATE TABLE IF NOT EXISTS faculty_schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_user_id INT NOT NULL,                    -- FK to users.user_id (Faculty)
    academic_period_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    activity_type ENUM('teaching', 'consultation', 'meeting', 'break', 'other') DEFAULT 'teaching',
    course_id INT,
    section VARCHAR(50),
    room VARCHAR(50),
    notes TEXT,
    status ENUM('active', 'cancelled', 'rescheduled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- ===========================
-- 21. Faculty Consultation Hours Table
-- Faculty consultation availability
-- ===========================
CREATE TABLE IF NOT EXISTS faculty_consultation_hours (
    consultation_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_user_id INT NOT NULL,                    -- FK to users.user_id (Faculty)
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    location VARCHAR(100),
    mode ENUM('in-person', 'online', 'hybrid') DEFAULT 'in-person',
    max_students INT DEFAULT 5,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===========================
-- Indexes for Faculty Management
-- ===========================
CREATE INDEX idx_faculty_course_faculty ON faculty_course_assignments(faculty_user_id);
CREATE INDEX idx_faculty_course_period ON faculty_course_assignments(academic_period_id);
CREATE INDEX idx_advisory_faculty ON faculty_advisory_assignments(faculty_user_id);
CREATE INDEX idx_advisory_student ON faculty_advisory_assignments(student_id);
CREATE INDEX idx_evaluation_faculty ON faculty_evaluations(faculty_user_id);
CREATE INDEX idx_evaluation_period ON faculty_evaluations(academic_period_id);
CREATE INDEX idx_schedule_faculty ON faculty_schedules(faculty_user_id);
CREATE INDEX idx_schedule_day ON faculty_schedules(day_of_week);

-- ===========================
-- ACADEMIC MANAGEMENT MODULE
-- ===========================

-- ===========================
-- 23. Sections Table
-- Course sections with capacity and schedule
-- ===========================
CREATE TABLE IF NOT EXISTS sections (
    section_id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    program_id INT NULL,
    section_name VARCHAR(50) NOT NULL,
    room VARCHAR(100),
    max_capacity INT DEFAULT 40,
    current_enrolled INT DEFAULT 0,
    schedule_day VARCHAR(50),
    schedule_time_start TIME,
    schedule_time_end TIME,
    status ENUM('active', 'inactive', 'full') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    UNIQUE KEY unique_section (period_id, program_id, section_name)
);

-- ===========================
-- 24. Grades Table
-- Student grades with component breakdown
-- ===========================
CREATE TABLE IF NOT EXISTS grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    student_user_id INT NOT NULL,
    course_id INT NOT NULL,
    period_id INT NOT NULL,
    prelim_grade DECIMAL(5,2),
    midterm_grade DECIMAL(5,2),
    finals_grade DECIMAL(5,2),
    final_grade DECIMAL(5,2),
    remarks VARCHAR(20),
    status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
    approved_by INT,
    approved_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_grade (student_user_id, course_id, period_id)
);

-- ===========================
-- 25. Academic Events Table
-- Calendar events and important dates
-- ===========================
CREATE TABLE IF NOT EXISTS academic_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT,
    event_name VARCHAR(200) NOT NULL,
    event_type ENUM('enrollment', 'exam', 'holiday', 'meeting', 'deadline', 'activity', 'other') DEFAULT 'other',
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    location VARCHAR(200),
    target_audience ENUM('all', 'students', 'faculty', 'staff', 'admin') DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL
);

-- ===========================
-- 26. Syllabus Repository Table
-- Course syllabi with file storage
-- ===========================
CREATE TABLE IF NOT EXISTS syllabus (
    syllabus_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    period_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    description TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);
-- ===========================
-- Indexes for Academic Management
-- ===========================
CREATE INDEX idx_sections_course ON sections(course_id);
CREATE INDEX idx_sections_period ON sections(period_id);
CREATE INDEX idx_grades_student ON grades(student_user_id);
CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_grades_period ON grades(period_id);
CREATE INDEX idx_events_date ON academic_events(start_date);
CREATE INDEX idx_events_type ON academic_events(event_type);
CREATE INDEX idx_syllabus_course ON syllabus(course_id);
CREATE INDEX idx_syllabus_period ON syllabus(period_id);
-- ===========================
-- ATTENDANCE MANAGEMENT MODULE
-- ===========================
-- ===========================

-- ===========================
-- RFID Cards Table
-- Tracks RFID cards assigned to users for attendance and access
-- ===========================
CREATE TABLE IF NOT EXISTS rfid_cards (
    rfid_id INT PRIMARY KEY AUTO_INCREMENT,
    card_number VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    card_type VARCHAR(50) DEFAULT 'employee',
    issue_date DATE,
    expiry_date DATE,
    status ENUM('active', 'inactive', 'lost', 'blocked') DEFAULT 'active',
    last_used DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===========================
-- 28. Staff Attendance Table
-- Tracks daily attendance for faculty and staff
-- ===========================
CREATE TABLE IF NOT EXISTS staff_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,                        -- FK to users.user_id (Faculty/Staff)
    attendance_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status ENUM('present', 'absent', 'late', 'half-day', 'on-leave') DEFAULT 'present',
    attendance_method ENUM('manual', 'rfid', 'biometric', 'mobile') DEFAULT 'manual',
    rfid_card_id INT,                            -- FK to rfid_cards.rfid_id
    location VARCHAR(100),
    remarks TEXT,
    verified_by INT,                             -- FK to users.user_id (Verifier)
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_staff_attendance (user_id, attendance_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (rfid_card_id) REFERENCES rfid_cards(rfid_id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 29. Student Attendance Table
-- Tracks student attendance per class/course
-- ===========================
CREATE TABLE IF NOT EXISTS student_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,                     -- FK to users.user_id
    course_id INT NOT NULL,                      -- FK to courses.course_id
    section_id INT,                              -- FK to sections.section_id
    period_id INT NOT NULL,                      -- FK to academic_periods.period_id
    attendance_date DATE NOT NULL,
    time_in TIME,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    attendance_method ENUM('manual', 'rfid', 'biometric', 'mobile') DEFAULT 'manual',
    rfid_card_id INT,                            -- FK to rfid_cards.rfid_id
    marked_by INT,                               -- FK to users.user_id (Faculty who marked)
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (rfid_card_id) REFERENCES rfid_cards(rfid_id) ON DELETE SET NULL,
    FOREIGN KEY (marked_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 30. Absentee Alerts Table
-- Stores alerts and notifications for absenteeism
-- ===========================
CREATE TABLE IF NOT EXISTS absentee_alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,                        -- FK to users.user_id
    user_type ENUM('student', 'faculty', 'staff') NOT NULL,
    alert_type ENUM('consecutive_absence', 'excessive_absence', 'pattern_detected', 'custom') NOT NULL,
    period_id INT,                               -- FK to academic_periods.period_id
    course_id INT,                               -- FK to courses.course_id (for students)
    absence_count INT NOT NULL,
    threshold_exceeded INT,                      -- How much over the threshold
    alert_date DATE NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'pending',
    message TEXT,
    notified_to INT,                             -- FK to users.user_id (Who was notified)
    notified_at TIMESTAMP NULL,
    acknowledged_by INT,                         -- FK to users.user_id
    acknowledged_at TIMESTAMP NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL,
    FOREIGN KEY (notified_to) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- Indexes for Attendance Management
-- ===========================
CREATE INDEX idx_rfid_card_number ON rfid_cards(card_number);
CREATE INDEX idx_rfid_user ON rfid_cards(user_id);
CREATE INDEX idx_staff_attendance_user ON staff_attendance(user_id);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(attendance_date);
CREATE INDEX idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_student_attendance_course ON student_attendance(course_id);
CREATE INDEX idx_student_attendance_date ON student_attendance(attendance_date);
CREATE INDEX idx_absentee_alerts_user ON absentee_alerts(user_id);
CREATE INDEX idx_absentee_alerts_status ON absentee_alerts(status);
CREATE INDEX idx_absentee_alerts_priority ON absentee_alerts(priority);

-- ===========================
-- 31. Exams Table
-- Stores exam definitions and configurations
-- ===========================
CREATE TABLE IF NOT EXISTS exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type ENUM('quiz', 'midterm', 'final', 'practical', 'project') NOT NULL,
    course_id INT NOT NULL,
    section_id INT,
    period_id INT,
    total_points DECIMAL(10,2) NOT NULL,
    passing_score DECIMAL(10,2),
    exam_duration INT,                           -- Duration in minutes
    description TEXT,
    instructions TEXT,
    status ENUM('draft', 'scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
    created_by INT,                              -- FK to users.user_id (faculty)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 32. Exam Schedules Table
-- Manages exam scheduling with venue and time
-- ===========================
CREATE TABLE IF NOT EXISTS exam_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    section_id INT,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255),
    room_id INT,                                 -- FK to rooms if available
    proctor_id INT,                              -- FK to users.user_id (faculty proctor)
    max_capacity INT,
    special_instructions TEXT,
    status ENUM('scheduled', 'rescheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (proctor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_venue_schedule (venue, exam_date, start_time)
);

-- ===========================
-- 33. Grade Entries Table
-- Stores individual grade submissions for approval workflow
-- ===========================
CREATE TABLE IF NOT EXISTS grade_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    section_id INT,
    period_id INT NOT NULL,
    exam_id INT,                                 -- FK to exams (if grade is for specific exam)
    component_name VARCHAR(100),                 -- e.g., 'Quiz 1', 'Midterm', 'Final', 'Attendance'
    component_type ENUM('exam', 'quiz', 'assignment', 'project', 'attendance', 'participation', 'other') DEFAULT 'other',
    raw_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    percentage DECIMAL(5,2),                     -- Calculated percentage
    weight DECIMAL(5,2),                         -- Weight in final grade
    weighted_score DECIMAL(10,2),                -- raw_score * weight
    remarks TEXT,
    submitted_by INT NOT NULL,                   -- FK to users.user_id (faculty)
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status ENUM('pending', 'approved', 'rejected', 'revision_needed') DEFAULT 'pending',
    approved_by INT,                             -- FK to users.user_id (admin/department head)
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 34. Grade Computation Settings Table
-- Stores grade computation formulas and weights per course/section
-- ===========================
CREATE TABLE IF NOT EXISTS grade_computation_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_id INT,
    period_id INT NOT NULL,
    component_name VARCHAR(100) NOT NULL,        -- e.g., 'Quizzes', 'Midterm', 'Final Project'
    component_type ENUM('exam', 'quiz', 'assignment', 'project', 'attendance', 'participation', 'other') NOT NULL,
    weight DECIMAL(5,2) NOT NULL,                -- Percentage weight (e.g., 30.00 for 30%)
    passing_percentage DECIMAL(5,2),             -- Minimum passing for this component
    computation_method ENUM('average', 'total', 'highest', 'weighted_average') DEFAULT 'average',
    drop_lowest INT DEFAULT 0,                   -- Number of lowest scores to drop
    is_required BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_by INT,                              -- FK to users.user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- Indexes for Examination & Grading
-- ===========================
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exams_section ON exams(section_id);
CREATE INDEX idx_exams_period ON exams(period_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exam_schedules_exam ON exam_schedules(exam_id);
CREATE INDEX idx_exam_schedules_date ON exam_schedules(exam_date);
CREATE INDEX idx_exam_schedules_proctor ON exam_schedules(proctor_id);
CREATE INDEX idx_grade_entries_student ON grade_entries(student_id);
CREATE INDEX idx_grade_entries_course ON grade_entries(course_id);
CREATE INDEX idx_grade_entries_period ON grade_entries(period_id);
CREATE INDEX idx_grade_entries_approval ON grade_entries(approval_status);
CREATE INDEX idx_grade_computation_course ON grade_computation_settings(course_id);
CREATE INDEX idx_grade_computation_period ON grade_computation_settings(period_id);

-- ===========================
-- FINANCIAL & ACCOUNTING SYSTEM
-- ===========================

-- ===========================
-- 1. Tuition Fee Setup Table
-- Manages fee structures per program, year level, and semester
-- ===========================
CREATE TABLE tuition_fee_setup (
    fee_setup_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    year_level ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year') NOT NULL,
    academic_period_id INT,
    
    tuition_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    laboratory_fee DECIMAL(10,2) DEFAULT 0.00,
    library_fee DECIMAL(10,2) DEFAULT 0.00,
    athletic_fee DECIMAL(10,2) DEFAULT 0.00,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    id_fee DECIMAL(10,2) DEFAULT 0.00,
    miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00,
    other_fees DECIMAL(10,2) DEFAULT 0.00,
    
    total_fee DECIMAL(10,2) GENERATED ALWAYS AS (
        tuition_fee + laboratory_fee + library_fee + athletic_fee + 
        registration_fee + id_fee + miscellaneous_fee + other_fees
    ) STORED,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 2. Student Invoices Table
-- Generates invoices for students based on enrollment
-- ===========================
CREATE TABLE student_invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    enrollment_id INT,
    academic_period_id INT,
    
    tuition_fee DECIMAL(10,2) DEFAULT 0.00,
    laboratory_fee DECIMAL(10,2) DEFAULT 0.00,
    library_fee DECIMAL(10,2) DEFAULT 0.00,
    athletic_fee DECIMAL(10,2) DEFAULT 0.00,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    id_fee DECIMAL(10,2) DEFAULT 0.00,
    miscellaneous_fee DECIMAL(10,2) DEFAULT 0.00,
    other_fees DECIMAL(10,2) DEFAULT 0.00,
    
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    scholarship_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    
    invoice_date DATE NOT NULL,
    due_date DATE,
    status ENUM('Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Pending',
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE SET NULL,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 3. Payment Collections Table
-- Records all payments made by students
-- ===========================
CREATE TABLE payment_collections (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    invoice_id INT NOT NULL,
    student_id INT NOT NULL,
    
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'GCash', 'PayMaya') NOT NULL,
    payment_date DATE NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    bank_name VARCHAR(100),
    check_number VARCHAR(50),
    reference_number VARCHAR(100),
    
    payment_status ENUM('Pending', 'Verified', 'Cleared', 'Bounced', 'Cancelled') DEFAULT 'Pending',
    receipt_number VARCHAR(50) UNIQUE,
    
    notes TEXT,
    collected_by INT,
    verified_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES student_invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 4. Scholarship Programs Table
-- Defines various scholarship programs available
-- ===========================
CREATE TABLE scholarship_programs (
    scholarship_id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_name VARCHAR(200) NOT NULL,
    scholarship_code VARCHAR(50) UNIQUE NOT NULL,
    scholarship_type ENUM('Full', 'Partial', 'Variable') NOT NULL,
    
    discount_type ENUM('Percentage', 'Fixed Amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    
    description TEXT,
    eligibility_criteria TEXT,
    required_gpa DECIMAL(3,2),
    required_income_level VARCHAR(100),
    
    total_budget DECIMAL(12,2),
    allocated_amount DECIMAL(12,2) DEFAULT 0.00,
    available_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_budget - allocated_amount) STORED,
    
    max_beneficiaries INT,
    current_beneficiaries INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    academic_period_id INT,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 5. Scholarship Fund Allocation Table
-- Tracks scholarship allocation to specific students
-- ===========================
CREATE TABLE scholarship_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_period_id INT,
    
    allocated_amount DECIMAL(10,2) NOT NULL,
    disbursed_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (allocated_amount - disbursed_amount) STORED,
    
    allocation_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    
    status ENUM('Pending', 'Approved', 'Active', 'Completed', 'Cancelled', 'Suspended') DEFAULT 'Pending',
    
    application_notes TEXT,
    approval_notes TEXT,
    approved_by INT,
    approval_date DATE,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (scholarship_id) REFERENCES scholarship_programs(scholarship_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 6. Income & Expenses Table
-- Tracks all school income and expenses
-- ===========================
CREATE TABLE income_expenses (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('Income', 'Expense') NOT NULL,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    
    category VARCHAR(100) NOT NULL,  -- e.g., 'Tuition', 'Salaries', 'Utilities', 'Supplies'
    subcategory VARCHAR(100),
    
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    
    description TEXT,
    payment_method ENUM('Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Others'),
    reference_number VARCHAR(100),
    
    vendor_payee VARCHAR(200),  -- For expenses: vendor/supplier; For income: source
    
    department VARCHAR(100),
    academic_period_id INT,
    
    status ENUM('Pending', 'Approved', 'Paid', 'Cancelled') DEFAULT 'Pending',
    
    receipt_url VARCHAR(255),
    supporting_docs TEXT,
    
    requested_by INT,
    approved_by INT,
    processed_by INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(period_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 7. Payment Gateway Configuration Table
-- Stores payment gateway settings and credentials
-- ===========================
CREATE TABLE payment_gateway_config (
    gateway_id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(100) NOT NULL,  -- e.g., 'PayPal', 'Stripe', 'GCash', 'PayMaya'
    gateway_type VARCHAR(50) NOT NULL,
    
    is_active BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    merchant_id VARCHAR(255),
    webhook_url VARCHAR(255),
    
    public_key TEXT,
    private_key TEXT,
    
    transaction_fee_type ENUM('Fixed', 'Percentage', 'Both') DEFAULT 'Percentage',
    transaction_fee_value DECIMAL(5,2) DEFAULT 0.00,
    
    supported_currencies VARCHAR(100) DEFAULT 'PHP',
    min_amount DECIMAL(10,2) DEFAULT 0.00,
    max_amount DECIMAL(10,2),
    
    configuration_json TEXT,  -- For additional settings in JSON format
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- 8. Payment Gateway Transactions Table
-- Logs all transactions through payment gateways
-- ===========================
CREATE TABLE payment_gateway_transactions (
    gateway_transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    gateway_id INT NOT NULL,
    
    external_transaction_id VARCHAR(255),  -- ID from the payment gateway
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    
    student_id INT NOT NULL,
    invoice_id INT,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PHP',
    transaction_fee DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    
    payment_status ENUM('Initiated', 'Pending', 'Processing', 'Success', 'Failed', 'Cancelled', 'Refunded') DEFAULT 'Initiated',
    
    gateway_response TEXT,
    error_message TEXT,
    
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_id) REFERENCES payment_collections(payment_id) ON DELETE SET NULL,
    FOREIGN KEY (gateway_id) REFERENCES payment_gateway_config(gateway_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES student_invoices(invoice_id) ON DELETE SET NULL
);

-- ===========================
-- Indexes for Financial Tables
-- ===========================
CREATE INDEX idx_tuition_fee_program ON tuition_fee_setup(program_id);
CREATE INDEX idx_tuition_fee_period ON tuition_fee_setup(academic_period_id);
CREATE INDEX idx_tuition_fee_year_level ON tuition_fee_setup(year_level);

CREATE INDEX idx_invoices_student ON student_invoices(student_id);
CREATE INDEX idx_invoices_enrollment ON student_invoices(enrollment_id);
CREATE INDEX idx_invoices_period ON student_invoices(academic_period_id);
CREATE INDEX idx_invoices_status ON student_invoices(status);
CREATE INDEX idx_invoices_date ON student_invoices(invoice_date);

CREATE INDEX idx_payments_invoice ON payment_collections(invoice_id);
CREATE INDEX idx_payments_student ON payment_collections(student_id);
CREATE INDEX idx_payments_date ON payment_collections(payment_date);
CREATE INDEX idx_payments_status ON payment_collections(payment_status);
CREATE INDEX idx_payments_method ON payment_collections(payment_method);

CREATE INDEX idx_scholarships_type ON scholarship_programs(scholarship_type);
CREATE INDEX idx_scholarships_period ON scholarship_programs(academic_period_id);
CREATE INDEX idx_scholarships_active ON scholarship_programs(is_active);

CREATE INDEX idx_allocations_scholarship ON scholarship_allocations(scholarship_id);
CREATE INDEX idx_allocations_student ON scholarship_allocations(student_id);
CREATE INDEX idx_allocations_period ON scholarship_allocations(academic_period_id);
CREATE INDEX idx_allocations_status ON scholarship_allocations(status);

CREATE INDEX idx_income_expenses_type ON income_expenses(transaction_type);
CREATE INDEX idx_income_expenses_category ON income_expenses(category);
CREATE INDEX idx_income_expenses_date ON income_expenses(transaction_date);
CREATE INDEX idx_income_expenses_period ON income_expenses(academic_period_id);
CREATE INDEX idx_income_expenses_status ON income_expenses(status);

CREATE INDEX idx_gateway_config_active ON payment_gateway_config(is_active);
CREATE INDEX idx_gateway_trans_gateway ON payment_gateway_transactions(gateway_id);
CREATE INDEX idx_gateway_trans_student ON payment_gateway_transactions(student_id);
CREATE INDEX idx_gateway_trans_status ON payment_gateway_transactions(payment_status);

-- ===========================
-- HR & PAYROLL MANAGEMENT
-- ===========================

-- Employee Records Table (extends users table for Staff/Faculty)
CREATE TABLE employee_records (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100) NOT NULL,
    employment_type ENUM('Full-time', 'Part-time', 'Contract', 'Temporary') DEFAULT 'Full-time',
    employment_status ENUM('Active', 'On Leave', 'Terminated', 'Retired') DEFAULT 'Active',
    
    hire_date DATE NOT NULL,
    end_date DATE NULL,
    
    basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    allowances DECIMAL(12, 2) DEFAULT 0.00,
    
    sss_number VARCHAR(50),
    tin_number VARCHAR(50),
    philhealth_number VARCHAR(50),
    pagibig_number VARCHAR(50),
    
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Staff Leave Management
CREATE TABLE staff_leave (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type ENUM('Sick Leave', 'Vacation Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Unpaid Leave') NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT GENERATED ALWAYS AS (DATEDIFF(end_date, start_date) + 1) STORED,
    
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    
    approved_by INT NULL,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    
    supporting_document_url VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employee_records(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Payroll Setup/Configuration
CREATE TABLE payroll_setup (
    payroll_setup_id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_period_start DATE NOT NULL,
    payroll_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    payroll_type ENUM('Monthly', 'Semi-Monthly', 'Weekly', 'Daily') DEFAULT 'Monthly',
    status ENUM('Draft', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Draft',
    
    total_employees INT DEFAULT 0,
    total_gross_pay DECIMAL(15, 2) DEFAULT 0.00,
    total_deductions DECIMAL(15, 2) DEFAULT 0.00,
    total_net_pay DECIMAL(15, 2) DEFAULT 0.00,
    
    notes TEXT,
    
    created_by INT,
    processed_by INT,
    processed_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Payslip/Payroll Records
CREATE TABLE payslips (
    payslip_id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_setup_id INT NOT NULL,
    employee_id INT NOT NULL,
    
    payslip_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Earnings
    basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    allowances DECIMAL(12, 2) DEFAULT 0.00,
    overtime_pay DECIMAL(12, 2) DEFAULT 0.00,
    bonus DECIMAL(12, 2) DEFAULT 0.00,
    other_earnings DECIMAL(12, 2) DEFAULT 0.00,
    gross_pay DECIMAL(12, 2) GENERATED ALWAYS AS (basic_salary + allowances + overtime_pay + bonus + other_earnings) STORED,
    
    -- Deductions
    sss_deduction DECIMAL(12, 2) DEFAULT 0.00,
    philhealth_deduction DECIMAL(12, 2) DEFAULT 0.00,
    pagibig_deduction DECIMAL(12, 2) DEFAULT 0.00,
    withholding_tax DECIMAL(12, 2) DEFAULT 0.00,
    loan_deduction DECIMAL(12, 2) DEFAULT 0.00,
    other_deductions DECIMAL(12, 2) DEFAULT 0.00,
    total_deductions DECIMAL(12, 2) GENERATED ALWAYS AS (sss_deduction + philhealth_deduction + pagibig_deduction + withholding_tax + loan_deduction + other_deductions) STORED,
    
    -- Net Pay
    net_pay DECIMAL(12, 2) GENERATED ALWAYS AS (gross_pay - total_deductions) STORED,
    
    -- Work Details
    days_worked DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    late_hours DECIMAL(5, 2) DEFAULT 0,
    absences INT DEFAULT 0,
    
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payroll_setup_id) REFERENCES payroll_setup(payroll_setup_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee_records(employee_id) ON DELETE CASCADE
);

-- Deduction Management
CREATE TABLE deductions (
    deduction_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    deduction_type ENUM('SSS', 'PhilHealth', 'Pag-IBIG', 'Withholding Tax', 'Loan', 'Cash Advance', 'Late/Absences', 'Other') NOT NULL,
    deduction_name VARCHAR(200) NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    frequency ENUM('One-time', 'Monthly', 'Semi-Monthly', 'Per Payroll') DEFAULT 'Monthly',
    
    start_date DATE NOT NULL,
    end_date DATE NULL,
    
    remaining_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employee_records(employee_id) ON DELETE CASCADE
);

-- Payroll Reports/Summary
CREATE TABLE payroll_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_setup_id INT NOT NULL,
    
    report_type ENUM('Summary', 'Detailed', 'Department', 'Tax', 'Deductions', 'Bank Transfer') NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    
    generated_by INT,
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    file_path VARCHAR(255),
    file_format VARCHAR(50),
    
    parameters JSON,
    
    FOREIGN KEY (payroll_setup_id) REFERENCES payroll_setup(payroll_setup_id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ===========================
-- Indexes for HR & Payroll Tables
-- ===========================
CREATE INDEX idx_employee_user ON employee_records(user_id);
CREATE INDEX idx_employee_number ON employee_records(employee_number);
CREATE INDEX idx_employee_department ON employee_records(department);
CREATE INDEX idx_employee_status ON employee_records(employment_status);

CREATE INDEX idx_leave_employee ON staff_leave(employee_id);
CREATE INDEX idx_leave_status ON staff_leave(status);
CREATE INDEX idx_leave_dates ON staff_leave(start_date, end_date);

CREATE INDEX idx_payroll_dates ON payroll_setup(payroll_period_start, payroll_period_end);
CREATE INDEX idx_payroll_status ON payroll_setup(status);

CREATE INDEX idx_payslip_payroll ON payslips(payroll_setup_id);
CREATE INDEX idx_payslip_employee ON payslips(employee_id);
CREATE INDEX idx_payslip_number ON payslips(payslip_number);

CREATE INDEX idx_deduction_employee ON deductions(employee_id);
CREATE INDEX idx_deduction_type ON deductions(deduction_type);
CREATE INDEX idx_deduction_active ON deductions(is_active);

CREATE INDEX idx_payroll_report_payroll ON payroll_reports(payroll_setup_id);
CREATE INDEX idx_payroll_report_type ON payroll_reports(report_type);

-- ===========================
-- Library Management System
-- ===========================

-- Book Catalog Table
CREATE TABLE library_books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE,                    -- International Standard Book Number
    title VARCHAR(255) NOT NULL,                -- Book title
    author VARCHAR(255) NOT NULL,               -- Author name(s)
    publisher VARCHAR(200),                     -- Publisher name
    publication_year YEAR,                      -- Year published
    edition VARCHAR(50),                        -- Edition (e.g., '1st', '2nd')
    category VARCHAR(100) NOT NULL,             -- Category/Genre (Fiction, Science, etc.)
    subcategory VARCHAR(100),                   -- Subcategory
    language VARCHAR(50) DEFAULT 'English',     -- Book language
    pages INT,                                  -- Number of pages
    
    -- Inventory details
    quantity_total INT DEFAULT 1,               -- Total copies available
    quantity_available INT DEFAULT 1,           -- Copies currently available
    quantity_borrowed INT DEFAULT 0,            -- Copies currently borrowed
    quantity_reserved INT DEFAULT 0,            -- Copies reserved
    quantity_lost INT DEFAULT 0,                -- Copies reported lost
    quantity_damaged INT DEFAULT 0,             -- Copies reported damaged
    
    -- Location and classification
    shelf_location VARCHAR(100),                -- Physical location (e.g., 'A-101')
    dewey_decimal VARCHAR(20),                  -- Dewey Decimal Classification
    call_number VARCHAR(50),                    -- Library call number
    
    -- Additional info
    description TEXT,                           -- Book description/synopsis
    cover_image_url VARCHAR(255),               -- URL to book cover image
    price DECIMAL(10,2),                        -- Book price
    date_acquired DATE,                         -- Date book was acquired
    
    -- Status and metadata
    status ENUM('Available', 'Limited', 'Unavailable') DEFAULT 'Available',
    is_reference BOOLEAN DEFAULT FALSE,         -- Reference books (non-borrowable)
    borrowable BOOLEAN DEFAULT TRUE,            -- Can be borrowed
    
    created_by INT,                             -- User who added the book
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Book Borrowing Records
CREATE TABLE library_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_id INT NOT NULL,                   -- Student/Faculty user_id
    transaction_type ENUM('Borrow', 'Return', 'Reserve', 'Renew') NOT NULL,
    
    -- Borrowing details
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,                           -- Actual return date (NULL if not returned)
    renewed_count INT DEFAULT 0,                -- Number of times renewed
    
    -- Status
    status ENUM('Active', 'Returned', 'Overdue', 'Lost', 'Damaged') DEFAULT 'Active',
    
    -- Penalties
    overdue_days INT DEFAULT 0,
    penalty_amount DECIMAL(10,2) DEFAULT 0.00,
    penalty_paid BOOLEAN DEFAULT FALSE,
    
    -- Condition tracking
    condition_out ENUM('Excellent', 'Good', 'Fair', 'Poor') DEFAULT 'Good',
    condition_in ENUM('Excellent', 'Good', 'Fair', 'Poor'),
    
    -- Staff handling
    issued_by INT,                              -- Staff who issued the book
    returned_to INT,                            -- Staff who received return
    
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES library_books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (returned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Lost and Damaged Books Log
CREATE TABLE library_incidents (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    transaction_id INT,                         -- Related transaction (if applicable)
    user_id INT,                                -- User responsible (if applicable)
    
    incident_type ENUM('Lost', 'Damaged', 'Missing') NOT NULL,
    incident_date DATE NOT NULL,
    
    -- Damage/Loss details
    severity ENUM('Minor', 'Moderate', 'Severe', 'Total Loss'),
    description TEXT,                           -- Description of incident
    
    -- Financial
    replacement_cost DECIMAL(10,2),
    amount_charged DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_date DATE,
    resolution_notes TEXT,
    
    reported_by INT,                            -- Staff who reported incident
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES library_books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES library_transactions(transaction_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Book Reservations
CREATE TABLE library_reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,

    book_id INT NOT NULL,
    user_id INT NOT NULL,

    reservation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,

    status ENUM('Active', 'Fulfilled', 'Cancelled', 'Expired')
        NOT NULL DEFAULT 'Active',

    notified BOOLEAN NOT NULL DEFAULT FALSE,

    notification_sent_at TIMESTAMP NULL DEFAULT NULL,
    fulfilled_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,

    cancellation_reason TEXT,

    INDEX idx_book_status (book_id, status),
    INDEX idx_user_status (user_id, status),
    INDEX idx_expiry (expiry_date),

    FOREIGN KEY (book_id)
        REFERENCES library_books(book_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- Digital Library Resources
CREATE TABLE digital_library (
    digital_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT,                                -- Link to physical book (optional)
    
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),                      -- PDF, EPUB, etc.
    file_size BIGINT,                           -- File size in bytes
    
    category VARCHAR(100),
    description TEXT,
    cover_image_url VARCHAR(255),
    
    access_level ENUM('Public', 'Students Only', 'Faculty Only', 'Restricted') DEFAULT 'Students Only',
    download_allowed BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES library_books(book_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for Library Tables
CREATE INDEX idx_library_books_category ON library_books(category);
CREATE INDEX idx_library_books_status ON library_books(status);
CREATE INDEX idx_library_books_isbn ON library_books(isbn);
CREATE INDEX idx_library_books_title ON library_books(title);

CREATE INDEX idx_library_transactions_book ON library_transactions(book_id);
CREATE INDEX idx_library_transactions_borrower ON library_transactions(borrower_id);
CREATE INDEX idx_library_transactions_status ON library_transactions(status);
CREATE INDEX idx_library_transactions_due ON library_transactions(due_date);

CREATE INDEX idx_library_incidents_book ON library_incidents(book_id);
CREATE INDEX idx_library_incidents_type ON library_incidents(incident_type);
CREATE INDEX idx_library_incidents_user ON library_incidents(user_id);

CREATE INDEX idx_library_reservations_book ON library_reservations(book_id);
CREATE INDEX idx_library_reservations_user ON library_reservations(user_id);
CREATE INDEX idx_library_reservations_status ON library_reservations(status);

CREATE INDEX idx_digital_library_category ON digital_library(category);
CREATE INDEX idx_digital_library_access ON digital_library(access_level);

-- ===========================
-- Scholarship & Grants Management
-- ===========================

-- Scholarship Types Setup
CREATE TABLE scholarship_types (
    scholarship_type_id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_name VARCHAR(255) NOT NULL,
    scholarship_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Funding Details
    funding_source VARCHAR(255),                -- Government, Private, Institution
    total_budget DECIMAL(15,2) DEFAULT 0.00,
    allocated_budget DECIMAL(15,2) DEFAULT 0.00,
    remaining_budget DECIMAL(15,2) DEFAULT 0.00,
    
    -- Eligibility Criteria
    min_gpa DECIMAL(3,2),                       -- Minimum GPA requirement
    max_family_income DECIMAL(15,2),            -- Maximum family income
    year_level_requirement VARCHAR(100),        -- e.g., "All", "1st Year", "2nd-4th Year"
    course_restriction TEXT,                    -- Specific courses eligible (JSON or CSV)
    
    -- Coverage Details
    tuition_coverage_percentage DECIMAL(5,2),   -- 0-100%
    covers_miscellaneous BOOLEAN DEFAULT FALSE,
    covers_books BOOLEAN DEFAULT FALSE,
    covers_allowance BOOLEAN DEFAULT FALSE,
    monthly_allowance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Application Period
    application_start DATE,
    application_end DATE,
    
    -- Slot Management
    total_slots INT DEFAULT 0,
    slots_filled INT DEFAULT 0,
    slots_available INT DEFAULT 0,
    
    status ENUM('Active', 'Inactive', 'Closed') DEFAULT 'Active',
    renewable BOOLEAN DEFAULT FALSE,            -- Can be renewed each semester/year
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Scholarship Applications
CREATE TABLE scholarship_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_type_id INT NOT NULL,
    student_id INT NOT NULL,
    
    -- Application Details
    application_number VARCHAR(50) UNIQUE NOT NULL,
    application_date DATE NOT NULL,
    academic_year VARCHAR(20),
    semester ENUM('1st Semester', '2nd Semester', 'Summer') NOT NULL,
    
    -- Student Academic Info (snapshot at application time)
    current_gpa DECIMAL(3,2),
    current_year_level VARCHAR(50),
    current_course VARCHAR(100),
    units_enrolled INT,
    
    -- Financial Information
    family_income DECIMAL(15,2),
    number_of_siblings INT,
    working_student BOOLEAN DEFAULT FALSE,
    
    -- Required Documents Status
    grade_sheet_submitted BOOLEAN DEFAULT FALSE,
    income_certificate_submitted BOOLEAN DEFAULT FALSE,
    recommendation_letter_submitted BOOLEAN DEFAULT FALSE,
    essay_submitted BOOLEAN DEFAULT FALSE,
    other_documents TEXT,                       -- JSON or description of other docs
    
    -- Application Status
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Withdrawn') DEFAULT 'Pending',
    priority_score DECIMAL(5,2),                -- Computed score for ranking
    
    -- Review Process
    reviewed_by INT,
    review_date DATETIME,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Approval
    approved_by INT,
    approval_date DATETIME,
    approved_amount DECIMAL(15,2),
    
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (scholarship_type_id) REFERENCES scholarship_types(scholarship_type_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Scholarship Beneficiaries (Approved & Active Scholars)
CREATE TABLE scholarship_beneficiaries (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,         -- Link to approved application
    scholarship_type_id INT NOT NULL,
    student_id INT NOT NULL,
    
    -- Grant Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year VARCHAR(20),
    semester ENUM('1st Semester', '2nd Semester', 'Summer', 'Full Year'),
    
    -- Grant Amount
    total_grant_amount DECIMAL(15,2) NOT NULL,
    tuition_discount DECIMAL(15,2) DEFAULT 0.00,
    allowance_amount DECIMAL(15,2) DEFAULT 0.00,
    other_benefits TEXT,
    
    -- Disbursement Tracking
    total_disbursed DECIMAL(15,2) DEFAULT 0.00,
    disbursement_status ENUM('Pending', 'Partial', 'Completed') DEFAULT 'Pending',
    last_disbursement_date DATE,
    
    -- Performance Monitoring
    required_gpa DECIMAL(3,2),
    current_gpa DECIMAL(3,2),
    gpa_maintained BOOLEAN DEFAULT TRUE,
    
    community_service_hours_required INT DEFAULT 0,
    community_service_hours_completed INT DEFAULT 0,
    service_requirement_met BOOLEAN DEFAULT TRUE,
    
    -- Renewal Status
    renewable BOOLEAN DEFAULT FALSE,
    renewal_application_id INT,
    renewal_status ENUM('Not Applicable', 'Pending', 'Approved', 'Denied'),
    
    -- Status
    status ENUM('Active', 'Completed', 'Revoked', 'Suspended') DEFAULT 'Active',
    revocation_reason TEXT,
    revoked_by INT,
    revoked_date DATETIME,
    
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES scholarship_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (scholarship_type_id) REFERENCES scholarship_types(scholarship_type_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (renewal_application_id) REFERENCES scholarship_applications(application_id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Eligibility Screening Records
CREATE TABLE scholarship_eligibility_screening (
    screening_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    scholarship_type_id INT NOT NULL,
    student_id INT NOT NULL,
    
    screening_date DATE NOT NULL,
    screened_by INT NOT NULL,
    
    -- Academic Criteria Checks
    gpa_requirement_met BOOLEAN DEFAULT FALSE,
    gpa_value DECIMAL(3,2),
    gpa_required DECIMAL(3,2),
    
    year_level_eligible BOOLEAN DEFAULT FALSE,
    year_level_value VARCHAR(50),
    year_level_required VARCHAR(100),
    
    course_eligible BOOLEAN DEFAULT FALSE,
    course_value VARCHAR(100),
    course_required TEXT,
    
    -- Financial Criteria
    income_requirement_met BOOLEAN DEFAULT FALSE,
    family_income DECIMAL(15,2),
    max_income_allowed DECIMAL(15,2),
    
    -- Document Verification
    documents_complete BOOLEAN DEFAULT FALSE,
    documents_checklist TEXT,                   -- JSON of required docs and status
    missing_documents TEXT,
    
    -- Interview/Assessment (if applicable)
    interview_required BOOLEAN DEFAULT FALSE,
    interview_completed BOOLEAN DEFAULT FALSE,
    interview_date DATETIME,
    interview_score DECIMAL(5,2),
    interview_notes TEXT,
    
    -- Final Screening Result
    overall_eligible BOOLEAN DEFAULT FALSE,
    eligibility_score DECIMAL(5,2),             -- Computed eligibility score
    screening_status ENUM('Passed', 'Failed', 'Pending Review', 'Conditional') DEFAULT 'Pending Review',
    
    disqualification_reasons TEXT,
    conditional_requirements TEXT,               -- What needs to be fulfilled for conditional approval
    
    recommendations TEXT,
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES scholarship_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (scholarship_type_id) REFERENCES scholarship_types(scholarship_type_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (screened_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Scholarship Disbursements (Payment Records)
CREATE TABLE scholarship_disbursements (
    disbursement_id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id INT NOT NULL,
    scholarship_type_id INT NOT NULL,
    student_id INT NOT NULL,
    
    disbursement_date DATE NOT NULL,
    disbursement_type ENUM('Tuition Discount', 'Monthly Allowance', 'Book Allowance', 'Other') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    academic_year VARCHAR(20),
    semester ENUM('1st Semester', '2nd Semester', 'Summer'),
    month VARCHAR(20),                          -- For monthly allowances
    
    payment_method ENUM('Direct Payment', 'Bank Transfer', 'Check', 'Tuition Deduction') DEFAULT 'Tuition Deduction',
    reference_number VARCHAR(100),
    
    processed_by INT,
    approved_by INT,
    
    status ENUM('Pending', 'Processed', 'Completed', 'Failed') DEFAULT 'Pending',
    remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (beneficiary_id) REFERENCES scholarship_beneficiaries(beneficiary_id) ON DELETE CASCADE,
    FOREIGN KEY (scholarship_type_id) REFERENCES scholarship_types(scholarship_type_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for Scholarship Tables
CREATE INDEX idx_scholarship_types_status ON scholarship_types(status);
CREATE INDEX idx_scholarship_types_code ON scholarship_types(scholarship_code);

CREATE INDEX idx_scholarship_applications_student ON scholarship_applications(student_id);
CREATE INDEX idx_scholarship_applications_type ON scholarship_applications(scholarship_type_id);
CREATE INDEX idx_scholarship_applications_status ON scholarship_applications(status);
CREATE INDEX idx_scholarship_applications_date ON scholarship_applications(application_date);

CREATE INDEX idx_scholarship_beneficiaries_student ON scholarship_beneficiaries(student_id);
CREATE INDEX idx_scholarship_beneficiaries_type ON scholarship_beneficiaries(scholarship_type_id);
CREATE INDEX idx_scholarship_beneficiaries_status ON scholarship_beneficiaries(status);
CREATE INDEX idx_scholarship_beneficiaries_year ON scholarship_beneficiaries(academic_year);

CREATE INDEX idx_scholarship_screening_application ON scholarship_eligibility_screening(application_id);
CREATE INDEX idx_scholarship_screening_student ON scholarship_eligibility_screening(student_id);
CREATE INDEX idx_scholarship_screening_status ON scholarship_eligibility_screening(screening_status);

CREATE INDEX idx_scholarship_disbursements_beneficiary ON scholarship_disbursements(beneficiary_id);
CREATE INDEX idx_scholarship_disbursements_student ON scholarship_disbursements(student_id);
CREATE INDEX idx_scholarship_disbursements_date ON scholarship_disbursements(disbursement_date);

-- ===========================
-- EVENTS & COMMUNICATION MANAGEMENT TABLES
-- ===========================

-- Announcement Center Table
CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type ENUM('General', 'Academic', 'Administrative', 'Emergency', 'Event', 'Holiday') DEFAULT 'General',
    priority ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
    
    -- Targeting
    target_audience ENUM('All', 'Students', 'Faculty', 'Staff', 'Parents', 'Custom') DEFAULT 'All',
    target_year_levels TEXT, -- JSON array: ["1st Year", "2nd Year"]
    target_courses TEXT, -- JSON array: ["BSIT", "BSCS"]
    target_departments TEXT, -- JSON array
    
    -- Media attachments
    attachment_url VARCHAR(255),
    attachment_type VARCHAR(50), -- 'image', 'pdf', 'document'
    
    -- Scheduling
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Status & visibility
    status ENUM('Draft', 'Published', 'Archived', 'Scheduled') DEFAULT 'Draft',
    views_count INT DEFAULT 0,
    
    -- Audit
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Event Scheduling Table
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_code VARCHAR(50) UNIQUE,
    description TEXT,
    event_type ENUM('Academic', 'Sports', 'Cultural', 'Seminar', 'Workshop', 'Competition', 'Meeting', 'Other') DEFAULT 'Academic',
    event_category ENUM('Internal', 'Public', 'External', 'Hybrid') DEFAULT 'Internal',
    
    -- Date & Time
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    registration_start DATETIME,
    registration_end DATETIME,
    duration_hours DECIMAL(5,2),
    
    -- Location
    venue VARCHAR(255),
    venue_type ENUM('On-Campus', 'Off-Campus', 'Online', 'Hybrid') DEFAULT 'On-Campus',
    room_number VARCHAR(50),
    building VARCHAR(100),
    online_meeting_link VARCHAR(255),
    
    -- Capacity & Registration
    max_participants INT,
    registered_count INT DEFAULT 0,
    checked_in_count INT DEFAULT 0,
    requires_registration BOOLEAN DEFAULT FALSE,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Organizer & Contact
    organizer VARCHAR(200),
    organizer_contact VARCHAR(100),
    organizer_email VARCHAR(255),
    department_id INT,
    
    -- Additional details
    event_poster_url VARCHAR(255),
    event_materials_url VARCHAR(255),
    special_instructions TEXT,
    
    -- Status & Approval
    status ENUM('Draft', 'Pending Approval', 'Approved', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Draft',
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    approval_date DATETIME,
    rejection_reason TEXT,
    
    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- School Calendar Table
CREATE TABLE school_calendar (
    calendar_id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    calendar_type ENUM('Academic', 'Holiday', 'Exam', 'Break', 'Enrollment', 'Event', 'Deadline', 'Meeting') DEFAULT 'Academic',
    
    -- Date & Time
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_all_day BOOLEAN DEFAULT TRUE,
    start_time TIME,
    end_time TIME,
    
    -- Academic context
    academic_year VARCHAR(20), -- e.g., "2023-2024"
    semester ENUM('1st Semester', '2nd Semester', 'Summer', 'All') DEFAULT 'All',
    
    -- Visual styling
    color_code VARCHAR(7), -- Hex color code for calendar display
    icon VARCHAR(50), -- Icon identifier for UI
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern ENUM('Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'),
    recurrence_end_date DATE,
    
    -- Reminders & Notifications
    send_reminder BOOLEAN DEFAULT FALSE,
    reminder_days_before INT DEFAULT 1,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Status & Visibility
    status ENUM('Active', 'Cancelled', 'Rescheduled', 'Completed') DEFAULT 'Active',
    visibility ENUM('Public', 'Students Only', 'Faculty Only', 'Staff Only', 'Admin Only') DEFAULT 'Public',
    is_highlighted BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Public Event Posting Table
CREATE TABLE public_events (
    public_event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_slug VARCHAR(255) UNIQUE, -- URL-friendly identifier
    short_description VARCHAR(500),
    full_description TEXT,
    event_category ENUM('Admission', 'Open House', 'Scholarship', 'Competition', 'Workshop', 'Seminar', 'Community Outreach', 'Other') DEFAULT 'Other',
    
    -- Date & Time
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    
    -- Location
    venue VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    map_coordinates VARCHAR(100), -- Latitude,Longitude for maps
    
    -- Media
    featured_image_url VARCHAR(255),
    gallery_images TEXT, -- JSON array of image URLs
    video_url VARCHAR(255),
    promotional_materials_url VARCHAR(255),
    
    -- Registration & Contact
    requires_registration BOOLEAN DEFAULT FALSE,
    registration_link VARCHAR(255),
    max_attendees INT,
    registered_count INT DEFAULT 0,
    contact_person VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- SEO & Social Media
    meta_keywords TEXT,
    meta_description VARCHAR(500),
    social_media_links TEXT, -- JSON object with platform links
    hashtags VARCHAR(255),
    
    -- Publishing
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    -- Analytics
    views_count INT DEFAULT 0,
    registrations_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    
    -- Status
    status ENUM('Draft', 'Published', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Draft',
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT,
    approval_date DATETIME,
    
    -- Audit
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Event Registrations Table (for both events and public_events)
CREATE TABLE event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT, -- Links to events table
    public_event_id INT, -- Links to public_events table
    
    -- Registrant Info
    user_id INT, -- If registered user
    external_name VARCHAR(200), -- For non-users
    external_email VARCHAR(255),
    external_phone VARCHAR(50),
    external_organization VARCHAR(200),
    
    -- Registration details
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    registration_number VARCHAR(50) UNIQUE,
    payment_status ENUM('Free', 'Pending', 'Paid', 'Refunded') DEFAULT 'Free',
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_reference VARCHAR(100),
    
    -- Attendance
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time DATETIME,
    attendance_status ENUM('Registered', 'Attended', 'No Show', 'Cancelled') DEFAULT 'Registered',
    
    -- Additional info
    special_requirements TEXT,
    remarks TEXT,
    
    status ENUM('Active', 'Cancelled', 'Waitlist') DEFAULT 'Active',
    cancellation_reason TEXT,
    
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (public_event_id) REFERENCES public_events(public_event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for Events & Communication Tables
CREATE INDEX idx_announcements_type ON announcements(announcement_type);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX idx_announcements_target ON announcements(target_audience);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_events_code ON events(event_code);

CREATE INDEX idx_calendar_type ON school_calendar(calendar_type);
CREATE INDEX idx_calendar_start_date ON school_calendar(start_date);
CREATE INDEX idx_calendar_academic_year ON school_calendar(academic_year);
CREATE INDEX idx_calendar_semester ON school_calendar(semester);

CREATE INDEX idx_public_events_status ON public_events(status);
CREATE INDEX idx_public_events_category ON public_events(event_category);
CREATE INDEX idx_public_events_date ON public_events(event_date);
CREATE INDEX idx_public_events_slug ON public_events(event_slug);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_public_event ON event_registrations(public_event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_registrations_status ON event_registrations(attendance_status);

-- ===========================
-- Inventory Management Tables
-- ===========================

-- Ensure referenced parent table supports foreign keys.
ALTER TABLE users ENGINE=InnoDB;

-- Main Assets/Inventory tracking
CREATE TABLE inventory_assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,  -- Unique asset code (e.g., AST-2024-001)
    asset_name VARCHAR(255) NOT NULL,
    asset_type ENUM('equipment', 'furniture', 'electronics', 'vehicle', 'building', 'land', 'other') NOT NULL DEFAULT 'equipment',
    category VARCHAR(100),  -- Sub-category (e.g., IT Equipment, Office Furniture)
    description TEXT,
    
    -- Identification & Purchase Info
    serial_number VARCHAR(100),
    model_number VARCHAR(100),
    manufacturer VARCHAR(200),
    supplier VARCHAR(200),
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    purchase_order_number VARCHAR(100),
    invoice_number VARCHAR(100),
    
    -- Warranty Information
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_provider VARCHAR(200),
    warranty_terms TEXT,
    
    -- Financial & Depreciation
    current_value DECIMAL(12, 2),
    salvage_value DECIMAL(12, 2) DEFAULT 0.00,
    depreciation_method ENUM('straight_line', 'declining_balance', 'none') DEFAULT 'straight_line',
    useful_life_years INT DEFAULT 5,
    depreciation_rate DECIMAL(5, 2),  -- Annual depreciation rate
    last_depreciation_date DATE,
    
    -- Location & Assignment
    location VARCHAR(255),
    building VARCHAR(100),
    floor VARCHAR(50),
    room VARCHAR(100),
    department VARCHAR(100),
    assigned_to VARCHAR(255),  -- Person currently using the asset
    custodian VARCHAR(255),  -- Person responsible for the asset
    
    -- Status & Condition
    status ENUM('available', 'in_use', 'maintenance', 'repair', 'reserved', 'disposed', 'lost', 'stolen') NOT NULL DEFAULT 'available',
    `condition` ENUM('excellent', 'good', 'fair', 'poor', 'non_functional') NOT NULL DEFAULT 'good',
    condition_notes TEXT,
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INT,  -- How often maintenance is required
    maintenance_cost_total DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Additional Information
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    rfid_tag VARCHAR(100),
    image_url VARCHAR(500),
    document_url VARCHAR(500),
    specifications JSON,  -- Store technical specs as JSON
    notes TEXT,
    
    -- Disposal Information
    disposal_date DATE,
    disposal_method VARCHAR(100),
    disposal_reason TEXT,
    disposal_value DECIMAL(10, 2),
    
    -- Audit Trail
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_asset_code (asset_code),
    INDEX idx_asset_type (asset_type),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_department (department),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_inventory_assets_created_by (created_by),
    INDEX idx_inventory_assets_updated_by (updated_by),
    INDEX idx_warranty_end (warranty_end_date),
    INDEX idx_next_maintenance (next_maintenance_date),
    CONSTRAINT fk_inventory_assets_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_assets_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset Categories (for dropdown/organization)
CREATE TABLE inventory_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_type ENUM('equipment', 'furniture', 'electronics', 'vehicle', 'building', 'land', 'other'),
    description TEXT,
    parent_category_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES inventory_categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,

    asset_id INT NOT NULL,

    transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- From Location
    from_location VARCHAR(255),
    from_building VARCHAR(100),
    from_department VARCHAR(100),
    from_assigned_to VARCHAR(255),
    from_custodian VARCHAR(255),

    -- To Location
    to_location VARCHAR(255),
    to_building VARCHAR(100),
    to_department VARCHAR(100),
    to_assigned_to VARCHAR(255),
    to_custodian VARCHAR(255),

    -- Transfer Details
    transfer_type ENUM('relocation', 'reassignment', 'temporary', 'permanent')
        DEFAULT 'permanent',

    reason TEXT,
    expected_return_date DATE,
    actual_return_date DATE,

    transfer_condition ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
    transfer_notes TEXT,

    -- Approval
    requested_by INT NULL,
    approved_by  INT NULL,

    approval_status ENUM('pending', 'approved', 'rejected')
        DEFAULT 'pending',

    approval_date DATETIME,
    approval_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_asset (asset_id),
    INDEX idx_transfer_date (transfer_date),
    INDEX idx_status (approval_status),

    CONSTRAINT fk_transfer_asset
        FOREIGN KEY (asset_id)
        REFERENCES inventory_assets(asset_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_transfer_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- Asset Maintenance Records
CREATE TABLE inventory_maintenance (
    maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    maintenance_type ENUM('preventive', 'corrective', 'inspection', 'calibration', 'cleaning', 'repair', 'other') NOT NULL,
    maintenance_date DATE NOT NULL,
    scheduled_date DATE,
    
    -- Maintenance Details
    description TEXT NOT NULL,
    problem_reported TEXT,
    action_taken TEXT,
    parts_replaced TEXT,
    maintenance_cost DECIMAL(10, 2) DEFAULT 0.00,
    labor_cost DECIMAL(10, 2) DEFAULT 0.00,
    parts_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_cost DECIMAL(10, 2) AS (maintenance_cost + labor_cost + parts_cost) STORED,
    
    -- Service Provider
    performed_by VARCHAR(200),
    service_provider VARCHAR(200),
    technician_name VARCHAR(200),
    contact_number VARCHAR(50),
    
    -- Status
    maintenance_status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    downtime_hours DECIMAL(6, 2),  -- How long asset was unavailable
    
    -- Next Maintenance
    next_maintenance_date DATE,
    
    -- Documentation
    invoice_number VARCHAR(100),
    receipt_url VARCHAR(500),
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500),
    notes TEXT,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES inventory_assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_maintenance_date (maintenance_date),
    INDEX idx_status (maintenance_status),
    INDEX idx_next_maintenance (next_maintenance_date)
) ;

-- Asset Depreciation History
CREATE TABLE inventory_depreciation (
    depreciation_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    depreciation_date DATE NOT NULL,
    depreciation_period VARCHAR(50),  -- e.g., "2024-Q1", "January 2024"
    
    -- Values
    opening_value DECIMAL(12, 2) NOT NULL,
    depreciation_amount DECIMAL(12, 2) NOT NULL,
    closing_value DECIMAL(12, 2) NOT NULL,
    accumulated_depreciation DECIMAL(12, 2),
    
    -- Calculation Details
    depreciation_method ENUM('straight_line', 'declining_balance', 'manual'),
    calculation_basis TEXT,
    
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES inventory_assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_date (depreciation_date)
) ;

-- Asset Audit/Inspection Records
CREATE TABLE inventory_audits (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    audit_date DATE NOT NULL,
    audit_type ENUM('annual', 'quarterly', 'random', 'investigation') DEFAULT 'annual',
    auditor_name VARCHAR(200),
    department VARCHAR(100),
    location VARCHAR(255),
    
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    completion_date DATE,
    
    total_assets_expected INT DEFAULT 0,
    total_assets_found INT DEFAULT 0,
    total_assets_missing INT DEFAULT 0,
    total_assets_damaged INT DEFAULT 0,
    
    findings TEXT,
    recommendations TEXT,
    report_url VARCHAR(500),
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_date (audit_date),
    INDEX idx_status (status)
) ;

-- Asset Audit Details (individual asset checks)
CREATE TABLE inventory_audit_items (
    audit_item_id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL,
    asset_id INT NOT NULL,
    
    expected_location VARCHAR(255),
    actual_location VARCHAR(255),
    expected_condition ENUM('excellent', 'good', 'fair', 'poor'),
    actual_condition ENUM('excellent', 'good', 'fair', 'poor', 'missing', 'damaged'),
    
    verification_status ENUM('verified', 'discrepancy', 'missing', 'unaccounted') DEFAULT 'verified',
    discrepancy_notes TEXT,
    action_required TEXT,
    
    verified_by VARCHAR(200),
    verification_date DATETIME,
    
    FOREIGN KEY (audit_id) REFERENCES inventory_audits(audit_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES inventory_assets(asset_id) ON DELETE CASCADE,
    INDEX idx_audit (audit_id),
    INDEX idx_asset (asset_id)
) ;

-- Asset Disposal Records
CREATE TABLE inventory_disposals (
    disposal_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    disposal_date DATE NOT NULL,
    disposal_method ENUM('sale', 'donation', 'scrap', 'trade_in', 'write_off', 'auction', 'other') NOT NULL,
    
    -- Financial Details
    book_value DECIMAL(12, 2),  -- Value at time of disposal
    disposal_value DECIMAL(12, 2),  -- Amount received
    disposal_cost DECIMAL(10, 2),  -- Cost to dispose
    gain_loss DECIMAL(12, 2) AS (disposal_value - book_value) STORED,
    
    -- Disposal Details
    reason TEXT NOT NULL,
    buyer_recipient VARCHAR(200),
    authorization_number VARCHAR(100),
    authorized_by VARCHAR(200),
    
    -- Documentation
    disposal_certificate_url VARCHAR(500),
    receipt_url VARCHAR(500),
    approval_document_url VARCHAR(500),
    
    notes TEXT,
    disposal_status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    
    created_by INT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES inventory_assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_disposal_date (disposal_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset Requests/Requisitions
CREATE TABLE inventory_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    request_type ENUM('new_asset', 'transfer', 'maintenance', 'disposal', 'temporary_use') NOT NULL,
    
    -- For new asset requests
    requested_asset_type VARCHAR(100),
    requested_item_name VARCHAR(255),
    quantity INT DEFAULT 1,
    estimated_cost DECIMAL(10, 2),
    justification TEXT,
    
    -- For existing asset requests
    asset_id INT,
    
    -- Request Details
    requested_by INT NOT NULL,
    department VARCHAR(100),
    purpose TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    required_date DATE,
    
    -- Approval Workflow
    status ENUM('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    reviewed_by INT,
    review_date DATETIME,
    review_notes TEXT,
    approved_by INT,
    approval_date DATETIME,
    approval_notes TEXT,
    
    completion_date DATETIME,
    completion_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES inventory_assets(asset_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_request_date (request_date),
    INDEX idx_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Reports & Analytics System
-- ===========================

-- Report Templates
CREATE TABLE report_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_type ENUM('student', 'enrollment', 'attendance', 'payroll', 'financial', 'academic', 'custom') NOT NULL,
    description TEXT,
    query_template TEXT,
    parameters JSON,
    default_filters JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_template_type (template_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved Reports
CREATE TABLE saved_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    report_type ENUM('student', 'enrollment', 'attendance', 'payroll', 'financial', 'academic', 'custom') NOT NULL,
    template_id INT,
    generated_by INT,
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    parameters JSON,
    filters_applied JSON,
    
    file_path VARCHAR(255),
    file_format ENUM('pdf', 'csv', 'excel', 'json') DEFAULT 'pdf',
    file_size INT,
    
    data_snapshot JSON,
    
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    error_message TEXT,
    
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    
    access_level ENUM('private', 'department', 'public') DEFAULT 'private',
    
    FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_report_type (report_type),
    INDEX idx_generated_by (generated_by),
    INDEX idx_generated_date (generated_date),
    INDEX idx_status (status),
    INDEX idx_access_level (access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Schedules
CREATE TABLE report_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    template_id INT,
    
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    schedule_time TIME,
    schedule_day INT,
    schedule_month INT,
    
    parameters JSON,
    filters JSON,
    
    recipients JSON,
    
    file_format ENUM('pdf', 'csv', 'excel', 'json') DEFAULT 'pdf',
    delivery_method ENUM('email', 'storage', 'both') DEFAULT 'both',
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    last_run_date DATETIME,
    next_run_date DATETIME,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_frequency (frequency),
    INDEX idx_is_active (is_active),
    INDEX idx_next_run_date (next_run_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Exports Log
CREATE TABLE report_exports (
    export_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT,
    
    export_type ENUM('student', 'enrollment', 'attendance', 'payroll', 'financial', 'academic', 'custom') NOT NULL,
    export_format ENUM('pdf', 'csv', 'excel', 'json') NOT NULL,
    
    exported_by INT,
    export_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    record_count INT,
    file_size INT,
    file_path VARCHAR(255),
    
    filters_applied JSON,
    
    FOREIGN KEY (report_id) REFERENCES saved_reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (exported_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_export_type (export_type),
    INDEX idx_exported_by (exported_by),
    INDEX idx_export_date (export_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Analytics Metrics
CREATE TABLE report_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('student', 'enrollment', 'attendance', 'payroll', 'financial', 'academic', 'custom') NOT NULL,
    
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 2),
    metric_data JSON,
    
    academic_period_id INT,
    department VARCHAR(100),
    
    calculated_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_report_type (report_type),
    INDEX idx_metric_name (metric_name),
    INDEX idx_calculated_date (calculated_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SYSTEM SETTINGS MODULE
-- ===========================

-- System Settings Table
-- Stores key-value configuration settings for the system
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communication Gateways Table
-- Stores configuration for email and SMS gateways
CREATE TABLE IF NOT EXISTS communication_gateways (
    gateway_id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(100) NOT NULL,
    gateway_type ENUM('email', 'sms') NOT NULL,
    provider VARCHAR(100) NOT NULL,
    
    -- Gateway Configuration (stored as JSON)
    configuration JSON NOT NULL,
    
    -- Status and Authentication
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Rate Limiting
    daily_limit INT,
    monthly_limit INT,
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    
    INDEX idx_gateway_type (gateway_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Logs Table
-- Stores all system activity, errors, and audit trails
CREATE TABLE IF NOT EXISTS system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_type ENUM('info', 'warning', 'error', 'security', 'audit', 'database', 'api', 'user_activity') NOT NULL,
    
    -- Log Details
    message TEXT NOT NULL,
    details JSON,
    
    -- User and Request Info
    user_id INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Module/Feature Context
    module VARCHAR(100),
    action VARCHAR(100),
    
    -- Error Information
    error_code VARCHAR(50),
    stack_trace TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_log_type (log_type),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_module (module),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



ALTER TABLE enrollments 
ADD COLUMN year_level VARCHAR(20) AFTER period_id;

-- Optional: Add comment to the column
ALTER TABLE enrollments 
MODIFY COLUMN year_level VARCHAR(20) COMMENT 'Student year level: 1st Year, 2nd Year, 3rd Year, 4th Year';
-- Migration: Add section_id to enrollments table
ALTER TABLE enrollments ADD COLUMN section_id INT NULL AFTER enrollment_id;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;


UPDATE syllabus
SET uploaded_by = NULL
WHERE uploaded_by IS NOT NULL
  AND uploaded_by NOT IN (SELECT user_id FROM users);

-- ===========================
-- LEARNING MANAGEMENT SYSTEM (LMS) MODULE
-- ===========================

-- Table: lms_materials
-- Stores learning materials uploaded by faculty
CREATE TABLE IF NOT EXISTS lms_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    section_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type ENUM('document', 'video', 'link', 'image', 'audio') DEFAULT 'document',
    file_url TEXT,
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    academic_period_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_lms_materials_faculty (faculty_id),
    INDEX idx_lms_materials_section (section_id),
    INDEX idx_lms_materials_academic_period (academic_period_id)
);

-- Table: lms_material_views
-- Tracks which students viewed which materials
CREATE TABLE IF NOT EXISTS lms_material_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    student_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES lms_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_material_view (material_id, student_id),
    INDEX idx_lms_material_views_material (material_id),
    INDEX idx_lms_material_views_student (student_id)
);

-- Table: lms_assignments
-- Stores assignments and quizzes created by faculty
CREATE TABLE IF NOT EXISTS lms_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    section_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type ENUM('assignment', 'quiz', 'exam') DEFAULT 'assignment',
    total_points INT NOT NULL DEFAULT 100,
    due_date DATETIME NOT NULL,
    academic_period_id INT NOT NULL,
    allow_late_submission TINYINT(1) DEFAULT 0,
    instructions TEXT,
    status ENUM('active', 'closed', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_lms_assignments_faculty (faculty_id),
    INDEX idx_lms_assignments_section (section_id),
    INDEX idx_lms_assignments_due_date (due_date),
    INDEX idx_lms_assignments_academic_period (academic_period_id)
);

-- Table: lms_assignment_submissions
-- Stores student submissions for assignments
CREATE TABLE IF NOT EXISTS lms_assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(5,2),
    feedback TEXT,
    graded_by INT,
    graded_at TIMESTAMP NULL,
    status ENUM('submitted', 'graded', 'late') DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES lms_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_assignment_submission (assignment_id, student_id),
    INDEX idx_lms_submissions_assignment (assignment_id),
    INDEX idx_lms_submissions_student (student_id),
    INDEX idx_lms_submissions_status (status)
);

-- Table: lms_quiz_questions
-- Stores quiz questions for quiz-type assignments
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') DEFAULT 'multiple_choice',
    options JSON,
    correct_answer TEXT,
    points INT DEFAULT 1,
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES lms_assignments(id) ON DELETE CASCADE,
    INDEX idx_lms_quiz_assignment (assignment_id),
    INDEX idx_lms_quiz_order (order_num)
);

-- Table: lms_discussions
-- Stores discussion threads created by faculty
CREATE TABLE IF NOT EXISTS lms_discussions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    section_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    academic_period_id INT NOT NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    status ENUM('active', 'closed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_lms_discussions_faculty (faculty_id),
    INDEX idx_lms_discussions_section (section_id),
    INDEX idx_lms_discussions_pinned (is_pinned),
    INDEX idx_lms_discussions_academic_period (academic_period_id)
);

-- Table: lms_discussion_replies
-- Stores replies to discussion threads
CREATE TABLE IF NOT EXISTS lms_discussion_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discussion_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_reply_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (discussion_id) REFERENCES lms_discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_reply_id) REFERENCES lms_discussion_replies(id) ON DELETE CASCADE,
    INDEX idx_lms_replies_discussion (discussion_id),
    INDEX idx_lms_replies_user (user_id),
    INDEX idx_lms_replies_parent (parent_reply_id)
);

-- Table: lms_discussion_likes
-- Tracks likes on discussion threads
CREATE TABLE IF NOT EXISTS lms_discussion_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discussion_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES lms_discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_discussion_like (discussion_id, user_id),
    INDEX idx_lms_likes_discussion (discussion_id),
    INDEX idx_lms_likes_user (user_id)
);
/* Ito ay add niyo sa database */

ALTER TABLE scholarship_applications
    ADD COLUMN scholarship_id INT AFTER scholarship_type_id,
    ADD COLUMN academic_period_id INT AFTER semester;

ALTER TABLE scholarship_beneficiaries
    ADD COLUMN scholarship_id INT AFTER scholarship_type_id,
    ADD COLUMN academic_period_id INT AFTER semester;

ALTER TABLE scholarship_eligibility_screening
    ADD COLUMN scholarship_id INT AFTER application_id;

ALTER TABLE scholarship_eligibility_screening
    ADD COLUMN academic_period_id INT AFTER student_id;

  CREATE TABLE IF NOT EXISTS announcement_reads (
                read_id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_read (announcement_id, user_id),
                FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE);

                 CREATE TABLE IF NOT EXISTS student_feedback (
                feedback_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(50) NOT NULL,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                message TEXT NOT NULL,
                response TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
/* add niyo uli ito  */
-- Migration: Add HR and Accounting roles to role_permissions ENUM
-- Run this against your database to support HR and Accounting in RBAC.

-- Step 1: Expand the ENUM on role_permissions to include HR and Accounting
ALTER TABLE role_permissions
  MODIFY COLUMN role ENUM('Student', 'Admin', 'Faculty', 'Staff', 'HR', 'Accounting') NOT NULL;

-- Step 2: Seed default (denied) rows for HR and Accounting for every existing permission
INSERT IGNORE INTO role_permissions (role, permission_id, is_allowed)
SELECT 'HR', permission_id, FALSE FROM rbac_permissions;

INSERT IGNORE INTO role_permissions (role, permission_id, is_allowed)
SELECT 'Accounting', permission_id, FALSE FROM rbac_permissions;


ALTER TABLE student_details
  ADD COLUMN student_type VARCHAR(50) NULL AFTER student_number;

ALTER TABLE student_details
  ADD COLUMN academic_year VARCHAR(20) NULL AFTER parent_phone,
  ADD COLUMN semester VARCHAR(50) NULL AFTER academic_year,
  ADD COLUMN civil_status ENUM('Single','Married','Widowed','Separated','Others') NULL AFTER semester,
  ADD COLUMN religion VARCHAR(100) NULL AFTER civil_status,
  ADD COLUMN is_pwd ENUM('Yes','No') NULL AFTER religion,
  ADD COLUMN indigenous_people ENUM('Yes','No') NULL AFTER is_pwd,
  ADD COLUMN zip_code VARCHAR(20) NULL AFTER indigenous_people,
  ADD COLUMN date_registered DATE NULL AFTER zip_code,
  ADD COLUMN permanent_sitio VARCHAR(150) NULL AFTER date_registered,
  ADD COLUMN permanent_barangay VARCHAR(150) NULL AFTER permanent_sitio,
  ADD COLUMN permanent_city_municipality VARCHAR(150) NULL AFTER permanent_barangay,
  ADD COLUMN permanent_province VARCHAR(150) NULL AFTER permanent_city_municipality,
  ADD COLUMN present_sitio VARCHAR(150) NULL AFTER permanent_province,
  ADD COLUMN present_barangay VARCHAR(150) NULL AFTER present_sitio,
  ADD COLUMN present_city_municipality VARCHAR(150) NULL AFTER present_barangay,
  ADD COLUMN present_province VARCHAR(150) NULL AFTER present_city_municipality,
  ADD COLUMN birth_place VARCHAR(255) NULL AFTER present_province,
  ADD COLUMN citizenship VARCHAR(100) NULL AFTER birth_place,
  ADD COLUMN father_status ENUM('Living','Deceased') NULL AFTER citizenship,
  ADD COLUMN father_residence_street VARCHAR(150) NULL AFTER father_status,
  ADD COLUMN father_residence_barangay VARCHAR(150) NULL AFTER father_residence_street,
  ADD COLUMN father_residence_city VARCHAR(150) NULL AFTER father_residence_barangay,
  ADD COLUMN father_residence_province VARCHAR(150) NULL AFTER father_residence_city,
  ADD COLUMN father_residence_zip_code VARCHAR(20) NULL AFTER father_residence_province,
  ADD COLUMN father_occupation VARCHAR(150) NULL AFTER father_residence_zip_code,
  ADD COLUMN father_phone VARCHAR(50) NULL AFTER father_occupation,
  ADD COLUMN mother_status ENUM('Living','Deceased') NULL AFTER father_phone,
  ADD COLUMN mother_residence_street VARCHAR(150) NULL AFTER mother_status,
  ADD COLUMN mother_residence_barangay VARCHAR(150) NULL AFTER mother_residence_street,
  ADD COLUMN mother_residence_city VARCHAR(150) NULL AFTER mother_residence_barangay,
  ADD COLUMN mother_residence_province VARCHAR(150) NULL AFTER mother_residence_city,
  ADD COLUMN mother_residence_zip_code VARCHAR(20) NULL AFTER mother_residence_province,
  ADD COLUMN mother_occupation VARCHAR(150) NULL AFTER mother_residence_zip_code,
  ADD COLUMN mother_phone VARCHAR(50) NULL AFTER mother_occupation,
  ADD COLUMN guardian_name VARCHAR(200) NULL AFTER mother_phone,
  ADD COLUMN guardian_relationship VARCHAR(100) NULL AFTER guardian_name,
  ADD COLUMN guardian_residence_street VARCHAR(150) NULL AFTER guardian_relationship,
  ADD COLUMN guardian_residence_barangay VARCHAR(150) NULL AFTER guardian_residence_street,
  ADD COLUMN guardian_residence_city VARCHAR(150) NULL AFTER guardian_residence_barangay,
  ADD COLUMN guardian_residence_province VARCHAR(150) NULL AFTER guardian_residence_city,
  ADD COLUMN guardian_residence_zip_code VARCHAR(20) NULL AFTER guardian_residence_province,
  ADD COLUMN guardian_occupation VARCHAR(150) NULL AFTER guardian_residence_zip_code,
  ADD COLUMN guardian_phone VARCHAR(50) NULL AFTER guardian_occupation,
  ADD COLUMN other_financial_assistance ENUM('Yes','No') NULL AFTER guardian_phone,
  ADD COLUMN scholarship_assistance_1 VARCHAR(255) NULL AFTER other_financial_assistance,
  ADD COLUMN scholarship_assistance_2 VARCHAR(255) NULL AFTER scholarship_assistance_1,
  ADD COLUMN scholarship_assistance_3 VARCHAR(255) NULL AFTER scholarship_assistance_2;


  ALTER TABLE lms_assignments
ADD COLUMN model_answer LONGTEXT NULL,
ADD COLUMN model_answer_file_url VARCHAR(500) NULL,
ADD COLUMN model_answer_uploaded_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE student_invoices
ADD admission_fee DECIMAL(10,2) DEFAULT 0,
ADD entrance_fee DECIMAL(10,2) DEFAULT 0,
ADD guidance_fee DECIMAL(10,2) DEFAULT 0,
ADD handbook_fee DECIMAL(10,2) DEFAULT 0,
ADD medical_dental_fee DECIMAL(10,2) DEFAULT 0,
ADD computer_fee DECIMAL(10,2) DEFAULT 0,
ADD cultural_fee DECIMAL(10,2) DEFAULT 0,
ADD development_fee DECIMAL(10,2) DEFAULT 0,
ADD nstp_fee DECIMAL(10,2) DEFAULT 0;


-- 1. Add the program_id column to the sections table
ALTER TABLE sections 
ADD COLUMN program_id INT NULL AFTER period_id;

-- 2. Add the foreign key relationship to the programs table
ALTER TABLE sections 
ADD CONSTRAINT fk_sections_program 
FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL;

-- ===========================
-- Rooms Management Table
-- ===========================
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

ALTER TABLE exam_schedules 
ADD CONSTRAINT fk_exam_schedules_room 
FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE SET NULL;

-- ===========================
-- Grade Entries Label & Lock Columns
-- ===========================
ALTER TABLE grade_entries 
ADD COLUMN label ENUM('midterm', 'tentative_final', 'final') NOT NULL DEFAULT 'midterm' AFTER period_id,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE AFTER label;

-- ===========================
-- Weighted Grading & Final Score Support
-- ===========================
ALTER TABLE grades 
ADD COLUMN letter_grade VARCHAR(2) NULL,
ADD COLUMN final_score DECIMAL(5,2) NULL,
ADD COLUMN weighted_output_score DECIMAL(10,2) NULL,
ADD COLUMN weighted_performance_score DECIMAL(10,2) NULL,
ADD COLUMN midterm_exam_score DECIMAL(5,2) NULL,
ADD COLUMN components_json JSON NULL COMMENT 'Stores detailed scores for Written Output and Performance Tasks';

-- ===========================
-- Payslips User Link
-- ===========================
ALTER TABLE payslips 
ADD COLUMN user_id INT NULL AFTER employee_id;

ALTER TABLE payslips 
ADD CONSTRAINT fk_payslips_user 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

