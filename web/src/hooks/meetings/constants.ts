export const API_ROUTES = {
  meetings: "/meetings",
  meeting: (id: string) => `/meetings/${id}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["meetings"] as const,
  detail: (id: string) => ["meetings", id] as const,
};
