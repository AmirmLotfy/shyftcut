-- Triggers for tracking user activity and conversions

-- Function to update last_active_at on user events
CREATE OR REPLACE FUNCTION public.update_user_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET last_active_at = NEW.created_at
    WHERE user_id = NEW.user_id
    AND (last_active_at IS NULL OR NEW.created_at > last_active_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_last_active_on_event ON public.user_events;
CREATE TRIGGER trigger_update_last_active_on_event
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.update_user_last_active_at();

-- Function to create conversion event on subscription creation/update
CREATE OR REPLACE FUNCTION public.create_subscription_conversion_event()
RETURNS TRIGGER AS $$
DECLARE
  prev_tier public.subscription_tier;
BEGIN
  -- On INSERT: create conversion event for new paid subscriptions
  IF TG_OP = 'INSERT' AND NEW.tier != 'free' AND NEW.status = 'active' THEN
    INSERT INTO public.conversion_events (user_id, conversion_type, funnel_stage, value, metadata, created_at)
    VALUES (
      NEW.user_id,
      'subscription',
      'completed',
      CASE 
        WHEN NEW.tier = 'premium' THEN 9.99
        WHEN NEW.tier = 'pro' THEN 19.99
        ELSE NULL
      END,
      jsonb_build_object('tier', NEW.tier, 'subscription_id', NEW.id),
      NEW.created_at
    );
    
    -- Create subscription event
    INSERT INTO public.subscription_events (subscription_id, user_id, event_type, to_tier, amount, created_at)
    VALUES (
      NEW.id,
      NEW.user_id,
      'created',
      NEW.tier,
      CASE 
        WHEN NEW.tier = 'premium' THEN 9.99
        WHEN NEW.tier = 'pro' THEN 19.99
        ELSE NULL
      END,
      NEW.created_at
    );
  END IF;
  
  -- On UPDATE: track tier changes and status changes
  IF TG_OP = 'UPDATE' THEN
    prev_tier := OLD.tier;
    
    -- Track tier changes
    IF NEW.tier != OLD.tier THEN
      INSERT INTO public.subscription_events (subscription_id, user_id, event_type, from_tier, to_tier, amount, created_at)
      VALUES (
        NEW.id,
        NEW.user_id,
        CASE 
          WHEN NEW.tier = 'free' THEN 'downgraded'
          WHEN OLD.tier = 'free' THEN 'upgraded'
          WHEN NEW.tier > OLD.tier THEN 'upgraded'
          ELSE 'downgraded'
        END,
        OLD.tier,
        NEW.tier,
        CASE 
          WHEN NEW.tier = 'premium' THEN 9.99
          WHEN NEW.tier = 'pro' THEN 19.99
          ELSE NULL
        END,
        now()
      );
    END IF;
    
    -- Track status changes
    IF NEW.status != OLD.status THEN
      INSERT INTO public.subscription_events (subscription_id, user_id, event_type, from_tier, to_tier, created_at)
      VALUES (
        NEW.id,
        NEW.user_id,
        CASE 
          WHEN NEW.status = 'canceled' THEN 'canceled'
          WHEN NEW.status = 'active' AND OLD.status = 'canceled' THEN 'reactivated'
          ELSE NEW.status
        END,
        OLD.tier,
        NEW.tier,
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_subscription_conversion ON public.subscriptions;
CREATE TRIGGER trigger_subscription_conversion
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_conversion_event();

-- Function to create signup conversion event
CREATE OR REPLACE FUNCTION public.create_signup_conversion_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversion_events (user_id, conversion_type, funnel_stage, metadata, created_at)
  VALUES (
    NEW.user_id,
    'signup',
    'completed',
    jsonb_build_object('email', NEW.email, 'display_name', NEW.display_name),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_signup_conversion ON public.profiles;
CREATE TRIGGER trigger_signup_conversion
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_signup_conversion_event();
