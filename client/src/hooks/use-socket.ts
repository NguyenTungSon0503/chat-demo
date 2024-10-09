import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constant/api";

export const useSocket = (userId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      console.error("User ID not found in cookies");
      return;
    }

    socketRef.current = io(SOCKET_URL, { query: { userId } });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef;
};
