import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Mic, MicOff, Paperclip, Phone, Search, Send, Video, VideoOff, X } from "lucide-react";
import { useEffect, useState } from "react";

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

type Contact = {
  id: number;
  name: string;
  avatar: string;
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "John", content: "Hey, how are you?", timestamp: "10:00 AM" },
    { id: 2, sender: "You", content: "Im good, thanks! How about you?", timestamp: "10:02 AM" },
    { id: 3, sender: "John", content: "Doing well! Want to have a quick call?", timestamp: "10:05 AM" },
    { id: 4, sender: "You", content: "Sure, lets do it!", timestamp: "10:07 AM" },
    { id: 5, sender: "John", content: "Great! Ill set up a video call.", timestamp: "10:08 AM" },
    { id: 6, sender: "You", content: "Sounds good. Talk to you soon!", timestamp: "10:10 AM" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(messages);

  const contacts: Contact[] = [
    { id: 1, name: "John Doe", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 2, name: "Jane Smith", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 3, name: "Bob Johnson", avatar: "/placeholder.svg?height=40&width=40" },
  ];

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = messages.filter(
      (message) => message.content.toLowerCase().includes(lowercasedQuery) || message.sender.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredMessages(filtered);
  }, [searchQuery, messages]);

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

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-white border-r transition-all duration-300 ${isSidebarOpen ? "w-80" : "w-0"}`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">Contacts</h2>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
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
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
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
          <div className="flex items-center">
            <div className="relative mr-2">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search messages..."
                className="pl-10 pr-4 py-2 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleCall(false)}>
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleCall(true)}>
              <Video className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          {filteredMessages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.sender === "You" ? "text-right" : ""}`}>
              <div className={`inline-block p-2 rounded-lg ${message.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>{message.content}</div>
              <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
            </div>
          ))}
        </ScrollArea>
        <div className="bg-white p-4 border-t flex items-center">
          <Button variant="ghost" size="icon" onClick={handleFileAttachment}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            className="flex-1 mx-2"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
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
