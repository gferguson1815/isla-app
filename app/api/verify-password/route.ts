import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const verifySchema = z.object({
  slug: z.string().min(1).max(50),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = verifySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const { slug, password } = validationResult.data;

    // Fetch link from database
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: link, error } = await supabase
      .from('links')
      .select('password')
      .eq('slug', slug)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Check if link has password protection
    if (!link.password) {
      return NextResponse.json(
        { error: 'This link is not password protected' },
        { status: 400 }
      );
    }

    // Verify password (in production, passwords should be hashed)
    if (link.password !== password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Generate a simple token (in production, use a proper JWT or session)
    const token = Buffer.from(`${slug}:${Date.now()}`).toString('base64');

    return NextResponse.json(
      {
        success: true,
        token
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}