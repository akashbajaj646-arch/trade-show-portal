import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

function generateUniqueLink(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, tradeShowName, items } = body;
    
    if (!customer.name || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Customer name and at least one item required'
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    const uniqueLink = generateUniqueLink();
    
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        trade_show_name: tradeShowName || null,
        unique_link: uniqueLink,
        status: 'pending'
      })
      .select()
      .single();
    
    if (portalError) throw portalError;
    
    const portalItems = items.map((item: any) => ({
      portal_id: portal.id,
      product_id: item.product_id,
      style_number: item.style_number,
      description: `${item.attr_2} - ${item.size}`,
      price: parseFloat(item.price),
      quantity: item.quantity,
      expected_delivery_date: item.deliveryDate || null,
      notes: item.notes || null
    }));
    
    const { error: itemsError } = await supabase
      .from('portal_items')
      .insert(portalItems);
    
    if (itemsError) throw itemsError;
    
    return NextResponse.json({
      success: true,
      portal: {
        id: portal.id,
        unique_link: uniqueLink,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${uniqueLink}`
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
