import { NextResponse } from 'next/server';

const APPARELMAGIC_API_TOKEN = process.env.APPARELMAGIC_API_KEY || '';
const BASE_URL = 'https://advanceapparels.app.apparelmagic.com/api/json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id') || '5069';
    
    const time = Math.floor(Date.now() / 1000).toString();
    
    // Try different endpoint formats
    const attempts = [
      {
        name: 'Method 1: /skus with product_id filter',
        url: `${BASE_URL}/skus?time=${time}&token=${APPARELMAGIC_API_TOKEN}&product_id=${productId}`
      },
      {
        name: 'Method 2: /products/:id/skus',
        url: `${BASE_URL}/products/${productId}/skus?time=${time}&token=${APPARELMAGIC_API_TOKEN}`
      },
      {
        name: 'Method 3: /inventory with product_id',
        url: `${BASE_URL}/inventory?time=${time}&token=${APPARELMAGIC_API_TOKEN}&product_id=${productId}`
      }
    ];
    
    const results = [];
    
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'TradeShowPortal/1.0'
          }
        });
        
        const text = await response.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {}
        
        results.push({
          name: attempt.name,
          url: attempt.url,
          status: response.status,
          success: response.ok,
          hasData: !!parsed?.response,
          dataCount: parsed?.response?.length || 0,
          sample: parsed?.response?.[0] || null
        });
      } catch (error) {
        results.push({
          name: attempt.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      productId,
      attempts: results
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
