import { useEffect, useRef, useState } from "react";

export type AlertPayload = { title: string; text: string; time: number | null };

function deriveWsUrl(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
  return apiUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws") + "/alerts";
}

export function useAlert() {
  const [pushAlert, setPushAlert] = useState<AlertPayload | null>(null);
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
          if (data.title && data.text) setPushAlert(data);
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

  return { pushAlert, dismissAlert: () => setPushAlert(null) };
}
