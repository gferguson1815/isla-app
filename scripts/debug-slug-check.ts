#!/usr/bin/env node

import * as dotenv from 'dotenv';
import path from 'path';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../app/server';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function debugSlugCheck() {
  // First, get an auth token
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to get session
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session) {
    console.error('❌ No active session. Please sign in first.');
    console.log('   Run the app and sign in, then try again.');
    return;
  }

  console.log('✅ Found session for user:', session.user.email);

  // Create tRPC client
  const trpc = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
        headers: () => ({
          authorization: `Bearer ${session.access_token}`,
        }),
      }),
    ],
  });

  try {
    console.log('\n🔍 Testing slug "capsule"...');
    const result = await trpc.workspace.checkSlug.query({ slug: 'capsule' });
    console.log('Result:', result);
    console.log(`Available: ${result.available ? '✅ Yes' : '❌ No'}`);

    // Also test a random slug
    const randomSlug = `test-${Date.now()}`;
    console.log(`\n🔍 Testing slug "${randomSlug}"...`);
    const result2 = await trpc.workspace.checkSlug.query({ slug: randomSlug });
    console.log('Result:', result2);
    console.log(`Available: ${result2.available ? '✅ Yes' : '❌ No'}`);

  } catch (error: any) {
    console.error('❌ Error calling checkSlug:', error.message);
  }
}

debugSlugCheck();