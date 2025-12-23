import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/apparelmagic';

export async function GET(request: Request) {
  try {
    const products = await getProducts(5500);
    
    // Search for the specific product
    const found = products.find(p => 
      p.style_number.toLowerCase().includes('24901')
    );
    
    return NextResponse.json({
      totalProductsFetched: products.length,
      foundSKU24901: found ? 'YES - Found it!' : 'NO - Not in results',
      product: found || null,
      firstFewProducts: products.slice(0, 5).map(p => p.style_number),
      lastFewProducts: products.slice(-5).map(p => p.style_number)
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
