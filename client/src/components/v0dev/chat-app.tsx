import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/config/api";
import { useMessages } from "@/hooks/use-message";
import { useSocket } from "@/hooks/use-socket";
import { formatDate } from "@/utils/formatDate";
import EmojiPicker from "emoji-picker-react";
import Cookies from "js-cookie";
import { Menu, Mic, MicOff, Paperclip, Phone, Send, Video, VideoOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  contacts: Contact[];
  selectedContact: Contact | null;
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
  const [inputMessage, setInputMessage] = useState("");
  const [allContact, setAllContact] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  const userId = Cookies.get("userId");
  const socketRef = useSocket();
  const messages = useMessages(selectedContact, socketRef);

  useEffect(() => {
    const fetchAllContacts = async () => {
      try {
        const response = await api.get(`api/groups`);
        setAllContact(response.data);
        setSelectedContact(response.data[0]);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchAllContacts();
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const messageData =
        selectedContact?.type === "direct"
          ? { content: inputMessage, senderId: userId, recipientId: selectedContact?.recipientId }
          : { content: inputMessage, senderId: userId, groupId: selectedContact?.id };

      socketRef.current?.emit("sendMessage", messageData);
      setInputMessage("");
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
    socketRef.current?.emit("addReaction", { messageId, reaction, userId: Number(userId) });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        contacts={allContact}
        setSelectedContact={setSelectedContact}
        selectedContact={selectedContact}
      />
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

const Sidebar = ({ isSidebarOpen, toggleSidebar, contacts, setSelectedContact, selectedContact }: SidebarProps) => (
  <div className={`bg-white border-r transition-all duration-300 ${isSidebarOpen ? "w-80" : "w-0"}`}>
    <div className="p-4 flex justify-between items-center border-b">
      <h2 className="font-semibold">Contacts</h2>
      <Button variant="ghost" onClick={toggleSidebar}>
        <X className="h-5 w-5" />
      </Button>
    </div>
    <ScrollArea className="h-[calc(100vh-64px)]">
      {contacts.map((contact) => (
        <div
          key={contact.name}
          className={`flex items-center p-4 ${selectedContact === contact ? "bg-blue-300 hover:bg-blue-400" : "bg-white hover:bg-gray-100 "} cursor-pointer`}
          onClick={() => setSelectedContact(contact)}
        >
          <Avatar>
            <AvatarImage
              src={contact.type === "group" ? contact.imageUrl : contact.profileImage}
              alt={contact.type === "group" ? contact.name : contact.name}
            />
            <AvatarFallback>{contact.type === "group" ? contact.name : contact.name}</AvatarFallback>
          </Avatar>
          <span className="ml-4 font-medium">{contact.type === "group" ? contact.name : contact.name}</span>
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
}: ChatAreaProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white p-4 flex justify-between items-center border-b">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <Button variant="ghost" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Avatar>
            <AvatarImage
              src={selectedContact?.type === "group" ? selectedContact.imageUrl : selectedContact?.profileImage}
              alt={selectedContact?.type === "group" ? selectedContact.name : selectedContact?.name}
            />
          </Avatar>
          <span className="ml-4 font-medium">{selectedContact?.type === "group" ? selectedContact.name : selectedContact?.name}</span>
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
      <ScrollArea className="flex-1 p-4 relative">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 relative ${message.sender.id === Number(userId) ? "text-right" : ""}`}>
            <div className="text-xs font-bold text-gray-500 mb-1">{formatDate(message.createdAt)}</div>
            <div
              className={`inline-block p-2 rounded-lg max-w-xs ${message.sender.id === Number(userId) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {message.content}
              {hoveredMessageId === message.id && message.sender.id !== Number(userId) && (
                <div className="absolute z-10">
                  <EmojiPicker
                    lazyLoadEmojis
                    reactionsDefaultOpen
                    allowExpandReactions
                    onReactionClick={(react) => handleReactionClick(message.id, react.getImageUrl())}
                    onEmojiClick={(emoji) => handleReactionClick(message.id, emoji.getImageUrl())}
                  />
                </div>
              )}
            </div>
            {message.reactions &&
              message.reactions.map((reaction) => (
                <div key={reaction.id} className={`w-4 h-4 mt-2 ${message.sender.id === Number(userId) ? "ml-auto" : ""}`}>
                  <img src={reaction.emoji}></img>
                </div>
              ))}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
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
};

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
          {isVideoCall ? "Video Call" : "Audio Call"} with {selectedContact?.type === "group" ? selectedContact.name : selectedContact?.name}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center">
        {isVideoCall && (
          <div className="bg-gray-300 w-full h-64 mb-4 rounded-lg flex items-center justify-center">
            {isVideoOff ? <VideoOff className="h-12 w-12 text-gray-500" /> : <span className="text-gray-500">Video Placeholder</span>}
          </div>
        )}
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage
            src={selectedContact?.type === "group" ? selectedContact.imageUrl : selectedContact?.profileImage}
            alt={selectedContact?.type === "group" ? selectedContact.name : selectedContact?.name}
          />
          <AvatarFallback>
            {selectedContact?.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-4">{selectedContact?.type === "group" ? selectedContact.name : selectedContact?.name}</h2>
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
