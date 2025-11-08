-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Plan details
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  
  -- Limits
  max_chat_instances integer NOT NULL DEFAULT 1,
  
  -- Billing (Stripe)
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  
  -- Dates
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create helper function to get user plan details
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id_param uuid)
RETURNS TABLE (
  plan_type text,
  max_chat_instances integer,
  current_chat_count bigint,
  can_create_more_chats boolean,
  can_hide_branding boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record record;
  chat_count bigint;
BEGIN
  -- Get subscription (default to free if not exists)
  SELECT * INTO sub_record
  FROM user_subscriptions
  WHERE user_id = user_id_param;
  
  IF sub_record IS NULL THEN
    sub_record.plan_type := 'free';
    sub_record.max_chat_instances := 1;
  END IF;
  
  -- Count current chat instances
  SELECT COUNT(*) INTO chat_count
  FROM chat_instances
  WHERE chat_instances.user_id = user_id_param;
  
  -- Return plan info
  RETURN QUERY SELECT
    sub_record.plan_type,
    sub_record.max_chat_instances,
    chat_count,
    (chat_count < sub_record.max_chat_instances)::boolean,
    (sub_record.plan_type IN ('pro', 'enterprise'))::boolean;
END;
$$;

-- Create enforcement function
CREATE OR REPLACE FUNCTION public.enforce_chat_instance_limit()
RETURNS TRIGGER AS $$
DECLARE
  plan_info record;
BEGIN
  -- Get user's plan
  SELECT * INTO plan_info
  FROM get_user_plan(NEW.user_id);
  
  -- Check limit
  IF NOT plan_info.can_create_more_chats THEN
    RAISE EXCEPTION 'Chat instance limit reached. Upgrade to Pro for unlimited chats.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on chat_instances
CREATE TRIGGER check_chat_instance_limit
  BEFORE INSERT ON public.chat_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_chat_instance_limit();

-- Seed existing users with free plan
INSERT INTO public.user_subscriptions (user_id, plan_type, max_chat_instances)
SELECT id, 'free', 1 
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;