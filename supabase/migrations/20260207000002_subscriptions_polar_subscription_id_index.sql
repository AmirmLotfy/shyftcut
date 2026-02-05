-- Index for webhook lookups by polar_subscription_id (subscription.updated, subscription.canceled, subscription.revoked).
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_subscription_id ON public.subscriptions(polar_subscription_id) WHERE polar_subscription_id IS NOT NULL;
