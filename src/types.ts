export interface Resident {
  id: string;
  fullName: string;
  gender: "Nam" | "Nữ";
  birthDate: string;
  cccd: string;
  phone: string;
  status: "Thường trú" | "Tạm trú" | "Tạm vắng";
  occupation: string;
  address: string;
  householdId: string;
  relationToOwner: string;
  avatar?: string;
  joinDate?: string;
  
  // Extended demographic & administrative fields (CSDL Quốc gia về Dân cư / Đề án 06)
  ethnicity?: string;              // Dân tộc (Kinh, Hoa, Tày...)
  religion?: string;               // Tôn giáo (Không, Phật giáo, Công giáo...)
  nationality?: string;            // Quốc tịch (Việt Nam, Hàn Quốc, Anh...)
  hometown?: string;               // Quê quán
  permanentAddress?: string;       // Nơi thường trú gốc (Cột H ở Thường trú, Cột J ở Tạm trú)
  temporaryAddress?: string;       // Nơi ở hiện nay / Tạm trú (Cột J ở Thường trú, Cột G ở Tạm trú)
  currentAddress?: string;         // Chỗ ở hiện tại
  education?: string;              // Trình độ học vấn
  fatherName?: string;             // Họ tên cha (Cột K ở Thường trú)
  motherName?: string;             // Họ tên mẹ (Cột L ở Thường trú)
  temporaryRegDate?: string;       // Ngày đăng ký tạm trú (Cột H ở Tạm trú)
  temporaryExpDate?: string;       // Ngày hết hạn tạm trú (Cột I ở Tạm trú)
  managementStatus?: string;       // Tình trạng quản lý
  maritalStatus?: "Độc thân" | "Đã kết hôn" | "Ly hôn" | "Góa"; // Tình trạng hôn nhân
  workplace?: string;              // Nơi làm việc / Cơ quan công tác
  idIssueDate?: string;            // Ngày cấp CCCD / Hộ chiếu
  idIssuePlace?: string;           // Nơi cấp CCCD / Hộ chiếu
  healthInsuranceNumber?: string;  // Mã BHYT
  militaryServiceStatus?: string;  // Tình trạng nghĩa vụ quân sự
  policyGroup?: string;            // Nhóm chính sách / Đoàn thể (Đảng viên, Thương binh, Người cao tuổi...)
  emergencyContact?: string;       // Người liên hệ khẩn cấp (Họ tên - SĐT)
  notes?: string;                  // Ghi chú cư trú

  // Quản lý Dân cư Người nước ngoài cư trú (Foreign Resident Management)
  isForeigner?: boolean;                           // Là người nước ngoài cư trú
  passportNumber?: string;                         // Số hộ chiếu
  passportExpiryDate?: string;                     // Ngày hết hạn hộ chiếu
  visaOrCardType?: "Thẻ tạm trú (TRC)" | "Thẻ thường trú (PRC)" | "Thị thực LĐ" | "Thị thực ĐT" | "Thị thực TT" | "Miễn thị thực / E-Visa"; // Loại thị thực / Thẻ cư trú
  visaOrCardNumber?: string;                       // Số thẻ tạm trú / Thị thực
  visaValidFrom?: string;                          // Giá trị từ ngày
  visaValidUntil?: string;                         // Thời hạn cư trú đến ngày
  temporaryRegistrationCode?: string;              // Mã khai báo tạm trú trực tuyến CA Phường
  temporaryRegistrationDate?: string;              // Ngày khai báo tạm trú
  temporaryRegistrationStatus?: "Đã khai báo" | "Chờ xác nhận" | "Chưa khai báo" | "Hết hạn"; // Tình trạng khai báo tạm trú
  workPermitNumber?: string;                       // Số giấy phép lao động (GPLĐ) hoặc Miễn GPLĐ
  sponsoringOrganization?: string;                 // Cơ quan / Doanh nghiệp bảo lãnh
  landlordContact?: string;                        // Chủ nhà / Quản lý cơ sở lưu trú (Họ tên - SĐT)
}

export interface Household {
  id: string;
  code: string; // e.g. HK-301
  ownerName: string;
  address: string;
  memberCount: number;
  type?: "Thường trú" | "Tạm trú";
  coordinates?: string;
  members: {
    name: string;
    relation: string;
    cccd: string;
    phone?: string;
    birthYear: number;
  }[];
}

