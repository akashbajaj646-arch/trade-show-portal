import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get('link');
    
    if (!link) {
      return NextResponse.json({ error: 'link parameter required' }, { status: 400 });
    }

    // Get portal by unique_link
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*')
      .eq('unique_link', link)
      .single();

    if (portalError || !portal) {
      return NextResponse.json({
        success: false,
        error: 'Portal not found',
        portalError: portalError
      });
    }

    // Get portal items
    const { data: items, error: itemsError } = await supabase
      .from('portal_items')
      .select('*')
      .eq('portal_id', portal.id);

    return NextResponse.json({
      success: true,
      portal: {
        id: portal.id,
        customer_name: portal.customer_name,
        unique_link: portal.unique_link
      },
      itemCount: items?.length || 0,
      items: items,
      itemsError: itemsError
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
