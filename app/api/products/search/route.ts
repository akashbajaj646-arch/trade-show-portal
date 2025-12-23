import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const all = searchParams.get('all');
    
    let productsQuery = supabase
      .from('products')
      .select('*')
      .order('style_number', { ascending: true });
    
    // If searching, filter by style number, description, or category
    if (query && !all) {
      const searchTerm = query.trim();
      productsQuery = productsQuery.or(
        `style_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
      );
    }
    
    // Limit results
    productsQuery = productsQuery.limit(all ? 200 : 100);
    
    const { data: products, error: productsError } = await productsQuery;
    
    if (productsError) throw productsError;
    
    // Fetch images for each product
    const productIds = products?.map(p => p.product_id) || [];
    
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true });
    
    // Group images by product_id
    const imagesByProduct: Record<string, any[]> = {};
    images?.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push({ img: img.image_url });
    });
    
    // Attach images to products
    const productsWithImages = products?.map(product => ({
      ...product,
      images: imagesByProduct[product.product_id] || []
    })) || [];
    
    return NextResponse.json({
      success: true,
      products: productsWithImages,
      total: productsWithImages.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
