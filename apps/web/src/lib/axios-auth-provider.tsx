"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { axiosInstance } from "./axios";

export const AxiosAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    const id = axiosInstance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axiosInstance.interceptors.request.eject(id);
  }, [getToken]);

  return children;
};
