import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { portalId } = await request.json();
    
    console.log('Deleting portal:', portalId);
    
    // Delete portal items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('portal_items')
      .delete()
      .eq('portal_id', portalId);
      
    if (itemsError) {
      console.error('Error deleting items:', itemsError);
    }

    // Delete portal files
    const { error: filesError } = await supabase
      .from('portal_files')
      .delete()
      .eq('portal_id', portalId);
      
    if (filesError) {
      console.error('Error deleting files:', filesError);
    }

    // Delete the portal
    const { error: portalError } = await supabase
      .from('portals')
      .delete()
      .eq('id', portalId);

    if (portalError) {
      console.error('Error deleting portal:', portalError);
      throw portalError;
    }

    console.log('Portal deleted successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