export interface BusinessFile {
  name: string;
  url: string;
  type: "image" | "pdf";
  size?: string;
  uploadDate?: string;
}

export interface InspectionLog {
  id: string;
  date: string;
  result: "Đạt chuẩn" | "Cảnh cáo" | "Không đạt" | "Yêu cầu khắc phục";
  inspector: string;
  note: string;
  recommendation?: string;
  penalties?: string;
}

export interface ForeignWorker {
  name: string;
  nationality: string;
  passportOrCode: string;
  position: string;
  temporaryResidenceStatus: "Đã khai báo tạm trú" | "Chưa khai báo" | "Đang làm thủ tục";
}

export interface BusinessChangeLog {
  id: string;
  date: string;
  type: "Mở mới" | "Chuyển địa điểm" | "Thay đổi ngành nghề" | "Thay đổi người đại diện" | "Tạm ngừng" | "Hoạt động trở lại" | "Khác";
  description: string;
  recordedBy: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  industryGroup?: string; // Nhóm phân loại ngành nghề (Ăn uống, Đời sống, Bán lẻ, Y tế, Lưu trú...)
  owner: string;
  phone: string;
  address: string;
  licenseNumber: string;
  status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt" | "Chuyển địa điểm" | "Chưa xác minh";
  employeeCount: number;
  safetyCertified: boolean;
  image?: string;
  images?: string[];
  coordinates?: string;

  // 1. Hồ sơ doanh nghiệp & Doanh nghiệp vừa và nhỏ (DNNVV)
  internalCode?: string;          // Mã hồ sơ nội bộ KP3 (ví dụ: DN-KP3-001)
  taxCode?: string;               // Mã số thuế / Mã số doanh nghiệp
  businessType?: "Công ty TNHH" | "Công ty Cổ phần" | "Doanh nghiệp tư nhân" | "Hộ kinh doanh" | "Cơ sở kinh doanh khác"; // Loại hình tổ chức
  enterpriseScale?: "Siêu nhỏ (< 5 LĐ)" | "Nhỏ (5 - 20 LĐ)" | "Vừa (20 - 50 LĐ)" | "Lớn (> 50 LĐ)"; // Phân loại quy mô
  startDate?: string;             // Ngày bắt đầu hoạt động tại địa chỉ
  verificationSource?: string;    // Nguồn xác minh (Khảo sát tổ dân phố, CSKV, Doanh nghiệp tự khai)

  // 2. Địa điểm, mặt bằng kinh doanh & Liên kết địa bàn
  streetArea?: string;            // Tuyến đường / Khu vực (Lương Định Của, Hẻm 42, Hẻm 18, Tổ 1, Tổ 2...)
  premisesType?: "Nhà phố" | "Văn phòng" | "Cửa hàng" | "Nhà xưởng" | "Ki-ốt" | "Địa điểm thuê" | "Chung cư / Căn hộ";
  premisesOwner?: string;         // Chủ sở hữu / người cho thuê mặt bằng
  premisesOwnerPhone?: string;    // SĐT chủ mặt bằng
  premisesOwnerCccd?: string;     // CCCD chủ mặt bằng
  linkedHouseholdCode?: string;   // Mã hộ dân liên kết (ví dụ: HK-301)
  linkedHouseholdOwner?: string;  // Tên chủ hộ liên kết
  linkedBuildingOrHostel?: string;// Liên kết cơ sở lưu trú / nhà trọ / tòa nhà

  // 3. Người đại diện và đầu mối liên hệ
  legalRepresentative?: string;   // Người đại diện theo pháp luật / Phụ trách
  legalRepPhone?: string;         // SĐT người đại diện
  legalRepCccd?: string;          // CCCD / Hộ chiếu người đại diện
  legalRepEmail?: string;         // Email liên hệ công vụ
  siteManager?: string;           // Người trực tiếp quản lý cơ sở tại chỗ
  siteManagerPhone?: string;      // SĐT người trực tiếp quản lý
  focalPointName?: string;        // Đầu mối phối hợp địa phương (tuyên truyền, khảo sát...)
  focalPointPhone?: string;       // SĐT đầu mối phối hợp
  focalPointRole?: string;        // Chức vụ / vai trò đầu mối

