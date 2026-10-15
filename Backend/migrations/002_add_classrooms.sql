
USE student_attendance_system;

-- =========================================
-- APPROVED CLASSROOM LOCATIONS
-- =========================================

CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,

    building_name VARCHAR(100) NOT NULL,
    room_name VARCHAR(100) NOT NULL,

    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,

    allowed_radius INT NOT NULL DEFAULT 50,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_classroom_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_classroom_longitude
        CHECK (longitude BETWEEN -180 AND 180),

    CONSTRAINT chk_classroom_radius
        CHECK (allowed_radius BETWEEN 10 AND 200),

    UNIQUE KEY uq_classroom
        (building_name, room_name)

) ENGINE=InnoDB;

-- =========================================
-- LINK ATTENDANCE SESSIONS TO CLASSROOMS
-- =========================================

ALTER TABLE lecture_sessions
ADD COLUMN classroom_id INT NULL,
ADD CONSTRAINT fk_session_classroom
    FOREIGN KEY (classroom_id)
    REFERENCES classrooms(id);
