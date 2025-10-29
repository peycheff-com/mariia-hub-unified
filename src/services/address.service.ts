import { supabase } from '@/integrations/supabase/client';
import { UserAddress } from '@/types/user';

export const addressService = {
  async getUserAddresses(): Promise<UserAddress[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async addAddress(addressData: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: user.id,
        label: addressData.label,
        address: addressData.address,
        is_default: addressData.is_default,
      });

    if (error) throw error;
  },

  async updateAddress(id: string, addressData: Partial<UserAddress>): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .update({
        label: addressData.label,
        address: addressData.address,
        is_default: addressData.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setDefaultAddress(id: string): Promise<void> {
    const { error } = await supabase.rpc('set_default_address', {
      address_id: id,
    });

    if (error) throw error;
  },
};