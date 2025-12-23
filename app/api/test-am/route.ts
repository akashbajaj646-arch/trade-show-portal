import { NextResponse } from 'next/server';

const APPAREL_MAGIC_TOKEN = process.env.APPAREL_MAGIC_TOKEN || '';

export async function GET() {
  const tests = [];
  
  // Test 1: Original search endpoint with empty query
  try {
    const r1 = await fetch('https://www.apparelmagic.com/api/products?q=', {
      headers: { 'Authorization': `Bearer ${APPAREL_MAGIC_TOKEN}` }
    });
    tests.push({ 
      endpoint: '/api/products?q=', 
      status: r1.status, 
      ok: r1.ok,
      text: r1.ok ? 'Success' : await r1.text()
    });
  } catch (e) {
    tests.push({ endpoint: '/api/products?q=', error: String(e) });
  }
  
  // Test 2: Just /api/products
  try {
    const r2 = await fetch('https://www.apparelmagic.com/api/products', {
      headers: { 'Authorization': `Bearer ${APPAREL_MAGIC_TOKEN}` }
    });
    tests.push({ 
      endpoint: '/api/products', 
      status: r2.status, 
      ok: r2.ok,
      text: r2.ok ? 'Success' : await r2.text()
    });
  } catch (e) {
    tests.push({ endpoint: '/api/products', error: String(e) });
  }
  
  return NextResponse.json({ tests });
}
