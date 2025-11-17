import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: portals, error } = await supabase
      .from('portals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the portals with proper URLs
    const formattedPortals = portals?.map(portal => ({
      ...portal,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portal/${portal.unique_link}`
    })) || [];

    return NextResponse.json({
      success: true,
      portals: formattedPortals
    });
  } catch (error) {
    console.error('Error fetching portals:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
