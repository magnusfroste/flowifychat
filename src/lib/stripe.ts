import { supabase } from "@/integrations/supabase/client";

export const createCheckoutSession = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const openCustomerPortal = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  } catch (error) {
    console.error('Error opening customer portal:', error);
    throw error;
  }
};

export const checkSubscription = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
};
