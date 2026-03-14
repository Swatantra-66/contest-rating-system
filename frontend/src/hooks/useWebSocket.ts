import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/ws";

export interface OnlineUser {
  user_id: string;
  user_name: string;
  rating: number;
  tier: string;
  image_url: string;
}

export interface ChallengePayload {
  from_id: string;
  from_name: string;
  from_rating: number;
  to_id: string;
  contest_id: string;
  difficulty: string;
  mode: string;
}

export interface WSHandlers {
  onOnlineUsers?: (users: OnlineUser[]) => void;
  onChallengeReceived?: (payload: ChallengePayload) => void;
  onChallengeResponse?: (payload: {
    contest_id: string;
    from_id: string;
    to_id: string;
    accepted: boolean;
  }) => void;
  onReadyUpdate?: (payload: {
    contest_id: string;
    ready_count: number;
    user_id: string;
  }) => void;
  onDuelStart?: (payload: { contest_id: string }) => void;
  onOpponentLeft?: (payload: { contest_id: string; user_id: string }) => void;
  onOpponentWon?: (payload: { contest_id: string }) => void;
}

export function useWebSocket(params: {
  userId: string;
  userName: string;
  tier: string;
  imageUrl: string;
  handlers: WSHandlers;
  enabled: boolean;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const send = useCallback((type: string, payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    if (!params.enabled || !params.userId) return;

    const url = `${WS_URL}?user_id=${params.userId}&user_name=${encodeURIComponent(params.userName)}&tier=${params.tier}&image_url=${encodeURIComponent(params.imageUrl)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const payload =
          typeof msg.payload === "string"
            ? JSON.parse(msg.payload)
            : msg.payload;

        switch (msg.type) {
          case "online_users":
            params.handlers.onOnlineUsers?.(payload);
            break;
          case "challenge_received":
            params.handlers.onChallengeReceived?.(payload);
            break;
          case "challenge_response":
            params.handlers.onChallengeResponse?.(payload);
            break;
          case "ready_update":
            params.handlers.onReadyUpdate?.(payload);
            break;
          case "duel_start":
            params.handlers.onDuelStart?.(payload);
            break;
          case "opponent_left":
            params.handlers.onOpponentLeft?.(payload);
            break;
          case "opponent_won":
            params.handlers.onOpponentWon?.(payload);
            break;
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, [params.enabled, params.userId]);

  return { send, connected };
}
