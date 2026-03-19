import type { StatusDefinition } from "@/types";

export const mockStatuses: StatusDefinition[] = [
  { id: "sts_01", value: "backlog", name: "Backlog", color: "#6b7280", order: 0 },
  { id: "sts_02", value: "todo", name: "Todo", color: "#3b82f6", order: 1 },
  { id: "sts_03", value: "in-progress", name: "In Progress", color: "#f59e0b", order: 2 },
  { id: "sts_04", value: "in-review", name: "In Review", color: "#8b5cf6", order: 3 },
  { id: "sts_05", value: "done", name: "Done", color: "#10b981", order: 4 },
];
