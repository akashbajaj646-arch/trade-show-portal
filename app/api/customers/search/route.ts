import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log(`Searching customers for: "${query}"`);
    
    if (!query || query.length < 2) {
      // Return recent/popular customers if no search query
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', '1')
        .order('customer_name', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        customers: data || [],
        count: data?.length || 0
      });
    }
    
    // Search by customer name (case-insensitive)
    const searchTerm = query.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`customer_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`)
      .order('customer_name', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error searching customers:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Sort results to prioritize exact and starts-with matches
    const sortedData = (data || []).sort((a, b) => {
      const aName = (a.customer_name || '').toLowerCase();
      const bName = (b.customer_name || '').toLowerCase();
      
      // Exact match first
      if (aName === searchTerm && bName !== searchTerm) return -1;
      if (bName === searchTerm && aName !== searchTerm) return 1;
      
      // Starts with second
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;
      
      // Alphabetical
      return aName.localeCompare(bName);
    });
    
    console.log(`Found ${sortedData.length} customers matching "${query}"`);
    
    return NextResponse.json({ 
      success: true, 
      customers: sortedData,
      count: sortedData.length
    });
    
  } catch (error) {
    console.error('Error in customer search:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
