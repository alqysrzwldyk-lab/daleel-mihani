"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Home, Mail, Bell, Megaphone, User, LayoutDashboard, Briefcase,
  Globe, LogOut, X, Building2, ChevronLeft, Settings
} from "lucide-react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

export default function UserMenu({
  open,
  onClose,
  user,
  onLogout,
  hasProfile,
}: {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  onLogout: () => void;
  hasProfile: boolean;
}) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClose() {
    setAnimating(false);
    onClose();
  }

  if (!open && !animating) return null;

  return (
    <>
      <div className="usermenu-overlay" onClick={handleClose} />
      <div className="usermenu-drawer">
        <div className="usermenu-header">
          <div className="usermenu-avatar">
            {user.role === "professional" ? (
              <User />
            ) : (
              <Building2 />
            )}
          </div>
          <div className="usermenu-user-info">
            <div className="usermenu-user-name">{user.name}</div>
            <div className="usermenu-user-email">{user.email}</div>
            <div className="usermenu-role-badge">
              {user.role === "professional" ? "محترف" : "صاحب عمل"}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="usermenu-body">
          <div className="usermenu-section-label">التنقل</div>

          <Link href="/" className="usermenu-item" onClick={handleClose}>
            <Home className="usermenu-item-icon" />
            <span className="usermenu-item-text">الرئيسية</span>
          </Link>

          <Link href="/search" className="usermenu-item" onClick={handleClose}>
            <Briefcase className="usermenu-item-icon" />
            <span className="usermenu-item-text">المهنيون</span>
          </Link>

          <Link href="/search?type=ad" className="usermenu-item" onClick={handleClose}>
            <Megaphone className="usermenu-item-icon" />
            <span className="usermenu-item-text">الإعلانات</span>
          </Link>

          <div className="usermenu-divider" />

          <div className="usermenu-section-label">التواصل</div>

          <Link href="/notifications" className="usermenu-item" onClick={handleClose}>
            <Bell className="usermenu-item-icon" />
            <span className="usermenu-item-text">الإشعارات</span>
          </Link>

          <div className="usermenu-item opacity-40" onClick={(e) => e.preventDefault()}>
            <Mail className="usermenu-item-icon" />
            <span className="usermenu-item-text">الرسائل</span>
            <span className="usermenu-item-badge">قريباً</span>
          </div>

          <div className="usermenu-divider" />

          <div className="usermenu-section-label">حسابك</div>

          {user.role === "professional" && (
            <>
              <Link href="/dashboard" className="usermenu-item" onClick={handleClose}>
                <LayoutDashboard className="usermenu-item-icon" />
                <span className="usermenu-item-text">لوحة التحكم</span>
              </Link>

              {!hasProfile && (
                <Link href="/create-profile" className="usermenu-item" onClick={handleClose}>
                  <User className="usermenu-item-icon" />
                  <span className="usermenu-item-text">إنشاء ملف مهني</span>
                  <span className="usermenu-item-badge">جديد</span>
                </Link>
              )}
            </>
          )}

          <Link href="/profile" className="usermenu-item" onClick={handleClose}>
            <Settings className="usermenu-item-icon" />
            <span className="usermenu-item-text">الحساب</span>
          </Link>

          <Link href="/dashboard/my-ads" className="usermenu-item" onClick={handleClose}>
            <Megaphone className="usermenu-item-icon" />
            <span className="usermenu-item-text">إعلاناتي</span>
          </Link>

          <div className="usermenu-divider" />

          <div className="usermenu-section-label">الإعدادات</div>

          <div className="usermenu-item opacity-40" onClick={(e) => e.preventDefault()}>
            <Globe className="usermenu-item-icon" />
            <span className="usermenu-item-text">اللغة</span>
            <span className="text-xs text-gray-400">العربية</span>
          </div>
        </div>

        <div className="usermenu-footer">
          <button
            onClick={onLogout}
            className="usermenu-item usermenu-item-danger"
            style={{ padding: "13px 0", justifyContent: "center" }}
          >
            <LogOut className="usermenu-item-icon" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
}
