import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tradeShow = searchParams.get('tradeShow');
    const customerType = searchParams.get('customerType'); // 'new' or 'existing'
    const sortBy = searchParams.get('sortBy') || 'created_at'; // 'created_at', 'ship_date', 'customer_name'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' or 'desc'
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = supabase
      .from('portals')
      .select('*')
      .limit(limit);
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filter by trade show (exact match)
    if (tradeShow && tradeShow !== 'all') {
      query = query.eq('trade_show_name', tradeShow);
    }
    
    // Filter by customer type
    if (customerType === 'new') {
      query = query.eq('is_new_customer', true);
    } else if (customerType === 'existing') {
      query = query.eq('is_new_customer', false);
    }
    
    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'ship_date') {
      query = query.order('ship_date', { ascending, nullsFirst: false });
    } else if (sortBy === 'customer_name') {
      query = query.order('customer_name', { ascending });
    } else {
      query = query.order('created_at', { ascending });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching portals:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    // Transform data for frontend
    const portals = (data || []).map(portal => ({
      id: portal.id,
      customer_name: portal.customer_name,
      customer_email: portal.customer_email,
      customer_phone: portal.customer_phone,
      trade_show_name: portal.trade_show_name,
      ship_date: portal.ship_date,
      created_at: portal.created_at,
      status: portal.status,
      unique_link: portal.unique_link,
      url: portal.url || `/portal/${portal.unique_link}`,
      is_new_customer: portal.is_new_customer,
    }));
    
    // Get unique trade shows for filter dropdown
    const { data: tradeShowsData } = await supabase
      .from('portals')
      .select('trade_show_name')
      .not('trade_show_name', 'is', null)
      .not('trade_show_name', 'eq', '');
    
    const uniqueTradeShows = [...new Set((tradeShowsData || []).map(p => p.trade_show_name))].filter(Boolean).sort();
    
    return NextResponse.json({
      success: true,
      portals,
      count: portals.length,
      filters: {
        tradeShows: uniqueTradeShows,
      }
    });
    
  } catch (error) {
    console.error('Error listing portals:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
