export const API_ROUTES = {
  tickets: "/tickets",
  ticket: (id: string) => `/tickets/${id}`,
  comments: (ticketId: string) => `/tickets/${ticketId}/comments`,
  activities: (ticketId: string) => `/tickets/${ticketId}/activities`,
  attachments: (ticketId: string) => `/tickets/${ticketId}/attachments`,
  attachment: (ticketId: string, attachmentId: string) =>
    `/tickets/${ticketId}/attachments/${attachmentId}`,
} as const;

export const QUERY_KEYS = {
  all: () => ["tickets"] as const,
  list: (filters?: object) => ["tickets", "list", filters ?? {}] as const,
  detail: (id: string) => ["tickets", id] as const,
  comments: (ticketId: string) => ["tickets", ticketId, "comments"] as const,
  activities: (ticketId: string) => ["tickets", ticketId, "activities"] as const,
  attachments: (ticketId: string) => ["tickets", ticketId, "attachments"] as const,
};
