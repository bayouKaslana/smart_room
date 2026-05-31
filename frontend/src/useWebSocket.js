import { useEffect, useRef, useCallback } from "react";

const WS_URL = `ws://${window.location.hostname}:3000`;

// ==========================
// Custom Hook — useWebSocket
// Mengelola koneksi WebSocket dengan auto-reconnect
// ==========================
export default function useWebSocket(onMessage) {
  const wsRef         = useRef(null);
  const reconnectRef  = useRef(null);
  const onMessageRef  = useRef(onMessage);

  // Selalu pakai versi terbaru callback
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Tutup koneksi lama jika masih ada
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket terhubung ✅");
      // Batalkan reconnect timer jika berhasil
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.log("WebSocket parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket terputus, reconnect dalam 3 detik...");
      // Auto reconnect setiap 3 detik
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.log("WebSocket error:", err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current)   wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);
}