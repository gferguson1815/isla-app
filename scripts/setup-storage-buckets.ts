#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 * Run this script to create the necessary storage buckets in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase Storage buckets...');

  try {
    // Create workspace-logos bucket
    const { data: existingBucket } = await supabase.storage.getBucket('workspace-logos');

    if (existingBucket) {
      console.log('✅ Bucket "workspace-logos" already exists');
    } else {
      const { data, error } = await supabase.storage.createBucket('workspace-logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
      });

      if (error) {
        console.error('❌ Error creating bucket:', error.message);
        process.exit(1);
      }

      console.log('✅ Created bucket "workspace-logos"');
    }

    // Set up RLS policies for the bucket
    console.log('📝 Setting up RLS policies...');

    // Note: Storage policies need to be set via SQL or Supabase Dashboard
    // Here's the SQL that should be run:
    const policySQL = `
-- Allow authenticated users to upload their workspace logos
CREATE POLICY "Allow workspace logo upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workspace-logos');

-- Allow public read access to workspace logos
CREATE POLICY "Allow public workspace logo access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'workspace-logos');

-- Allow authenticated users to update their workspace logos
CREATE POLICY "Allow workspace logo update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'workspace-logos');

-- Allow authenticated users to delete their workspace logos
CREATE POLICY "Allow workspace logo delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'workspace-logos');
    `;

    console.log('📋 RLS Policies to apply (run in Supabase SQL Editor):');
    console.log(policySQL);

    console.log('\n✅ Storage bucket setup complete!');
    console.log('👉 Don\'t forget to apply the RLS policies above in your Supabase Dashboard SQL Editor');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupStorageBuckets();