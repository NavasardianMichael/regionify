-- AlterTable
ALTER TABLE "projects" ADD COLUMN "embed_token" TEXT;
ALTER TABLE "projects" ADD COLUMN "embed_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "embed_seo_title" VARCHAR(200);
ALTER TABLE "projects" ADD COLUMN "embed_seo_description" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "embed_seo_keywords" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "projects_embed_token_key" ON "projects"("embed_token");
