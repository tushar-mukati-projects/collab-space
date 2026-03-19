import { prisma } from "../db.js";

const toLabelDTO = (label: { id: string; name: string; color: string }) => {
  return { id: label.id, name: label.name, color: label.color };
};

export const listLabels = async (workspaceId: string) => {
  const labels = await prisma.label.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { name: "asc" },
  });
  return labels.map(toLabelDTO);
};

export const createLabel = async (name: string, color: string, workspaceId: string) => {
  const label = await prisma.label.create({
    data: { name, color, workspace_id: workspaceId },
  });
  return toLabelDTO(label);
};

export const updateLabel = async (
  id: string,
  data: { name?: string; color?: string },
  workspaceId: string,
) => {
  const existing = await prisma.label.findFirst({
    where: { id, workspace_id: workspaceId },
  });
  if (!existing) return null;

  const label = await prisma.label.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
  return toLabelDTO(label);
};

export const deleteLabel = async (id: string, workspaceId: string) => {
  const existing = await prisma.label.findFirst({
    where: { id, workspace_id: workspaceId },
  });
  if (!existing) return false;

  await prisma.label.delete({ where: { id } });
  return true;
};
