import { api } from "@/config/api";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

type GroupContact = {
  id: string;
  name: string;
  imageUrl?: string;
  members: Member[];
  type: "group";
};

type Member = {
  userId: number;
  username: string;
  profileImage?: string;
};

type DirectContact = {
  recipientId: number;
  name: string;
  profileImage?: string;
  type: "direct";
};

type Contact = GroupContact | DirectContact;

type DirectMessage = {
  id: number;
  createdAt: string;
  content: string | null;
  sender: {
    id: number;
    username: string;
  };
  reactions: {
    id: number;
    user: {
      id: number;
      username: string;
    };
    emoji: string;
  }[];
};

type GroupMessage = {
  id: number;
  createdAt: string;
  content: string | null;
  sender: {
    id: number;
    username: string;
  };
  reactions: {
    id: number;
    user: {
      id: number;
      username: string;
    };
    emoji: string;
  }[];
};

type Message = DirectMessage | GroupMessage;

export const useMessages = (selectedContact: Contact | null, socketRef: React.MutableRefObject<Socket | null>) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!selectedContact) return;

    const id = selectedContact.type === "group" ? selectedContact.id : selectedContact.recipientId;
    const { type } = selectedContact;

    const fetchMessages = async () => {
      try {
        const params = type === "direct" ? { recipientId: id } : { groupId: id };
        const queryString = new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>)
        );
        const response = await api.get(`api/messages/${type}?${queryString}`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedContact]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewReaction = (updatedMessage: Message) => {
      setMessages((prevMessages) => prevMessages.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)));
    };

    socket.on("newReaction", handleNewReaction);

    return () => {
      socket.off("newReaction", handleNewReaction);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!selectedContact || !socket) return;

    const id = selectedContact.type === "group" ? selectedContact.id : selectedContact.recipientId;
    const { type } = selectedContact;

    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on("newMessage", handleNewMessage);

    if (type === "group") {
      socket.emit("joinRoom", { groupId: id });
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      if (type === "group") {
        socket.emit("leaveRoom", id);
      }
    };
  }, [selectedContact]);

  return messages;
};
