import { Association } from "../../types";

export interface TargetGroupConfig {
  id: string;
  name: string;
  section: "Đảng viên" | "Chính quyền" | "Đoàn thể" | "Chính sách" | "Nhóm khác";
  defaultRole: string;
  roles: string[];
  description: string;
  badgeBg: string;
  badgeText: string;
  category: "Chính trị - Xã hội" | "Chính quyền cơ sở" | "An ninh - Quốc phòng" | "Đoàn thể nhân dân" | "Hội quần chúng" | "Chính sách xã hội" | "Phong trào tự quản";
  legalBasis?: string;
  meetingFrequency?: string;
}

export const TARGET_GROUPS: TargetGroupConfig[] = [
  // 1. Nhóm Đảng
  {
    id: "ASC_DANG",
    name: "Chi bộ Đảng (Đảng viên)",
    section: "Đảng viên",
    defaultRole: "Đảng viên",
    roles: ["Đảng viên", "Bí thư Chi bộ", "Phó Bí thư", "Chi ủy viên", "Đảng viên dự bị"],
    description: "Tổ chức hạt nhân lãnh đạo chính trị tại cơ sở, gương mẫu đi đầu trong mọi phong trào.",
    badgeBg: "bg-rose-100 dark:bg-rose-950/40",
    badgeText: "text-rose-800 dark:text-rose-300",
    category: "Chính trị - Xã hội",
    legalBasis: "Điều lệ Đảng Cộng sản Việt Nam",
    meetingFrequency: "Định kỳ ngày 03 hàng tháng"
  },
  {
    id: "ASC_CTDANG",
    name: "Cảm tình Đảng",
    section: "Đảng viên",
    defaultRole: "Đối tượng bồi dưỡng Đảng",
    roles: ["Đối tượng bồi dưỡng Đảng", "Quần chúng ưu tú", "Học viên lớp nhận thức Đảng"],
    description: "Lực lượng quần chúng ưu tú, hạt giống bồi dưỡng kết nạp Đảng tại khu phố.",
    badgeBg: "bg-orange-100 dark:bg-orange-950/40",
    badgeText: "text-orange-800 dark:text-orange-300",
    category: "Chính trị - Xã hội",
    legalBasis: "Quy định số 24-QĐ/TW của Ban Chấp hành Trung ương",
    meetingFrequency: "Hàng quý"
  },
  {
    id: "ASC_DANG213",
    name: "Đảng viên 213",
    section: "Đảng viên",
    defaultRole: "Đảng viên sinh hoạt nơi cư trú",
    roles: ["Đảng viên sinh hoạt nơi cư trú", "Tổ trưởng đảng viên 213", "Tổ phó đảng viên 213"],
    description: "Đảng viên đang công tác tham gia sinh hoạt định kỳ tại nơi cư trú theo Quy định 213.",
    badgeBg: "bg-red-100 dark:bg-red-950/40",
    badgeText: "text-red-800 dark:text-red-300",
    category: "Chính trị - Xã hội",
    legalBasis: "Quy định số 213-QĐ/TW của Bộ Chính trị",
    meetingFrequency: "6 tháng / lần"
  },

  // 2. Nhóm Chính quyền
  {
    id: "ASC_BDH",
    name: "Ban điều hành khu phố",
    section: "Chính quyền",
    defaultRole: "Thành viên Ban điều hành",
    roles: ["Trưởng Ban điều hành", "Phó Ban điều hành", "Thành viên Ban điều hành", "Thư ký Ban điều hành"],
    description: "Bộ máy tự quản trực tiếp điều hành mọi hoạt động hành chính, kinh tế - xã hội tại khu phố.",
    badgeBg: "bg-amber-100 dark:bg-amber-950/40",
    badgeText: "text-amber-800 dark:text-amber-300",
    category: "Chính quyền cơ sở",
    legalBasis: "Nghị định số 80/2021/NĐ-CP & Luật Dân chủ cơ sở 2022",
    meetingFrequency: "Họp giao ban thứ Hai hàng tuần"
  },
  {
    id: "ASC_TOTRUONG",
    name: "Tổ trưởng dân phố",
    section: "Chính quyền",
    defaultRole: "Tổ trưởng dân phố",
    roles: ["Tổ trưởng dân phố", "Tổ phó dân phố", "Cán sự phụ trách cụm liên gia"],
    description: "Cầu nối trực tiếp giữa Ban điều hành khu phố và từng hộ gia đình trong tổ dân phố.",
    badgeBg: "bg-yellow-100 dark:bg-yellow-950/40",
    badgeText: "text-yellow-800 dark:text-yellow-300",
    category: "Chính quyền cơ sở",
    legalBasis: "Quyết định của UBND TP. Hồ Chí Minh",
    meetingFrequency: "Định kỳ hàng tháng"
  },
  {
    id: "ASC_KHUDOI",
    name: "Khu Đội",
    section: "Chính quyền",
    defaultRole: "Chiến sĩ dân quân",
    roles: ["Chỉ huy trưởng DQTV", "Chỉ huy phó DQTV", "Chiến sĩ dân quân cơ động", "Chiến sĩ Y tế dân quân", "Chiến sĩ dân quân"],
    description: "Lực lượng quân sự địa phương, sẵn sàng chiến đấu, tuần tra và phòng chống thiên tai.",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/40",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    category: "An ninh - Quốc phòng",
    legalBasis: "Luật Dân quân tự vệ 2019",
    meetingFrequency: "Trực tuần tra 24/7 và huấn luyện định kỳ"
  },

  // 3. Nhóm Đoàn thể
  {
    id: "ASC_MT",
    name: "Ban Công tác Mặt trận",
    section: "Đoàn thể",
    defaultRole: "Ủy viên Ban CTMT",
    roles: ["Trưởng Ban CTMT", "Phó Ban CTMT", "Ủy viên Ban CTMT", "Đại biểu phối hợp"],
    description: "Tập hợp, phát huy khối đại đoàn kết toàn dân tộc, giám sát và phản biện xã hội.",
    badgeBg: "bg-blue-100 dark:bg-blue-950/40",
    badgeText: "text-blue-800 dark:text-blue-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Điều lệ Mặt trận Tổ quốc Việt Nam",
    meetingFrequency: "Hàng tháng"
  },
  {
    id: "ASC_PN",
    name: "Chi hội Phụ nữ",
    section: "Đoàn thể",
    defaultRole: "Hội viên Phụ nữ",
    roles: ["Chi hội trưởng Phụ nữ", "Chi hội phó Phụ nữ", "Ủy viên BCH Chi hội Phụ nữ", "Hội viên nòng cốt", "Hội viên Phụ nữ"],
    description: "Bảo vệ quyền lợi phụ nữ, trẻ em, xây dựng gia đình 5 không 3 sạch, giúp nhau phát triển kinh tế.",
    badgeBg: "bg-pink-100 dark:bg-pink-950/40",
    badgeText: "text-pink-800 dark:text-pink-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Điều lệ Hội Liên hiệp Phụ nữ Việt Nam",
    meetingFrequency: "Định kỳ ngày 08 hàng tháng"
  },
  {
    id: "ASC_DOAN",
    name: "Chi đoàn Thanh niên",
    section: "Đoàn thể",
    defaultRole: "Đoàn viên",
    roles: ["Bí thư Chi đoàn", "Phó Bí thư Chi đoàn", "Ủy viên BCH Chi đoàn", "Đoàn viên tích cực", "Đoàn viên"],
    description: "Lực lượng xung kích, đi đầu trong chuyển đổi số, tình nguyện vì cộng đồng.",
    badgeBg: "bg-cyan-100 dark:bg-cyan-950/40",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Điều lệ Đoàn TNCS Hồ Chí Minh",
    meetingFrequency: "Sinh hoạt ngày 26 hàng tháng"
  },
  {
    id: "ASC_CCB",
    name: "Chi hội Cựu chiến binh",
    section: "Đoàn thể",
    defaultRole: "Hội viên CCB",
    roles: ["Chi hội trưởng CCB", "Chi hội phó CCB", "Ủy viên BCH CCB", "Hội viên CCB gương mẫu", "Hội viên CCB"],
    description: "Giữ vững phẩm chất Bộ đội Cụ Hồ, gương mẫu giáo dục truyền thống cách mạng cho thế hệ trẻ.",
    badgeBg: "bg-green-100 dark:bg-green-950/40",
    badgeText: "text-green-800 dark:text-green-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Pháp lệnh Cựu chiến binh",
    meetingFrequency: "Hàng quý"
  },
  {
    id: "ASC_NCT",
    name: "Chi hội Người cao tuổi",
    section: "Đoàn thể",
    defaultRole: "Hội viên Người cao tuổi",
    roles: ["Chi hội trưởng NCT", "Chi hội phó NCT", "Ủy viên BCH NCT", "Cụ cao niên tiêu biểu", "Hội viên Người cao tuổi"],
    description: "Phong trào 'Tuổi cao - Gương sáng', chỗ dựa tinh thần vững chắc cho gia đình và khu phố.",
    badgeBg: "bg-purple-100 dark:bg-purple-950/40",
    badgeText: "text-purple-800 dark:text-purple-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Luật Người cao tuổi",
    meetingFrequency: "Hàng quý"
  },
  {
    id: "ASC_ND",
    name: "Chi hội Nông dân",
    section: "Đoàn thể",
    defaultRole: "Hội viên Nông dân",
    roles: ["Chi hội trưởng Nông dân", "Chi hội phó Nông dân", "Hội viên Nông dân tiêu biểu", "Hội viên Nông dân"],
    description: "Đoàn kết nông dân, hỗ trợ phát triển kinh tế nông nghiệp đô thị, bảo vệ môi trường cơ sở.",
    badgeBg: "bg-lime-100 dark:bg-lime-950/40",
    badgeText: "text-lime-800 dark:text-lime-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Điều lệ Hội Nông dân Việt Nam",
    meetingFrequency: "Hàng quý"
  },

  // 4. Nhóm Chính sách & Xã hội
  {
    id: "ASC_TBXH",
    name: "Chi hội Thương binh Xã hội",
    section: "Chính sách",
    defaultRole: "Đối tượng chính sách",
    roles: ["Chi hội trưởng TBXH", "Chi hội phó TBXH", "Gia đình Liệt sĩ", "Thương bệnh binh", "Người có công", "Đối tượng chính sách"],
    description: "Chăm lo gia đình liệt sĩ, thương bệnh binh, thực hiện tốt công tác đền ơn đáp nghĩa.",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/40",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    category: "Chính sách xã hội",
    legalBasis: "Pháp lệnh Ưu đãi người có công với cách mạng",
    meetingFrequency: "Dịp 27/7 và lễ Tết"
  },
  {
    id: "ASC_CTD",
    name: "Chi hội Chữ thập đỏ",
    section: "Chính sách",
    defaultRole: "Hội viên Chữ thập đỏ",
    roles: ["Chi hội trưởng CTĐ", "Chi hội phó CTĐ", "Tình nguyện viên hiến máu", "Cứu trợ viên khẩn cấp", "Hội viên Chữ thập đỏ"],
    description: "Cứu trợ nhân đạo, hiến máu tình nguyện, sơ cấp cứu ban đầu và chăm lo người nghèo.",
    badgeBg: "bg-red-100 dark:bg-red-950/40",
    badgeText: "text-red-800 dark:text-red-300",
    category: "Hội quần chúng",
    legalBasis: "Luật Hoạt động Chữ thập đỏ",
    meetingFrequency: "Định kỳ hàng tháng"
  },
  {
    id: "ASC_KH",
    name: "Chi hội Khuyến học",
    section: "Chính sách",
    defaultRole: "Hội viên Khuyến học",
    roles: ["Chi hội trưởng Khuyến học", "Chi hội phó Khuyến học", "Ủy viên BCH Khuyến học", "Hội viên Khuyến học"],
    description: "Xây dựng xã hội học tập, vận động trao học bổng cho học sinh nghèo vượt khó hiếu học.",
    badgeBg: "bg-teal-100 dark:bg-teal-950/40",
    badgeText: "text-teal-800 dark:text-teal-300",
    category: "Hội quần chúng",
    legalBasis: "Quy định Hội Khuyến học Việt Nam",
    meetingFrequency: "Đầu năm học và tổng kết hè"
  },
  {
    id: "ASC_BNN",
    name: "Hội Bảo trợ người khuyết tật & Trẻ mồ côi",
    section: "Chính sách",
    defaultRole: "Thành viên bảo trợ",
    roles: ["Chi hội trưởng", "Chi hội phó", "Cộng tác viên xã hội", "Thành viên bảo trợ"],
    description: "Bảo trợ, trợ giúp người yếu thế, khuyết tật và trẻ em mồ côi tái hòa nhập cộng đồng.",
    badgeBg: "bg-sky-100 dark:bg-sky-950/40",
    badgeText: "text-sky-800 dark:text-sky-300",
    category: "Chính sách xã hội",
    legalBasis: "Luật Người khuyết tật & Luật Trẻ em",
    meetingFrequency: "Hàng quý"
  },

  // 5. Nhóm An ninh, Trật tự & Tự quản
  {
    id: "ASC_ANTT",
    name: "Tổ Bảo vệ An ninh trật tự cơ sở",
    section: "Chính quyền",
    defaultRole: "Tổ viên ANTT",
    roles: ["Tổ trưởng ANTT", "Tổ phó ANTT", "Tổ viên ANTT", "Đội viên dân phòng"],
    description: "Lực lượng nòng cốt giữ gìn ANTT, PCCC và cứu nạn cứu hộ tại cơ sở theo Luật mới 2024.",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-800 dark:text-slate-200",
    category: "An ninh - Quốc phòng",
    legalBasis: "Luật Lực lượng tham gia bảo vệ ANTT ở cơ sở 2023 (Có hiệu lực 01/07/2024)",
    meetingFrequency: "Trực 24/7 phối hợp Công an khu vực"
  },
  {
    id: "ASC_HOAGIAI",
    name: "Tổ Hòa giải cơ sở",
    section: "Chính quyền",
    defaultRole: "Hòa giải viên",
    roles: ["Tổ trưởng Tổ hòa giải", "Tổ phó Tổ hòa giải", "Hòa giải viên uy tín", "Hòa giải viên"],
    description: "Giải quyết kịp thời các mâu thuẫn, tranh chấp nhỏ trong nội bộ nhân dân tại cơ sở.",
    badgeBg: "bg-violet-100 dark:bg-violet-950/40",
    badgeText: "text-violet-800 dark:text-violet-300",
    category: "Chính quyền cơ sở",
    legalBasis: "Luật Hòa giải ở cơ sở 2013",
    meetingFrequency: "Theo vụ việc phát sinh"
  },
  {
    id: "ASC_PCCC",
    name: "Đội Dân phòng & PCCC cơ sở",
    section: "Chính quyền",
    defaultRole: "Đội viên PCCC",
    roles: ["Đội trưởng Dân phòng", "Đội phó Dân phòng", "Đội viên PCCC nòng cốt", "Đội viên PCCC"],
    description: "Thực hiện phương châm 4 tại chỗ trong công tác phòng cháy, chữa cháy và CNCH khu dân cư.",
    badgeBg: "bg-red-100 dark:bg-red-950/40",
    badgeText: "text-red-800 dark:text-red-300",
    category: "An ninh - Quốc phòng",
    legalBasis: "Luật Phòng cháy và chữa cháy",
    meetingFrequency: "Kiểm tra an toàn PCCC hàng tháng"
  },
  {
    id: "ASC_TTD",
    name: "Tổ Tự quản Đô thị & Môi trường",
    section: "Chính quyền",
    defaultRole: "Tổ viên tự quản",
    roles: ["Tổ trưởng tự quản", "Tổ phó tự quản", "Tuyên truyền viên môi trường", "Tổ viên tự quản"],
    description: "Kiểm tra trật tự lòng lề đường, vệ sinh môi trường các tuyến hẻm xanh - sạch - đẹp.",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/40",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    category: "Phong trào tự quản",
    legalBasis: "Quy chế Quản lý đô thị TP. Thủ Đức",
    meetingFrequency: "Ra quân Ngày Chủ nhật xanh"
  },
  {
    id: "ASC_DS",
    name: "Tổ Dân số & Chăm sóc Sức khỏe",
    section: "Chính sách",
    defaultRole: "Cộng tác viên Dân số",
    roles: ["Tổ trưởng Tổ Dân số", "Cộng tác viên Dân số nòng cốt", "Cộng tác viên Dân số"],
    description: "Thu thập biến động dân số, tuyên truyền chăm sóc sức khỏe ban đầu, tiêm chủng mở rộng.",
    badgeBg: "bg-teal-100 dark:bg-teal-950/40",
    badgeText: "text-teal-800 dark:text-teal-300",
    category: "Chính sách xã hội",
    legalBasis: "Pháp lệnh Dân số & Trạm Y tế phường An Phú",
    meetingFrequency: "Giao ban Trạm Y tế ngày 25 hàng tháng"
  },
  {
    id: "ASC_GIAMSAT",
    name: "Ban Thanh tra Nhân dân & Ban Giám sát ĐTCĐ",
    section: "Đoàn thể",
    defaultRole: "Thành viên Ban Giám sát",
    roles: ["Trưởng Ban Thanh tra", "Phó Ban Thanh tra", "Trưởng Ban Giám sát ĐTCĐ", "Thành viên Ban Giám sát"],
    description: "Giám sát việc thực hiện chính sách, pháp luật, khiếu nại tố cáo và các công trình cộng đồng.",
    badgeBg: "bg-purple-100 dark:bg-purple-950/40",
    badgeText: "text-purple-800 dark:text-purple-300",
    category: "Đoàn thể nhân dân",
    legalBasis: "Luật Thực hiện Dân chủ ở cơ sở 2022",
    meetingFrequency: "Định kỳ hàng quý"
  }
];

