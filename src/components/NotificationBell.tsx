"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation"; 

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
  const pathname = usePathname(); 

  // 💡 الحل النهائي: استخدام الأنواع المتوافقة بدقة مع المتصفح والسيرفر دون كلمة any
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 🚀 تعديل المسار المطلق لتخطي مشكلة الـ Middleware واللغات (ar/en)
        const origin = window.location.origin;
        const res = await fetch(`${origin}/api/notifications?t=${Date.now()}`, {
          cache: "no-store"
        });

        if (res.status === 401) {
          console.warn("الجلسة منتهية أو غير مصرح به. تم إيقاف جلب الإشعارات في الخلفية.");
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current); 
          }
          
          const segments = pathname.split("/");
          const currentLocale = segments[1] === "ar" || segments[1] === "en" ? segments[1] : "";
          const loginPath = currentLocale ? `/${currentLocale}/login` : "/login";
          
          router.push(loginPath);
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

    // ⏱️ التحديث الدوري الحركي النظيف وتخزينه في المرجع المعرّف بدقة
    intervalRef.current = setInterval(fetchNotifications, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, pathname]);

  const handleNotificationClick = async (notif: INotification) => {
    setIsOpen(false); 

    if (notif.link) {
      const segments = pathname.split("/");
      const currentLocale = segments[1]; 
      
      const isLocalePresent = currentLocale === "ar" || currentLocale === "en";
      const finalLink = isLocalePresent ? `/${currentLocale}${notif.link}` : notif.link;

      console.log("Navigating securely to:", finalLink);
      router.push(finalLink);
    }

    try {
      // 🚀 تعديل مسار تحديث حالة القراءة إلى المسار المطلق
      const origin = window.location.origin;
      await fetch(`${origin}/api/notifications/${notif._id}/read`, { method: "PUT" });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <div className="relative">
      {/* زر الجرس 🔔 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none transition"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة للإشعارات */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50 text-right" style={{ direction: "rtl" }}>
          <div className="px-4 py-2 font-bold border-b border-gray-100 text-gray-700">
            <span>الإشعارات المستلمة</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)} 
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                    !notif.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}