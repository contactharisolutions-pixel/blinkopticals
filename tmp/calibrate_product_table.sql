-- AUDIT & CALIBRATION: Product Table Fields
-- Ensuring alignment between ERP Inventory, AI Data Filler, and Ecommerce Product Details

DO $$
BEGIN
    -- 1. Ensure measurement granularity columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='lens_width') THEN
        ALTER TABLE product ADD COLUMN lens_width VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='bridge_size') THEN
        ALTER TABLE product ADD COLUMN bridge_size VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='temple_length') THEN
        ALTER TABLE product ADD COLUMN temple_length VARCHAR(20);
    END IF;

    -- 2. Ensure Lens properties exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='lens_composite') THEN
        ALTER TABLE product ADD COLUMN lens_composite VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='lens_colorway') THEN
        ALTER TABLE product ADD COLUMN lens_colorway VARCHAR(100);
    END IF;

    -- 3. Ensure material_id exists (standardizing on FKs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='material_id') THEN
        ALTER TABLE product ADD COLUMN material_id VARCHAR(50);
    END IF;

    -- 4. Ensure short_description (punchy USP for SEO/Mobile)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='short_description') THEN
        ALTER TABLE product ADD COLUMN short_description TEXT;
    END IF;

    -- 5. Ensure SEO fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='seo_title') THEN
        ALTER TABLE product ADD COLUMN seo_title VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='seo_description') THEN
        ALTER TABLE product ADD COLUMN seo_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product' AND column_name='tags') THEN
        ALTER TABLE product ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;

END $$;
