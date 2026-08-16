"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import { Bell } from "lucide-react";
import HireRequestActions from "@/components/HireRequestActions";

interface INotification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  type?: string;
  createdAt: string;
  data?: {
    action?: string;
    hireRequestId?: string;
    status?: string;
    companyName?: string;
    title?: string;
    senderName?: string;
    conversationId?: string;
  };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const T = useT();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const origin = window.location.origin;
        const res = await fetch(`${origin}/api/notifications?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 10000);

    const handleReadAll = () => {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    window.addEventListener("notifications:read", handleReadAll);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("notifications:read", handleReadAll);
    };
  }, []);

  const markAllRead = async () => {
    try {
      const origin = window.location.origin;
      await fetch(`${origin}/api/notifications/read-all`, { method: "POST" });
    } catch {}
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    window.dispatchEvent(new Event("notifications:read"));
  };

  const handleToggle = () => {
    if (!isOpen) markAllRead();
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif: INotification) => {
    setIsOpen(false);

    try {
      const origin = window.location.origin;
      await fetch(`${origin}/api/notifications/${notif._id}/read`, { method: "PUT" });
    } catch {}

    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleHireResolved = (notifId: string, status: string, conversationId?: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notifId
          ? { ...n, data: { ...(n.data || {}), status, conversationId } }
          : n
      )
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-[var(--muted)] hover:text-primary transition rounded-xl hover:bg-[var(--border-light)]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="nav-badge" style={{ top: -2, right: -2 }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border-light)] z-50 overflow-hidden">
            <div className="px-4 py-3 font-bold text-sm border-b border-[var(--border-light)] flex items-center justify-between">
              <span>{T("الإشعارات")}</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary text-[11px]">{unreadCount} {T("جديد")}</span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted text-sm">
                  {T("لا توجد إشعارات حالياً")}
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 border-b border-[var(--border-light)] hover:bg-[var(--border-light)] transition cursor-pointer ${
                      !notif.isRead ? "bg-primary-50/50" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.message}</p>

                    {notif.data?.action === "hire" && (
                      <div className="mt-2">
                        <div className="rounded-lg bg-[var(--border-light)] border border-[var(--border)] px-3 py-2">
                          {notif.data.companyName && (
                            <p className="text-xs font-bold text-[var(--foreground)]">{notif.data.companyName}</p>
                          )}
                          {notif.data.title && (
                            <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                              {notif.data.title}
                            </p>
                          )}
                        </div>
                        <HireRequestActions
                          hireRequestId={notif.data.hireRequestId!}
                          status={notif.data.status}
                          onResolved={(status, conversationId) =>
                            handleHireResolved(notif._id, status, conversationId)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => { setIsOpen(false); router.push("/notifications"); }}
                className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary-50 transition border-t border-gray-50"
              >
                {T("عرض الكل")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
