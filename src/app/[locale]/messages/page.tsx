"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, User, Building2, Plus, X, Search, Loader2 } from "lucide-react";
import { useT } from "@/lib/useT";

type ConversationItem = {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  refType?: string | null;
};

type ContactUser = {
  _id: string;
  name: string;
  role: "professional" | "employer";
  avatar?: string | null;
  profession?: string | null;
  location?: string | null;
  refType?: string | null;
  refId?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  professional: "محترف",
  employer: "شركة",
};

function Avatar({ name, role, size = "md" }: { name: string; role?: string; size?: "md" | "lg" }) {
  const initials = (name || "؟").slice(0, 2);
  const cls =
    size === "lg"
      ? "w-12 h-12 text-base"
      : "w-12 h-12 text-sm";
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
        role === "employer"
          ? "bg-sky-100 text-sky-700"
          : "bg-primary/10 text-primary"
      }`}
    >
      {initials}
    </div>
  );
}

function NewConversationModal({ onClose }: { onClose: () => void }) {
  const T = useT();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "professional" | "employer">("all");
  const [users, setUsers] = useState<ContactUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (tab !== "all") params.set("role", tab);
      fetch(`/api/messages/users?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => setUsers(d.users || []))
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  async function startChat(u: ContactUser) {
    setStartingId(u._id);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: u._id,
          content: T("مرحباً {name}، أود التواصل معك", { name: u.name }),
          refType: u.refType || undefined,
          refId: u.refId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.conversationId) {
        onClose();
        window.location.href = `/messages/${data.conversationId}`;
      } else {
        alert(data.error ? T(data.error) : T("فشل بدء المحادثة"));
      }
    } catch {
      alert(T("فشل الاتصال"));
    }
    setStartingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[var(--surface)] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: "85dvh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <h3 className="font-bold text-base">{T("رسالة جديدة")}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[var(--border-light)] flex items-center justify-center">
            <X className="w-4 h-4 text-[var(--muted-light)]" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={T("ابحث عن محترف أو شركة...")}
              className="w-full py-2.5 px-4 pr-10 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/5 transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
          </div>

          <div className="flex gap-1.5 mt-3">
            {([
              ["all", "الكل"],
              ["professional", "محترفون"],
              ["employer", "شركات"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tab === key ? "bg-primary text-white" : "bg-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--border)]"
                }`}
              >
                {T(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm">{T("لا يوجد مستخدمون")}</div>
          ) : (
            users.map((u) => (
              <button
                key={u._id}
                onClick={() => startChat(u)}
                disabled={startingId === u._id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Avatar name={u.name} role={u.role} />
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{u.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === "employer"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {T(ROLE_LABELS[u.role]) || u.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">
                    {u.profession ? T("المهنة: {profession}", { profession: u.profession }) : u.location || u.role === "employer" ? T("شركة") : ""}
                  </p>
                </div>
                {startingId === u._id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Plus className="w-4 h-4 text-muted-light" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const T = useT();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.status === 401) return;
        const d = await res.json();
        if (!cancelled && d.conversations) setConversations(d.conversations);
      } catch {}
      if (!cancelled) setLoading(false);
    };
    fetchList();
    const interval = setInterval(fetchList, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function timeAgo(dateStr: string) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return T("الآن");
    if (mins < 60) return T("منذ {mins} د", { mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return T("منذ {hours} س", { hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return T("منذ {days} ي", { days });
    return new Date(dateStr).toLocaleDateString("ar");
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <MessageSquare className="w-4 h-4" />
        </button>
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1>{T("الرسائل")}</h1>
      </div>

      <button
        onClick={() => setShowNew(true)}
        className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm transition border border-primary/10"
      >
        <Plus className="w-4 h-4" />
        {T("رسالة جديدة")}
      </button>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <Mail />
          <h3>{T("لا توجد رسائل")}</h3>
          <p>{T("ابدأ محادثة مع محترف أو شركة وسوف تظهر هنا")}</p>
          <button onClick={() => setShowNew(true)} className="btn btn-primary mt-4">
            {T("بدء محادثة جديدة")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => router.push(`/messages/${conv._id}`)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-right w-full"
            >
              <Avatar name={conv.otherUser?.name || T("مستخدم")} role={conv.otherUser?.role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-sm truncate">{conv.otherUser?.name || T("مستخدم")}</span>
                    {conv.otherUser?.role && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          conv.otherUser.role === "employer"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {T(ROLE_LABELS[conv.otherUser.role]) || conv.otherUser.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewConversationModal onClose={() => setShowNew(false)} />
      )}
    </div>
  );
}
