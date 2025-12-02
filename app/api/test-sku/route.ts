import { NextResponse } from 'next/server';

const APPARELMAGIC_API_TOKEN = process.env.APPARELMAGIC_API_KEY || '';
const BASE_URL = 'https://advanceapparels.app.apparelmagic.com/api/json';

function getAuthParams() {
  const time = Math.floor(Date.now() / 1000).toString();
  return { time, token: APPARELMAGIC_API_TOKEN };
}

export async function GET() {
  const auth = getAuthParams();
  
  // Fetch product_attributes for product 5069 (style 24901)
  const url = `${BASE_URL}/product_attributes?product_id=5069&time=${auth.time}&token=${auth.token}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return NextResponse.json(data);
}