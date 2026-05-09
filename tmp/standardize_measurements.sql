-- REFINEMENT: Optical Measurement Standardization
-- Purging generic H/W/L columns and the redundant concatenated string.
-- Standardizing on professional optical terminology: lens_width, bridge_size, temple_length.

ALTER TABLE product DROP COLUMN IF EXISTS measurements_h;
ALTER TABLE product DROP COLUMN IF EXISTS measurements_w;
ALTER TABLE product DROP COLUMN IF EXISTS measurements_l;
ALTER TABLE product DROP COLUMN IF EXISTS measurement;
