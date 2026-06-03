-- Migration: course_content table (MySQL)
-- Para almacenar contenido de cursos (videos, lecciones)

CREATE TABLE IF NOT EXISTS course_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) DEFAULT 'video',
    video_url TEXT NOT NULL,
    preview_url TEXT,
    duration VARCHAR(20),
    order_index INT DEFAULT 0,
    is_active INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_content_course (course_id),
    INDEX idx_course_content_order (course_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
