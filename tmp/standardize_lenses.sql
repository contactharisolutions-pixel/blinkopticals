-- REFINEMENT: Lens Specification Standardization
-- Removing master-linked ID columns for lenses as we prefer direct technical naming
-- (Composite and Colorway) for better precision in the optical boutique context.

ALTER TABLE product DROP COLUMN IF EXISTS lens_material_id;
ALTER TABLE product DROP COLUMN IF EXISTS lens_color_id;
