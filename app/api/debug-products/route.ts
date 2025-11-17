import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/apparelmagic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const products = await getProducts();
    
    // If searching, find products that contain the search term ANYWHERE
    let matchingProducts = products;
    if (search) {
      matchingProducts = products.filter(p => 
        JSON.stringify(p).toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return NextResponse.json({
      totalProducts: products.length,
      matchingProducts: matchingProducts.length,
      searchTerm: search || 'none',
      sampleProducts: matchingProducts.slice(0, 10).map(p => ({
        product_id: p.product_id,
        style_number: p.style_number,
        description: p.description,
        category: p.category
      })),
      // Show some random products to see the format
      randomSamples: [
        products[0],
        products[Math.floor(products.length / 2)],
        products[products.length - 1]
      ].map(p => ({
        product_id: p.product_id,
        style_number: p.style_number,
        description: p.description
      }))
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
