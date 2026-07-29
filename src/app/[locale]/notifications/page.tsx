"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

type INotification = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/notifications?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string, link?: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>الإشعارات</h1>
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <span className="badge badge-primary">
            {notifications.filter((n) => !n.isRead).length} غير مقروء
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell />
          <h3>لا توجد إشعارات</h3>
          <p>ستظهر هنا الإشعارات عندما يرسل لك أحدهم طلب توظيف أو يقبل طلبك</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markAsRead(notif._id, notif.link)}
              className={`app-card p-4 cursor-pointer ${
                !notif.isRead ? "border-primary/20 bg-primary-50/50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    !notif.isRead ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{notif.message}</p>
                  <p className="text-[11px] text-muted-light mt-2">
                    {new Date(notif.createdAt).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-light shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
