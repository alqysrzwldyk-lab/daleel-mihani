"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, BadgeCheck, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";

export default function ProfessionalSearchFilters() {
  const T = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const profession = searchParams.get("profession") || "";
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [availability, setAvailability] = useState(
    searchParams.get("availability") || ""
  );
  const [verified, setVerified] = useState(searchParams.get("verified") === "true");

  const [prevParams, setPrevParams] = useState(searchParams);
  if (prevParams !== searchParams) {
    setPrevParams(searchParams);
    setLocation(searchParams.get("location") || "");
    setAvailability(searchParams.get("availability") || "");
    setVerified(searchParams.get("verified") === "true");
  }

  function apply(next: Partial<{ location: string; availability: string; verified: boolean }>) {
    const finalLocation = next.location !== undefined ? next.location : location;
    const finalAvailability =
      next.availability !== undefined ? next.availability : availability;
    const finalVerified = next.verified !== undefined ? next.verified : verified;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (profession) params.set("profession", profession);
    if (finalLocation.trim()) params.set("location", finalLocation.trim());
    if (finalAvailability) params.set("availability", finalAvailability);
    if (finalVerified) params.set("verified", "true");
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ location: location });
          }}
          placeholder={T("بحث حسب الموقع")}
          className="input pl-9"
        />
      </div>

      <select
        value={availability}
        onChange={(e) => apply({ availability: e.target.value })}
        className="select"
      >
        <option value="">{T("التوفر")}: {T("الكل")}</option>
        <option value="available">{T("متاح")}</option>
        <option value="busy">{T("مشغول")}</option>
        <option value="away">{T("غير متاح")}</option>
      </select>

      <button
        onClick={() => apply({ verified: !verified })}
        className={`chip ${verified ? "active" : ""}`}
        aria-pressed={verified}
      >
        <BadgeCheck className="w-4 h-4" /> {T("الموثقون فقط")}
      </button>

      <button
        onClick={() => apply({ location })}
        className="btn btn-primary text-sm flex items-center gap-1.5"
      >
        <Search className="w-4 h-4" /> {T("بحث")}
      </button>
    </div>
  );
}
