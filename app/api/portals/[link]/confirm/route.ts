import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  context: { params: Promise<{ link: string }> }
) {
  try {
    const params = await context.params;
    const uniqueLink = params.link;

    // Get portal ID
    const { data: portal } = await supabase
      .from('portals')
      .select('id')
      .eq('unique_link', uniqueLink)
      .single();

    if (!portal) {
      return NextResponse.json({
        success: false,
        error: 'Portal not found'
      }, { status: 404 });
    }

    // Update status
    const { error } = await supabase
      .from('portals')
      .update({ status: 'confirmed' })
      .eq('id', portal.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
