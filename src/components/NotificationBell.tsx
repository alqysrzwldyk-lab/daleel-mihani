"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell } from "lucide-react";

interface INotification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary transition rounded-xl hover:bg-gray-50"
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
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 font-bold text-sm border-b border-gray-100 flex items-center justify-between">
              <span>الإشعارات</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary text-[11px]">{unreadCount} جديد</span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted text-sm">
                  لا توجد إشعارات حالياً
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                      !notif.isRead ? "bg-primary-50/50" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => { setIsOpen(false); router.push("/notifications"); }}
                className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary-50 transition border-t border-gray-50"
              >
                عرض الكل
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
