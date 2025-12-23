import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id');  // Supabase customer UUID
    const amCustomerId = searchParams.get('am_customer_id');  // ApparelMagic customer_id
    
    if (!customerId && !amCustomerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'customer_id or am_customer_id is required' 
      }, { status: 400 });
    }
    
    let query = supabase
      .from('customer_locations')
      .select('*')
      .order('is_main_location', { ascending: false })
      .order('location_name', { ascending: true });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (amCustomerId) {
      query = query.eq('am_customer_id', amCustomerId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log(`Found ${data?.length || 0} locations for customer`);
    
    return NextResponse.json({ 
      success: true, 
      locations: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Error in locations endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
