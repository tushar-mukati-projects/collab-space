import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export const usePushSubscribe = () => {
  return useMutation({
    mutationFn: async () => {
      if (!("Notification" in window)) {
        throw new Error("This browser does not support notifications");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Register service worker if not already
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get or create push subscription
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });
        }
      }

      if (subscription) {
        const json = subscription.toJSON();
        await axiosInstance.post("/notifications/subscribe", {
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        });
      }

      return { permission: "granted" as const };
    },
    onSuccess: () => {
      toast.success("Push notifications enabled");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const usePushUnsubscribe = () => {
  return useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await axiosInstance.delete("/notifications/subscribe", {
            data: { endpoint: subscription.endpoint },
          });
          await subscription.unsubscribe();
        }
      }
    },
    onSuccess: () => {
      toast.success("Push notifications disabled");
    },
  });
};
