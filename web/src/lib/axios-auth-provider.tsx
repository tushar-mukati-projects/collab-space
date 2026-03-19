"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { axiosInstance } from "./axios";

let tokenGetter: (() => Promise<string | null>) | null = null;

axiosInstance.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Clerk not ready
    }
  }
  return config;
});

export const AxiosAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    tokenGetter = getToken;
    return () => {
      tokenGetter = null;
    };
  }, [getToken]);

  if (!isLoaded) return null;

  return children;
};
