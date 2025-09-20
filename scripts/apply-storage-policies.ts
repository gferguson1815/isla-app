#!/usr/bin/env node

/**
 * Apply Storage RLS Policies for Supabase
 * This script applies the necessary RLS policies for the workspace-logos bucket
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyStoragePolicies() {
  console.log('🔧 Applying storage RLS policies...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // First check if the bucket exists
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('workspace-logos');

  if (!bucket) {
    console.error('❌ Bucket "workspace-logos" not found!');
    console.log('   Run: pnpm tsx scripts/setup-storage-buckets.ts');
    process.exit(1);
  }

  console.log('✅ Found workspace-logos bucket\n');

  // Since we can't directly execute SQL through the client library,
  // we'll provide clear instructions for manual application
  console.log('📋 IMPORTANT: Storage RLS policies must be applied manually');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Please follow these steps:\n');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run the following SQL commands:\n');
  console.log('═══════════════════════════════════════════════════════════');

  const sqlCommands = `
-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Allow workspace logo upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public workspace logo access" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace logo update" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace logo delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload workspace logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update workspace logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete workspace logos" ON storage.objects;

-- Step 2: Create new policies
CREATE POLICY "Authenticated users can upload workspace logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-logos');

CREATE POLICY "Public can view workspace logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-logos');

CREATE POLICY "Authenticated users can update workspace logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workspace-logos')
WITH CHECK (bucket_id = 'workspace-logos');

CREATE POLICY "Authenticated users can delete workspace logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-logos');

-- Step 3: Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'workspace-logos';

-- Step 4: Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
`;

  console.log(sqlCommands);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('💡 Alternative: Use the SQL file directly');
  console.log('   Copy and paste from: scripts/fix-storage-policies.sql\n');

  console.log('🎯 After applying these policies:');
  console.log('   - Authenticated users can upload/update/delete logos');
  console.log('   - Public users can view logos');
  console.log('   - The storage upload error should be resolved\n');

  // Try to update bucket settings programmatically
  console.log('🔄 Attempting to update bucket settings...');
  const { data: updateData, error: updateError } = await supabase.storage.updateBucket('workspace-logos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
  });

  if (updateError) {
    console.warn(`⚠️  Could not update bucket: ${updateError.message}`);
  } else {
    console.log('✅ Bucket settings updated successfully');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 Next Steps:');
  console.log('   1. Apply the SQL commands above in Supabase');
  console.log('   2. Test logo upload on /onboarding/workspace');
  console.log('   3. The RLS policy error should be resolved');
}

applyStoragePolicies();