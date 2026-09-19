-- LMS Tables Migration Script
-- This script creates all necessary tables for the Learning Management System

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
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_faculty (faculty_id),
    INDEX idx_section (section_id),
    INDEX idx_academic_period (academic_period_id)
);

-- Table: lms_material_views
-- Tracks which students viewed which materials
CREATE TABLE IF NOT EXISTS lms_material_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    student_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES lms_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_view (material_id, student_id),
    INDEX idx_material (material_id),
    INDEX idx_student (student_id)
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
    model_answer_file_url TEXT NOT NULL,
    status ENUM('active', 'closed', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_faculty (faculty_id),
    INDEX idx_section (section_id),
    INDEX idx_due_date (due_date),
    INDEX idx_academic_period (academic_period_id)
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
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
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
    INDEX idx_assignment (assignment_id),
    INDEX idx_order (order_num)
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
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_faculty (faculty_id),
    INDEX idx_section (section_id),
    INDEX idx_pinned (is_pinned),
    INDEX idx_academic_period (academic_period_id)
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_reply_id) REFERENCES lms_discussion_replies(id) ON DELETE CASCADE,
    INDEX idx_discussion (discussion_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_reply_id)
);

-- Table: lms_discussion_likes
-- Tracks likes on discussion threads
CREATE TABLE IF NOT EXISTS lms_discussion_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discussion_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES lms_discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (discussion_id, user_id),
    INDEX idx_discussion (discussion_id),
    INDEX idx_user (user_id)
);
