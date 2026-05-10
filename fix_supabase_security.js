const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function fixSecurity() {
    console.log('Starting Hardened Supabase Security Fix (including Views)...');
    console.log('Target Project:', process.env.SUPABASE_URL);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Connected to database');

        const publicSelectTables = [
            'product', 'brands', 'categories', 'genders', 'frame_types', 'shapes', 
            'materials', 'frame_colors', 'offer', 'coupon', 'business_settings', 
            'pages', 'page_seo', 'page_sections', 'cms_pages', 'cms_sections', 
            'cms_banners', 'cms_brand_hero', 'blog', 'popup'
        ];

        const hardenedSql = `
        DO $$ 
        DECLARE 
            r RECORD;
            public_tables TEXT[] := ARRAY['${publicSelectTables.join("','")}'];
        BEGIN
            -- 1. SECURE TABLES (RLS)
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                -- Enable Row Level Security
                EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
                
                -- Clear old policies
                EXECUTE 'DROP POLICY IF EXISTS "Allow Full Access for App" ON public.' || quote_ident(r.tablename);
                EXECUTE 'DROP POLICY IF EXISTS "Allow Full Access for Admin" ON public.' || quote_ident(r.tablename);
                EXECUTE 'DROP POLICY IF EXISTS "Allow Public Read" ON public.' || quote_ident(r.tablename);
                
                -- Policy for Admin (service_role and postgres)
                EXECUTE 'CREATE POLICY "Allow Full Access for Admin" ON public.' || quote_ident(r.tablename) || ' FOR ALL TO service_role, postgres USING (true) WITH CHECK (true)';
                
                -- Policy for Public Read (anon)
                IF r.tablename = ANY(public_tables) THEN
                    EXECUTE 'CREATE POLICY "Allow Public Read" ON public.' || quote_ident(r.tablename) || ' FOR SELECT TO anon USING (true)';
                    RAISE NOTICE 'Restricted Table %: Admin Full, Public SELECT', r.tablename;
                ELSE
                    RAISE NOTICE 'Hardened Table %: Admin Full, Public BLOCKED', r.tablename;
                END IF;
            END LOOP;

            -- 2. SECURE VIEWS AND MATERIALIZED VIEWS (Permissions)
            -- Materialized Views don't support RLS, so we use GRANT/REVOKE to secure them.
            FOR r IN (SELECT relname, relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')) LOOP
                -- Revoke access from anon/public
                EXECUTE 'REVOKE ALL ON public.' || quote_ident(r.relname) || ' FROM public, anon';
                
                -- Grant access only to trusted roles
                EXECUTE 'GRANT SELECT ON public.' || quote_ident(r.relname) || ' TO service_role, authenticated, postgres';
                
                RAISE NOTICE 'Secured View/MatView %: Public BLOCKED', r.relname;
            END LOOP;
        END $$;
        `;

        await client.query(hardenedSql);
        console.log('🚀 SUCCESS: Row Level Security and View Permissions have been hardened.');
        console.log('✓ Admin/Backend (Service Role): Full Access Bypass');
        console.log('✓ Public (Anon): SELECT-only for Catalog tables, BLOCKED for sensitive data and Sales Summaries.');

    } catch (err) {
        console.error('FAILED to harden security:', err.message);
    } finally {
        await client.end();
    }
}

fixSecurity();
