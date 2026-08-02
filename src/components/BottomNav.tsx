"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, Search, PlusSquare, Bell, MessageCircle, User } from "lucide-react";

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/search", label: "بحث", icon: Search },
  { href: "/messages", label: "الرسائل", icon: MessageCircle },
  { href: "/add-post", label: "إضافة إعلان", icon: PlusSquare },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/profile", label: "حسابي", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/notifications?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUnreadMessages(
            (data.conversations || []).reduce(
              (s: number, c: { unread: number }) => s + (c.unread || 0),
              0
            )
          );
        }
      } catch {}
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/search") return pathname.startsWith("/search");
    if (href === "/messages") return pathname.startsWith("/messages");
    if (href === "/add-post") return pathname.startsWith("/add-post");
    if (href === "/notifications") return pathname.startsWith("/notifications");
    if (href === "/profile") {
      return pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/create-profile");
    }
    return false;
  };

  return (
    <nav className="bottom-nav mobile-only">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);

        let finalHref: string = tab.href;
        if (tab.href === "/profile") {
          if (!user) finalHref = "/login";
          else if (user.role === "professional") finalHref = "/dashboard";
          else finalHref = "/search";
        }
        if ((tab.href === "/notifications" || tab.href === "/messages") && !user) finalHref = "/login";
        if (tab.href === "/add-post" && !user) finalHref = "/login";

        return (
          <Link
            key={tab.href}
            href={finalHref}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            <div style={{ position: "relative" }}>
              <Icon />
              {tab.href === "/notifications" && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
              {tab.href === "/messages" && unreadMessages > 0 && (
                <span className="nav-badge">{unreadMessages > 99 ? "99+" : unreadMessages}</span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
