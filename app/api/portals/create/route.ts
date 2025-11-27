import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generate a unique link for the portal
function generateUniqueLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      locationId,
      locationName,
      address1,
      address2,
      city,
      state,
      postalCode,
      country,
      tradeShowName,
      shipDate,
      notes,
      isNewCustomer,
    } = body;
    
    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Customer name is required'
      }, { status: 400 });
    }
    
    // Generate unique link
    let uniqueLink = generateUniqueLink();
    let attempts = 0;
    
    // Ensure unique link doesn't already exist
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('portals')
        .select('id')
        .eq('unique_link', uniqueLink)
        .single();
      
      if (!existing) break;
      
      uniqueLink = generateUniqueLink();
      attempts++;
    }
    
    // If creating a new customer, insert them first
    let finalCustomerId = customerId;
    
    if (isNewCustomer && !customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          customer_name: customerName.trim(),
          email: customerEmail || null,
          phone: customerPhone || null,
          address_1: address1 || null,
          address_2: address2 || null,
          city: city || null,
          state: state || null,
          postal_code: postalCode || null,
          country: country || 'USA',
          is_local_only: true,
          is_active: '1',
        })
        .select('id')
        .single();
      
      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create customer: ' + customerError.message
        }, { status: 500 });
      }
      
      finalCustomerId = newCustomer?.id;
    }
    
    // Create the portal
    const portalData = {
      unique_link: uniqueLink,
      customer_id: finalCustomerId || null,
      customer_name: customerName.trim(),
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      location_id: locationId || null,
      location_name: locationName || null,
      shipping_address_1: address1 || null,
      shipping_address_2: address2 || null,
      shipping_city: city || null,
      shipping_state: state || null,
      shipping_postal_code: postalCode || null,
      shipping_country: country || 'USA',
      trade_show_name: tradeShowName || null,
      ship_date: shipDate || null,
      notes: notes || null,
      status: 'active',
      is_new_customer: isNewCustomer || false,
    };
    
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .insert(portalData)
      .select()
      .single();
    
    if (portalError) {
      console.error('Error creating portal:', portalError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create portal: ' + portalError.message
      }, { status: 500 });
    }
    
    console.log(`Portal created: ${uniqueLink} for ${customerName}`);
    
    return NextResponse.json({
      success: true,
      portal: {
        id: portal.id,
        uniqueLink: portal.unique_link,
        customerName: portal.customer_name,
        status: portal.status,
      },
      message: 'Portal created successfully'
    });
    
  } catch (error) {
    console.error('Error in portal creation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
