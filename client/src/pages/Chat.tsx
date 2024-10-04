// ChatComponent.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { formatDate } from "@/utils/formatDate";
import { Image } from "lucide-react";
import { Label } from "@/components/ui/label";

const socket = io("http://localhost:5000");

const Chat = () => {
  const [rooms, setRooms] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState({
    id: "",
    name: "",
  });
  const [messages, setMessages] = useState<
    {
      id: string;
      content: string;
      user: {
        userId: string;
        username: string;
      };
      createdAt: string;
      type: string;
      fileUrl: string | null;
      fileName: string | null;
    }[]
  >([]);
  const [message, setMessage] = useState("");
  const [roomName, setRoomName] = useState("");
  const [openPopover, setOpenPopOver] = useState(false);
  const [isLoading] = useState(false);

  const userId = Cookies.get("userId");

  useEffect(() => {
    fetchRooms();

    if (selectedRoom?.id) {
      fetchMessages(selectedRoom?.id);
      socket.emit("joinRoom", selectedRoom?.id);
      socket.on("newMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }

    return () => {
      socket.emit("leaveRoom", selectedRoom?.id);
      socket.off("newMessage");
    };
  }, [selectedRoom?.id]);

  const fetchRooms = async () => {
    const response = await axios.get("http://localhost:5000/api/messages/rooms");
    const data = response.data;
    setRooms(data);
  };

  const fetchMessages = async (roomId: string) => {
    const response = await axios.get(`http://localhost:5000/api/messages/${roomId}`);
    const data = response.data;
    setMessages(data);
  };

  const createRoom = async () => {
    try {
      if (!roomName) {
        return;
      }
      await axios.post("http://localhost:5000/api/messages/rooms", { name: roomName });
      fetchRooms();
      setRoomName("");
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = (messageType = "text", fileName: string | null) => {
    if (userId && selectedRoom?.id) {
      const messageData = {
        content: message,
        type: messageType,
        userId,
        roomId: selectedRoom?.id,
        fileName,
      };
      socket.emit("sendMessage", messageData);
      if (messageType === "text") {
        setMessage("");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const filesArray = Array.from(fileList);
    (filesArray as File[]).forEach(async (file: File) => {
      const params = {
        blobName: file.name,
        roomName: selectedRoom.name,
      };
      const queryString = new URLSearchParams(params).toString();
      try {
        const response = await axios.get("http://localhost:5000/api/upload/generate-sas?" + queryString);
        const sasUrl = response.data.url;

        // Upload the file to the SAS URL
        const uploadResponse = await axios.put(sasUrl, file, {
          headers: {
            "x-ms-blob-type": "BlockBlob", // Specify Blob type
            "Content-Type": file.type,
          },
        });
        if (uploadResponse.status === 201) {
          sendMessage(file.type, file.name);
        }
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    });
  };

  return (
    <div className="justify-items-center container mx-auto">
      <h2>Rooms</h2>
      <div className="flex flex-row justify-between gap-5">
        <Input type="text" placeholder="Create new room" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
        <Button onClick={createRoom}>Create Room</Button>
      </div>
      <div>
        <Combobox
          options={rooms.map((room) => ({ label: room.name, value: room.id.toString() }))}
          openPopover={openPopover}
          setOpenPopOver={setOpenPopOver}
          selectedValue={selectedRoom?.id}
          handleSelect={(value) => {
            const selectedRoomObj = rooms.find((room) => room.id.toString() === value);
            if (!selectedRoomObj) {
              return;
            }
            setSelectedRoom(selectedRoomObj);
          }}
          isLoading={isLoading}
        />
      </div>
      {selectedRoom.id && (
        <Card>
          <CardHeader>
            <CardTitle>Chat in Room {selectedRoom.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col justify-between gap-5">
              <div>
                <ul>
                  {messages.map((msg, index) => (
                    <div className={`flex ${msg.user.userId == userId ? "justify-end" : "justify-start"} mb-2`} key={msg.id}>
                      <div className="flex flex-col">
                        <div className="flex flex-row justify-between gap-x-4">
                          <p className={msg.user.userId == userId ? "hidden" : "text-blue-600 text-sm font-bold"}>{msg.user.username}</p>
                          <p className="text-gray-500 text-sm font-bold">{formatDate(msg.createdAt)}</p>
                        </div>
                        <li key={index}>
                          <div className={`p-2 rounded ${msg.user.userId == userId ? "bg-blue-200" : "bg-gray-200"}`}>
                            {msg.fileName && msg.fileUrl ? (
                              <>
                                {/\.(jpg|jpeg|png|gif|bmp|webp|tiff)$/i.test(msg.fileName) ? (
                                  <img src={msg.fileUrl} alt="uploaded file" className="h-32 w-32" />
                                ) : /\.(pdf)$/i.test(msg.fileName) ? (
                                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                    View PDF
                                  </a>
                                ) : (
                                  <p>Unsupported file type</p>
                                )}
                              </>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                        </li>
                      </div>
                    </div>
                  ))}
                </ul>
              </div>
              <div className="flex flex-row gap-2">
                <Input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
                <Label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer hover:text-red-200">
                  <Image className="h-8 w-8" />
                </Label>
                <Input id="file-upload" type="file" accept="image/*,application/pdf" className="hidden" multiple onChange={handleFileUpload} />
                <Button onClick={() => sendMessage("text", null)}>Send</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Chat;
