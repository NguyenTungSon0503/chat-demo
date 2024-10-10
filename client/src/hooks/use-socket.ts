import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constant/api";
import Cookies from "js-cookie";

const accessToken = Cookies.get("accessToken");

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      console.error("accessToken not found");
      return;
    }

    socketRef.current = io(SOCKET_URL, { auth: { accessToken } });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
};
