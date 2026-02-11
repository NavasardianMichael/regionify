-- Rename Plan enum values: free → observer, atlas → chronographer
ALTER TYPE "Plan" RENAME VALUE 'free' TO 'observer';
ALTER TYPE "Plan" RENAME VALUE 'atlas' TO 'chronographer';
