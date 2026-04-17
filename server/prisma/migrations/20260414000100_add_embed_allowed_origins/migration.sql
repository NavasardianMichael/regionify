-- Add trusted origin allowlist for public embed framing
ALTER TABLE "projects"
ADD COLUMN "embed_allowed_origins" JSONB;
