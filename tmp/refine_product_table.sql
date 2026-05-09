-- REFINEMENT: Removing Duplicate/Legacy Columns from Product Table
-- We are keeping the _id columns (frame_type_id, gender_id, etc.) 
-- as they are joined with master data for better performance and integrity.

ALTER TABLE product DROP COLUMN IF EXISTS frame_type;
ALTER TABLE product DROP COLUMN IF EXISTS gender;
ALTER TABLE product DROP COLUMN IF EXISTS material;
ALTER TABLE product DROP COLUMN IF EXISTS shape;

-- Optional: If measurement was duplicated by separate columns
-- We decided to keep discrete columns AND the string for flexibility
-- so we'll keep both measurement (string) and the lens_width etc. columns.
