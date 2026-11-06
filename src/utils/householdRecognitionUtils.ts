import { Resident, Household, Business } from "../types";
import { normalizeAddress } from "../components/household/HouseholdDuplicates";

/**
 * Trích xuất năm sinh từ chuỗi ngày sinh (DD/MM/YYYY, YYYY-MM-DD, hoặc YYYY)
 */
export function extractBirthYear(birthDateStr?: string): number {
  if (!birthDateStr) return 1985;
  const s = birthDateStr.trim();
  // Format DD/MM/YYYY
  const parts = s.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const y = parseInt(parts[2]);
    if (!isNaN(y)) return y;
  }
  // Format YYYY-MM-DD
  const partsDash = s.split("-");
  if (partsDash.length === 3 && partsDash[0].length === 4) {
    const y = parseInt(partsDash[0]);
    if (!isNaN(y)) return y;
  }
  // 4 digits
  const match = s.match(/\b(19\d\d|20\d\d)\b/);
  if (match) return parseInt(match[1]);
  return 1985;
}

/**
 * Thuật toán suy luận quan hệ gia phả tự động với Chủ hộ
 * Dựa vào: Họ tên cha, Họ tên mẹ, Giới tính, Năm sinh, và Cấu trúc con chung giữa các thành viên
 */
export function inferRelationToOwner(
  person: Resident,
  owner: Resident,
  allGroupResidents: Resident[]
): string {
  const pName = (person.fullName || "").trim().toUpperCase();
  const oName = (owner.fullName || "").trim().toUpperCase();

  // 1. Bản thân người đó chính là Chủ hộ
  if (pName === oName || person.cccd === owner.cccd) {
    return "Chủ hộ";
  }

  // Nếu người đó đã có relationToOwner rõ ràng từ trước (khác "Thành viên" chung chung)
  const existingRel = (person.relationToOwner || "").trim().toLowerCase();
  if (existingRel && existingRel !== "thành viên" && existingRel !== "chưa cập nhật" && existingRel !== "n/a") {
    // Viết hoa chữ cái đầu
    return existingRel.charAt(0).toUpperCase() + existingRel.slice(1);
  }

  const pFather = (person.fatherName || "").trim().toUpperCase();
  const pMother = (person.motherName || "").trim().toUpperCase();
  const oFather = (owner.fatherName || "").trim().toUpperCase();
  const oMother = (owner.motherName || "").trim().toUpperCase();
  const isFemale = person.gender === "Nữ";
  const pBirth = extractBirthYear(person.birthDate);
  const oBirth = extractBirthYear(owner.birthDate);

  // 2. Con đẻ của Chủ hộ: Cha hoặc Mẹ của người này chính là Chủ hộ
  if ((pFather && pFather === oName) || (pMother && pMother === oName)) {
    return isFemale ? "Con gái" : "Con trai";
  }

  // 3. Bố / Mẹ của Chủ hộ: Chủ hộ có Cha hoặc Mẹ trùng tên với người này
  if (oFather && oFather === pName) {
    return "Bố (Cha)";
  }
  if (oMother && oMother === pName) {
    return "Mẹ";
  }

  // 4. Vợ / Chồng của Chủ hộ: Có ít nhất một đứa con chung trong nhóm thành viên
  for (const m of allGroupResidents) {
    const mF = (m.fatherName || "").trim().toUpperCase();
    const mM = (m.motherName || "").trim().toUpperCase();
    if ((mF === oName && mM === pName) || (mF === pName && mM === oName)) {
      return isFemale ? "Vợ" : "Chồng";
    }
  }

  // 5. Cháu (Nội/Ngoại) của Chủ hộ: Cha hoặc Mẹ của người này là con của Chủ hộ
  if (pFather || pMother) {
    for (const m of allGroupResidents) {
      const mName = (m.fullName || "").trim().toUpperCase();
      if (pFather === mName || pMother === mName) {
        const mFather = (m.fatherName || "").trim().toUpperCase();
        const mMother = (m.motherName || "").trim().toUpperCase();
        if (mFather === oName || mMother === oName) {
          // m là con của chủ hộ => person là cháu
          if (pFather === mName) {
            return isFemale ? "Cháu nội (Gái)" : "Cháu nội (Trai)";
          } else {
            return isFemale ? "Cháu ngoại (Gái)" : "Cháu ngoại (Trai)";
          }
        }
      }
    }
  }

  // 6. Con dâu / Con rể của Chủ hộ: Người này kết hôn với con của Chủ hộ
  for (const m of allGroupResidents) {
    const mName = (m.fullName || "").trim().toUpperCase();
    const mFather = (m.fatherName || "").trim().toUpperCase();
    const mMother = (m.motherName || "").trim().toUpperCase();
    if (mFather === oName || mMother === oName) {
      // m là con của chủ hộ
      for (const child of allGroupResidents) {
        const cF = (child.fatherName || "").trim().toUpperCase();
        const cM = (child.motherName || "").trim().toUpperCase();
        if ((cF === mName && cM === pName) || (cF === pName && cM === mName)) {
          return isFemale ? "Con dâu" : "Con rể";
        }
      }
    }
  }

  // 7. Anh / Chị / Em ruột của Chủ hộ: Có cùng Cha hoặc Mẹ với Chủ hộ
  if ((pFather && oFather && pFather === oFather) || (pMother && oMother && pMother === oMother)) {
    if (pBirth < oBirth) {
      return isFemale ? "Chị gái" : "Anh trai";
    } else {
      return isFemale ? "Em gái" : "Em trai";
    }
  }

  // 8. Suy luận bổ trợ theo độ tuổi chênh lệch
  if (pBirth > oBirth + 18) {
    return isFemale ? "Con gái" : "Con trai";
  } else if (pBirth < oBirth - 18) {
    return isFemale ? "Bác / Cô / Dì" : "Bác / Chú / Cậu";
  } else if (Math.abs(pBirth - oBirth) <= 8 && isFemale !== (owner.gender === "Nữ")) {
    return isFemale ? "Vợ (đề xuất)" : "Chồng (đề xuất)";
  }

  return "Thành viên gia đình";
}

