-- Add first and last name; migrate from full_name; drop full_name
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;

UPDATE "users"
SET
  "first_name" = CASE
    WHEN position(' ' in "full_name") > 0 THEN trim(substring("full_name" from 1 for position(' ' in "full_name") - 1))
    ELSE trim("full_name")
  END,
  "last_name" = CASE
    WHEN position(' ' in "full_name") > 0 THEN trim(substring("full_name" from position(' ' in "full_name") + 1))
    ELSE ''
  END
WHERE "first_name" IS NULL OR "last_name" IS NULL;

UPDATE "users" SET "last_name" = 'User' WHERE "last_name" = '' OR "last_name" IS NULL;

ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;

ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name";
