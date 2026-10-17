import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const toDueDateISO = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  const anchored = new Date(date);
  anchored.setHours(12, 0, 0, 0);
  return anchored.toISOString();
};
