"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Send } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
};

type Data = { notifications: Row[]; total: number; page: number; totalPages: number };

export default function AdminNotificationsPage() {
  const T = useT();
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const url = `/api/admin/notifications?page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function broadcast() {
    setSending(true);
    setMsg("");
    const res = await apiSend("/api/admin/notifications", "POST", {
      title: title.trim(),
      message: message.trim(),
      type,
      role: role || undefined,
      link: link.trim() || undefined,
    });
    if (res.error) {
      setMsg(res.error === "noRecipients" ? T("لا يوجد مستلمون لهذه الفئة") : T("حدث خطأ"));
    } else {
      setMsg(T("تم إرسال الإشعار إلى {count} مستخدم", { count: res.recipients }));
      setTitle("");
      setMessage("");
      setLink("");
      reload();
    }
    setSending(false);
    setConfirmOpen(false);
  }

  function requestBroadcast() {
    if (!title.trim() || !message.trim()) {
      setMsg(T("العنوان والنص مطلوبان"));
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("الإشعارات")}</h1>
      <p className="admin-page-subtitle">{T("إرسال إشعار جماعي للمستخدمين وعرض آخر الإشعارات")}</p>

      <div className="admin-table-wrap mb-5">
        <div className="px-4 py-3 font-extrabold text-sm border-b border-border">{T("إرسال إشعار جماعي")}</div>
        <div className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="admin-input"
              placeholder={T("العنوان")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select className="admin-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="info">{T("معلومة")}</option>
              <option value="success">{T("نجاح")}</option>
              <option value="warning">{T("تحذير")}</option>
              <option value="alert">{T("تنبيه")}</option>
            </select>
          </div>
          <textarea
            className="admin-input w-full min-h-[80px]"
            placeholder={T("نص الإشعار...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select className="admin-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">{T("جميع المستخدمين")}</option>
              <option value="professional">{T("المهنيون")}</option>
              <option value="employer">{T("أصحاب العمل")}</option>
            </select>
            <input
              className="admin-input flex-1 min-w-[200px]"
              placeholder={T("رابط داخلي اختياري (يبدأ بـ /)...")}
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button className="btn btn-primary btn-sm flex items-center gap-2" disabled={sending} onClick={requestBroadcast}>
              <Send className="w-4 h-4" />
              {sending ? T("جارٍ الإرسال...") : T("إرسال")}
            </button>
          </div>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "title", label: T("العنوان") },
            { key: "message", label: T("النص") },
            { key: "type", label: T("النوع") },
            { key: "read", label: T("الحالة") },
            { key: "created", label: T("التاريخ") },
          ]}
        >
          {data.notifications.map((n) => (
            <tr key={n.id}>
              <td>
                <p className="font-bold">{n.title}</p>
                <p className="text-[11px] text-muted-light">{n.recipientId}</p>
              </td>
              <td className="text-muted max-w-[260px] truncate">{n.message}</td>
              <td>
                <StatusPill value={n.type} />
              </td>
              <td>
                <span className={`admin-pill ${n.isRead ? "admin-pill-gray" : "admin-pill-blue"}`}>
                  {n.isRead ? T("مقروء") : T("غير مقروء")}
                </span>
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(n.createdAt)}</td>
            </tr>
          ))}
          {!data.notifications.length && (
            <tr>
              <td colSpan={5} className="text-center text-muted py-6">
                {T("لا توجد إشعارات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      <ConfirmModal
        open={confirmOpen}
        title={T("تأكيد الإرسال الجماعي")}
        message={T("سيتم إرسال الإشعار إلى {audience}. هل أنت متأكد؟", {
          audience: role ? (role === "professional" ? T("المهنيون") : T("أصحاب العمل")) : T("جميع المستخدمين"),
        })}
        busy={sending}
        confirmLabel={T("إرسال")}
        onConfirm={broadcast}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
