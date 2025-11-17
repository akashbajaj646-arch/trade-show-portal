import { NextResponse } from 'next/server';
import { getProductSKUs } from '@/lib/apparelmagic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'product_id is required'
    }, { status: 400 });
  }

  try {
    const skus = await getProductSKUs(productId);
    
    return NextResponse.json({
      success: true,
      skus
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
