import ChatInterface from "@/components/chat/chat-interface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant | Warehouse AI",
  description: "Tanya jawab cerdas mengenai stok dan gudang Anda",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto p-4">
      <ChatInterface />
    </div>
  );
}