import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  context: { params: Promise<{ link: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const params = await context.params;
    const uniqueLink = params.link;
    
    console.log('=== PORTAL FETCH ===');
    console.log('Searching for link:', uniqueLink);

    // Get portal
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*')
      .eq('unique_link', uniqueLink)
      .maybeSingle();

    if (portalError || !portal) {
      console.error('Portal not found:', uniqueLink);
      return NextResponse.json({
        success: false,
        error: 'Portal not found'
      }, { status: 404 });
    }

    console.log('✓ Portal found:', portal.id);

    // Get portal items
    const { data: items, error: itemsError } = await supabase
      .from('portal_items')
      .select('*')
      .eq('portal_id', portal.id);

    console.log('✓ Items found:', items?.length || 0);

    if (itemsError) {
      console.error('Items error:', itemsError);
    }

    // Get uploaded files
    const { data: files } = await supabase
      .from('portal_files')
      .select('*')
      .eq('portal_id', portal.id);

    console.log('✓ Files found:', files?.length || 0);

    return NextResponse.json({
      success: true,
      portal: {
        ...portal,
        items: items || [],
        files: files || []
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
