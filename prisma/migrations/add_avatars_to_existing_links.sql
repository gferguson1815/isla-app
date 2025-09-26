-- This migration generates avatars for existing links that don't have one
-- Using a deterministic pattern based on the link ID

-- Update existing links with null favicon to have generated avatar URLs
-- Using the DiceBear API with the link's ID as the seed for uniqueness
UPDATE "links"
SET favicon = CONCAT(
  'https://api.dicebear.com/7.x/shapes/svg?seed=',
  id,
  '&backgroundColor=4ECDC4&size=128'
)
WHERE favicon IS NULL;