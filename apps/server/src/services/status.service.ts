import { prisma } from "../db.js";
import { serializeStatus } from "../utils.js";

const toStatusDTO = (sd: {
  id: string;
  value: string;
  name: string;
  color: string;
  order: number;
}) => {
  return {
    id: sd.id,
    value: serializeStatus(sd.value),
    name: sd.name,
    color: sd.color,
    order: sd.order,
  };
};

export const listStatuses = async (workspaceId: string) => {
  const definitions = await prisma.statusDefinition.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { order: "asc" },
  });
  return definitions.map(toStatusDTO);
};

export const updateStatus = async (
  id: string,
  data: { name?: string; color?: string },
  workspaceId: string,
) => {
  const existing = await prisma.statusDefinition.findFirst({
    where: { id, workspace_id: workspaceId },
  });
  if (!existing) return null;

  const updated = await prisma.statusDefinition.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
  return toStatusDTO(updated);
};
