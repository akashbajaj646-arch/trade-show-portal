import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const { portalId } = await request.json();
    
    if (!portalId) {
      return NextResponse.json({
        success: false,
        error: 'Portal ID required'
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Delete portal (cascades to items and attachments due to foreign key constraints)
    const { error } = await supabase
      .from('portals')
      .delete()
      .eq('id', portalId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete'
    }, { status: 500 });
  }
}
