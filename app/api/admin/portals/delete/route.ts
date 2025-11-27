import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalId } = body;
    
    if (!portalId) {
      return NextResponse.json({
        success: false,
        error: 'Portal ID is required'
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('portals')
      .delete()
      .eq('id', portalId);
    
    if (error) {
      console.error('Error deleting portal:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Portal deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in portal deletion:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
