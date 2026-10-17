const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const mockUrl = (path: string) => `${API_URL}${path}`;
