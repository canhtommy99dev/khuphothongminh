import { Business } from "../../types";

export interface IndustrySectorDef {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  badgeClass: string;
  cardBg: string;
  borderClass: string;
  barColor: string;
  textColor: string;
  accentHex: string;
  description: string;
}

export const INDUSTRY_SECTORS: IndustrySectorDef[] = [
  {
    id: "Dịch vụ ăn uống",
    name: "Dịch vụ ăn uống",
    shortName: "Ẩm thực & Đồ uống",
    icon: "🍜",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    cardBg: "bg-amber-50/70 hover:bg-amber-50/90",
    borderClass: "border-amber-200",
    barColor: "bg-amber-500",
    textColor: "text-amber-800",
    accentHex: "#f59e0b",
    description: "Nhà hàng, quán ăn, cà phê, trà sữa, phở bò, điểm tâm"
  },
  {
    id: "Dịch vụ đời sống",
    name: "Dịch vụ đời sống",
    shortName: "Dịch vụ đời sống",
    icon: "✂️",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    cardBg: "bg-purple-50/70 hover:bg-purple-50/90",
    borderClass: "border-purple-200",
    barColor: "bg-purple-500",
    textColor: "text-purple-800",
    accentHex: "#a855f7",
    description: "Cắt tóc gội đầu, tiệm giặt ủi, spa thẩm mỹ, sửa xe máy, tiệm may"
  },
  {
    id: "Bán lẻ thương mại",
    name: "Bán lẻ thương mại",
    shortName: "Bán lẻ thương mại",
    icon: "🛒",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    cardBg: "bg-emerald-50/70 hover:bg-emerald-50/90",
    borderClass: "border-emerald-200",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-800",
    accentHex: "#10b981",
    description: "Cửa hàng tiện lợi 24/7, tạp hóa, siêu thị mini, shop thời trang"
  },
  {
    id: "Y tế / Chăm sóc sức khỏe",
    name: "Y tế / Chăm sóc sức khỏe",
    shortName: "Y tế & Sức khỏe",
    icon: "🏥",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    cardBg: "bg-rose-50/70 hover:bg-rose-50/90",
    borderClass: "border-rose-200",
    barColor: "bg-rose-500",
    textColor: "text-rose-800",
    accentHex: "#f43f5e",
    description: "Nhà thuốc GPP, phòng khám nha khoa, trạm y tế, phòng khám chuyên khoa"
  },
  {
    id: "Lưu trú & Cho thuê",
    name: "Lưu trú & Cho thuê",
    shortName: "Nhà trọ & Lưu trú",
    icon: "🏠",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    cardBg: "bg-blue-50/70 hover:bg-blue-50/90",
    borderClass: "border-blue-200",
    barColor: "bg-blue-500",
    textColor: "text-blue-800",
    accentHex: "#3b82f6",
    description: "Nhà trọ công nhân/sinh viên, nhà nghỉ, khách sạn, căn hộ mini"
  },
  {
    id: "Giáo dục & Đào tạo",
    name: "Giáo dục & Đào tạo",
    shortName: "Giáo dục & Đào tạo",
    icon: "🎓",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    cardBg: "bg-indigo-50/70 hover:bg-indigo-50/90",
    borderClass: "border-indigo-200",
    barColor: "bg-indigo-500",
    textColor: "text-indigo-800",
    accentHex: "#6366f1",
    description: "Lớp mầm non tư thục, trung tâm gia sư, bồi dưỡng ngoại ngữ, năng khiếu"
  },
  {
    id: "Cơ khí & Kỹ thuật số / Khác",
    name: "Cơ khí & Kỹ thuật số / Khác",
    shortName: "Kỹ thuật & Khác",
    icon: "🔧",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    cardBg: "bg-slate-50/70 hover:bg-slate-50/90",
    borderClass: "border-slate-200",
    barColor: "bg-slate-500",
    textColor: "text-slate-800",
    accentHex: "#64748b",
    description: "Sửa máy tính, điện thoại, điện lạnh, hàn cơ khí, quảng cáo, in ấn"
  }
];

