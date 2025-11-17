// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// For server-side operations that need elevated permissions
export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Database types
export interface Portal {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip?: string;
  trade_show_name?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  unique_link: string;
  viewed_at?: string;
  view_count: number;
  notes?: string;
}

export interface CustomProduct {
  id: string;
  created_at: string;
  style_number: string;
  description?: string;
  price?: number;
  category?: string;
  content?: string;
  origin?: string;
  pack_size?: string;
  notes?: string;
}

export interface PortalItem {
  id: string;
  portal_id: string;
  created_at: string;
  product_id?: string;
  custom_product_id?: string;
  style_number: string;
  description?: string;
  price?: number;
  quantity: number;
  expected_delivery_date?: string;
  notes?: string;
}

export interface PortalAttachment {
  id: string;
  portal_id: string;
  created_at: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
}

export interface ChangeRequest {
  id: string;
  portal_id: string;
  portal_item_id?: string;
  created_at: string;
  request_type: string;
  current_value?: string;
  requested_value?: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined';
  admin_response?: string;
  responded_at?: string;
}