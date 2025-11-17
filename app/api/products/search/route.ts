import { NextResponse } from 'next/server';
import { searchProducts, getProducts } from '@/lib/apparelmagic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const showAll = searchParams.get('all') === 'true';

  try {
    let products;
    
    if (showAll || query === '') {
      // Get ALL products (up to 5500)
      products = await getProducts(5500);
    } else {
      // Search with query (prioritizes exact Style Number matches)
      products = await searchProducts(query);
    }
    
    return NextResponse.json({
      success: true,
      products: products.slice(0, 100), // Return max 100 results to avoid overwhelming UI
      total: products.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
