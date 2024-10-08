import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import Cookies from "js-cookie";
import { Menu, Mic, MicOff, Paperclip, Phone, Send, Video, VideoOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

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

type GroupContact = {
  id: number;
  name: string;
  imageUrl: string;
  members: {
    user: {
      id: number;
      username: string;
    };
  }[];
  type: "group";
};

type DirectContact = {
  id: number;
  content: string | null;
  createdAt: Date;
  sender: {
    id: number;
    username: string;
  };
  type: "direct";
  recipient: {
    id: number;
    username: string;
    profileImage?: string;
  };
};

type Contact = GroupContact | DirectContact;

type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  contacts: Contact[];
  setSelectedContact: (contact: Contact) => void;
};

type ChatAreaProps = {
  userId?: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedContact: Contact | null;
  messages: Message[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleFileAttachment: () => void;
  handleCall: (video: boolean) => void;
  hoveredMessageId: number | null;
  setHoveredMessageId: (id: number | null) => void;
  handleReactionClick: (messageId: number, reaction: string) => void;
};

type CallDialogProps = {
  isCallActive: boolean;
  setIsCallActive: (active: boolean) => void;
  isVideoCall: boolean;
  selectedContact: Contact | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isVideoOff: boolean;
  setIsVideoOff: (videoOff: boolean) => void;
  handleEndCall: () => void;
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [allContact, setAllContact] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const userId = Cookies.get("userId");

  useEffect(() => {
    if (!userId) {
      console.error("User ID not found in cookies");
      return;
    }

    // Initialize socket only once when component mounts
    socketRef.current = io("http://localhost:5000", {
      query: { userId },
    });

    // Clean up the socket connection on component unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedContact || !socketRef.current) return;

    const { id, type } = selectedContact;

    // Fetch initial messages for the selected contact
    const fetchMessages = async () => {
      try {
        const params = type === "direct" ? { userId: Number(userId), recipientId: selectedContact.recipient.id } : { groupId: id };
        const queryString = new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>)
        );
        const response = await axios.get(`http://localhost:5000/api/messages/${type}?${queryString}`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Listen for new messages based on contact type
    const event = type === "direct" ? "newDirectMessage" : "newGroupMessage";
    socketRef.current.on(event, (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Manage joining and leaving rooms for group messages
    if (type === "group") {
      socketRef.current.emit("joinRoom", { groupId: id, userId });
    }

    return () => {
      // Cleanup the event listeners and leave the room when contact changes
      socketRef.current?.off(event);
      if (type === "group") {
        socketRef.current?.emit("leaveRoom", id);
      }
    };
  }, [selectedContact, userId]);

  useEffect(() => {
    fetchAllContacts();
  }, []);

  const fetchAllContacts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groups/${userId}`);
      setAllContact(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      if (selectedContact?.type === "direct") {
        const messageData = {
          content: inputMessage,
          senderId: userId,
          recipientId: selectedContact?.recipient.id,
        };
        socketRef.current?.emit("sendDirectMessage", messageData);
        setInputMessage("");
      } else if (selectedContact?.type === "group") {
        const messageData = {
          content: inputMessage,
          senderId: userId,
          groupId: selectedContact?.id,
        };
        socketRef.current?.emit("sendGroupMessage", messageData);
        setInputMessage("");
      }
    }
  };

  const handleFileAttachment = () => {
    console.log("File attachment clicked");
  };

  const handleCall = (video: boolean) => {
    setIsCallActive(true);
    setIsVideoCall(video);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsVideoCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleReactionClick = (messageId: number, reaction: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => (message.id === messageId ? { ...message, reaction: message.reaction === reaction ? "" : reaction } : message))
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} contacts={allContact} setSelectedContact={setSelectedContact} />
      <ChatArea
        userId={userId}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedContact={selectedContact}
        messages={messages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        handleFileAttachment={handleFileAttachment}
        handleCall={handleCall}
        hoveredMessageId={hoveredMessageId}
        setHoveredMessageId={setHoveredMessageId}
        handleReactionClick={handleReactionClick}
      />
      <CallDialog
        isCallActive={isCallActive}
        setIsCallActive={setIsCallActive}
        isVideoCall={isVideoCall}
        selectedContact={selectedContact}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isVideoOff={isVideoOff}
        setIsVideoOff={setIsVideoOff}
        handleEndCall={handleEndCall}
      />
    </div>
  );
}

const Sidebar = ({ isSidebarOpen, toggleSidebar, contacts, setSelectedContact }: SidebarProps) => (
  <div className={`bg-white border-r transition-all duration-300 ${isSidebarOpen ? "w-80" : "w-0"}`}>
    <div className="p-4 flex justify-between items-center border-b">
      <h2 className="font-semibold">Contacts</h2>
      <Button variant="ghost" onClick={toggleSidebar}>
        <X className="h-5 w-5" />
      </Button>
    </div>
    <ScrollArea className="h-[calc(100vh-64px)]">
      {contacts.map((contact) => (
        <div key={contact.id} className="flex items-center p-4 hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedContact(contact)}>
          <Avatar>
            <AvatarImage
              src={contact.type === "group" ? contact.imageUrl : contact.recipient.profileImage}
              alt={contact.type === "group" ? contact.name : contact.recipient.username}
            />
            <AvatarFallback>{contact.type === "group" ? contact.name : contact.recipient.username}</AvatarFallback>
          </Avatar>
          <span className="ml-4 font-medium">{contact.type === "group" ? contact.name : contact.recipient.username}</span>
        </div>
      ))}
    </ScrollArea>
  </div>
);

const ChatArea = ({
  userId,
  isSidebarOpen,
  toggleSidebar,
  selectedContact,
  messages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleFileAttachment,
  handleCall,
  hoveredMessageId,
  setHoveredMessageId,
  handleReactionClick,
}: ChatAreaProps) => (
  <div className="flex-1 flex flex-col">
    <div className="bg-white p-4 flex justify-between items-center border-b">
      <div className="flex items-center">
        {!isSidebarOpen && (
          <Button variant="ghost" onClick={toggleSidebar} className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Avatar>
          <AvatarImage src={selectedContact?.avatar} alt={selectedContact?.name} />
          <AvatarFallback>
            {/* {selectedContact?.name
              .split(" ")
              .map((n) => n[0])
              .join("")} */}
          </AvatarFallback>
        </Avatar>
        <span className="ml-4 font-medium">{selectedContact?.name || "Select a contact"}</span>
      </div>
      <div className="space-x-4">
        <Button variant="ghost" onClick={() => handleCall(false)}>
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={() => handleCall(true)}>
          <Video className="h-5 w-5" />
        </Button>
      </div>
    </div>
    <ScrollArea className="flex-1 p-4">
      {messages.map((message) => (
        <div key={message.id} className={`mb-4 ${message.sender.id === Number(userId) ? "text-right" : ""}`}>
          <div className="text-xs font-bold text-gray-500 mt-1">{formatDate(message.createdAt)}</div>
          <div
            className={`inline-block p-2 rounded-lg max-w-xs ${message.sender.id === Number(userId) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            {message.content}
            {hoveredMessageId === message.id && message.sender.id !== Number(userId) && (
              <div className="absolute">
                <EmojiPicker
                  lazyLoadEmojis
                  reactionsDefaultOpen
                  allowExpandReactions
                  onReactionClick={(react) => handleReactionClick(message.id, react.emoji)}
                  onEmojiClick={(emoji) => console.log("Emoji clicked:", emoji)}
                />
              </div>
            )}
          </div>
          {/* {message.reaction && <div className="text-lg mt-1">{message.reaction}</div>} */}
        </div>
      ))}
    </ScrollArea>
    <div className="bg-white p-4 border-t flex items-center gap-3">
      <Input
        className="flex-1 mx-2 border-gray-300"
        placeholder="Type a message..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
      />
      <Button variant="ghost" onClick={handleFileAttachment} className="border-gray-400">
        <Paperclip className="h-5 w-5" />
      </Button>
      <Button onClick={handleSendMessage}>
        <Send className="h-5 w-5" />
      </Button>
    </div>
  </div>
);

const CallDialog = ({
  isCallActive,
  setIsCallActive,
  isVideoCall,
  selectedContact,
  isMuted,
  setIsMuted,
  isVideoOff,
  setIsVideoOff,
  handleEndCall,
}: CallDialogProps) => (
  <Dialog open={isCallActive} onOpenChange={setIsCallActive}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isVideoCall ? "Video Call" : "Audio Call"} with {selectedContact?.name}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center">
        {isVideoCall && (
          <div className="bg-gray-300 w-full h-64 mb-4 rounded-lg flex items-center justify-center">
            {isVideoOff ? <VideoOff className="h-12 w-12 text-gray-500" /> : <span className="text-gray-500">Video Placeholder</span>}
          </div>
        )}
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={selectedContact?.avatar} alt={selectedContact?.name} />
          <AvatarFallback>
            {/* {selectedContact?.name
              .split(" ")
              .map((n) => n[0])
              .join("")} */}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-4">{selectedContact?.name}</h2>
        <div className="flex space-x-4">
          <Button variant={isMuted ? "destructive" : "secondary"} onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          {isVideoCall && (
            <Button variant={isVideoOff ? "destructive" : "secondary"} onClick={() => setIsVideoOff(!isVideoOff)}>
              <Video className="h-5 w-5" />
            </Button>
          )}
          <Button variant="destructive" onClick={handleEndCall}>
            End Call
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
