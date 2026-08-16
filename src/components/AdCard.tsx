import Image from "next/image";
import { Tag, MapPin } from "lucide-react";
import { getT } from "@/i18n/getT";

const CURRENCY_SYMBOLS: Record<string, string> = {
  YER: "﷼",
  SAR: "﷼",
  USD: "$",
};

type Props = {
  ad: {
    _id: string;
    type: string;
    category: string;
    title: string;
    description: string;
    price?: number;
    currency?: string;
    location: string;
    images?: string[];
  };
};

export default async function AdCard({ ad }: Props) {
  const T = await getT();
  const symbol = CURRENCY_SYMBOLS[ad.currency || "YER"] || "﷼";

  return (
    <div className="app-card h-scroll-card flex flex-col justify-between overflow-hidden">
      {ad.images && ad.images.length > 0 && ad.images[0] && (
        <div className="relative w-full h-32 bg-slate-100">
          <Image
            src={ad.images[0]}
            alt={ad.title}
            width={384}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex gap-1.5 mb-2">
            <span className={`badge ${ad.type === "professional" ? "badge-primary" : "badge-warning"}`}>
              {ad.type === "professional" ? T("خدمة مهنية") : T("إعلان تجاري")}
            </span>
            <span className="badge bg-[var(--border-light)] text-[var(--muted)] border border-[var(--border)]">
              {ad.category}
            </span>
          </div>

          <h4 className="text-sm font-bold mb-1 line-clamp-1">{ad.title}</h4>
          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-2">{ad.description}</p>
        </div>

        <div className="border-t border-gray-50 pt-2 flex justify-between items-center">
          <span className="price-tag flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {ad.price ? `${ad.price.toLocaleString()} ${symbol}` : T("حسب الاتفاق")}
          </span>
          <span className="text-[11px] text-muted-light flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {ad.location}
          </span>
        </div>
      </div>
    </div>
  );
}
