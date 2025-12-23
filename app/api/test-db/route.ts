// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('portals')
      .select('count')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      tables: ['portals', 'custom_products', 'portal_items', 'portal_attachments', 'change_requests']
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}