export interface AutoRecognizedHousehold {
  householdCode: string;
  address: string;
  type: "Thường trú" | "Tạm trú";
  owner: Resident;
  members: {
    resident: Resident;
    relation: string;
  }[];
  totalMembers: number;
}

/**
 * Hàm phân tích và nhận diện toàn bộ Hộ gia đình và Thành viên từ danh sách cư dân (Thường trú & Tạm trú)
 */
export function autoRecognizeHouseholds(residents: Resident[]): AutoRecognizedHousehold[] {
  // 1. Phân nhóm cư dân theo khóa hộ
  const groupsMap: { [key: string]: { residents: Resident[]; type: "Thường trú" | "Tạm trú"; address: string; code: string } } = {};

  residents.forEach(res => {
    const isTamTru = res.status === "Tạm trú";
    let key: string;
    let code: string;
    const address = res.address || res.currentAddress || res.permanentAddress || "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh";

    if (isTamTru) {
      // Đối với Tạm trú: Nhóm theo (Địa chỉ tạm trú chuẩn hóa + Họ tên người đăng ký/chủ hộ)
      const normAddr = normalizeAddress(res.currentAddress || res.address || "");
      // Tìm xem có tên chủ hộ ghi nhận không (nếu có từ ghi chú hoặc tự khai)
      key = `TT_${normAddr || "UNKNOWN"}`;
      code = `TT-${res.cccd ? res.cccd.slice(-6) : Math.floor(100000 + Math.random() * 900000)}`;
    } else {
      // Đối với Thường trú: Nhóm theo mã hộ khẩu (householdId / household_code)
      const hId = (res.householdId || "").trim();
      if (hId && hId !== "Chưa cập nhật" && hId !== "Tạm trú" && hId !== "N/A") {
        key = `HK_${hId}`;
        code = hId;
      } else {
        const normAddr = normalizeAddress(res.permanentAddress || res.address || "");
        key = `HK_ADDR_${normAddr || "UNKNOWN"}`;
        code = `HK-${res.cccd ? res.cccd.slice(-6) : Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    if (!groupsMap[key]) {
      groupsMap[key] = {
        residents: [],
        type: isTamTru ? "Tạm trú" : "Thường trú",
        address,
        code
      };
    }
    groupsMap[key].residents.push(res);
  });

  const recognized: AutoRecognizedHousehold[] = [];

  Object.values(groupsMap).forEach(group => {
    if (group.residents.length === 0) return;

    // 2. Nhận diện Chủ hộ
    // Ưu tiên 1: Người có relationToOwner là "Chủ hộ"
    let owner = group.residents.find(r => {
      const rel = (r.relationToOwner || "").trim().toLowerCase();
      return rel === "chủ hộ" || rel.startsWith("chủ hộ");
    });

    // Ưu tiên 2: Nếu chưa có, chọn người lớn tuổi nhất đã trưởng thành
    if (!owner) {
      const sortedByAge = [...group.residents].sort((a, b) => {
        return extractBirthYear(a.birthDate) - extractBirthYear(b.birthDate);
      });
      owner = sortedByAge[0];
    }

    // 3. Suy luận quan hệ cho từng thành viên
    const membersWithRelation = group.residents.map(r => {
      const relation = inferRelationToOwner(r, owner!, group.residents);
      return {
        resident: r,
        relation
      };
    });

    recognized.push({
      householdCode: group.code,
      address: group.address,
      type: group.type,
      owner,
      members: membersWithRelation,
      totalMembers: group.residents.length
    });
  });

  return recognized;
}

/**
 * Phân tích và chuyển đổi chuỗi ngày tháng sang Date (hỗ trợ DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
 */
export function parseDateString(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();
  
  // Format DD/MM/YYYY
  const partsSlash = s.split("/");
  if (partsSlash.length === 3) {
    const d = parseInt(partsSlash[0], 10);
    const m = parseInt(partsSlash[1], 10) - 1;
    const y = parseInt(partsSlash[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1900 && y < 2100) {
      return new Date(y, m, d);
    }
  }

  // Format YYYY-MM-DD hoặc DD-MM-YYYY
  const partsDash = s.split("-");
  if (partsDash.length === 3) {
    if (partsDash[0].length === 4) {
      const y = parseInt(partsDash[0], 10);
      const m = parseInt(partsDash[1], 10) - 1;
      const d = parseInt(partsDash[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    } else {
      const d = parseInt(partsDash[0], 10);
      const m = parseInt(partsDash[1], 10) - 1;
      const y = parseInt(partsDash[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

export interface ResidenceExpiryStatus {
  status: "expired" | "expiring_soon" | "valid" | "unknown";
  daysLeft: number | null;
  label: string;
  badgeClass: string;
  isWarning: boolean; // Cảnh báo hết hạn tạm trú trước 01 tháng (30 ngày)
  isExpired: boolean;
  formattedDate: string;
}

/**
 * Kiểm tra trạng thái hết hạn tạm trú, cảnh báo trước 01 tháng (30 ngày)
 */
export function getTemporaryResidenceExpiryStatus(expDateStr?: string): ResidenceExpiryStatus {
  if (!expDateStr || !expDateStr.trim()) {
    return {
      status: "unknown",
      daysLeft: null,
      label: "Chưa rõ thời hạn",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      isWarning: false,
      isExpired: false,
      formattedDate: "Chưa cập nhật"
    };
  }

  const expDate = parseDateString(expDateStr);
  if (!expDate) {
    return {
      status: "unknown",
      daysLeft: null,
      label: expDateStr,
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      isWarning: false,
      isExpired: false,
      formattedDate: expDateStr
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dayStr = `${String(expDate.getDate()).padStart(2, "0")}/${String(expDate.getMonth() + 1).padStart(2, "0")}/${expDate.getFullYear()}`;

  if (daysLeft < 0) {
    return {
      status: "expired",
      daysLeft,
      label: `Đã hết hạn tạm trú (${Math.abs(daysLeft)} ngày trước)`,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-300 font-bold",
      isWarning: false,
      isExpired: true,
      formattedDate: dayStr
    };
  } else if (daysLeft <= 30) {
    return {
      status: "expiring_soon",
      daysLeft,
      label: `Sắp hết hạn tạm trú (còn ${daysLeft} ngày)`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse",
      isWarning: true,
      isExpired: false,
      formattedDate: dayStr
    };
  } else {
    return {
      status: "valid",
      daysLeft,
      label: `Tạm trú còn hạn đến ${dayStr}`,
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      isWarning: false,
      isExpired: false,
      formattedDate: dayStr
    };
  }
}

export interface ParsedAccommodationInfo {
  isHostel: boolean;
  owner: string;
  phone: string;
  address: string;
  shortAddress: string;
  hostelName: string;
  rawAddress: string;
}

/**
 * Bóc tách thông tin nhà trọ / lưu trú từ chuỗi địa chỉ dân cư
 * Ví dụ: "Nhà trọ Phạm Văn Bình (SĐT: 0913137155) 17/A3 Khu phố 3, Phường An Phú, Thành phố Hồ Chí Minh"
 * => { owner: "Phạm Văn Bình", phone: "0913137155", address: "17/A3 Khu phố 3, Phường An Phú, Thành phố Hồ Chí Minh", shortAddress: "17/A3 Khu phố 3", hostelName: "Nhà trọ Phạm Văn Bình" }
 */
export function parseAccommodationInfo(rawAddress?: string): ParsedAccommodationInfo {
  const result: ParsedAccommodationInfo = {
    isHostel: false,
    owner: "",
    phone: "",
    address: "",
    shortAddress: "",
    hostelName: "",
    rawAddress: rawAddress || ""
  };

  if (!rawAddress || !rawAddress.trim()) return result;
  const s = rawAddress.trim();

  // Kiểm tra từ khóa nhà trọ ở đầu
  const hostelRegex = /^(?:nhà\s+trọ|phòng\s+trọ|trọ)\s*:?\s*(.*)$/i;
  const match = s.match(hostelRegex);

  if (!match) {
    if (/nhà\s+trọ|phòng\s+trọ/i.test(s)) {
      result.isHostel = true;
    }
    result.address = s;
    result.shortAddress = s.split(",")[0].trim();
    return result;
  }

  result.isHostel = true;
  let rest = match[1].trim();

  // Bóc tách SĐT nếu có: (SĐT: 0913137155) hoặc (0918312448) hoặc sđt: 0975054647...
  const phoneMatch = rest.match(/(?:\((?:sđt:?|sdt:?|đt:?)?\s*([0-9\.\s\-]{8,15})\)|(?:sđt|sdt|đt)\s*[:.]?\s*([0-9\.\s\-]{8,15}))/i);
  if (phoneMatch && phoneMatch.index !== undefined) {
    result.phone = (phoneMatch[1] || phoneMatch[2] || "").replace(/[^\d]/g, "").trim();
    rest = (rest.slice(0, phoneMatch.index) + " " + rest.slice(phoneMatch.index + phoneMatch[0].length)).trim();
  }

  // Tách tên chủ nhà trọ và địa chỉ nhà trọ
  // Nhận diện địa chỉ bắt đầu bằng số nhà (17/A3, 14/B1, 39A/A11, Ô 30, Lô B...) hoặc "tại địa chỉ"
  const addrMatch = rest.match(/(?:,\s*|\s+tại\s+địa\s+chỉ\s+|\s+địa\s+chỉ\s+|\s+)((?:\d+[A-Za-z0-9\/\-]*|Ô\s*\d+|Lô\s*[A-Za-z0-9]+)\s+.*)$/i);
  if (addrMatch && addrMatch.index !== undefined) {
    result.owner = rest.slice(0, addrMatch.index).trim().replace(/^[:,\-\s]+|[:,\-\s]+$/g, "");
    result.address = addrMatch[1].trim();
  } else {
    const parts = rest.split(",");
    result.owner = parts[0].trim().replace(/^[:,\-\s]+|[:,\-\s]+$/g, "");
    result.address = parts.slice(1).join(",").trim();
  }

  // Làm sạch tiền tố xưng hô như "ông", "bà", "anh", "chị" trong tên chủ trọ
  if (result.owner) {
    result.owner = result.owner.replace(/^(?:ông|bà|anh|chị)\s+/i, "").trim();
  }

  // Tạo địa chỉ ngắn gọn
  if (result.address) {
    const addrParts = result.address.split(",");
    result.shortAddress = addrParts.slice(0, 2).join(",").trim();
  }

  result.hostelName = result.owner ? `Nhà trọ ${result.owner}` : "Nhà trọ KP3";
  return result;
}

/**
 * Tự động phát hiện và trích xuất danh sách các cơ sở nhà trọ / lưu trú từ dữ liệu dân cư (residents)
 * Tương tự như cơ chế của "Nhà trọ Phạm Văn Bình", nhận diện chủ trọ, SĐT, địa chỉ,
 * số lượng người lưu trú thực tế, ước tính số phòng, số tầng.
 */
export function autoExtractHostelBusinesses(
  residents: Resident[],
  existingBusinesses: Business[]
): Business[] {
  if (!residents || residents.length === 0) return [];

  function toTitleCase(str: string): string {
    if (!str) return "";
    return str.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  // Thu thập các nhóm cư dân thuê trọ theo từng cơ sở (key: Số nhà / Lô / Tên chủ trọ)
  const hostelGroups = new Map<string, {
    key: string;
    owner: string;
    phone: string;
    address: string;
    residents: Resident[];
  }>();

  residents.forEach(res => {
    const rawAddr = res.currentAddress || res.temporaryAddress || res.address || "";
    if (!rawAddr) return;

    const parsed = parseAccommodationInfo(rawAddr);
    if (!parsed.isHostel) return;

    // Xác định key định danh thống nhất (Số nhà dạng 39A/A11, 14/B1, 10/A11, Ô 30 Lô B2...)
    const houseNumMatch = (parsed.address || rawAddr).match(/\b\d+[A-Za-z0-9]*\/[A-Za-z0-9]+\b/i);
    const lotMatch = (parsed.address || rawAddr).match(/\b(?:Ô\s*\d+|Lô\s*[A-Za-z0-9]+)\b/i);

    let key = "";
    if (houseNumMatch) {
      key = houseNumMatch[0].toUpperCase();
    } else if (lotMatch) {
      key = lotMatch[0].toUpperCase();
    } else if (parsed.owner && parsed.owner.length > 2) {
      key = parsed.owner.toUpperCase();
    } else if (parsed.address) {
      key = parsed.address.split(",")[0].trim().toUpperCase();
    }

    if (!key) return;

    if (!hostelGroups.has(key)) {
      hostelGroups.set(key, {
        key,
        owner: parsed.owner ? toTitleCase(parsed.owner) : "",
        phone: parsed.phone || "",
        address: parsed.address || rawAddr,
        residents: []
      });
    }

    const g = hostelGroups.get(key)!;
    g.residents.push(res);
    if (!g.phone && parsed.phone) g.phone = parsed.phone;
    if ((!g.owner || g.owner.length < (parsed.owner || "").length) && parsed.owner) {
      g.owner = toTitleCase(parsed.owner);
    }
  });

  // Lọc các cơ sở trọ có tối thiểu 3 người lưu trú trở lên để đảm bảo tính chuẩn xác
  const hostelList = Array.from(hostelGroups.values())
    .filter(g => g.residents.length >= 3)
    .sort((a, b) => b.residents.length - a.residents.length);

  const lodgingImages = [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=500"
  ];

  const result: Business[] = [];
  let nextIndex = existingBusinesses.length + 1;

  for (const h of hostelList) {
    // Kiểm tra xem cơ sở này đã có trong danh sách existingBusinesses chưa (tránh tạo trùng)
    const alreadyExists = existingBusinesses.some(b => {
      // 1. Khớp SĐT
      if (h.phone && b.phone && h.phone.replace(/\D/g, "") === b.phone.replace(/\D/g, "")) {
        return true;
      }
      // 2. Khớp số nhà
      const bHouseNum = (b.address || "").match(/\b\d+[A-Za-z0-9]*\/[A-Za-z0-9]+\b/i);
      if (bHouseNum && bHouseNum[0].toUpperCase() === h.key) {
        return true;
      }
      // 3. Khớp tên chủ nhà trọ
      if (h.owner && b.owner && b.owner.toLowerCase().includes(h.owner.toLowerCase())) {
        return true;
      }
      return false;
    });

    if (alreadyExists) continue;

    const count = h.residents.length;
    const estRooms = Math.max(4, Math.ceil(count / 2.5));
    const estFloors = estRooms > 16 ? 4 : (estRooms > 6 ? 3 : 2);
    const ownerName = h.owner || `Chủ hộ trọ ${h.key}`;
    const cleanAddr = h.address.includes("Khu phố 3")
      ? h.address 
      : `${h.key} Khu phố 3, Phường An Phú, TP. Hồ Chí Minh`;

    const internalId = `HKD-KP3-NT${String(nextIndex).padStart(3, "0")}`;
    const autoBusiness: Business = {
      id: `HOSTEL-AUTO-${h.key.replace(/[^A-Za-z0-9]/g, "-")}`,
      internalCode: internalId,
      name: `Nhà trọ ${ownerName}`,
      taxCode: `0318${String(100000 + nextIndex).slice(1)}-001`,
      businessType: "Hộ kinh doanh",
      enterpriseScale: count > 30 ? "Nhỏ (5 - 20 LĐ)" : "Siêu nhỏ (< 5 LĐ)",
      type: "Hộ kinh doanh",
      industryGroup: "Lưu trú & Cho thuê",
      owner: ownerName,
      phone: h.phone || "09" + String(10000000 + (nextIndex * 7132) % 90000000),
      address: cleanAddr,
      licenseNumber: `GP-NT-${2020 + (nextIndex % 4)}/KP3`,
      status: "Đang hoạt động",
      startDate: `15/0${(nextIndex % 9) + 1}/202${1 + (nextIndex % 3)}`,
      verificationSource: "Dữ liệu Đăng ký Tạm trú Cư dân KP3 & CSKV",
      streetArea: `Khu vực ${h.key} Khu phố 3`,
      premisesType: "Nhà phố",
      premisesOwner: ownerName,
      premisesOwnerPhone: h.phone || undefined,
      linkedBuildingOrHostel: `Khu nhà trọ ${ownerName} (${h.key})`,
      legalRepresentative: ownerName,
      siteManager: `${ownerName} (Chủ cơ sở)`,
      employeeCount: Math.max(1, Math.ceil(count / 25)),
      localWorkersCount: 1,
      temporaryWorkersCount: 1,
      foreignWorkersCount: 0,
      supportNeeds: [
        "Hướng dẫn khai báo tạm trú trực tuyến cho khách trọ",
        "Kiểm tra định kỳ trang thiết bị PCCC"
      ],
      safetyCertified: true,
      image: lodgingImages[(nextIndex - 1) % lodgingImages.length],
      coordinates: `${(10.7925 + ((nextIndex * 7) % 30) * 0.0001).toFixed(4)}, ${(106.7435 + ((nextIndex * 11) % 30) * 0.0001).toFixed(4)}`,
      toBanDo: "272",
      soThua: String(40 + (nextIndex % 50)),
      dienTich: 120 + ((nextIndex * 15) % 150),
      loaiDat: "ODT",
      isAccommodation: true,
      soPhong: estRooms,
      soTang: estFloors,
      soNguoiLuuTru: count,
      giaThueTrungBinh: "2.2 - 3.5 triệu/tháng",
      inspections: [
        {
          id: `INSP-${internalId}-1`,
          date: "12/03/2026",
          result: "Đạt chuẩn",
          inspector: "Công an Phường An Phú & Ban Điều hành KP3",
          note: "Đã trang bị bình chữa cháy xách tay, bảng tiêu lệnh chữa cháy, có lối thoát hiểm thứ 2.",
          recommendation: "Nhắc nhở người thuê trọ tắt các thiết bị điện khi ra khỏi phòng."
        }
      ]
    };

    result.push(autoBusiness);
    nextIndex++;
  }

  return result;
}

/**
 * Kiểm tra xem cư dân có đang lưu trú / thuê trọ tại cơ sở kinh doanh nhà trọ này không
 */
export function isResidentInAccommodation(res: Resident, bus: Business): boolean {
  const isAcc = Boolean(
    bus.isAccommodation || 
    (bus.type || "").toLowerCase().includes("trọ") ||
    (bus.type || "").toLowerCase().includes("lưu trú") ||
    (bus.type || "").toLowerCase().includes("nhà nghỉ") ||
    (bus.name || "").toLowerCase().includes("nhà trọ") ||
    (bus.name || "").toLowerCase().includes("nhà nghỉ")
  );
  if (!isAcc) return false;

  const resAddr = res.currentAddress || res.temporaryAddress || res.address || "";
  const parsed = parseAccommodationInfo(resAddr);

  // 1. So khớp theo SĐT chủ trọ
  if (parsed.phone) {
    const cleanP = parsed.phone.replace(/[^\d]/g, "");
    const busPhone = (bus.phone || "").replace(/[^\d]/g, "");
    const premPhone = (bus.premisesOwnerPhone || "").replace(/[^\d]/g, "");
    if (cleanP && (cleanP === busPhone || cleanP === premPhone)) {
      return true;
    }
  }

  // 2. So khớp theo tên Chủ nhà trọ hoặc Tên cơ sở
  if (parsed.owner && parsed.owner.length > 2) {
    const oLower = parsed.owner.toLowerCase().trim();
    const busOwnerLower = (bus.owner || "").toLowerCase().trim();
    const busNameLower = (bus.name || "").toLowerCase().trim();
    const premOwnerLower = (bus.premisesOwner || "").toLowerCase().trim();

    if (
      busOwnerLower.includes(oLower) || oLower.includes(busOwnerLower) ||
      busNameLower.includes(oLower) || premOwnerLower.includes(oLower)
    ) {
      return true;
    }
  }

  // 3. So khớp theo số nhà / lô (ví dụ 17/A3, 39A/A11, 14/B1...)
  const busNumMatch = (bus.address || "").toLowerCase().match(/\b\d+[a-z0-9]*\/[a-z0-9]+\b/i);
  const resNumMatch = (parsed.address || resAddr).toLowerCase().match(/\b\d+[a-z0-9]*\/[a-z0-9]+\b/i);
  if (busNumMatch && resNumMatch && busNumMatch[0] === resNumMatch[0]) {
    return true;
  }

  // 4. So khớp theo địa chỉ chuẩn hóa
  const normBus = normalizeAddress(bus.address || "");
  const normRes = normalizeAddress(parsed.address || resAddr);
  if (normBus && normRes && (normBus === normRes || normBus.includes(normRes) || normRes.includes(normBus))) {
    return true;
  }

  return false;
}

