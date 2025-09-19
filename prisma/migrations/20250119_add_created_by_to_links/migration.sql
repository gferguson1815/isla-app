-- AlterTable
ALTER TABLE "links" ADD COLUMN "created_by" UUID;

-- Update existing links to set created_by to the workspace owner
UPDATE "links" l
SET "created_by" = (
  SELECT wm.user_id
  FROM workspace_memberships wm
  WHERE wm.workspace_id = l.workspace_id
  AND wm.role = 'owner'
  LIMIT 1
)
WHERE l.created_by IS NULL;

-- Make created_by NOT NULL after populating existing rows
ALTER TABLE "links" ALTER COLUMN "created_by" SET NOT NULL;

-- CreateIndex
CREATE INDEX "links_created_by_idx" ON "links"("created_by");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;