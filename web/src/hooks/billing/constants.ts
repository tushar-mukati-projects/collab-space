export const API_ROUTES = {
  checkout: "/billing/checkout",
  portal: "/billing/portal",
  subscription: "/billing/subscription",
} as const;

export const QUERY_KEYS = {
  subscription: () => ["billing", "subscription"] as const,
};
