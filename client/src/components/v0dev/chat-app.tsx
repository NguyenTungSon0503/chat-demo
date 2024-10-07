import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Video, Paperclip, Send, Mic, MicOff, VideoOff, Menu, X, SmilePlus } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  reaction?: string; // Add reaction property
};

type Contact = {
  id: number;
  name: string;
  avatar: string;
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "John", content: "Hey, how are you?", timestamp: "10:00 AM" },
    { id: 2, sender: "You", content: "I'm good, thanks! How about you?", timestamp: "10:02 AM" },
    { id: 3, sender: "John", content: "Doing well! Want to have a quick call?", timestamp: "10:05 AM" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  const contacts: Contact[] = [
    { id: 1, name: "John Doe", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 2, name: "Jane Smith", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 3, name: "Bob Johnson", avatar: "/placeholder.svg?height=40&width=40" },
  ];

  const handleSendMessage = () => {
    if (inputMessage.trim() !== "") {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: "You",
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([...messages, newMessage]);
      setInputMessage("");
    }
  };

  const handleFileAttachment = () => {
    // Implement file attachment logic here
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
    if (messages.find((message) => message.id === messageId)?.reaction === reaction) {
      reaction = "";
    }
    setMessages((prevMessages) => prevMessages.map((message) => (message.id === messageId ? { ...message, reaction } : message)));
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback>
                  {contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="ml-4 font-medium">{contact.name}</span>
            </div>
          ))}
        </ScrollArea>
      </div>
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
                {selectedContact?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
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
            <div key={message.id} className={`mb-4 ${message.sender === "You" ? "text-right" : ""}`}>
              <div className="text-xs font-bold text-gray-500 mt-1">{message.timestamp}</div>
              <div
                className={`inline-block p-2 rounded-lg max-w-xs ${message.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {message.content}
                {hoveredMessageId === message.id && message.sender !== "You" && (
                  <div className="absolute">
                    <EmojiPicker
                      lazyLoadEmojis
                      reactionsDefaultOpen
                      allowExpandReactions
                      onReactionClick={(react) => handleReactionClick(message.id, react.emoji)}
                      onEmojiClick={(emoji) => {
                        // setInputMessage((prev) => prev + emoji.emoji);
                        console.log("Emoji clicked:", emoji);
                      }}
                    />
                  </div>
                )}
              </div>
              {message.reaction && <div className="text-lg mt-1">{message.reaction}</div>}
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
                {selectedContact?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
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
    </div>
  );
}
