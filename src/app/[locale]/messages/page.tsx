"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Mail, User, Building2, ArrowLeft } from "lucide-react";

type ConversationItem = {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations) setConversations(d.conversations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} ي`;
    return new Date(dateStr).toLocaleDateString("ar");
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1>الرسائل</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <Mail />
          <h3>لا توجد رسائل</h3>
          <p>عندما تتواصل مع أحد المهنيين أو أصحاب العمل، ستظهر المحادثات هنا</p>
          <Link href="/search" className="btn btn-primary mt-4">ابحث عن مهنيين</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              href={`/messages/${conv._id}`}
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {conv.otherUser?.role === "professional" ? (
                  <User className="w-5 h-5 text-primary" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{conv.otherUser?.name || "مستخدم"}</span>
                  <div className="flex items-center gap-2">
                    {conv.unread > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {conv.unread}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-light">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{conv.lastMessage || "..."}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
