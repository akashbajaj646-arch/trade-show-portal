import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getProductById } from '@/lib/apparelmagic';

export async function GET(
  request: Request,
  context: { params: Promise<{ link: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const { link } = await context.params;
    
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*')
      .eq('unique_link', link)
      .single();
    
    if (portalError || !portal) {
      return NextResponse.json({
        success: false,
        error: 'Portal not found'
      }, { status: 404 });
    }
    
    const { data: items, error: itemsError } = await supabase
      .from('portal_items')
      .select('*')
      .eq('portal_id', portal.id);
    
    if (itemsError) throw itemsError;
    
    const { data: attachments, error: attachmentsError } = await supabase
      .from('portal_attachments')
      .select('*')
      .eq('portal_id', portal.id);
    
    if (attachmentsError) throw attachmentsError;
    
    const itemsWithProducts = await Promise.all(
      (items || []).map(async (item) => {
        try {
          const product = await getProductById(item.product_id);
          return {
            ...item,
            product_images: product?.images || [],
            product_category: product?.category || '',
            product_content: product?.content || '',
            product_origin: product?.origin || ''
          };
        } catch (error) {
          console.error(`Error fetching product ${item.product_id}:`, error);
          return item;
        }
      })
    );
    
    await supabase
      .from('portals')
      .update({ 
        view_count: portal.view_count + 1,
        viewed_at: new Date().toISOString()
      })
      .eq('id', portal.id);
    
    return NextResponse.json({
      success: true,
      portal,
      items: itemsWithProducts,
      attachments: attachments || []
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
