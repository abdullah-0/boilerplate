"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildNotificationsUrl } from "@/lib/config";

export type AppNotification = {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
};

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useNotifications = (enabled: boolean) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    let isMounted = true;
    const socket = new WebSocket(buildNotificationsUrl(token));
    socketRef.current = socket;

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        if (!isMounted) {
          return;
        }
        const eventName =
          typeof payload.event === "string" && payload.event.length > 0
            ? payload.event
            : "notification";

        setNotifications((prev) => {
          const next: AppNotification[] = [
            {
              id: createNotificationId(),
              event: eventName,
              payload,
              receivedAt: new Date().toISOString(),
            },
            ...prev,
          ];
          return next.slice(0, 6);
        });
      } catch (error) {
        console.warn("Ignored notification payload", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    const cleanup = () => {
      isMounted = false;
      window.clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socketRef.current = null;
      socket.removeEventListener("message", handleMessage);
    };

    socket.addEventListener("close", cleanup);
    socket.addEventListener("error", cleanup);

    return cleanup;
  }, [enabled]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return useMemo(
    () => ({ notifications, dismiss, clearAll }),
    [clearAll, dismiss, notifications]
  );
};
