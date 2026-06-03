-- Reassign Staff users to Admin, then remove Staff role row
DO $$
DECLARE
  admin_id TEXT;
  staff_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM roles WHERE name::text = 'Admin' LIMIT 1;
  SELECT id INTO staff_id FROM roles WHERE name::text = 'Staff' LIMIT 1;
  IF staff_id IS NOT NULL AND admin_id IS NOT NULL THEN
    UPDATE user_roles SET role_id = admin_id WHERE role_id = staff_id;
    DELETE FROM roles WHERE id = staff_id;
  END IF;
END $$;

ALTER TYPE "RoleName" RENAME VALUE 'Technician' TO 'Inspector';
ALTER TYPE "RoleName" RENAME VALUE 'Customer' TO 'User';