  // 4. Lao động & Quản lý Người nước ngoài
  localWorkersCount?: number;     // Lao động thường trú tại địa phương (KP3)
  temporaryWorkersCount?: number; // Lao động tạm trú
  foreignWorkersCount?: number;   // Số lượng lao động người nước ngoài
  foreignWorkers?: ForeignWorker[]; // Chi tiết chuyên gia / lao động người nước ngoài

  // 5. Nhu cầu hỗ trợ, khó khăn tự nguyện cung cấp
  supportNeeds?: string[];        // Danh mục nhu cầu hỗ trợ (Vốn vay chính sách, Thủ tục địa phương, PCCC, Mặt bằng, ANTT...)
  supportNotes?: string;          // Nội dung kiến nghị, khó khăn phản ánh

  // 6. Lịch sử biến động địa bàn
  changeHistory?: BusinessChangeLog[];

  // Địa chính & Giấy chứng nhận quyền sử dụng đất (Trích lục Tờ BĐ, Thửa, GCN)
  toBanDo?: string;             // Tờ BĐ (ví dụ: 272)
  soThua?: string;              // Số thửa (ví dụ: 55)
  dienTich?: number | string;   // Diện tích m² (ví dụ: 150)
  loaiDat?: string;             // Loại đất (ví dụ: ODT, TMD...)
  mapUrl?: string;              // Link Google Maps (https://maps.app.goo.gl/...)
  tenChuSuDung?: string;        // Tên chủ sử dụng đất
  soGcn?: string;               // Số GCN (Giấy chứng nhận QSDĐ / Sổ đỏ)
  soVaoSo?: string;             // Số vào sổ cấp GCN

  // Thông tin chuyên biệt cho cơ sở Nhà trọ, Nhà nghỉ, Khách sạn
  isAccommodation?: boolean;    // Đánh dấu cơ sở lưu trú / nhà trọ / nhà nghỉ
  soPhong?: number;             // Số phòng
  soTang?: number;              // Số tầng
  soNguoiLuuTru?: number;       // Số người đang lưu trú / thuê trọ
  giaThueTrungBinh?: string;    // Giá thuê tham khảo

  // Tệp tin đính kèm (Sổ đỏ, GPKD, PCCC...)
  soDoFile?: BusinessFile;      // File PDF / Hình ảnh Sổ đỏ
  giayPhepFile?: BusinessFile;  // File PDF / Hình ảnh Giấy phép kinh doanh
  pcccFile?: BusinessFile;      // File PDF / Hình ảnh chứng nhận PCCC
  pcccPassed?: boolean;         // Đạt chuẩn nghiệm thu PCCC
  hasCamKetAnNinh?: boolean;    // Đã ký cam kết ANTT với Công an Phường

  // Nhật ký Kiểm tra định kỳ (Thanh tra PCCC, Vệ sinh ATTP, Trật tự đô thị...)
  inspections?: InspectionLog[];
}

export interface FieldReport {
  id: string;
  title: string;
  category: "Rác thải" | "Lấn chiếm lòng đường" | "Tiếng ồn" | "An ninh trật tự" | "Hạ tầng đô thị";
  reporterName: string;
  reporterPhone: string;
  reportedAt: string;
  location: string;
  coordinates: { x: number; y: number };
  description: string;
  status: "Đã tiếp nhận" | "Đang xử lý" | "Đã giải quyết";
  timeline: {
    time: string;
    title: string;
    description: string;
    actor: string;
  }[];
  beforeImage?: string;
  afterImage?: string;
}

export interface PartyMember {
  id: string;
  fullName: string;
  partyCardNumber: string;
  position: string; // e.g. Bí thư, Đảng viên, Phó bí thư
  joinDate: string;
  cellGroup: string; // Tổ Đảng
  birthDate: string;
  status: "Đang sinh hoạt" | "Miễn sinh hoạt" | "Chuyển sinh hoạt";
  cccd?: string;
}

export interface WelfareRecipient {
  id: string;
  fullName: string;
  category: string;
  address: string;
  cccd: string;
  phone?: string;
  supportLevel: string;
  status: "Đang nhận trợ cấp" | "Chờ duyệt hồ sơ" | "Đã tạm ngưng";
  notes?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  organizer: string;
  dateTime: string;
  location: string;
  status: "Sắp diễn ra" | "Đang diễn ra" | "Đã kết thúc" | "Đã hủy";
  expectedAttendees: number;
  description: string;
}

