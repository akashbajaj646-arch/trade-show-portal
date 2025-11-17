import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { portalId, status } = await request.json();
    
    if (!portalId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Portal ID and status required'
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    const { error } = await supabase
      .from('portals')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', portalId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update'
    }, { status: 500 });
  }
}
