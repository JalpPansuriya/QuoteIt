import { getSupabase } from './supabase';
import { Client, Product, Quote, AppSettings } from '../types';

export const supabaseService = {
  saveAll: async (data: { clients: Client[], products: Product[], quotes: Quote[], settings: AppSettings }) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error } = await supabase
      .from('user_data')
      .upsert({ 
        user_id: user.id, 
        payload: data,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  },

  loadAll: async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('payload')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data?.payload || null;
  }
};