export interface LocalNews {
  id: string;
  title: string;
  category: "Thông báo khẩn" | "Hành chính" | "Y tế & Đời sống" | "Phong trào" | "An sinh xã hội";
  date: string;
  author: string;
  content: string;
  isPinned?: boolean;
  image?: string;
}

export interface FundContribution {
  id: string;
  householdCode: string;
  ownerName: string;
  fundName: "Quỹ Khuyến học" | "Quỹ Vì người nghèo" | "Quỹ Quốc phòng an ninh" | "Quỹ Phòng chống thiên tai" | "Quỹ Bảo trì hẻm";
  amount: number;
  status: "Đã nộp" | "Chưa nộp";
  paidAt?: string;
}

export interface AdministrativeForm {
  id: string;
  code: string;
  title: string;
  category: "Cư trú & Hộ khẩu" | "Địa chính & Nhà ở" | "Hộ kinh doanh" | "Hộ tịch & Tư pháp" | "An sinh xã hội" | "Tổ dân phố & Chi bộ";
  issuingBody: string;
  description: string;
  requiredDocuments: string[];
  processingTime: string;
  fee: string;
  fileFormat: "DOCX" | "PDF" | "DOCX / PDF";
  fileSize: string;
  downloadCount: number;
  templateContent: string;
}

export interface AssociationMember {
  id: string;
  fullName: string;
  role: string;
  cccd: string;
  phone?: string;
  birthDate?: string;
  joinDate?: string; // Ngày tham gia chi hội / kết nạp
  decisionNumber?: string; // Số quyết định chuẩn y / công nhận
  decisionDate?: string; // Ngày ban hành quyết định
  decisionFile?: {
    name: string;
    url: string; // Base64 Data URL or preview link
    type: "image" | "pdf";
    size?: string;
    uploadDate?: string;
  };
  avatar?: string; // Hình ảnh đại diện thành viên (Base64 hoặc URL)
}

export interface Association {
  id: string;
  name: string;
  category: "Chính trị - Xã hội" | "Chính quyền cơ sở" | "An ninh - Quốc phòng" | "Đoàn thể nhân dân" | "Hội quần chúng" | "Chính sách xã hội" | "Phong trào tự quản";
  description: string;
  leaderName: string;
  leaderCccd: string;
  members: AssociationMember[];
}

export type ActiveTab = 
  | "dashboard"
  | "residents"
  | "households"
  | "enterprises"
  | "businesses"
  | "gis"
  | "tasks"
  | "ai"
  | "reports"
  | "forms"
  | "party"
  | "welfare"
  | "cultural"
  | "finance"
  | "plan"
  | "settings";

export interface TargetGisItem {
  id?: string;
  type?: "household" | "business" | "enterprise" | "custom" | "camera" | "fire" | "light";
  name: string;
  address?: string;
  coordinates?: string;
  lat?: number;
  lng?: number;
  navigateRoute?: boolean;
}

export interface TaskAssignee {
  name: string;
  role: string;
  unit: string;
  phone?: string;
  avatar?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  unit: "Tổ dân phố 11" | "Tổ dân phố 12" | "Tổ dân phố 13" | "Tổ dân phố 14" | "Tổ dân phố 15" | "Ban Điều hành KP" | "Chi bộ KP3" | "Chi đoàn Thanh niên" | "Hội Phụ nữ" | "Tổ Bảo vệ ANTT";
  assignee: TaskAssignee;
  creator: string;
  priority: "Thấp" | "Trung bình" | "Cao" | "Khẩn cấp";
  status: "Chờ xử lý" | "Đang thực hiện" | "Chờ nghiệm thu" | "Hoàn thành";
  progressPercent: number;
  startDate: string;
  deadline: string;
  completedAt?: string;
  proofImages?: string[];
  notes?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  type: "Họp Chi bộ" | "Họp Tổ Dân Phố" | "Tuần tra ANTT" | "Chủ Nhật Xanh" | "Tiếp công dân" | "Hội nghị Khu phố" | "Khác";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm - HH:mm
  location: string;
  host: string;
  attendees: string;
  status: "Sắp diễn ra" | "Đang diễn ra" | "Đã kết thúc" | "Đã hoãn";
  notes?: string;
}

