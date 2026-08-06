"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, MessageSquare, User, Building2 } from "lucide-react";

type Msg = {
  _id: string;
  senderId: { _id: string; name: string; role: string };
  content: string;
  read: boolean;
  createdAt: string;
};

type OtherUser = {
  _id: string;
  name: string;
  role: string;
  email?: string;
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const myIdRef = useRef<string | null>(null);
  const markedReadRef = useRef(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setMyId(d.user.id);
          myIdRef.current = d.user.id;
        } else {
          router.push("/login");
        }
      });
  }, [router]);

  const markRead = useCallback(() => {
    fetch(`/api/messages/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403 || res.status === 404) {
          setError("لا يمكن الوصول إلى هذه المحادثة");
          setLoading(false);
          return;
        }
        const d = await res.json();
        if (cancelled) return;
        if (d.messages) {
          setMessages(d.messages);
          const hasUnreadFromOther = d.messages.some(
            (m: Msg) => m.senderId._id !== myIdRef.current && !m.read
          );
          if (hasUnreadFromOther && !markedReadRef.current) {
            markRead();
            markedReadRef.current = true;
          }
        }
        if (d.otherUser) setOtherUser(d.otherUser);
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, markRead, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      if (res.ok && data.message) {
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
      } else {
        alert(data.error || "فشل إرسال الرسالة");
      }
    } catch {}
    setSending(false);
  }

  if (error) {
    return (
      <div className="page-container max-w-2xl mx-auto">
        <div className="empty-state">
          <MessageSquare />
          <h3>{error}</h3>
          <button onClick={() => router.push("/messages")} className="btn btn-primary mt-4">
            العودة إلى الرسائل
          </button>
        </div>
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
          {otherUser?.role === "employer" ? (
            <Building2 className="w-4 h-4 text-sky-600" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm block truncate">{otherUser?.name || "المحادثة"}</span>
          <span className={`text-[11px] font-semibold ${otherUser?.role === "employer" ? "text-sky-600" : "text-primary"}`}>
            {otherUser?.role === "employer" ? "شركة" : otherUser?.role === "professional" ? "محترف" : ""}
          </span>
        </div>
        {otherUser?.role === "professional" && otherUser?._id && (
          <button
            onClick={() => router.push("/search")}
            className="text-[11px] font-bold text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
          >
            الملف المهني
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-4 space-y-3 mb-3" style={{ maxHeight: "calc(100dvh - 280px)" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted">جاري تحميل الرسائل...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-muted">لا توجد رسائل بعد</p>
            <p className="text-xs text-muted-light mt-1">أرسل أول رسالة لبدء المحادثة</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId._id === myId;
            const showDate =
              i === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(messages[i - 1].createdAt).toDateString();
            const prevIsSameSender =
              i > 0 && messages[i - 1].senderId._id === msg.senderId._id;
            return (
              <div key={msg._id}>
                {showDate && (
                  <div className="text-center my-3">
                    <span className="text-[10px] text-muted-light bg-[var(--border-light)] px-3 py-1 rounded-full">
                      {new Date(msg.createdAt).toLocaleDateString("ar")}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-[var(--border-light)] text-[var(--foreground)] rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 justify-end mt-1 ${isMe ? "text-white/60" : "text-[var(--muted-light)]"}`}>
                      <span className="text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMe && (
                        <span className={`text-[10px] font-bold ${msg.read ? "text-emerald-300" : "text-white/40"}`}>
                          {msg.read ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`h-1.5 ${prevIsSameSender ? "" : "my-0.5"}`} />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-1.5">
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
