import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Check if we can connect to Supabase
    const { data: portals, error } = await supabase
      .from('portals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        supabaseKey: supabaseKey ? 'Set' : 'Not set'
      });
    }

    return NextResponse.json({
      success: true,
      portalCount: portals?.length || 0,
      portals: portals,
      supabaseUrl: supabaseUrl ? 'Connected' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
