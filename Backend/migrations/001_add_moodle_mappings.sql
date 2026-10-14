
-- Moodle LMS Integration
-- Database: student_attendance_system
--
-- Run this migration only on a database that
-- does not already have the Moodle mapping columns.
--
-- DO NOT rerun on our current local database.
-- The changes have already been applied there.

ALTER TABLE courses
ADD COLUMN moodle_course_id BIGINT UNSIGNED NULL,
ADD UNIQUE KEY uq_courses_moodle_course_id
(moodle_course_id);

ALTER TABLE users
ADD COLUMN moodle_user_id BIGINT UNSIGNED NULL,
ADD UNIQUE KEY uq_users_moodle_user_id
(moodle_user_id);

-- Individual user and course mappings are
-- configured separately after verifying
-- their identities in each environment.
