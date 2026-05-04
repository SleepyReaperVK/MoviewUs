import { useCallback, useEffect, useRef, useState } from "react";

export type AlertPayload = { title: string; text: string; time: number | null };

function deriveWsUrl(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
  return apiUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws") + "/alerts";
}

export function useAlert() {
  const [notifications, setNotifications] = useState<AlertPayload[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wsUrl = deriveWsUrl();

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AlertPayload;
          if (data.title && data.text) {
            setNotifications((prev) => [...prev, { ...data }]);
          }
        } catch { /* ignore malformed messages */ }
      };

      ws.onclose = () => {
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Latest notification surfaces as the modal alert
  const pushAlert = notifications.length > 0 ? notifications[notifications.length - 1] : null;

  // Dismiss the latest (used by AlertModal auto-dismiss and close button)
  const dismissAlert = useCallback(() => {
    setNotifications((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  return { notifications, pushAlert, dismissAlert, dismissNotification };
}
