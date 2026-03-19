type PrismaTicketStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
type PrismaTicketPriority = "urgent" | "high" | "medium" | "low" | "none";
type PrismaTicketParentType = "board" | "ticket";

const statusToApi: Record<string, string> = {
  in_progress: "in-progress",
  in_review: "in-review",
};

const statusToDb: Record<string, string> = {
  "in-progress": "in_progress",
  "in-review": "in_review",
};

export const serializeStatus = (dbValue: string): string => {
  return statusToApi[dbValue] ?? dbValue;
};

export const deserializeStatus = (apiValue: string): PrismaTicketStatus => {
  return (statusToDb[apiValue] ?? apiValue) as PrismaTicketStatus;
};

export const serializePriority = (dbValue: string): string => {
  return dbValue;
};

export const deserializePriority = (apiValue: string): PrismaTicketPriority => {
  return apiValue as PrismaTicketPriority;
};

export const deserializeParentType = (apiValue: string): PrismaTicketParentType => {
  return apiValue as PrismaTicketParentType;
};
