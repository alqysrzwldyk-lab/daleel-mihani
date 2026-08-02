"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  User as UserIcon,
  MessageSquare,
  Loader2,
  Calendar,
} from "lucide-react";
import HireRequestActions from "@/components/HireRequestActions";

type HireDetail = {
  _id: string;
  companyName: string;
  title: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  employer: { _id: string; name: string; email: string } | null;
  professional: { _id: string; name: string; email: string } | null;
  conversationId: string | null;
};

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

export default function HireDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [hire, setHire] = useState<HireDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/hire/${id}`, { cache: "no-store" }).then(async (r) => ({
        status: r.status,
        body: await r.json(),
      })),
    ])
      .then(([me, hireRes]) => {
        if (!me.user) {
          router.push("/login");
          return;
        }
        setUser(me.user);
        if (hireRes.status === 401) {
          router.push("/login");
          return;
        }
        if (hireRes.status === 403) {
          setError("لا يمكنك الوصول إلى هذا الطلب");
        } else if (hireRes.status === 404) {
          setError("الطلب غير موجود");
        } else {
          setHire(hireRes.body.hire);
          setStatus(hireRes.body.hire.status);
          setConversationId(hireRes.body.hire.conversationId);
        }
      })
      .catch(() => setError("حدث خطأ أثناء تحميل الطلب"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !hire) {
    return (
      <div className="page-container max-w-xl mx-auto">
        <div className="empty-state">
          <Briefcase />
          <h3>{error || "الطلب غير موجود"}</h3>
          <button onClick={() => router.push("/notifications")} className="btn btn-primary mt-4">
            العودة إلى الإشعارات
          </button>
        </div>
      </div>
    );
  }

  const isProfessional = user?.role === "professional";
  const finalStatus = status || hire.status;

  return (
    <div className="page-container max-w-xl mx-auto">
      <button onClick={() => router.back()} className="back-btn mb-4">
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="app-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">{hire.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted mt-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              {hire.companyName}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              finalStatus === "accepted"
                ? "bg-emerald-50 text-emerald-600"
                : finalStatus === "rejected"
                  ? "bg-red-50 text-red-500"
                  : "bg-amber-50 text-amber-600"
            }`}
          >
            {finalStatus === "accepted"
              ? "تم القبول"
              : finalStatus === "rejected"
                ? "تم الرفض"
                : "قيد الانتظار"}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-light mt-3">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(hire.createdAt).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <div className="mt-5 bg-slate-50 rounded-xl p-4">
          <p className="font-bold text-sm mb-1.5">تفاصيل العرض</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{hire.message}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <UserIcon className="w-4 h-4 text-primary" />
          <span>
            {isProfessional ? hire.employer?.name : hire.professional?.name}
            {isProfessional ? " (صاحب الطلب)" : " (المهني المستهدف)"}
          </span>
        </div>
      </div>

      {isProfessional && finalStatus === "pending" && (
        <div className="app-card p-4 mt-4">
          <p className="text-sm font-bold mb-3">اتخذ قرارك الآن</p>
          <HireRequestActions
            hireRequestId={hire._id}
            status={finalStatus}
            onResolved={(s, convId) => {
              setStatus(s);
              if (convId) setConversationId(convId);
            }}
          />
        </div>
      )}

      {finalStatus === "accepted" && conversationId && (
        <div className="app-card p-4 mt-4 flex flex-col gap-3">
          <p className="text-sm text-success font-bold">تم قبول الطلب وفتح التواصل المباشر</p>
          <button
            onClick={() => router.push(`/messages/${conversationId}`)}
            className="btn btn-primary btn-block flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            فتح المحادثة المباشرة
          </button>
        </div>
      )}

      {finalStatus === "accepted" && !conversationId && (
        <div className="app-card p-4 mt-4">
          <p className="text-sm text-success font-bold">تم قبول الطلب</p>
        </div>
      )}

      {finalStatus === "rejected" && (
        <div className="app-card p-4 mt-4">
          <p className="text-sm text-red-500 font-bold">
            {isProfessional ? "رفضت هذا العرض" : "اعتذر المهني عن هذا العرض"}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => router.push("/notifications")}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
        >
          العودة إلى الإشعارات
        </button>
        {user?.role === "professional" && (
          <button
            onClick={() => router.push("/messages")}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            الرسائل
          </button>
        )}
      </div>
    </div>
  );
}
