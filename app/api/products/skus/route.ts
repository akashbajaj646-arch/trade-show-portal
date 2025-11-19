import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'product_id is required'
      }, { status: 400 });
    }
    
    const { data: skus, error } = await supabase
      .from('product_skus')
      .select('*')
      .eq('product_id', productId)
      .order('attr_2', { ascending: true })
      .order('size', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      skus: skus || []
    });
    
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
