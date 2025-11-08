import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPlan {
  plan_type: 'free' | 'pro' | 'enterprise';
  max_chat_instances: number;
  current_chat_count: number;
  can_create_more_chats: boolean;
  can_hide_branding: boolean;
}

export const useUserPlan = () => {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_user_plan', { user_id_param: session.user.id });

      if (!error && data?.[0]) {
        setPlan(data[0] as UserPlan);
      }
    } catch (error) {
      console.error('Failed to fetch user plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return { plan, loading, refetch: fetchPlan };
};
