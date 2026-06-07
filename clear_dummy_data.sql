-- Script to clear dummy data from the Feed tables
-- Note: This will delete ALL data in these tables.

DELETE FROM posts;
DELETE FROM stories;
DELETE FROM highlights;

-- Optionally, you can also delete learning progress and users if you want a completely fresh start:
-- DELETE FROM learning_progress;
-- DELETE FROM users;
