import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { Ref } from "vue";

import { buildNotificationsUrl } from "@/api/config";

export type AppNotification = {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
};

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useNotifications = (enabled: Ref<boolean> | boolean) => {
  const isEnabled = computed(() =>
    typeof enabled === "boolean" ? enabled : enabled.value
  );
  const notifications = ref<AppNotification[]>([]);
  const socket = ref<WebSocket | null>(null);
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const teardown = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data) as Record<string, unknown>;
      const eventName =
        typeof payload.event === "string" && payload.event.length > 0
          ? payload.event
          : "notification";
      notifications.value = [
        {
          id: createNotificationId(),
          event: eventName,
          payload,
          receivedAt: new Date().toISOString(),
        },
        ...notifications.value,
      ].slice(0, 6);
    } catch (error) {
      console.warn("Ignored notification payload", error);
    }
  };

  watch(
    isEnabled,
    (active) => {
      teardown();
      if (!active) {
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }

      const ws = new WebSocket(buildNotificationsUrl(token));
      socket.value = ws;
      ws.addEventListener("message", handleMessage);
      ws.addEventListener("error", teardown);
      ws.addEventListener("close", teardown);

      heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    teardown();
  });

  const dismiss = (id: string) => {
    notifications.value = notifications.value.filter((item) => item.id !== id);
  };

  const clearAll = () => {
    notifications.value = [];
  };

  return { notifications, dismiss, clearAll };
};