export const getBusinessIndustryGroup = (b: Business): string => {
  if (b.industryGroup && b.industryGroup.trim()) {
    const ig = b.industryGroup.trim().toLowerCase();
    if (ig.includes("ăn uống") || ig.includes("đồ uống") || ig.includes("ẩm thực")) return "Dịch vụ ăn uống";
    if (ig.includes("đời sống")) return "Dịch vụ đời sống";
    if (ig.includes("bán lẻ") || ig.includes("thương mại")) return "Bán lẻ thương mại";
    if (ig.includes("y tế") || ig.includes("sức khỏe") || ig.includes("dược")) return "Y tế / Chăm sóc sức khỏe";
    if (ig.includes("lưu trú") || ig.includes("nhà trọ") || ig.includes("khách sạn") || ig.includes("nhà nghỉ")) return "Lưu trú & Cho thuê";
    if (ig.includes("giáo dục") || ig.includes("đào tạo")) return "Giáo dục & Đào tạo";
    if (ig.includes("cơ khí") || ig.includes("kỹ thuật") || ig.includes("khác")) return "Cơ khí & Kỹ thuật số / Khác";
    return b.industryGroup;
  }

  const typeLower = (b.type || "").toLowerCase();
  const nameLower = (b.name || "").toLowerCase();
  const combined = `${typeLower} ${nameLower}`;

  if (b.isAccommodation || combined.includes("nhà trọ") || combined.includes("nhà nghỉ") || combined.includes("khách sạn") || combined.includes("lưu trú") || combined.includes("homestay")) {
    return "Lưu trú & Cho thuê";
  }
  if (combined.includes("ăn uống") || combined.includes("cà phê") || combined.includes("cafe") || combined.includes("phở") || combined.includes("quán ăn") || combined.includes("nhà hàng") || combined.includes("trà sữa") || combined.includes("điểm tâm") || combined.includes("bánh")) {
    return "Dịch vụ ăn uống";
  }
  if (combined.includes("đời sống") || combined.includes("giặt ủi") || combined.includes("giặt") || combined.includes("tóc") || combined.includes("gội") || combined.includes("spa") || combined.includes("nail") || combined.includes("may") || combined.includes("sửa xe") || combined.includes("đồ da")) {
    return "Dịch vụ đời sống";
  }
  if (combined.includes("bán lẻ") || combined.includes("thương mại") || combined.includes("tiện lợi") || combined.includes("tạp hóa") || combined.includes("siêu thị") || combined.includes("shop") || combined.includes("cửa hàng")) {
    return "Bán lẻ thương mại";
  }
  if (combined.includes("y tế") || combined.includes("sức khỏe") || combined.includes("nha khoa") || combined.includes("thuốc") || combined.includes("dược") || combined.includes("phòng khám")) {
    return "Y tế / Chăm sóc sức khỏe";
  }
  if (combined.includes("giáo dục") || combined.includes("đào tạo") || combined.includes("mầm non") || combined.includes("gia sư") || combined.includes("học") || combined.includes("trường")) {
    return "Giáo dục & Đào tạo";
  }

  return "Cơ khí & Kỹ thuật số / Khác";
};

export const getSectorMeta = (groupName: string): IndustrySectorDef => {
  return INDUSTRY_SECTORS.find(s => s.id === groupName) || {
    id: groupName,
    name: groupName,
    shortName: groupName,
    icon: "💼",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    cardBg: "bg-slate-50/70 hover:bg-slate-50/90",
    borderClass: "border-slate-200",
    barColor: "bg-slate-500",
    textColor: "text-slate-800",
    accentHex: "#64748b",
    description: "Ngành nghề kinh doanh khác"
  };
};
