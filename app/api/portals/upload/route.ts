import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const portalId = formData.get('portalId') as string;
    
    if (!file || !portalId) {
      return NextResponse.json({ success: false, error: 'Missing file or portalId' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${portalId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portal-attachments')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    const { data: publicURL } = supabase.storage
      .from('portal-attachments')
      .getPublicUrl(fileName);
    
    const { error: dbError } = await supabase
      .from('portal_attachments')
      .insert({
        portal_id: portalId,
        file_name: file.name,
        file_url: publicURL.publicUrl,
        file_type: file.type.startsWith('image/') ? 'photo' : 'document',
        file_size: file.size
      });
    
    if (dbError) throw dbError;
    
    return NextResponse.json({ success: true, url: publicURL.publicUrl });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}
