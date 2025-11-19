import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateUniqueLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, tradeShowName, items } = body;

    console.log('=== CREATE PORTAL DEBUG ===');
    console.log('Received items:', JSON.stringify(items, null, 2));

    // Generate unique link
    const uniqueLink = generateUniqueLink();

    // Create portal
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        trade_show_name: tradeShowName,
        status: 'pending',
        unique_link: uniqueLink
      })
      .select()
      .single();

    if (portalError) throw portalError;

    // Create portal items - image_url is passed from frontend
    const portalItems = items.map((item: any) => {
      console.log('Processing item:', {
        style_number: item.style_number,
        image_url: item.image_url,
        has_image_url: !!item.image_url
      });
      
      return {
        portal_id: portal.id,
        product_id: item.product_id,
        style_number: item.style_number,
        attr_2: item.attr_2,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        delivery_date: item.deliveryDate || null,
        notes: item.notes || null,
        image_url: item.image_url || null
      };
    });

    console.log('Inserting portal items:', JSON.stringify(portalItems, null, 2));

    const { error: itemsError } = await supabase
      .from('portal_items')
      .insert(portalItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      success: true,
      portal: {
        id: portal.id,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portal/${uniqueLink}`
      }
    });

  } catch (error) {
    console.error('Error creating portal:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
