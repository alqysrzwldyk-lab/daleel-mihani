"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, User, Building2, Loader2, MessageSquare } from "lucide-react";

type Msg = {
  _id: string;
  senderId: { _id: string; name: string; role: string };
  content: string;
  read: boolean;
  createdAt: string;
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherUser, setOtherUser] = useState<{ _id: string; name: string; role: string } | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setMyId(d.user.id);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/messages/${conversationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) {
          setMessages(d.messages);
          const other = d.messages.find((m: Msg) => m.senderId._id !== myId);
          if (other) setOtherUser(other.senderId);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/messages/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }, [conversationId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages/${conversationId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.messages) setMessages(d.messages);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUser?._id,
          content: text.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            _id: data.message._id,
            senderId: { _id: myId!, name: "", role: "" },
            content: text.trim(),
            read: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setText("");
      }
    } catch {}
    setSending(false);
  }

  if (loading) {
    return (
      <div className="page-container max-w-2xl mx-auto">
        <div className="skeleton h-12 rounded-xl mb-4" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto flex flex-col" style={{ minHeight: "calc(100dvh - var(--nav-height) - var(--bottom-nav-height) - var(--safe-top) - var(--safe-bottom))" }}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          {otherUser?.role === "professional" ? (
            <User className="w-4 h-4 text-primary" />
          ) : (
            <Building2 className="w-4 h-4 text-primary" />
          )}
        </div>
        <div>
          <span className="font-bold text-sm">{otherUser?.name || "المحادثة"}</span>
          <span className="text-[11px] text-muted block">
            {otherUser?.role === "professional" ? "محترف" : "مستخدم"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-3" style={{ maxHeight: "calc(100dvh - 280px)" }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-muted">لا توجد رسائل بعد</p>
            <p className="text-xs text-muted-light mt-1">أرسل أول رسالة لبدء المحادثة</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId._id === myId;
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="text-center my-3">
                    <span className="text-[10px] text-muted-light bg-gray-50 px-3 py-1 rounded-full">
                      {new Date(msg.createdAt).toLocaleDateString("ar")}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 p-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1 py-2.5 px-4 outline-none text-sm bg-transparent"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