export const ASSOCIATION_CATEGORIES = [
  "Chính trị - Xã hội",
  "Chính quyền cơ sở",
  "An ninh - Quốc phòng",
  "Đoàn thể nhân dân",
  "Hội quần chúng",
  "Chính sách xã hội",
  "Phong trào tự quản"
] as const;

export type AssociationCategory = typeof ASSOCIATION_CATEGORIES[number];

export const DEFAULT_ASSOCIATIONS: Association[] = [
  {
    id: "ASC_BDH",
    name: "Ban điều hành khu phố",
    category: "Chính quyền cơ sở",
    description: "Tổ chức tự quản trực tiếp điều hành mọi hoạt động dân cư và đời sống cơ sở tại Khu phố 3.",
    leaderName: "Nguyễn Trung Huy",
    leaderCccd: "079080009988",
    members: [
      {
        id: "M_HUY_BDH",
        fullName: "Nguyễn Trung Huy",
        role: "Trưởng Ban điều hành",
        cccd: "079080009988",
        phone: "0909123888",
        birthDate: "12/03/1980",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-01/UBND-AP",
        decisionDate: "10/01/2020"
      },
      {
        id: "M_SON_BDH",
        fullName: "Lê Văn Sơn",
        role: "Phó Ban điều hành",
        cccd: "079070003112",
        phone: "0944112233",
        birthDate: "08/12/1970",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-02/UBND-AP",
        decisionDate: "10/01/2020"
      },
      {
        id: "M_HUNG_BDH",
        fullName: "Nguyễn Văn Hùng",
        role: "Cố vấn Ban điều hành",
        cccd: "079068001234",
        phone: "0903829112",
        birthDate: "15/04/1968",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-03/UBND-AP",
        decisionDate: "10/01/2020"
      }
    ]
  },
  {
    id: "ASC_DANG",
    name: "Chi bộ Đảng (Đảng viên)",
    category: "Chính trị - Xã hội",
    description: "Tổ chức hạt nhân lãnh đạo chính trị tại cơ sở, gương mẫu đi đầu trong mọi phong trào tại KP3.",
    leaderName: "Nguyễn Văn Hùng",
    leaderCccd: "079068001234",
    members: [
      {
        id: "M_HUNG_DANG",
        fullName: "Nguyễn Văn Hùng",
        role: "Bí thư Chi bộ",
        cccd: "079068001234",
        phone: "0903829112",
        birthDate: "15/04/1968",
        joinDate: "01/01/2015",
        decisionNumber: "QĐ-05/ĐU-AP",
        decisionDate: "15/12/2014"
      },
      {
        id: "M_HUY_DANG",
        fullName: "Nguyễn Trung Huy",
        role: "Chi ủy viên",
        cccd: "079080009988",
        phone: "0909123888",
        birthDate: "12/03/1980",
        joinDate: "02/09/2016",
        decisionNumber: "QĐ-12/ĐU-AP",
        decisionDate: "20/08/2016"
      },
      {
        id: "M_HOA_DANG",
        fullName: "Trần Thị Mai Hoa",
        role: "Phó Bí thư Chi bộ",
        cccd: "079175002233",
        phone: "0918234567",
        birthDate: "20/11/1975",
        joinDate: "19/05/2012",
        decisionNumber: "QĐ-08/ĐU-AP",
        decisionDate: "10/05/2012"
      }
    ]
  },
  {
    id: "ASC_MT",
    name: "Ban Công tác Mặt trận",
    category: "Đoàn thể nhân dân",
    description: "Tập hợp, phát huy khối đại đoàn kết toàn dân tộc, giám sát và phản biện xã hội.",
    leaderName: "Lê Văn Sơn",
    leaderCccd: "079070003112",
    members: [
      {
        id: "M_SON_MT",
        fullName: "Lê Văn Sơn",
        role: "Trưởng Ban CTMT",
        cccd: "079070003112",
        phone: "0944112233",
        birthDate: "08/12/1970",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-MT-01/UBMT-AP",
        decisionDate: "12/01/2020"
      },
      {
        id: "M_HOA_MT",
        fullName: "Trần Thị Mai Hoa",
        role: "Phó Ban CTMT",
        cccd: "079175002233",
        phone: "0918234567",
        birthDate: "20/11/1975",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-MT-02/UBMT-AP",
        decisionDate: "12/01/2020"
      }
    ]
  },
  {
    id: "ASC_PN",
    name: "Chi hội Phụ nữ",
    category: "Đoàn thể nhân dân",
    description: "Đại diện chăm lo, bảo vệ quyền lợi hợp pháp, chính đáng của phụ nữ và trẻ em.",
    leaderName: "Trần Thị Mai Hoa",
    leaderCccd: "079175002233",
    members: [
      {
        id: "M_HOA_PN",
        fullName: "Trần Thị Mai Hoa",
        role: "Chi hội trưởng Phụ nữ",
        cccd: "079175002233",
        phone: "0918234567",
        birthDate: "20/11/1975",
        joinDate: "10/03/2018",
        decisionNumber: "QĐ-PN-03/BCH-AP",
        decisionDate: "05/03/2018"
      },
      {
        id: "M_LAN_PN",
        fullName: "Phạm Thị Lan",
        role: "Chi hội phó Phụ nữ",
        cccd: "079182004455",
        phone: "0938445566",
        birthDate: "14/08/1982",
        joinDate: "10/03/2018",
        decisionNumber: "QĐ-PN-04/BCH-AP",
        decisionDate: "05/03/2018"
      }
    ]
  },
  {
    id: "ASC_DOAN",
    name: "Chi đoàn Thanh niên",
    category: "Đoàn thể nhân dân",
    description: "Lực lượng xung kích, năng động, đi đầu trong chuyển đổi số và công tác tình nguyện.",
    leaderName: "Nguyễn Minh Quân",
    leaderCccd: "079095006677",
    members: [
      {
        id: "M_QUAN_DOAN",
        fullName: "Nguyễn Minh Quân",
        role: "Bí thư Chi đoàn",
        cccd: "079095006677",
        phone: "0977889900",
        birthDate: "05/06/1995",
        joinDate: "26/03/2021",
        decisionNumber: "QĐ-ĐTN-01/BCH-AP",
        decisionDate: "20/03/2021"
      },
      {
        id: "M_HUY_DOAN",
        fullName: "Nguyễn Trung Huy",
        role: "Cố vấn Chi đoàn",
        cccd: "079080009988",
        phone: "0909123888",
        birthDate: "12/03/1980",
        joinDate: "26/03/2018"
      }
    ]
  },
  {
    id: "ASC_CCB",
    name: "Chi hội Cựu chiến binh",
    category: "Đoàn thể nhân dân",
    description: "Tập hợp cán bộ, chiến sĩ quân đội đã hoàn thành nghĩa vụ quân sự về sinh hoạt tại địa phương.",
    leaderName: "Vũ Đình Trọng",
    leaderCccd: "079055001122",
    members: [
      {
        id: "M_TRONG_CCB",
        fullName: "Vũ Đình Trọng",
        role: "Chi hội trưởng CCB",
        cccd: "079055001122",
        phone: "0903778899",
        birthDate: "10/10/1955",
        joinDate: "06/12/2015",
        decisionNumber: "QĐ-CCB-02/BCH-AP"
      },
      {
        id: "M_HUNG_CCB",
        fullName: "Nguyễn Văn Hùng",
        role: "Hội viên CCB gương mẫu",
        cccd: "079068001234",
        phone: "0903829112",
        birthDate: "15/04/1968",
        joinDate: "06/12/2016"
      }
    ]
  },
  {
    id: "ASC_ANTT",
    name: "Tổ Bảo vệ An ninh trật tự cơ sở",
    category: "An ninh - Quốc phòng",
    description: "Lực lượng bảo vệ an ninh trật tự cơ sở mới thành lập theo Luật 2024, tuần tra khép kín địa bàn.",
    leaderName: "Đặng Văn Nam",
    leaderCccd: "079088007788",
    members: [
      {
        id: "M_NAM_ANTT",
        fullName: "Đặng Văn Nam",
        role: "Tổ trưởng ANTT",
        cccd: "079088007788",
        phone: "0988223344",
        birthDate: "01/01/1988",
        joinDate: "01/07/2024",
        decisionNumber: "QĐ-01/UBND-ANTT",
        decisionDate: "01/07/2024"
      },
      {
        id: "M_SON_ANTT",
        fullName: "Lê Văn Sơn",
        role: "Tổ phó ANTT",
        cccd: "079070003112",
        phone: "0944112233",
        birthDate: "08/12/1970",
        joinDate: "01/07/2024",
        decisionNumber: "QĐ-02/UBND-ANTT",
        decisionDate: "01/07/2024"
      }
    ]
  },
  {
    id: "ASC_KHUDOI",
    name: "Khu Đội",
    category: "An ninh - Quốc phòng",
    description: "Lực lượng dân quân tại chỗ, sẵn sàng cơ động tham gia giữ vững quốc phòng và phòng chống thiên tai.",
    leaderName: "Hoàng Đức Anh",
    leaderCccd: "079092003344",
    members: [
      {
        id: "M_ANH_KD",
        fullName: "Hoàng Đức Anh",
        role: "Chỉ huy trưởng DQTV",
        cccd: "079092003344",
        phone: "0933556677",
        birthDate: "18/09/1992",
        joinDate: "10/01/2021",
        decisionNumber: "QĐ-BCHQS-01"
      }
    ]
  },
  {
    id: "ASC_HOAGIAI",
    name: "Tổ Hòa giải cơ sở",
    category: "Chính quyền cơ sở",
    description: "Hòa giải các mâu thuẫn tranh chấp đất đai, dân sự nhỏ trong khu dân cư ngay từ ban đầu.",
    leaderName: "Nguyễn Văn Hùng",
    leaderCccd: "079068001234",
    members: [
      {
        id: "M_HUNG_HG",
        fullName: "Nguyễn Văn Hùng",
        role: "Tổ trưởng Tổ hòa giải",
        cccd: "079068001234",
        phone: "0903829112",
        birthDate: "15/04/1968",
        joinDate: "15/01/2020",
        decisionNumber: "QĐ-TP-01/UBND-AP"
      },
      {
        id: "M_HOA_HG",
        fullName: "Trần Thị Mai Hoa",
        role: "Hòa giải viên",
        cccd: "079175002233",
        phone: "0918234567",
        birthDate: "20/11/1975",
        joinDate: "15/01/2020"
      }
    ]
  },
  {
    id: "ASC_PCCC",
    name: "Đội Dân phòng & PCCC cơ sở",
    category: "An ninh - Quốc phòng",
    description: "Thực hiện phương châm 4 tại chỗ trong PCCC và cứu nạn cứu hộ tại các cụm dân cư và nhà trọ.",
    leaderName: "Đặng Văn Nam",
    leaderCccd: "079088007788",
    members: [
      {
        id: "M_NAM_PCCC",
        fullName: "Đặng Văn Nam",
        role: "Đội trưởng Dân phòng",
        cccd: "079088007788",
        phone: "0988223344",
        birthDate: "01/01/1988",
        joinDate: "01/07/2024"
      }
    ]
  },
  {
    id: "ASC_NCT",
    name: "Chi hội Người cao tuổi",
    category: "Đoàn thể nhân dân",
    description: "Phong trào Tuổi cao gương sáng, động viên con cháu học tập và lao động tốt.",
    leaderName: "Vũ Đình Trọng",
    leaderCccd: "079055001122",
    members: [
      {
        id: "M_TRONG_NCT",
        fullName: "Vũ Đình Trọng",
        role: "Chi hội trưởng NCT",
        cccd: "079055001122",
        phone: "0903778899",
        birthDate: "10/10/1955",
        joinDate: "01/10/2016"
      }
    ]
  },
  {
    id: "ASC_ND",
    name: "Chi hội Nông dân",
    category: "Đoàn thể nhân dân",
    description: "Liên kết các hộ làm vườn, kinh tế đô thị và bảo vệ cảnh quan môi trường tại KP3.",
    leaderName: "Nguyễn Văn Thảo",
    leaderCccd: "079065004455",
    members: [
      {
        id: "M_THAO_ND",
        fullName: "Nguyễn Văn Thảo",
        role: "Chi hội trưởng Nông dân",
        cccd: "079065004455",
        phone: "0908776655",
        birthDate: "12/04/1965",
        joinDate: "14/10/2019"
      }
    ]
  },
  {
    id: "ASC_TBXH",
    name: "Chi hội Thương binh Xã hội",
    category: "Chính sách xã hội",
    description: "Chăm lo thực hiện chính sách đền ơn đáp nghĩa và bảo trợ xã hội tại khu phố.",
    leaderName: "Nguyễn Văn Hùng",
    leaderCccd: "079068001234",
    members: [
      {
        id: "M_HUNG_TB",
        fullName: "Nguyễn Văn Hùng",
        role: "Chi hội trưởng TBXH",
        cccd: "079068001234",
        phone: "0903829112",
        birthDate: "15/04/1968",
        joinDate: "27/07/2015"
      }
    ]
  },
  {
    id: "ASC_CTD",
    name: "Chi hội Chữ thập đỏ",
    category: "Hội quần chúng",
    description: "Tổ chức cứu trợ nhân đạo, vận động hiến máu tình nguyện và chăm lo người nghèo.",
    leaderName: "Phạm Thị Lan",
    leaderCccd: "079182004455",
    members: [
      {
        id: "M_LAN_CTD",
        fullName: "Phạm Thị Lan",
        role: "Chi hội trưởng CTĐ",
        cccd: "079182004455",
        phone: "0938445566",
        birthDate: "14/08/1982",
        joinDate: "23/11/2019",
        decisionNumber: "QĐ-CTD-01/HCTD-AP"
      }
    ]
  },
  {
    id: "ASC_KH",
    name: "Chi hội Khuyến học",
    category: "Hội quần chúng",
    description: "Trao học bổng Khuyến tài Khuyến học và nuôi dưỡng truyền thống hiếu học tại KP3.",
    leaderName: "Lê Văn Sơn",
    leaderCccd: "079070003112",
    members: [
      {
        id: "M_SON_KH",
        fullName: "Lê Văn Sơn",
        role: "Chi hội trưởng Khuyến học",
        cccd: "079070003112",
        phone: "0944112233",
        birthDate: "08/12/1970",
        joinDate: "02/10/2018"
      }
    ]
  },
  {
    id: "ASC_BNN",
    name: "Hội Bảo trợ người khuyết tật & Trẻ mồ côi",
    category: "Chính sách xã hội",
    description: "Bảo trợ xã hội và tiếp sức hòa nhập cộng đồng cho người yếu thế.",
    leaderName: "Trần Thị Mai Hoa",
    leaderCccd: "079175002233",
    members: [
      {
        id: "M_HOA_BNN",
        fullName: "Trần Thị Mai Hoa",
        role: "Chi hội trưởng",
        cccd: "079175002233",
        phone: "0918234567",
        birthDate: "20/11/1975",
        joinDate: "18/04/2019"
      }
    ]
  },
  {
    id: "ASC_TTD",
    name: "Tổ Tự quản Đô thị & Môi trường",
    category: "Phong trào tự quản",
    description: "Bảo vệ mỹ quan đô thị, không lấn chiếm lòng lề đường và phong trào Chủ nhật xanh.",
    leaderName: "Nguyễn Trung Huy",
    leaderCccd: "079080009988",
    members: [
      {
        id: "M_HUY_TTD",
        fullName: "Nguyễn Trung Huy",
        role: "Tổ trưởng tự quản",
        cccd: "079080009988",
        phone: "0909123888",
        birthDate: "12/03/1980",
        joinDate: "15/01/2020"
      }
    ]
  },
  {
    id: "ASC_DS",
    name: "Tổ Dân số & Chăm sóc Sức khỏe",
    category: "Chính sách xã hội",
    description: "Cộng tác viên dân số phụ trách theo dõi biến động cư dân và sức khỏe cộng đồng.",
    leaderName: "Phạm Thị Lan",
    leaderCccd: "079182004455",
    members: [
      {
        id: "M_LAN_DS",
        fullName: "Phạm Thị Lan",
        role: "Tổ trưởng Tổ Dân số",
        cccd: "079182004455",
        phone: "0938445566",
        birthDate: "14/08/1982",
        joinDate: "01/01/2019"
      }
    ]
  },
  {
    id: "ASC_GIAMSAT",
    name: "Ban Thanh tra Nhân dân & Ban Giám sát ĐTCĐ",
    category: "Đoàn thể nhân dân",
    description: "Giám sát công trình hạ tầng và việc thực hiện quy chế dân chủ cơ sở tại KP3.",
    leaderName: "Lê Văn Sơn",
    leaderCccd: "079070003112",
    members: [
      {
        id: "M_SON_GS",
        fullName: "Lê Văn Sơn",
        role: "Trưởng Ban Thanh tra",
        cccd: "079070003112",
        phone: "0944112233",
        birthDate: "08/12/1970",
        joinDate: "15/01/2020"
      }
    ]
  },
  {
    id: "ASC_TOTRUONG",
    name: "Tổ trưởng dân phố",
    category: "Chính quyền cơ sở",
    description: "Mạng lưới cán sự cơ sở phụ trách các tổ dân phố và cụm liên gia tại Khu phố 3.",
    leaderName: "Nguyễn Trung Huy",
    leaderCccd: "079080009988",
    members: [
      {
        id: "M_HUY_TT",
        fullName: "Nguyễn Trung Huy",
        role: "Tổ trưởng dân phố",
        cccd: "079080009988",
        phone: "0909123888",
        birthDate: "12/03/1980",
        joinDate: "15/01/2020"
      }
    ]
  },
  {
    id: "ASC_CTDANG",
    name: "Cảm tình Đảng",
    category: "Chính trị - Xã hội",
    description: "Hạt giống quần chúng ưu tú được Chi bộ Đảng Khu phố 3 phân công bồi dưỡng kết nạp.",
    leaderName: "Nguyễn Minh Quân",
    leaderCccd: "079095006677",
    members: [
      {
        id: "M_QUAN_CTD",
        fullName: "Nguyễn Minh Quân",
        role: "Đối tượng bồi dưỡng Đảng",
        cccd: "079095006677",
        phone: "0977889900",
        birthDate: "05/06/1995",
        joinDate: "19/05/2023"
      }
    ]
  },
  {
    id: "ASC_DANG213",
    name: "Đảng viên 213",
    category: "Chính trị - Xã hội",
    description: "Đảng viên sinh hoạt nơi cư trú theo Quy định số 213-QĐ/TW của Bộ Chính trị.",
    leaderName: "Trần Văn Thanh",
    leaderCccd: "079081005555",
    members: [
      {
        id: "M_THANH_213",
        fullName: "Trần Văn Thanh",
        role: "Tổ trưởng đảng viên 213",
        cccd: "079081005555",
        phone: "0919887766",
        birthDate: "25/07/1981",
        joinDate: "01/01/2020",
        decisionNumber: "QĐ-213/ĐU-AP"
      }
    ]
  }
];

export const getCategoryBadgeStyle = (cat: string) => {
  switch (cat) {
    case "Chính trị - Xã hội":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    case "Chính quyền cơ sở":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "An ninh - Quốc phòng":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "Đoàn thể nhân dân":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    case "Hội quần chúng":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "Chính sách xã hội":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    default:
      return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
  }
};
