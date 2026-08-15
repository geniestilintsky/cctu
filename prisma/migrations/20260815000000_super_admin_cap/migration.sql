-- Caps SUPER_ADMIN accounts at 10.
--
-- A CHECK constraint cannot count rows, so the cap is enforced with triggers.
-- Putting it here rather than in application code means it holds for every
-- writer — the app, prisma/seed.ts, phpMyAdmin and hand-written SQL alike.
--
-- The INSERT trigger blocks a new SUPER_ADMIN row once 10 exist; the UPDATE
-- trigger blocks promoting an existing account into an 11th. Demoting a super
-- admin, or updating one that is already a super admin, is unaffected.

DROP TRIGGER IF EXISTS `user_super_admin_cap_insert`;

CREATE TRIGGER `user_super_admin_cap_insert`
BEFORE INSERT ON `user`
FOR EACH ROW
BEGIN
  IF NEW.role = 'SUPER_ADMIN'
     AND (SELECT COUNT(*) FROM `user` WHERE role = 'SUPER_ADMIN') >= 10 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Super admin limit reached: a maximum of 10 SUPER_ADMIN accounts is allowed.';
  END IF;
END;

DROP TRIGGER IF EXISTS `user_super_admin_cap_update`;

CREATE TRIGGER `user_super_admin_cap_update`
BEFORE UPDATE ON `user`
FOR EACH ROW
BEGIN
  IF NEW.role = 'SUPER_ADMIN' AND OLD.role <> 'SUPER_ADMIN'
     AND (SELECT COUNT(*) FROM `user` WHERE role = 'SUPER_ADMIN') >= 10 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Super admin limit reached: a maximum of 10 SUPER_ADMIN accounts is allowed.';
  END IF;
END;
