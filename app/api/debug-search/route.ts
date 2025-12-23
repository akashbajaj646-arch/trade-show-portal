import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/apparelmagic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const allProducts = await getProducts();
    const searchTerm = query.toLowerCase().trim();
    
    // Find the specific product
    const product24901 = allProducts.find(p => p.product_id === "5069");
    
    // Try different match attempts
    const exactMatch = product24901?.style_number.toLowerCase() === searchTerm;
    const containsMatch = product24901?.style_number.toLowerCase().includes(searchTerm);
    
    // Check for hidden characters
    const styleNumberBytes = product24901 ? Array.from(product24901.style_number).map(c => c.charCodeAt(0)) : [];
    const searchTermBytes = Array.from(searchTerm).map(c => c.charCodeAt(0));
    
    return NextResponse.json({
      searchQuery: query,
      searchTerm: searchTerm,
      searchTermLength: searchTerm.length,
      product24901: product24901,
      styleNumberLength: product24901?.style_number.length,
      exactMatch: exactMatch,
      containsMatch: containsMatch,
      styleNumberBytes: styleNumberBytes,
      searchTermBytes: searchTermBytes,
      comparison: {
        styleNumber: product24901?.style_number,
        styleNumberLower: product24901?.style_number.toLowerCase(),
        searchTerm: searchTerm,
        areEqual: product24901?.style_number.toLowerCase() === searchTerm
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
