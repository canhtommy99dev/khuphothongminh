import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Database, 
  MapPin, 
  ShieldCheck, 
  CalendarDays, 
  Bot, 
  Copy, 
  Check, 
  ChevronRight, 
  Table, 
  Code, 
  Activity,
  DollarSign,
  TrendingUp,
  Cpu,
  Info,
  Users,
  Home,
  Briefcase,
  Award,
  Heart,
  AlertTriangle,
  Globe,
  BookOpen,
  FolderPlus,
  Key,
  CheckSquare,
  Compass,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  HelpCircle
} from "lucide-react";

// Types for Data Dictionary
interface ColumnDef {
  name: string;
  type: string;
  constraints: string;
  description: string;
  sample: string;
}

interface TableDef {
  name: string;
  purpose: string;
  columns: ColumnDef[];
}

interface CategoryDef {
  id: string;
  title: string;
  description: string;
  tables: TableDef[];
}

interface RoadmapPhase {
  id: number;
  title: string;
  name: string;
  iconName: string;
  objective: string;
  requirements: string[];
  outputs: string[];
  criteria: string[];
  prompt: string;
}

const roadmapPhases: RoadmapPhase[] = [
  {
    id: 1,
    title: "Giai đoạn 01",
    name: "Phân tích nghiệp vụ",
    iconName: "ClipboardList",
    objective: "Phân tích nghiệp vụ cốt lõi: Dân cư, Hộ dân, Tạm trú/vắng, Nhà trọ, Kinh doanh cá thể, Chi bộ Đảng, Mặt trận Đoàn thể, Phản ánh hiện trường, Bản đồ GIS, Trợ lý AI và Lịch công tác.",
    requirements: [
      "Khảo sát và rà soát đặc thù quản lý của 650 hộ dân và gần 12.000 nhân khẩu tại Khu phố 3 An Phú",
      "Xác lập nghiệp vụ quản lý cư trú, tạm trú ngắn hạn cho nhà trọ công nhân và lao động nhập cư",
      "Nghiên cứu quy trình báo cáo hành chính, hoạt động của Chi bộ, Đoàn thể chính trị và Ban CTMT",
      "Lập quy trình tiếp nhận và phân phối xử lý tin báo, phản ánh hiện trường của người dân"
    ],
    outputs: [
      "Business Requirement Document (BRD) phân tích nghiệp vụ hoàn chỉnh",
      "Danh sách User Story chi tiết cho từng nhóm đối tượng người dùng",
      "Sơ đồ Use Case tổng quan và chi tiết cho từng phân hệ nghiệp vụ",
      "Sơ đồ luồng đi của thông tin và trải nghiệm người dùng (User Flow)"
    ],
    criteria: [
      "Tài liệu BRD được kiểm duyệt bởi Tổ công tác chuyển đổi số Khu phố 3",
      "Bao quát đầy đủ 10 phân hệ cốt lõi, không bỏ sót bất kỳ quy trình nghiệp vụ thực tế nào"
    ],
    prompt: "Bạn là Business Analyst và Solution Architect. Hãy phân tích nghiệp vụ hệ thống 'Khu phố thông minh' cho Khu phố 3, Phường An Phú, TP. Hồ Chí Minh. Cung cấp tài liệu BRD hoàn chỉnh bao gồm User Story, Use Case, User Flow, chức năng và phi chức năng cho quản lý dân cư, nhà trọ, kinh doanh cá thể, chi bộ đảng, phản ánh hiện trường."
  },
  {
    id: 2,
    title: "Giai đoạn 02",
    name: "Thiết kế kiến trúc hệ thống",
    iconName: "Cpu",
    objective: "Thiết kế kiến trúc hệ thống tổng thể, mô hình luồng dữ liệu, sơ đồ kết nối API bảo mật và phương án triển khai.",
    requirements: [
      "Lựa chọn công nghệ: NextJS/React, Express backend proxy, Supabase Cloud, PostgreSQL, PostGIS",
      "Thiết kế cơ chế giấu API Key của các bên thứ ba (Gemini API, Google Maps) ở phía server bảo mật",
      "Xác định mô hình giao tiếp thời gian thực qua WebSockets / Server-Sent Events cho thông báo",
      "Thiết kế phương án triển khai Containerized (Docker) trên Google Cloud Run"
    ],
    outputs: [
      "Kiến trúc tổng quan (Architecture Diagram) dưới dạng Mermaid",
      "Sơ đồ luồng dữ liệu bảo mật (Security & Data Flow Diagram)",
      "Định nghĩa kiến trúc các API chính (API Spec) và luồng đồng bộ",
      "Sơ đồ hạ tầng triển khai đám mây (Deployment Diagram)"
    ],
    criteria: [
      "Kiến trúc tối ưu hóa phi máy chủ (Serverless) chịu tải được lượng người dùng lớn",
      "Sơ đồ Mermaid thiết kế rõ ràng, chính xác, không bị lỗi cú pháp"
    ],
    prompt: "Bạn là Enterprise Solution Architect. Hãy thiết kế kiến trúc hệ thống dạng Mermaid cho nền tảng Khu phố thông minh. Frontend sử dụng NextJS/React, backend sử dụng Express, database PostgreSQL + PostGIS, tích hợp Gemini và Google Maps. Cung cấp sơ đồ Data Flow, API, và Deployment."
  },
  {
    id: 3,
    title: "Giai đoạn 03",
    name: "Thiết kế cơ sở dữ liệu",
    iconName: "Database",
    objective: "Thiết kế mô hình dữ liệu quan hệ chuẩn hóa 3NF, tích hợp thuộc tính địa lý không gian PostGIS cho bản đồ số.",
    requirements: [
      "Thiết kế cấu trúc bảng dữ liệu cho toàn bộ 10 phân hệ, bao gồm các bảng kết nối quan hệ",
      "Xác định chi tiết kiểu dữ liệu, ràng buộc khóa ngoại (Foreign Key) và chỉ mục Index",
      "Tích hợp các kiểu dữ liệu hình học (Point, MultiPolygon) phục vụ GIS của PostGIS"
    ],
    outputs: [
      "Từ điển dữ liệu (Data Dictionary) chi tiết 44 bảng thiết kế",
      "Sơ đồ thực thể quan hệ ERD (Entity Relationship Diagram) trực quan",
      "Tập lệnh SQL Schema khởi tạo cấu trúc các bảng và chỉ mục Index"
    ],
    criteria: [
      "Cấu trúc dữ liệu đạt chuẩn hóa 3NF chống trùng lặp, tối ưu hiệu năng",
      "Các ràng buộc khóa ngoại đồng bộ chính xác, không mâu thuẫn"
    ],
    prompt: "Bạn là PostgreSQL Architect. Hãy thiết kế cơ sở dữ liệu quan hệ hoàn chỉnh cho hệ thống Khu phố thông minh gồm các module: Dân cư, Hộ dân, Nhà trọ, Kinh doanh, Đảng bộ, Đoàn thể, GIS, Phản ánh, Văn bản, Người dùng. Xuất SQL schema khởi tạo đầy đủ các bảng và khóa."
  },
  {
    id: 4,
    title: "Giai đoạn 04",
    name: "Thiết kế phân quyền (RBAC)",
    iconName: "ShieldCheck",
    objective: "Thiết kế ma trận kiểm soát truy cập dựa trên vai trò (RBAC) chi tiết cho 8 nhóm chức vụ của khu phố.",
    requirements: [
      "Xây dựng danh mục 8 nhóm vai trò: Super Admin, Bí thư, Trưởng KP, Ban CTMT, Chi hội trưởng, Tổ ANTT, Cán bộ, Cư dân",
      "Xây dựng Permission Matrix quy định rõ quyền Đọc/Ghi/Sửa/Xóa của từng nhóm trên mỗi phân hệ",
      "Thiết kế chính sách Row Level Security (RLS) của Postgres bảo mật dữ liệu ở mức dòng"
    ],
    outputs: [
      "Ma trận chức năng chi tiết theo vai trò (Permission Matrix)",
      "Danh sách phân bổ quyền hạn cho từng vai trò người dùng (Role Matrix)",
      "Dự thảo các quy định chính sách bảo mật cơ sở dữ liệu RLS"
    ],
    criteria: [
      "Mỗi vai trò có ranh giới quyền hạn rõ ràng, không chồng chéo, không phân quyền thừa",
      "Bảo đảm người dân chỉ truy xuất được thông tin hộ gia đình mình, cán bộ chỉ cập nhật phần việc được giao"
    ],
    prompt: "Hãy thiết kế hệ thống kiểm soát truy cập dựa trên vai trò (RBAC) cho Khu phố thông minh với 8 vai trò đặc thù. Cung cấp Permission Matrix chi tiết cho từng phân hệ và mã mẫu RLS (Row Level Security) trên PostgreSQL để bảo mật dữ liệu cư dân."
  },
  {
    id: 5,
    title: "Giai đoạn 05",
    name: "Thiết kế giao diện UI UX",
    iconName: "Layout",
    objective: "Thiết kế sitemap cấu trúc, hành trình trải nghiệm và giao diện Material Design 3 đẹp mắt.",
    requirements: [
      "Thiết kế Sitemap cấu trúc định vị các màn hình chức năng chính",
      "Xây dựng User Journey cho các luồng hành vi trọng điểm (gửi phản ánh hiện trường, duyệt nhân khẩu)",
      "Định hình hệ thống thiết kế (Design System) đồng nhất: màu sắc, font chữ, các component mẫu"
    ],
    outputs: [
      "Sơ đồ cấu trúc trang (Sitemap) và hành trình trải nghiệm người dùng",
      "Bản vẽ Wireframes và mô hình giao diện độ phân giải cao (High Fidelity Mockup)",
      "Bộ linh kiện giao diện (Component Library) responsive tối ưu trên di động"
    ],
    criteria: [
      "Giao diện tối ưu khả năng đọc tốt, tương phản cao, dễ bấm cho người cao tuổi",
      "Đáp ứng chuẩn thiết kế Material Design 3 hiện đại, gọn gàng và khoa học"
    ],
    prompt: "Bạn là Senior UX Designer. Hãy thiết kế sitemap, hành trình người dùng (User Journey) và các thành phần giao diện (Design System) cho Dashboard, Dân cư, Hộ dân, Nhà trọ, Kinh doanh, Đảng bộ, Đoàn thể, GIS, Trợ lý AI dựa trên Material Design 3."
  },
  {
    id: 6,
    title: "Giai đoạn 06",
    name: "Khởi tạo dự án",
    iconName: "FolderPlus",
    objective: "Khởi tạo mã nguồn dự án React/Vite TypeScript, cấu hình Tailwind CSS, linter và chạy thử nghiệm build.",
    requirements: [
      "Thiết lập cấu trúc thư mục tiêu chuẩn: /app, /components, /hooks, /lib, /services, /types",
      "Cấu hình Vite dev server chạy trên cổng 3000 cố định phục vụ container",
      "Thiết lập TypeScript nghiêm ngặt, cấu hình linter để bắt lỗi cú pháp sớm"
    ],
    outputs: [
      "Khung xương dự án (Scaffold) hoàn chỉnh cấu trúc file",
      "File cấu hình môi trường .env.example mẫu rõ ràng",
      "Mã nguồn biên dịch thành công không có bất kỳ cảnh báo lỗi nghiêm trọng nào"
    ],
    criteria: [
      "Dự án khởi động thành công trên môi trường localhost",
      "Hoạt động tốt không lỗi kiểu dữ liệu TypeScript hay lỗi linter"
    ],
    prompt: "Hãy viết kịch bản khởi tạo dự án React/Vite TypeScript. Cấu hình Tailwind CSS v4, thiết lập cấu trúc thư mục chuẩn và khởi tạo tệp package.json đầy đủ cùng cấu hình tsconfig.json để đảm bảo biên dịch thành công."
  },
  {
    id: 7,
    title: "Giai đoạn 07",
    name: "Xây dựng database thực tế",
    iconName: "Code",
    objective: "Sinh các tập lệnh SQL Migration khởi tạo toàn bộ cấu trúc cơ sở dữ liệu Postgres + PostGIS trên Supabase.",
    requirements: [
      "Xây dựng bộ kịch bản khởi tạo 44 bảng dữ liệu, các chỉ mục tìm kiếm Index",
      "Lập trình Trigger tự động cập nhật trường thời gian updated_at và ghi vết log hệ thống",
      "Viết các SQL View phục vụ các thống kê phức tạp và các Stored Procedure"
    ],
    outputs: [
      "Các file SQL Migrations sắp xếp tuần tự theo phiên bản (001_init.sql, 002_auth.sql, ...)",
      "Các hàm thủ tục (Postgres Functions & Triggers) tự động hóa",
      "Bộ dữ liệu mẫu (Seed Data) đầy đủ cho 44 bảng để kiểm thử"
    ],
    criteria: [
      "Import thành công vào môi trường Postgres không phát sinh lỗi cú pháp hay xung đột ràng buộc",
      "Các trigger hoạt động chính xác khi thao tác dữ liệu"
    ],
    prompt: "Bạn là PostgreSQL Architect. Hãy viết các file SQL Migration (001_init.sql, 002_auth.sql, 003_citizens.sql) khởi tạo bảng, thiết lập ràng buộc khóa ngoại, tạo trigger tự động cập nhật updated_at và seed dữ liệu mẫu phong phú."
  },
  {
    id: 8,
    title: "Giai đoạn 08",
    name: "Xây dựng Authentication",
    iconName: "Key",
    objective: "Tích hợp hệ thống xác thực tài khoản an toàn qua Supabase Auth và quản lý phiên làm việc bảo mật.",
    requirements: [
      "Lập trình trang đăng nhập (Login), đăng ký tài khoản (Register), quên mật khẩu",
      "Tích hợp xác thực hai yếu tố / gửi mã OTP xác nhận tài khoản",
      "Xây dựng cơ chế lưu giữ trạng thái đăng nhập, giải mã JWT kiểm tra vai trò người dùng"
    ],
    outputs: [
      "Các trang giao diện đăng nhập, đăng ký và lấy lại mật khẩu responsive",
      "Cơ chế Session Management đồng bộ ở client và API server",
      "Hệ thống định tuyến bảo vệ (Protected Routes) chặn người dùng chưa đăng nhập"
    ],
    criteria: [
      "Xác thực chuẩn xác, mã hóa mật khẩu ở DB dạng băm an toàn",
      "Bảo mật chống tấn công đánh cắp session bằng cách cấu hình Cookie an toàn"
    ],
    prompt: "Hãy lập trình module xác thực an toàn tích hợp Supabase Auth trong React. Xây dựng các trang Login, Register, Forgot Password và hook useAuth quản lý trạng thái session, kiểm tra mã token JWT và điều phối phân quyền người dùng."
  },
  {
    id: 9,
    title: "Giai đoạn 09",
    name: "Phát triển Module Dân cư",
    iconName: "Users",
    objective: "Xây dựng giao diện CRUD quản lý dữ liệu nhân khẩu của 12.000 cư dân, hỗ trợ quét QR Code và import Excel.",
    requirements: [
      "Thiết kế giao diện bảng dữ liệu cư dân, form tạo mới, cập nhật đầy đủ thông tin",
      "Phát triển công cụ quét QR Code trích xuất dữ liệu từ thẻ CCCD gắn chip",
      "Xây dựng tính năng Import cư dân hàng loạt từ file Excel và xuất báo cáo PDF/Excel"
    ],
    outputs: [
      "Giao diện quản lý dân cư (CitizenManagement Component) hoàn chỉnh",
      "Công cụ lọc nâng cao theo độ tuổi, giới tính, tổ dân phố, trạng thái",
      "Hệ thống parser tệp Excel client-side bảo mật"
    ],
    criteria: [
      "Các thao tác CRUD hoạt động trơn tru không lỗi, hiển thị dữ liệu chính xác",
      "Import file Excel chứa hàng trăm dòng hoạt động thành công dưới 3 giây"
    ],
    prompt: "Hãy xây dựng module Quản lý Dân cư trong React. Thiết kế giao diện CRUD hiện đại, hỗ trợ tìm kiếm nâng cao, bộ lọc thông minh theo tổ dân phố và trạng thái cư trú, tích hợp chức năng import/export Excel và tạo mã định danh QR Code."
  },
  {
    id: 10,
    title: "Giai đoạn 10",
    name: "Phát triển Module Hộ dân",
    iconName: "Home",
    objective: "Xây dựng tính năng quản lý hộ gia đình, liên kết thành viên và theo dõi lịch sử biến động cư trú.",
    requirements: [
      "Lập trình giao diện quản lý sổ hộ khẩu, địa chỉ số và thông tin chủ hộ",
      "Phát triển tính năng thêm mới, chỉnh sửa mối quan hệ thành viên hộ",
      "Xây dựng nhật ký ghi vết lịch sử biến động cư trú (chuyển khẩu, tách hộ)"
    ],
    outputs: [
      "Màn hình quản lý hộ dân (HouseholdManagement Component)",
      "Sơ đồ biểu diễn quan hệ gia đình trực quan dễ nhìn",
      "Nhật ký lưu vết lịch sử biến động thông tin hộ gia đình"
    ],
    criteria: [
      "Dữ liệu thành viên liên kết đồng bộ 100% với bảng dân cư chính",
      "Bấm xem chi tiết hộ gia đình hiển thị đầy đủ thông tin các thành viên"
    ],
    prompt: "Hãy xây dựng module Quản lý Hộ dân. Thiết kế giao diện hiển thị danh sách hộ gia đình, bảng liên kết thành viên hộ với mối quan hệ cụ thể (Chủ hộ, Vợ, Con, Cháu), và lịch sử biến động cư trú như chuyển đi/đến."
  },
  {
    id: 11,
    title: "Giai đoạn 11",
    name: "Phát triển Module Nhà trọ",
    iconName: "Home",
    objective: "Xây dựng tính năng quản lý nhà trọ, căn hộ cho thuê, phòng trọ và kiểm soát tạm trú cho công nhân.",
    requirements: [
      "Lập trình danh mục quản lý cơ sở nhà trọ, phòng trọ thuộc cơ sở",
      "Theo dõi danh sách khách thuê trọ, số điện thoại, đăng ký tạm trú tạm vắng",
      "Vẽ biểu đồ thống kê công suất cho thuê và tình trạng phòng trống"
    ],
    outputs: [
      "Giao diện quản lý nhà trọ, sơ đồ danh sách các phòng",
      "Màn hình quản lý đăng ký lưu trú dành cho chủ trọ",
      "Biểu đồ trực quan mật độ cư trú tại các khu trọ"
    ],
    criteria: [
      "Theo dõi đầy đủ lịch sử lưu trú của từng phòng trọ",
      "Liên kết chặt chẽ với module dân cư để kiểm soát nhân khẩu thuê trọ"
    ],
    prompt: "Hãy viết code React cho module Quản lý Nhà trọ. Giao diện bao gồm danh sách các chủ trọ, số phòng cho thuê, danh sách khách thuê hiện tại, trạng thái khai báo tạm trú và hiển thị biểu đồ thống kê công suất phòng."
  },
  {
    id: 12,
    title: "Giai đoạn 12",
    name: "Phát triển Module Hộ kinh doanh",
    iconName: "Briefcase",
    objective: "Xây dựng tính năng quản lý hồ sơ hộ kinh doanh cá thể, phân loại ngành nghề và kiểm tra an toàn PCCC.",
    requirements: [
      "Lập trình lưu trữ hồ sơ hộ kinh doanh, giấy phép đăng ký, mã số thuế",
      "Xây dựng bộ phân loại ngành nghề kinh doanh, trạng thái vệ sinh ATTP",
      "Thiết lập lịch kiểm tra định kỳ và biên bản kết quả kiểm tra PCCC"
    ],
    outputs: [
      "Màn hình quản lý hộ kinh doanh (BusinessManagement Component)",
      "Lịch kiểm tra (Inspections schedule) và kho lưu trữ biên bản kiểm tra",
      "Cơ chế cảnh báo thông minh hộ kinh doanh sắp hết hạn giấy phép"
    ],
    criteria: [
      "Tìm kiếm nhanh hộ kinh doanh theo tên, mã số thuế, ngành nghề",
      "Lịch kiểm tra hiển thị trực quan, hỗ trợ cập nhật kết quả nhanh chóng"
    ],
    prompt: "Hãy xây dựng module Quản lý Hộ kinh doanh cá thể trong React. Thiết kế bảng hiển thị danh sách cơ sở, bộ lọc theo ngành nghề, trạng thái kiểm tra an toàn PCCC, và tính năng cập nhật lịch hẹn kiểm tra định kỳ."
  },
  {
    id: 13,
    title: "Giai đoạn 13",
    name: "Phát triển Module Đảng bộ",
    iconName: "Award",
    objective: "Số hóa lý lịch đảng viên, quản lý sinh hoạt chi bộ hằng tháng và dự thảo Nghị quyết chi bộ.",
    requirements: [
      "Lập trình quản lý hồ sơ đảng viên, chức vụ Đảng, ngày kết nạp, ngày chính thức",
      "Phát triển phân hệ quản lý lịch họp, danh sách chuyên đề sinh hoạt Chi bộ 3",
      "Tích hợp kho lưu trữ dự thảo và Nghị quyết Chi bộ ban hành hằng kỳ"
    ],
    outputs: [
      "Giao diện quản lý chi bộ (PartyBranch Component) hoàn chỉnh",
      "Kho tư liệu Nghị quyết và Biên bản sinh hoạt Đảng",
      "Bảng phân công đảng viên theo dõi, giúp đỡ hộ nghèo/tổ dân phố"
    ],
    criteria: [
      "Tuyệt đối bảo mật thông tin hồ sơ lý lịch chính trị đảng viên theo quy định",
      "Hệ thống nạp sẵn các biểu mẫu văn bản Đảng chuẩn giúp soạn thảo nhanh"
    ],
    prompt: "Hãy xây dựng module Quản lý Công tác Đảng bộ cho Chi bộ 3. Lập trình giao diện quản lý lý lịch đảng viên, lịch họp chi bộ, soạn thảo và lưu trữ nghị quyết, và bảng phân công đảng viên giám sát tổ dân tự quản."
  },
  {
    id: 14,
    title: "Giai đoạn 14",
    name: "Phát triển Module Đoàn thể",
    iconName: "Heart",
    objective: "Xây dựng tính năng quản lý danh sách hội viên, lịch hoạt động phong trào và thu chi các quỹ xã hội.",
    requirements: [
      "Quản lý 5 tổ chức đoàn thể cơ sở: Cựu chiến binh, Hội Phụ nữ, Đoàn Thanh niên, Khuyến học, Người cao tuổi",
      "Theo dõi lịch trình các hoạt động phong trào thi đua, vận động cộng đồng",
      "Số hóa thu chi, đóng góp ngân quỹ tự quản của từng đoàn thể minh bạch"
    ],
    outputs: [
      "Giao diện quản lý Đoàn thể chính trị - xã hội",
      "Kho dữ liệu lịch trình phong trào và hoạt động thiện nguyện",
      "Sổ cái tài chính quỹ đoàn thể cập nhật số dư thời gian thực"
    ],
    criteria: [
      "Hội viên liên kết khớp đúng với dữ liệu cư dân để tránh số liệu ảo",
      "Công khai số liệu quỹ rõ ràng, chi tiết dòng tiền thu và chi"
    ],
    prompt: "Hãy lập trình module Quản lý Đoàn thể xã hội. Giao diện bao gồm các tab riêng cho Hội Phụ nữ, Cựu chiến binh, Đoàn Thanh niên, Khuyến học để quản lý danh sách hội viên, lịch trình hoạt động phong trào và thu chi quỹ hội."
  },
  {
    id: 15,
    title: "Giai đoạn 15",
    name: "Tích hợp bản đồ số GIS",
    iconName: "MapPin",
    objective: "Tích hợp Google Maps và PostGIS hiển thị trực quan không gian địa bàn Khu phố 3, ranh giới tổ dân phố.",
    requirements: [
      "Vẽ và số hóa ranh giới đa giác (MultiPolygon) của 15 tổ dân phố trên bản đồ số",
      "Định vị tọa độ (Point) của từng hộ dân, hộ kinh doanh trên bản đồ nền",
      "Tích hợp hiển thị vị trí các camera giám sát an ninh và điểm nóng ANTT"
    ],
    outputs: [
      "Giao diện bản đồ số (GisMap Component) tương tác mượt mà",
      "Các bộ lọc lớp bản đồ (Map Layers) thông minh: camera, hộ dân, phản ánh",
      "Khối popup thông tin nhanh khi click chuột vào một điểm định vị"
    ],
    criteria: [
      "Bản đồ tải nhanh, tọa độ trùng khớp thực tế ranh giới Khu phố 3 tại Phường An Phú",
      "Hỗ trợ tính toán khoảng cách không gian (Spatial Queries) phục vụ an ninh"
    ],
    prompt: "Hãy lập trình module Bản đồ GIS tích hợp Google Maps Platform trong React. Vẽ ranh giới địa bàn Khu phố 3, định vị vị trí các hộ dân, hộ kinh doanh, camera an ninh, và chốt ANTT, hỗ trợ lọc địa điểm theo lớp bản đồ."
  },
  {
    id: 16,
    title: "Giai đoạn 16",
    name: "Phát triển Phản ánh hiện trường",
    iconName: "AlertTriangle",
    objective: "Xây dựng phân hệ tiếp nhận tin báo, phản ánh trật tự đô thị, tiếng ồn từ cư dân và xử lý 3 bước.",
    requirements: [
      "Thiết kế form gửi phản ánh: tải ảnh hiện trường, nhập mô tả, lấy vị trí GPS thực tế",
      "Lập trình quy trình điều phối: Tiếp nhận -> Phân công Tổ ANTT/Cán bộ xử lý -> Báo cáo hoàn thành",
      "Hệ thống tự động cập nhật tiến độ xử lý và gửi thông báo trực quan cho cư dân"
    ],
    outputs: [
      "Giao diện phản ánh hiện trường (FieldReflections Component)",
      "Bảng điều khiển điều phối phản ánh dành cho Trưởng khu phố",
      "Quy trình xử lý khép kín đính kèm hình ảnh kết quả khắc phục"
    ],
    criteria: [
      "Lưu trữ tọa độ chính xác của phản ánh phục vụ định vị nhanh trên bản đồ GIS",
      "Tin báo được gửi thẳng đến đúng bộ phận có thẩm quyền xử lý trong 5 phút"
    ],
    prompt: "Hãy xây dựng module Phản ánh hiện trường. Thiết kế form cho người dân báo cáo sự việc (tải ảnh, nhập GPS, mô tả) và giao diện quản lý cho cán bộ tiếp nhận, phân công Tổ ANTT xử lý và cập nhật tiến độ."
  },
  {
    id: 17,
    title: "Giai đoạn 17",
    name: "Tích hợp Trợ lý ảo AI",
    iconName: "Bot",
    objective: "Xây dựng hệ thống 4 AI Agents chuyên trách (Bí thư, Trưởng KP, Mặt trận, ANTT) sử dụng Gemini API.",
    requirements: [
      "Tích hợp SDK @google/genai gọi model Gemini 3.5 Flash server-side",
      "Huấn luyện tập lệnh System Instruction chuyên sâu cho từng vai trò trợ lý",
      "Thiết kế giao diện chat đa luồng đẹp mắt, hỗ trợ soạn thảo văn bản tự động"
    ],
    outputs: [
      "Giao diện Trợ lý AI (AiAssistant Component) trực quan",
      "Hệ thống 4 trợ lý ảo nạp ngữ cảnh nghiệp vụ khác biệt",
      "Chức năng kết xuất văn bản dự thảo hành chính ra tệp .docx / .pdf"
    ],
    criteria: [
      "AI phản hồi hoàn toàn bằng tiếng Việt hành chính chuẩn mực, chính xác",
      "Không lộ khóa API Key của Gemini ở client dưới mọi hình thức"
    ],
    prompt: "Hãy lập trình module AI Assistant trong React sử dụng SDK @google/genai server-side. Tạo ra 4 AI Agent chuyên trách (Trợ lý Bí thư, Trợ lý Trưởng KP, Trợ lý Mặt trận, Trợ lý ANTT) với system instructions riêng biệt hỗ trợ soạn thảo văn bản."
  },
  {
    id: 18,
    title: "Giai đoạn 18",
    name: "Phát triển Dashboard điều hành",
    iconName: "TrendingUp",
    objective: "Thiết kế Dashboard trung tâm tổng hợp KPIs chỉ số và biểu đồ thống kê động sử dụng Recharts.",
    requirements: [
      "Vẽ biểu đồ Recharts cơ cấu dân số theo giới tính, độ tuổi, tổ dân phố",
      "Vẽ biểu đồ thu chi quỹ tự quản và tiến độ giải quyết các phản ánh hiện trường",
      "Hiển thị bảng điều khiển chuyên biệt cho từng vai trò cán bộ"
    ],
    outputs: [
      "Giao diện Dashboard tổng thể (Dashboard Component)",
      "Hệ thống biểu đồ Recharts phân tích dữ liệu trực quan",
      "Khối thống kê nhanh KPIs nổi bật toàn địa bàn"
    ],
    criteria: [
      "Biểu đồ tự động làm mới dữ liệu từ cơ sở dữ liệu thời gian thực",
      "Responsive hoàn hảo hiển thị đẹp mắt trên các kích cỡ màn hình tablet"
    ],
    prompt: "Hãy xây dựng giao diện Dashboard điều hành trung tâm sử dụng Recharts trong React. Hiển thị các chỉ số KPI chính (Tổng dân số, số hộ gia đình, số hộ kinh doanh, phản ánh chưa xử lý) và các biểu đồ phân tích cơ cấu cư dân."
  },
  {
    id: 19,
    title: "Giai đoạn 19",
    name: "Kiểm thử hệ thống",
    iconName: "CheckSquare",
    objective: "Thực hiện kiểm thử chức năng, kiểm thử tích hợp API, kiểm tra an toàn bảo mật và UAT người dùng.",
    requirements: [
      "Kiểm toán lỗ hổng bảo mật SQL Injection, XSS, kiểm thử phân quyền RBAC API",
      "Đo lường thời gian tải trang, tối ưu hóa kích thước bundle JS",
      "Tổ chức kiểm thử chấp nhận người dùng (UAT) diện rộng tại hội trường KP3"
    ],
    outputs: [
      "Tài liệu báo cáo kết quả kiểm thử (Test Report) chi tiết",
      "Danh sách các lỗi (Bug Tracker) đã được vá triệt để",
      "Biên bản xác nhận nghiệm thu kỹ thuật UAT có chữ ký đại diện"
    ],
    criteria: [
      "Tất cả các tính năng cốt lõi vượt qua kiểm thử chức năng 100%",
      "Thời gian tải trang đầu dưới 1.5 giây, không bị giật lag"
    ],
    prompt: "Hãy viết kế hoạch kiểm thử hệ thống và báo cáo kiểm thử UAT cho ứng dụng Khu phố thông minh. Chi tiết các bước kiểm thử chức năng CRUD dân cư, kiểm thử phân quyền RBAC, kiểm tra tải đồng thời và bảo mật thông tin."
  },
  {
    id: 20,
    title: "Giai đoạn 20",
    name: "Triển khai vận hành",
    iconName: "Globe",
    objective: "Đóng gói mã nguồn, triển khai lên Google Cloud Run, cấu hình domain SSL và tự động hóa sao lưu hằng ngày.",
    requirements: [
      "Tối ưu hóa Dockerfile đóng gói ứng dụng Node.js/Express + React",
      "Cấu hình môi trường đám mây Supabase và tên miền chính thức của khu phố",
      "Thiết lập kịch bản tự động snapshot dữ liệu hằng đêm để phòng ngừa rủi ro"
    ],
    outputs: [
      "Ứng dụng chạy chính thức trên môi trường internet kết nối HTTPS an toàn",
      "Hệ thống giám sát trạng thái máy chủ (Monitoring logs) trực quan",
      "Quy trình tự động sao lưu dữ liệu Postgres hằng ngày"
    ],
    criteria: [
      "Ứng dụng truy cập nhanh, ổn định liên tục với tỷ lệ uptime đạt 99.9%",
      "Bảo mật thông tin dữ liệu cư dân tuyệt đối trên server đám mây"
    ],
    prompt: "Hãy viết hướng dẫn triển khai hoàn chỉnh ứng dụng Express + React lên Google Cloud Run và cấu hình Supabase Production. Bao gồm thiết lập biến môi trường, tối ưu hóa tệp Dockerfile, cài đặt tên miền và chứng chỉ SSL."
  },
  {
    id: 21,
    title: "Giai đoạn 21",
    name: "Tài liệu bàn giao & Chuyển giao",
    iconName: "BookOpen",
    objective: "Biên soạn bộ tài liệu kỹ thuật, tài liệu hướng dẫn cán bộ sử dụng và bàn giao quyền quản trị.",
    requirements: [
      "Viết tài liệu hướng dẫn vận hành chi tiết bằng tiếng Việt có hình ảnh minh họa",
      "Biên soạn cẩm nang hướng dẫn cư dân cài đặt app và khai báo phản ánh",
      "Tổ chức lớp tập huấn chuyển giao quy trình vận hành và mã nguồn dự án"
    ],
    outputs: [
      "Bộ tài liệu Hướng dẫn sử dụng (User Manual) đầy đủ",
      "Tài liệu đặc tả kỹ thuật hệ thống và mô hình dữ liệu (Technical Doc)",
      "Biên bản nghiệm thu bàn giao và chuyển quyền sở hữu tài khoản cloud"
    ],
    criteria: [
      "Tài liệu chi tiết, dễ hiểu đối với cán bộ lớn tuổi không rành công nghệ",
      "Bàn giao trọn vẹn mã nguồn, tài liệu hướng dẫn khôi phục thảm họa (DR)"
    ],
    prompt: "Hãy soạn thảo tài liệu hướng dẫn sử dụng nhanh dành cho Ban điều hành Khu phố 3 sử dụng ứng dụng 'Khu phố thông minh'. Mô tả chi tiết cách thêm cư dân mới, duyệt phản ánh hiện trường của người dân, sử dụng Trợ lý AI và xem báo cáo Dashboard."
  }
];

const getPhaseExtraInfo = (id: number) => {
  switch (id) {
    case 1:
      return {
        risk: "Thiếu thông tin thực tế từ Ban điều hành và các Chi hội do cán bộ bận việc hành chính.",
        mitigation: "Tổ chức một buổi họp tập trung, cử Thư ký ghi chép và nạp biểu mẫu khảo sát trực tuyến.",
        handover: ["Bản khảo sát nghiệp vụ", "Sơ đồ luồng thông tin hiện tại", "Danh sách 10 phân hệ nghiệp vụ"]
      };
    case 2:
      return {
        risk: "Lộ API Key hoặc kết nối API bị quá tải khi người dân truy cập đồng thời.",
        mitigation: "Sử dụng API Proxy server-side, giấu kín key ở server, tích hợp Redis cache phản hồi.",
        handover: ["Tài liệu đặc tả kiến trúc", "Sơ đồ Mermaid thiết kế", "Mẫu cấu hình bảo mật API"]
      };
    case 3:
      return {
        risk: "Ràng buộc dữ liệu quá chặt chẽ gây khó khăn khi import dữ liệu thô thiếu thuộc tính.",
        mitigation: "Thiết kế các trường nullable tạm thời ở giai đoạn di chuyển, áp dụng hàm sanitize ở tầng ứng dụng.",
        handover: ["File SQL khởi tạo Schema", "Sơ đồ ERD PDF", "Bộ tệp tin Seed dữ liệu mẫu"]
      };
    case 4:
      return {
        risk: "Cấu hình nhầm lẫn quyền hạn giữa các chức vụ gây rò rỉ dữ liệu cư dân nhạy cảm.",
        mitigation: "Kiểm thử tự động ma trận phân quyền, áp dụng chính sách RLS cứng ở mức Database.",
        handover: ["Ma trận phân quyền RBAC Excel", "Kịch bản test bảo mật RLS", "Quy trình cấp phát tài khoản"]
      };
    case 5:
      return {
        risk: "Giao diện quá phức tạp, chữ nhỏ làm cán bộ lớn tuổi không thể thao tác.",
        mitigation: "Thiết kế chữ tối thiểu 14px, tương phản cao, nút bấm lớn hơn 44px, hỗ trợ thu phóng.",
        handover: ["Bản vẽ Figma Mockup", "Bộ Design System UI", "Kịch bản kiểm thử trải nghiệm UX"]
      };
    case 6:
      return {
        risk: "Lỗi xung đột phiên bản Node.js hoặc thư viện Vite giữa các máy phát triển.",
        mitigation: "Cố định phiên bản thư viện trong package.json, cấu hình Dockerfile chuẩn ngay từ đầu.",
        handover: ["Mã nguồn khung xương", "Cấu hình Linter & TSConfig", "Hướng dẫn cài đặt môi trường"]
      };
    case 7:
      return {
        risk: "Import schema bị lỗi do cơ sở dữ liệu Supabase có sẵn một số bảng trùng tên.",
        mitigation: "Sử dụng cú pháp DROP TABLE IF EXISTS trong file di cư, backup dữ liệu cũ trước khi chạy.",
        handover: ["Thư mục SQL Migration", "Log kết quả khởi tạo Supabase", "Tài liệu cấu trúc bảng"]
      };
    case 8:
      return {
        risk: "Gửi mã OTP qua Email/SMS bị chậm hoặc rơi vào hòm thư rác.",
        mitigation: "Cấu hình dịch vụ gửi email chuyên nghiệp (SendGrid/Resend), thiết lập SPF/DKIM đầy đủ.",
        handover: ["Mã nguồn module Auth", "Tài liệu cấu hình Supabase Auth", "Kịch bản test bảo mật phiên đăng nhập"]
      };
    case 9:
      return {
        risk: "CCCD gắn chip của các thời kỳ khác nhau chứa định dạng chuỗi quét QR khác nhau.",
        mitigation: "Viết hàm parser đa phiên bản, tự động cắt chuỗi dựa trên ký tự phân tách '|'.",
        handover: ["Mã nguồn CitizenManagement", "Thư viện giải mã chuỗi QR CCCD", "Tệp Excel import mẫu"]
      };
    case 10:
      return {
        risk: "Lỗi bất đồng bộ khi cập nhật chủ hộ làm hộ gia đình rơi vào trạng thái không có chủ hộ.",
        mitigation: "Sử dụng Transaction trong PostgreSQL để cập nhật đồng thời thông tin chủ hộ và thành viên.",
        handover: ["Mã nguồn HouseholdManagement", "Sơ đồ quan hệ gia đình", "Kịch bản chuyển hộ khẩu mẫu"]
      };
    case 11:
      return {
        risk: "Chủ trọ không rành công nghệ, ngại khai báo thông tin khách thuê trọ thường xuyên biến động.",
        mitigation: "Tối giản form đăng ký trọ chỉ còn 4 trường thông tin, hỗ trợ chụp ảnh CCCD tự động điền.",
        handover: ["Giao diện quản lý nhà trọ", "Tài liệu hướng dẫn dành cho chủ trọ", "Báo cáo mẫu quản lý tạm trú"]
      };
    case 12:
      return {
        risk: "Hộ kinh doanh đổi ngành nghề thường xuyên nhưng không cập nhật trên hệ thống.",
        mitigation: "Định kỳ hằng quý gửi tin nhắn nhắc nhở rà soát thông tin tự động qua ứng dụng.",
        handover: ["Giao diện quản lý kinh doanh", "Biểu mẫu báo cáo ATTP & PCCC", "Danh mục mã ngành kinh tế"]
      };
    case 13:
      return {
        risk: "Rò rỉ thông tin đánh giá phân loại Đảng viên cuối năm.",
        mitigation: "Mã hóa trường nội dung đánh giá nhạy cảm, chỉ cho phép Bí thư Chi bộ xem.",
        handover: ["Module Quản lý Đảng viên", "Mẫu biên bản họp Chi bộ số", "Quy định bảo mật thông tin nội bộ"]
      };
    case 14:
      return {
        risk: "Thu quỹ không đồng bộ dẫn đến sai lệch số dư thủ quỹ cầm và số liệu trên app.",
        mitigation: "Tích hợp quét QR nhận tiền tự động, xuất hóa đơn điện tử ngay khi hoàn thành giao dịch.",
        handover: ["Module Quản lý Đoàn thể", "Sổ thu chi quỹ kỹ thuật số", "Quy trình đối soát ngân quỹ"]
      };
    case 15:
      return {
        risk: "Bản đồ không tải được khi không có kết nối internet hoặc vượt hạn mức API Key.",
        mitigation: "Thiết lập hạn mức ngân sách Google Cloud, tích hợp bản đồ tĩnh OpenStreetMap làm dự phòng.",
        handover: ["Module Bản đồ GIS", "Dữ liệu ranh giới GeoJSON Tổ dân phố", "Mẫu cấu hình Google Maps API"]
      };
    case 16:
      return {
        risk: "Người dân gửi tin báo giả mạo, spam ảnh rác pháhoại hệ thống.",
        mitigation: "Yêu cầu xác thực tài khoản qua OTP để gửi phản ánh, giới hạn tần suất gửi 2 tin/phút.",
        handover: ["Giao diện Phản ánh hiện trường", "Biểu mẫu phân công Tổ ANTT", "Lịch sử tiếp nhận phản ánh mẫu"]
      };
    case 17:
      return {
        risk: "AI trả lời lệch lạc ngữ cảnh nghiệp vụ hành chính hoặc sinh thông tin sai lệch (hallucination).",
        mitigation: "Nạp tài liệu luật và quy trình thực tế vào System Instruction, chặn từ khóa nhạy cảm.",
        handover: ["Mã nguồn AI Assistant", "Bộ tài liệu hướng dẫn Prompt Tuning", "Log ghi vết hội thoại AI"]
      };
    case 18:
      return {
        risk: "Biểu đồ Recharts bị lỗi tràn khung hoặc hiển thị đè văn bản trên thiết bị di động.",
        mitigation: "Sử dụng ResponsiveContainer của Recharts, ẩn bớt trục X/Y trên màn hình dưới 768px.",
        handover: ["Giao diện Dashboard", "Bộ API kết xuất số liệu thống kê", "Cấu hình phân tích KPIs tự động"]
      };
    case 19:
      return {
        risk: "Phát hiện nhiều lỗi nghiêm trọng sát ngày nghiệm thu gây chậm tiến độ.",
        mitigation: "Thực hiện kiểm thử cuốn chiếu ngay sau khi hoàn thành từng module thay vì dồn cuối.",
        handover: ["Tài liệu kịch bản kiểm thử (Test Cases)", "Báo cáo khắc phục lỗi", "Biên bản ký nhận UAT"]
      };
    case 20:
      return {
        risk: "Máy chủ Cloud Run bị quá tải hoặc cơ sở dữ liệu Supabase bị khóa do dùng quá hạn mức miễn phí.",
        mitigation: "Nâng cấp gói Supabase Pro, cấu hình Auto-scaling cho Cloud Run tối thiểu 1 và tối đa 10 container.",
        handover: ["Dockerfile & Config YAML", "Tài liệu hướng dẫn khôi phục hệ thống", "Log vận hành ban đầu"]
      };
    case 21:
      return {
        risk: "Cán bộ sau tập huấn quên thao tác hoặc không tiếp tục cập nhật dữ liệu thường xuyên.",
        mitigation: "Thành lập Tổ công tác Chuyển đổi số cộng đồng hỗ trợ trực tiếp hằng tuần tại văn phòng khu phố.",
        handover: ["Cẩm nang hướng dẫn sử dụng bản in", "Video clip bài giảng tập huấn", "Biên bản bàn giao toàn quyền quản trị"]
      };
    default:
      return {
        risk: "Rủi ro vận hành kỹ thuật chung.",
        mitigation: "Thường xuyên giám sát, sao lưu và cập nhật các bản vá bảo mật hằng tuần.",
        handover: ["Tài liệu hướng dẫn", "Bản sao lưu dự phòng"]
      };
  }
};

export default function PlanArchitecture() {
  const [activeMainSection, setActiveMainSection] = useState<"plan" | "architecture" | "roadmap">("roadmap");
  const [activePlanTab, setActivePlanTab] = useState<number>(0);
  const [activeArchTab, setActiveArchTab] = useState<string>("overall");
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState<number>(0);

  // Load statuses and checklists from localStorage, or set defaults (Forcing 100% completed as requested)
  const [phaseStatuses, setPhaseStatuses] = useState<Record<number, "completed" | "in_progress" | "not_started">>(() => {
    const forced: Record<number, "completed" | "in_progress" | "not_started"> = {};
    for (let i = 1; i <= 21; i++) {
      forced[i] = "completed";
    }
    return forced;
  });

  const [phaseChecklists, setPhaseChecklists] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    roadmapPhases.forEach(p => {
      p.requirements.forEach((_, rIdx) => {
        const key = `req-${p.id}-${rIdx}`;
        defaults[key] = true;
      });
      p.outputs.forEach((_, oIdx) => {
        const key = `out-${p.id}-${oIdx}`;
        defaults[key] = true;
      });
      p.criteria.forEach((_, cIdx) => {
        const key = `crit-${p.id}-${cIdx}`;
        defaults[key] = true;
      });
    });
    return defaults;
  });

  // Save states to localStorage when updated
  useEffect(() => {
    localStorage.setItem("kp3_roadmap_statuses", JSON.stringify(phaseStatuses));
  }, [phaseStatuses]);

  useEffect(() => {
    localStorage.setItem("kp3_roadmap_checklists", JSON.stringify(phaseChecklists));
  }, [phaseChecklists]);

  // Toggle helpers
  const toggleChecklist = (key: string) => {
    setPhaseChecklists(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleStatusChange = (phaseId: number, status: "completed" | "in_progress" | "not_started") => {
    setPhaseStatuses(prev => ({
      ...prev,
      [phaseId]: status
    }));
  };

  const resetRoadmapProgress = () => {
    if (window.confirm("Bạn có chắc chắn muốn thiết lập lại toàn bộ lộ trình triển khai về trạng thái Hoàn thành 100%?")) {
      const defaults: Record<number, "completed" | "in_progress" | "not_started"> = {};
      const checkDefaults: Record<string, boolean> = {};
      for (let i = 1; i <= 21; i++) {
        defaults[i] = "completed";
      }
      roadmapPhases.forEach(p => {
        p.requirements.forEach((_, rIdx) => {
          checkDefaults[`req-${p.id}-${rIdx}`] = true;
        });
        p.outputs.forEach((_, oIdx) => {
          checkDefaults[`out-${p.id}-${oIdx}`] = true;
        });
        p.criteria.forEach((_, cIdx) => {
          checkDefaults[`crit-${p.id}-${cIdx}`] = true;
        });
      });
      setPhaseStatuses(defaults);
      setPhaseChecklists(checkDefaults);
    }
  };

  // Helper to resolve dynamically typed icons
  const getPhaseIcon = (name: string, size: number = 16, className: string = "") => {
    switch (name) {
      case "ClipboardList": return <FileText size={size} className={className} />;
      case "Cpu": return <Cpu size={size} className={className} />;
      case "Database": return <Database size={size} className={className} />;
      case "ShieldCheck": return <ShieldCheck size={size} className={className} />;
      case "Layout": return <Table size={size} className={className} />; // Table as fallback for Layout
      case "FolderPlus": return <FolderPlus size={size} className={className} />;
      case "Code": return <Code size={size} className={className} />;
      case "Key": return <Key size={size} className={className} />;
      case "Users": return <Users size={size} className={className} />;
      case "Home": return <Home size={size} className={className} />;
      case "Briefcase": return <Briefcase size={size} className={className} />;
      case "Award": return <Award size={size} className={className} />;
      case "Heart": return <Heart size={size} className={className} />;
      case "MapPin": return <MapPin size={size} className={className} />;
      case "AlertTriangle": return <AlertTriangle size={size} className={className} />;
      case "Bot": return <Bot size={size} className={className} />;
      case "TrendingUp": return <TrendingUp size={size} className={className} />;
      case "CheckSquare": return <CheckSquare size={size} className={className} />;
      case "Globe": return <Globe size={size} className={className} />;
      case "BookOpen": return <BookOpen size={size} className={className} />;
      default: return <FileText size={size} className={className} />;
    }
  };

  // Metrics calculations
  const completedCount = Object.values(phaseStatuses).filter(s => s === "completed").length;
  const inProgressCount = Object.values(phaseStatuses).filter(s => s === "in_progress").length;
  const notStartedCount = Object.values(phaseStatuses).filter(s => s === "not_started").length;
  const progressPercent = Math.round((completedCount / 21) * 100);

  // States for DB Viewer
  const [selectedDbCategory, setSelectedDbCategory] = useState<string>("A");
  const [selectedTable, setSelectedTable] = useState<string>("to_dan_pho");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Formal Plan Data (10 sections)
  const planSections = [
    {
      title: "1. Căn cứ pháp lý",
      content: `Kế hoạch được xây dựng và triển khai dựa trên các văn bản pháp lý, quyết định chủ trương sau:
- **Nghị quyết số 98/2023/QH15** ngày 24/6/2023 của Quốc hội về thí điểm một số cơ chế, chính sách đặc thù phát triển Thành phố Hồ Chí Minh.
- **Quyết định số 749/QĐ-TTg** ngày 03/6/2020 của Thủ tướng Chính phủ phê duyệt "Chương trình Chuyển đổi số quốc gia đến năm 2025, định hướng đến năm 2030".
- **Quyết định số 3746/QĐ-UBND** của Ủy ban nhân dân Thành phố Hồ Chí Minh về chương trình chuyển đổi số của Thành phố và Đề án xây dựng Thành phố Hồ Chí Minh trở thành Đô thị thông minh giai đoạn 2020 - 2025.
- **Kế hoạch Chuyển đổi số của UBND Thành phố Thủ Đức** về việc tăng cường ứng dụng công nghệ thông tin trong quản lý nhà nước và phát triển chính quyền số cấp cơ sở.
- **Nghị quyết Đại hội Đảng bộ Phường An Phú** về việc hiện đại hóa hành chính, nâng cao hiệu quả quản lý khu dân cư sau khi sắp xếp lại bộ máy tổ chức dưới khu phố.`
    },
    {
      title: "2. Sự cần thiết đầu tư",
      content: `Khu phố 3, Phường An Phú có diện tích lớn, nằm tại vị trí trọng điểm đô thị hóa nhanh của TP. Thủ Đức với:
- **Hơn 650 hộ dân** và **gần 12.000 nhân khẩu**.
- Thành phần cư dân phức tạp: Nhiều căn hộ cao cấp đan xen với các khu nhà trọ công nhân, người lao động nhập cư biến động thường xuyên.
- **Hàng trăm hộ kinh doanh cá thể**, doanh nghiệp vừa và nhỏ hoạt động trên địa bàn.
- Khối lượng hồ sơ giấy tờ, thống kê báo cáo định kỳ gửi về Phường rất lớn, gây quá tải cho bộ máy cán bộ bán chuyên trách khu phố.

Sau khi các **Tổ nhân dân tự quản kết thúc hoạt động** theo chủ trương tinh gọn bộ máy, việc theo dõi biến động nhân khẩu, tạm trú tạm vắng, nắm bắt tâm tư nguyện vọng cư dân và quản lý an ninh trật tự gặp nhiều khó khăn. Do đó, việc xây dựng một **Hệ thống Web ứng dụng quản lý tập trung và tương tác số** (Smart Neighborhood App) tại Khu phố 3 là vô cùng cấp bách và mang tính thực tiễn cao.`
    },
    {
      title: "3. Mục tiêu tổng quát",
      content: `Thiết lập mô hình **"Khu phố thông minh - Chính quyền số cơ sở"** kiểu mẫu tại Khu phố 3, Phường An Phú:
- Hiện đại hóa toàn diện công tác quản trị, số hóa 100% dữ liệu quản lý dân cư, cán bộ, đoàn thể và cơ sở kinh doanh.
- Thiết lập kênh kết nối tương tác trực tiếp, hai chiều giữa Ban Điều hành khu phố với từng người dân, hộ gia đình.
- Ứng dụng công nghệ trí tuệ nhân tạo (AI) và bản đồ số GIS để hỗ trợ cán bộ ra quyết định, làm báo cáo nhanh chóng, chính xác.
- Làm cơ sở thực tiễn để nhân rộng mô hình ra toàn địa bàn Phường An Phú và Thành phố Thủ Đức.`
    },
    {
      title: "4. Mục tiêu cụ thể",
      content: `Các chỉ tiêu cụ thể cần đạt được khi đưa hệ thống vào vận hành:
- **Số hóa 100%** hồ sơ hộ dân (650+ hộ) và nhân khẩu (12.000+ người), phân loại rõ thường trú, tạm trú, tạm vắng.
- **Quản lý chính xác 100%** các hộ kinh doanh trên địa bàn, bao gồm trạng thái giấy phép, PCCC, vệ sinh an toàn thực phẩm.
- **Rút ngắn 80%** thời gian tổng hợp số liệu, làm báo cáo hành chính của cán bộ khu phố nhờ chức năng kết xuất báo cáo tự động và trợ lý AI soạn thảo văn bản.
- **Giải quyết trên 90%** các phản ánh hiện trường của người dân (rác thải, tiếng ồn, trật tự đô thị) trong vòng 24 giờ kể từ khi tiếp nhận.
- **Vẽ bản đồ GIS số hóa** ranh giới 15 tổ dân phố cũ, định vị chính xác vị trí hộ dân, camera an ninh và các điểm nóng trật tự.`
    },
    {
      title: "5. Nội dung triển khai",
      content: `Kế hoạch tập trung xây dựng nền tảng ứng dụng web gồm 10 phân hệ cốt lõi:
1. **Phân hệ Quản lý Dân cư & Nhân khẩu:** Quản lý lý lịch cư dân, CCCD, tình trạng cư trú, tạo mã QR định danh cho từng hộ.
2. **Phân hệ Hộ kinh doanh:** Giám sát ngành nghề, mã số thuế, kiểm tra an toàn PCCC & thực phẩm định kỳ.
3. **Phân hệ Quản lý Cán bộ:** Số hóa hồ sơ Bí thư, Trưởng KP, Mặt trận, Tổ ANTT; theo dõi nhiệm vụ được giao.
4. **Phân hệ Đoàn thể chính trị - xã hội:** Quản lý hội viên, quá trình đóng góp, sinh hoạt của CCB, Phụ nữ, Thanh niên, Khuyến học...
5. **Phân hệ Bản đồ số GIS:** Tích hợp bản đồ không gian, khoanh vùng ranh giới tổ, định vị điểm phản ánh và camera giám sát.
6. **Phân hệ Văn bản điện tử:** Lưu trữ văn bản đến/đi, kế hoạch, nghị quyết; phân loại hồ sơ thông minh.
7. **Phân hệ Lịch công tác & Sự kiện:** Sắp xếp lịch họp chi bộ, tiếp dân, nhắc việc cán bộ qua Zalo/Email.
8. **Phân hệ AI Trợ lý Khu phố:** Trí tuệ nhân tạo hỗ trợ soạn thảo văn bản hành chính và hỏi đáp nghiệp vụ tiếng Việt.
9. **Phân hệ Phản ánh hiện trường:** Người dân gửi phản ánh đính kèm ảnh, video, vị trí GPS thực tế.
10. **Phân hệ Báo cáo Thống kê:** Dashboard biểu đồ trực quan cập nhật thời gian thực về dữ liệu toàn địa bàn.`
    },
    {
      title: "6. Tiến độ thực hiện",
      content: `Tổng thời gian triển khai dự kiến trong vòng **8 tháng**, chia làm các mốc cụ thể:
- **Tháng 1 - 2 (Giai đoạn chuẩn bị & thiết kế):** Khảo sát chi tiết địa bàn, thu thập phiếu thông tin cư dân, hoàn thiện thiết kế cơ sở dữ liệu và bản vẽ kiến trúc phần mềm.
- **Tháng 3 - 4 (Phát triển phân hệ cốt lõi):** Lập trình phân hệ Quản lý dân cư, Hộ khẩu, Hộ kinh doanh và Cán bộ khu phố. Thiết lập hệ thống lưu trữ đám mây bảo mật.
- **Tháng 5 - 6 (Tích hợp bản đồ số & Đoàn thể):** Xây dựng Bản đồ GIS địa bàn, vẽ ranh giới tổ, định vị camera. Phát triển các phân hệ đoàn thể, an sinh xã hội và phản ánh hiện trường.
- **Tháng 7 (Tích hợp AI & Thử nghiệm):** Huấn luyện Trợ lý AI với dữ liệu nghiệp vụ địa phương. Chạy thử nghiệm diện hẹp (khoảng 50 hộ dân và toàn bộ cán bộ khu phố).
- **Tháng 8 (Nghiệm thu & Vận hành chính thức):** Tập huấn sử dụng cho cán bộ, truyền thông rộng rãi đến người dân cài đặt ứng dụng, bàn giao hệ thống.`
    },
    {
      title: "7. Dự toán kinh phí (Ước tính)",
      content: `Dự án ưu tiên sử dụng hạ tầng đám mây tối ưu chi phí và các thư viện mã nguồn mở chất lượng cao:
- **Phần mềm & Bản quyền:** Sử dụng gói dịch vụ Supabase Cloud Developer, OpenAI/Gemini API, Google Maps API (Phần lớn nằm trong hạn mức miễn phí hoặc chi phí cực thấp cho quy mô cấp cơ sở) ~ **12.000.000 VNĐ / năm**.
- **Thiết bị đầu cuối hỗ trợ cán bộ:** Mua sắm 05 máy tính bảng cấu hình trung bình cho Trưởng KP, Phó KP và các Chi hội trưởng đi rà soát địa bàn ~ **20.000.000 VNĐ** (Phát sinh một lần).
- **Chi phí số hóa dữ liệu ban đầu:** Thuê lực lượng thanh niên tình nguyện hỗ trợ nhập liệu 650 hộ dân và 12.000 nhân khẩu vào hệ thống ~ **15.000.000 VNĐ** (Phát sinh một lần).
- **Chi phí tập huấn & Tài liệu tuyên truyền:** In ấn tài liệu hướng dẫn cư dân và tổ chức hội nghị tập huấn ~ **5.000.000 VNĐ**.
- **Tổng kinh phí dự kiến năm đầu tiên:** **52.000.000 VNĐ** (Tiết kiệm gấp 10 lần so với các dự án phần mềm thương mại truyền thống nhờ thiết kế serverless).`
    },
    {
      title: "8. Phân công trách nhiệm",
      content: `Tổ chức triển khai cụ thể tại Khu phố 3:
- **Bí thư Chi bộ:** Chỉ đạo toàn diện công tác triển khai; giám sát phân hệ Đảng bộ và Lịch công tác; phê duyệt quy chế bảo mật thông tin cư dân.
- **Ban Điều hành Khu phố (Trưởng/Phó KP):** Trực tiếp phụ trách thu thập dữ liệu thô, duyệt danh sách dân cư, hộ kinh doanh; điều phối xử lý phản ánh hiện trường của người dân.
- **Ban Công tác Mặt trận & Chi hội trưởng Đoàn thể:** Quản lý và cập nhật danh sách hội viên, phân bổ hỗ trợ an sinh xã hội đúng đối tượng trên hệ thống.
- **Tổ Bảo vệ An ninh trật tự cơ sở:** Phụ trách giám sát bản đồ an ninh, tiếp nhận phản ánh về ANTT, kiểm tra hiện trường từ tin báo cư dân.
- **Bộ phận Kỹ thuật (Đơn vị tư vấn chuyển đổi số):** Lập trình hệ thống, bảo trì máy chủ, hướng dẫn sử dụng và hỗ trợ kỹ thuật 24/7.`
    },
    {
      title: "9. Hiệu quả dự kiến mang lại",
      content: `Hệ thống đi vào vận hành sẽ đem lại những bước đột phá:
- **Đối với Cán bộ khu phố:** Chấm dứt thời kỳ quản lý bằng sổ tay hành chính và file Excel rời rạc. Chỉ cần 1 chạm trên điện thoại/máy tính bảng là có thể nắm bắt biến động dân cư, xuất báo cáo chuẩn gửi lên Phường ngay lập tức.
- **Đối với Người dân:** Gửi phản ánh trật tự đô thị dễ dàng qua ảnh chụp thực tế, theo dõi trực quan tiến độ sửa chữa của chính quyền. Được hỗ trợ giải đáp thủ tục hành chính tức thì bởi trợ lý AI 24/7.
- **Đối với Công tác Quản lý Nhà nước:** Hình thành kho dữ liệu sạch, sống, đủ, đúng phục vụ cho công tác hoạch định chính sách an sinh, quản lý an ninh trật tự và quy hoạch đô thị văn minh tại địa bàn Phường An Phú.`
    },
    {
      title: "10. Kiến nghị và Đề xuất",
      content: `- Kính đề nghị **Ủy ban nhân dân Phường An Phú** phê duyệt chủ trương triển khai thí điểm hệ thống tại Khu phố 3; hỗ trợ kết nối thông tin với Cảnh sát khu vực để chuẩn hóa dữ liệu tạm trú.
- Đề xuất **Phòng Thông tin & Truyền thông TP. Thủ Đức** hỗ trợ kỹ thuật hướng dẫn kết nối ứng dụng với Cổng dịch vụ công tập trung của thành phố trong giai đoạn tiếp theo.
- Đề nghị Ban điều hành Khu phố tạo điều kiện thuận lợi để các tình nguyện viên đi từng hộ dân hướng dẫn cài đặt ứng dụng và giới thiệu Trợ lý AI Khu phố đến cộng đồng.`
    }
  ];

  // System Architecture Data
  const architectureSections = [
    { id: "overall", label: "Kiến trúc tổng thể", icon: FileText },
    { id: "database", label: "Thiết kế Cơ sở dữ liệu", icon: Database },
    { id: "gis", label: "Bản đồ không gian GIS", icon: MapPin },
    { id: "rbac", label: "Phân quyền RBAC", icon: ShieldCheck },
    { id: "ai", label: "Kiến trúc AI Agent", icon: Bot },
    { id: "security", label: "Bảo mật & Sao lưu", icon: ShieldCheck },
  ];

  // 10 categories, 44 tables definition
  const dbCategories: CategoryDef[] = [
    {
      id: "A",
      title: "A. DỮ LIỆU ĐỊA BÀN",
      description: "Quản lý ranh giới địa lý, tổ dân phố, số nhà và hệ thống GIS cơ bản của khu phố.",
      tables: [
        {
          name: "to_dan_pho",
          purpose: "Quản lý danh mục các Tổ dân phố thuộc Khu phố 3 (gồm 15 tổ cũ và cơ cấu sắp xếp mới).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã định danh duy nhất của tổ dân phố", sample: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", description: "Tên tổ dân phố (Ví dụ: 'Tổ dân phố 1')", sample: "Tổ dân phố 3" },
            { name: "leader_name", type: "VARCHAR(255)", constraints: "", description: "Họ tên Tổ trưởng tổ dân phố", sample: "Trần Văn A" },
            { name: "leader_phone", type: "VARCHAR(20)", constraints: "", description: "Số điện thoại liên lạc của Tổ trưởng", sample: "0903123456" },
            { name: "description", type: "TEXT", constraints: "", description: "Mô tả phạm vi ranh giới hoặc đặc thù của tổ", sample: "Dọc trục đường Lương Định Của từ số 10 đến số 40" }
          ]
        },
        {
          name: "khu_vuc",
          purpose: "Phân nhóm các tiểu vùng địa bàn đặc thù như khu chung cư, khu nhà trọ, hẻm chính.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã định danh khu vực", sample: "c3b2a1d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL", description: "Tên khu vực đặc thù", sample: "Khu nhà trọ hẻm 42 Lương Định Của" },
            { name: "type", type: "VARCHAR(50)", constraints: "", description: "Loại hình khu vực (Chung cư / Nhà trọ / Hẻm / Mặt tiền)", sample: "Khu nhà trọ" }
          ]
        },
        {
          name: "dia_chi_so",
          purpose: "Cơ sở dữ liệu địa chỉ số chính xác phục vụ định vị và bưu chính hành chính.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã địa chỉ số", sample: "d4c3b2a1-e5f6-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "house_number", type: "VARCHAR(50)", constraints: "NOT NULL", description: "Số nhà chính xác", sample: "42/18" },
            { name: "street", type: "VARCHAR(150)", constraints: "NOT NULL", description: "Tên đường/hẻm", sample: "Lương Định Của" },
            { name: "to_dan_pho_id", type: "UUID", constraints: "REFERENCES to_dan_pho(id)", description: "Thuộc tổ dân phố nào", sample: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }
          ]
        },
        {
          name: "vi_tri_gis",
          purpose: "Bảng lưu trữ tọa độ địa lý (Lat, Long) cho các địa chỉ số trên địa bàn.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã vị trí GIS", sample: "e5d4c3b2-a1f6-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "dia_chi_id", type: "UUID", constraints: "REFERENCES dia_chi_so(id)", description: "Địa chỉ liên kết", sample: "d4c3b2a1-e5f6-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "latitude", type: "DECIMAL(10, 8)", constraints: "NOT NULL", description: "Vĩ độ địa lý GPS", sample: "10.787654" },
            { name: "longitude", type: "DECIMAL(11, 8)", constraints: "NOT NULL", description: "Kinh độ địa lý GPS", sample: "106.723456" }
          ]
        }
      ]
    },
    {
      id: "B",
      title: "B. NHÂN KHẨU & DÂN CƯ",
      description: "Quản lý thông tin chi tiết từng cá nhân cư trú, sổ hộ gia đình, tạm trú tạm vắng và biến động cư trú.",
      tables: [
        {
          name: "households",
          purpose: "Quản lý danh sách các hộ gia đình cư trú trên địa bàn Khu phố 3.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã định danh hộ gia đình", sample: "f6e5d4c3-b2a1-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "household_code", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", description: "Số sổ hộ khẩu hoặc số định danh hộ của địa phương", sample: "HK-KP3-301" },
            { name: "owner_name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Họ và tên chủ hộ gia đình", sample: "Nguyễn Văn Hùng" },
            { name: "address", type: "TEXT", constraints: "NOT NULL", description: "Địa chỉ thường trú/tạm trú của hộ tại Khu phố 3", sample: "Số 42/18 Lương Định Của, Phường An Phú" },
            { name: "to_dan_pho_id", type: "UUID", constraints: "REFERENCES to_dan_pho(id)", description: "Thuộc tổ dân phố quản lý", sample: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }
          ]
        },
        {
          name: "citizens",
          purpose: "Quản lý dữ liệu lý lịch tư pháp, căn cước công dân và thông tin liên lạc của từng cư dân.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã định danh cư dân", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "citizen_code", type: "VARCHAR(20)", constraints: "UNIQUE", description: "Mã định danh riêng của hệ thống khu phố", sample: "CD-00124" },
            { name: "full_name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Họ và tên đầy đủ", sample: "Nguyễn Văn Hùng" },
            { name: "gender", type: "VARCHAR(10)", constraints: "NOT NULL", description: "Giới tính (Nam / Nữ / Khác)", sample: "Nam" },
            { name: "date_of_birth", type: "DATE", constraints: "NOT NULL", description: "Ngày tháng năm sinh", sample: "1975-04-15" },
            { name: "cccd", type: "VARCHAR(20)", constraints: "NOT NULL UNIQUE", description: "Số Căn cước công dân (12 số)", sample: "079075001234" },
            { name: "phone", type: "VARCHAR(20)", constraints: "", description: "Số điện thoại di động chính", sample: "0903112233" },
            { name: "status", type: "VARCHAR(50)", constraints: "DEFAULT 'Thường trú'", description: "Trạng thái cư trú (Thường trú / Tạm trú / Tạm vắng)", sample: "Thường trú" }
          ]
        },
        {
          name: "household_members",
          purpose: "Bảng liên kết thể hiện mối quan hệ giữa các thành viên cư trú trong một hộ gia đình.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã liên kết thành viên", sample: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "household_id", type: "UUID", constraints: "REFERENCES households(id)", description: "Mã hộ gia đình", sample: "f6e5d4c3-b2a1-7a8b-9c0d-1e2f3a4b5c6d" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Mã cư dân", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "relation_to_owner", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Mối quan hệ với chủ hộ (Vợ, Con, Cháu, Thuê nhà...)", sample: "Chủ hộ" }
          ]
        },
        {
          name: "temporary_residence",
          purpose: "Theo dõi hồ sơ đăng ký tạm trú thời hạn ngắn của người lao động nhập cư, sinh viên thuê trọ.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã hồ sơ tạm trú", sample: "b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Cư dân đăng ký", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "start_date", type: "DATE", constraints: "NOT NULL", description: "Ngày bắt đầu tạm trú", sample: "2026-01-01" },
            { name: "end_date", type: "DATE", constraints: "", description: "Ngày hết hạn tạm trú (nếu có)", sample: "2027-01-01" },
            { name: "reason", type: "TEXT", constraints: "", description: "Lý do tạm trú (Thuê nhà, Đi làm...)", sample: "Thuê nhà trọ làm việc tại công trình gần khu đô thị mới" }
          ]
        },
        {
          name: "temporary_absence",
          purpose: "Lưu thông tin cư dân thường trú đăng ký tạm vắng khỏi địa bàn (đi nghĩa vụ, học tập ở nước ngoài...).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã tạm vắng", sample: "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Mã cư dân tạm vắng", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "start_date", type: "DATE", constraints: "NOT NULL", description: "Ngày bắt đầu tạm vắng", sample: "2026-02-15" },
            { name: "reason", type: "TEXT", constraints: "", description: "Lý do tạm vắng", sample: "Đi nghĩa vụ quân sự" }
          ]
        },
        {
          name: "residence_history",
          purpose: "Nhật ký lưu lại lịch sử biến động cư trú của nhân khẩu (chuyển đi, chuyển đến, qua đời).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã lịch sử cư trú", sample: "d5e6f7a8-b90c-1d2e-3f4a-5b6c7d8e9f0a" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Cư dân thay đổi", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "event_type", type: "VARCHAR(50)", constraints: "NOT NULL", description: "Loại sự kiện (Chuyển đi / Chuyển đến / Khác)", sample: "Chuyển đến" },
            { name: "description", type: "TEXT", constraints: "", description: "Chi tiết sự thay đổi", sample: "Chuyển từ Quận 3 về Khu phố 3 An Phú" }
          ]
        }
      ]
    },
    {
      id: "C",
      title: "C. QUẢN LÝ NHÀ TRỌ",
      description: "Quản lý cơ sở lưu trú, căn hộ cho thuê, phòng trọ công nhân và kiểm soát danh sách khách thuê.",
      tables: [
        {
          name: "boarding_houses",
          purpose: "Lưu thông tin các cơ sở nhà trọ, chung cư mini, nhà cho thuê nguyên căn trên địa bàn.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã nhà trọ", sample: "e6f7a8b9-0c1d-2e3f-4a5b-6c7d8e9f0a1b" },
            { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tên nhà trọ hoặc tên chủ nhà trọ dễ nhớ", sample: "Nhà trọ Cô Mai Hẻm 42" },
            { name: "address", type: "TEXT", constraints: "NOT NULL", description: "Địa chỉ cụ thể nhà trọ", sample: "42/35 Lương Định Của, Phường An Phú" },
            { name: "total_rooms", type: "INT", constraints: "DEFAULT 0", description: "Tổng số phòng cho thuê", sample: "12" }
          ]
        },
        {
          name: "boarding_rooms",
          purpose: "Chi tiết từng phòng trọ thuộc các cơ sở lưu trú để quản lý công suất và phân bổ nhân khẩu.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã phòng trọ", sample: "f7a8b90c-1d2e-3f4a-5b6c-7d8e9f0a1b2c" },
            { name: "boarding_id", type: "UUID", constraints: "REFERENCES boarding_houses(id)", description: "Mã nhà trọ cha", sample: "e6f7a8b9-0c1d-2e3f-4a5b-6c7d8e9f0a1b" },
            { name: "room_number", type: "VARCHAR(50)", constraints: "NOT NULL", description: "Số phòng/Tên phòng", sample: "Phòng số 04" },
            { name: "max_tenants", type: "INT", constraints: "DEFAULT 4", description: "Số người ở tối đa cho phép", sample: "3" }
          ]
        },
        {
          name: "tenants",
          purpose: "Liên kết cư dân hiện tại đang thuê phòng trọ, hỗ trợ kiểm tra lưu trú của công an khu vực.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã khách thuê", sample: "a8b90c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d" },
            { name: "room_id", type: "UUID", constraints: "REFERENCES boarding_rooms(id)", description: "Mã phòng trọ đang thuê", sample: "f7a8b90c-1d2e-3f4a-5b6c-7d8e9f0a1b2c" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Mã cư dân thuê trọ", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "start_date", type: "DATE", constraints: "NOT NULL", description: "Ngày bắt đầu dọn vào thuê", sample: "2026-03-01" }
          ]
        }
      ]
    },
    {
      id: "D",
      title: "D. HỘ KINH DOANH CÁ THỂ",
      description: "Quản lý cơ sở sản xuất kinh doanh, thương mại dịch vụ quy mô hộ gia đình, kiểm tra an toàn, thuế.",
      tables: [
        {
          name: "businesses",
          purpose: "Danh mục các hộ kinh doanh cá thể hoạt động trực tiếp tại Khu phố 3.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã hộ kinh doanh", sample: "b90c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e" },
            { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tên thương hiệu/Tên hộ kinh doanh", sample: "Cửa hàng Tạp hóa Mai Lan" },
            { name: "owner_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Chủ hộ kinh doanh", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "tax_code", type: "VARCHAR(50)", constraints: "UNIQUE", description: "Mã số thuế hộ kinh doanh", sample: "8312954710" },
            { name: "address", type: "TEXT", constraints: "NOT NULL", description: "Địa điểm kinh doanh thực tế", sample: "Số 15 Lương Định Của, Phường An Phú" }
          ]
        },
        {
          name: "business_types",
          purpose: "Danh mục phân loại ngành nghề kinh doanh (Ăn uống, Tạp hóa, Dịch vụ, Nhà thuốc...).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã ngành nghề", sample: "c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f" },
            { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL UNIQUE", description: "Tên ngành nghề kinh doanh", sample: "Dịch vụ ăn uống, nhà hàng" },
            { name: "description", type: "TEXT", constraints: "", description: "Chi tiết yêu cầu ngành nghề", sample: "Kinh doanh ăn uống có điều kiện vệ sinh ATTP" }
          ]
        },
        {
          name: "inspections",
          purpose: "Nhật ký kiểm tra định kỳ của Ban điều hành về PCCC, môi trường và vệ sinh thực phẩm.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã đợt kiểm tra", sample: "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a" },
            { name: "business_id", type: "UUID", constraints: "REFERENCES businesses(id)", description: "Hộ kinh doanh được kiểm tra", sample: "b90c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e" },
            { name: "check_date", type: "DATE", constraints: "NOT NULL", description: "Ngày kiểm tra", sample: "2026-05-10" },
            { name: "result", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Kết quả (Đạt / Không đạt / Cần khắc phục)", sample: "Đạt yêu cầu PCCC" }
          ]
        },
        {
          name: "licenses",
          purpose: "Theo dõi các loại giấy phép con của hộ kinh doanh (giấy ĐKKD, giấy vệ sinh ATTP, chứng nhận PCCC).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã giấy phép", sample: "e2f3a4b5-c67d-8e9f-0a1b-2c3d4e5f6a7b" },
            { name: "business_id", type: "UUID", constraints: "REFERENCES businesses(id)", description: "Doanh nghiệp sở hữu giấy phép", sample: "b90c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e" },
            { name: "license_type", type: "VARCHAR(150)", constraints: "NOT NULL", description: "Loại giấy chứng nhận/giấy phép", sample: "Chứng nhận đủ điều kiện ATTP" },
            { name: "expiry_date", type: "DATE", constraints: "", description: "Ngày hết hạn giấy phép", sample: "2028-12-31" }
          ]
        }
      ]
    },
    {
      id: "E",
      title: "E. CÔNG TÁC ĐẢNG & CHI BỘ",
      description: "Quản lý đảng viên sinh hoạt tại chi bộ khu phố, biên bản họp chi bộ định kỳ và nghị quyết hành động.",
      tables: [
        {
          name: "party_members",
          purpose: "Danh sách đảng viên thuộc Chi bộ Khu phố 3, theo dõi chức vụ và tổ đảng.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã đảng viên", sample: "f3a4b5c6-7d8e-9f0a-1b2c-3d4e5f6a7b8c" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id) UNIQUE", description: "Thông tin cư dân là Đảng viên", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "party_card_number", type: "VARCHAR(50)", constraints: "UNIQUE", description: "Số thẻ Đảng viên", sample: "ĐV-0312456" },
            { name: "cell_group", type: "VARCHAR(100)", constraints: "", description: "Tổ Đảng đang sinh hoạt", sample: "Tổ Đảng số 2 - Chung cư" }
          ]
        },
        {
          name: "party_meetings",
          purpose: "Theo dõi các cuộc họp Chi bộ định kỳ hàng tháng và đột xuất.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã cuộc họp", sample: "a4b5c67d-8e9f-0a1b-2c3d-4e5f6a7b8c9d" },
            { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Chủ đề cuộc họp chi bộ", sample: "Họp chi bộ thường kỳ Tháng 7/2026" },
            { name: "meeting_date", type: "DATE", constraints: "NOT NULL", description: "Ngày tổ chức", sample: "2026-07-03" },
            { name: "content_summary", type: "TEXT", constraints: "", description: "Tóm tắt nội dung cuộc họp", sample: "Triển khai thí điểm khu phố thông minh và rà soát an sinh hè" }
          ]
        },
        {
          name: "party_resolutions",
          purpose: "Lưu trữ các Nghị quyết được ban hành từ các cuộc họp Chi bộ để cán bộ, đảng viên thực hiện.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã nghị quyết", sample: "b5c67d8e-9f0a-1b2c-3d4e-5f6a7b8c9d0e" },
            { name: "meeting_id", type: "UUID", constraints: "REFERENCES party_meetings(id)", description: "Từ cuộc họp nào", sample: "a4b5c67d-8e9f-0a1b-2c3d-4e5f6a7b8c9d" },
            { name: "resolution_code", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", description: "Ký hiệu nghị quyết chi bộ", sample: "NQ-01/NQ-CB3" },
            { name: "content", type: "TEXT", constraints: "NOT NULL", description: "Toàn văn nghị quyết chi bộ", sample: "Nghị quyết thống nhất 100% thúc đẩy cài đặt app khu phố thông minh" }
          ]
        },
        {
          name: "party_assignments",
          purpose: "Bảng theo dõi việc phân công nhiệm vụ phụ trách hộ gia đình, địa bàn cho từng Đảng viên.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã phân công", sample: "c67d8e9f-0a1b-2c3d-4e5f-6a7b8c9d0e1f" },
            { name: "member_id", type: "UUID", constraints: "REFERENCES party_members(id)", description: "Đảng viên được phân công", sample: "f3a4b5c6-7d8e-9f0a-1b2c-3d4e5f6a7b8c" },
            { name: "task_description", type: "TEXT", constraints: "NOT NULL", description: "Nội dung phân công phụ trách", sample: "Phụ trách vận động an sinh xã hội hẻm 42 Lương Định Của" }
          ]
        }
      ]
    },
    {
      id: "F",
      title: "F. CÁN BỘ KHU PHỐ",
      description: "Hồ sơ nhân sự ban điều hành khu phố, phân công công việc hành chính và theo dõi lịch tiếp dân.",
      tables: [
        {
          name: "officers",
          purpose: "Hồ sơ các cán bộ Ban Điều hành, chi hội trưởng, tổ trưởng tổ dân phố.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã cán bộ", sample: "d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id) UNIQUE", description: "Thông tin cá nhân cán bộ", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "start_date", type: "DATE", constraints: "NOT NULL", description: "Ngày bắt đầu nhiệm kỳ", sample: "2024-06-01" },
            { name: "status", type: "VARCHAR(50)", constraints: "DEFAULT 'Đang hoạt động'", description: "Trạng thái công tác (Đang hoạt động / Miễn nhiệm)", sample: "Đang hoạt động" }
          ]
        },
        {
          name: "officer_positions",
          purpose: "Danh mục chức danh cán bộ (Bí thư, Trưởng khu phố, Phó trưởng khu phố, Công an khu vực...).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã chức vụ", sample: "e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b" },
            { name: "title", type: "VARCHAR(150)", constraints: "NOT NULL UNIQUE", description: "Tên chức vụ cán bộ", sample: "Bí thư Chi bộ" },
            { name: "role_level", type: "INT", constraints: "NOT NULL", description: "Cấp độ phân quyền nghiệp vụ hành chính", sample: "1" }
          ]
        },
        {
          name: "officer_tasks",
          purpose: "Quản lý việc giao việc và giám sát kết quả thực thi công vụ của cán bộ khu phố.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã công việc", sample: "f9a0b1c2-d3e4-5f6a-7b8c-9d0e1f2a3b4c" },
            { name: "officer_id", type: "UUID", constraints: "REFERENCES officers(id)", description: "Cán bộ nhận việc", sample: "d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a" },
            { name: "task_title", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tên nhiệm vụ được giao", sample: "Rà soát danh sách trẻ em nhận quà Khuyến học" },
            { name: "status", type: "VARCHAR(50)", constraints: "", description: "Trạng thái (Đang làm / Đã xong / Quá hạn)", sample: "Đã hoàn thành" }
          ]
        },
        {
          name: "officer_evaluations",
          purpose: "Đánh giá hiệu quả công tác cuối năm và khen thưởng cán bộ hoàn thành xuất sắc nhiệm vụ.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã phiếu đánh giá", sample: "a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d" },
            { name: "officer_id", type: "UUID", constraints: "REFERENCES officers(id)", description: "Cán bộ được đánh giá", sample: "d7e8f9a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a" },
            { name: "year", type: "INT", constraints: "NOT NULL", description: "Năm đánh giá", sample: "2025" },
            { name: "rating", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Xếp loại (Xuất sắc / Tốt / Hoàn thành)", sample: "Hoàn thành xuất sắc nhiệm vụ" }
          ]
        }
      ]
    },
    {
      id: "G",
      title: "G. CÁC ĐOÀN THỂ CHÍNH TRỊ - XÃ HỘI",
      description: "Quản lý Chi hội Cựu chiến binh, Hội Phụ nữ, Chi đoàn Thanh niên, Hội Người cao tuổi, Chữ thập đỏ, Khuyến học...",
      tables: [
        {
          name: "organizations",
          purpose: "Danh sách các hội, chi hội đoàn thể hoạt động tại khu phố.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã tổ chức", sample: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e" },
            { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL UNIQUE", description: "Tên hội đoàn thể", sample: "Hội Liên hiệp Phụ nữ KP3" },
            { name: "description", type: "TEXT", constraints: "", description: "Mô tả vai trò", sample: "Vận động phong trào phụ nữ văn minh và bảo vệ trẻ em" }
          ]
        },
        {
          name: "chapters",
          purpose: "Phân chia chi hội cấp cơ sở hoặc các tổ hội đoàn thể trực thuộc để quản lý linh hoạt.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã phân hội", sample: "c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f" },
            { name: "org_id", type: "UUID", constraints: "REFERENCES organizations(id)", description: "Thuộc tổ chức nào", sample: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e" },
            { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL", description: "Tên phân hội", sample: "Chi hội Phụ nữ Tổ dân phố 12" }
          ]
        },
        {
          name: "members",
          purpose: "Danh sách hội viên chi hội, theo dõi quá trình sinh hoạt đoàn thể cộng đồng.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã hội viên", sample: "d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a" },
            { name: "chapter_id", type: "UUID", constraints: "REFERENCES chapters(id)", description: "Đang sinh hoạt ở chi hội nào", sample: "c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id)", description: "Mã cư dân là hội viên", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "join_date", type: "DATE", constraints: "", description: "Ngày kết nạp hội viên", sample: "2020-05-19" }
          ]
        },
        {
          name: "activities",
          purpose: "Lịch sử tổ chức các hoạt động tình nguyện, phong trào, hội họp và ngân sách phong trào.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã hoạt động", sample: "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b" },
            { name: "chapter_id", type: "UUID", constraints: "REFERENCES chapters(id)", description: "Chi hội tổ chức", sample: "c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f" },
            { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tên sự kiện phong trào", sample: "Phong trào Ngày chủ nhật xanh dọn rác kênh rạch" },
            { name: "expense", type: "DECIMAL(15, 2)", constraints: "DEFAULT 0", description: "Kinh phí thực hiện hoạt động", sample: "1500000.00" }
          ]
        }
      ]
    },
    {
      id: "H",
      title: "H. CHÍNH SÁCH AN SINH XÃ HỘI",
      description: "Theo dõi gia đình chính sách, thương binh liệt sĩ, hộ nghèo/cận nghèo, người khuyết tật, trợ cấp khó khăn.",
      tables: [
        {
          name: "beneficiaries",
          purpose: "Hồ sơ đối tượng thuộc diện nhận chính sách an sinh xã hội, bảo trợ.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã đối tượng chính sách", sample: "f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c" },
            { name: "citizen_id", type: "UUID", constraints: "REFERENCES citizens(id) UNIQUE", description: "Mã cư dân thuộc diện hỗ trợ", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "category", type: "VARCHAR(150)", constraints: "NOT NULL", description: "Phân nhóm chính sách (Hộ nghèo, Người có công...)", sample: "Thương binh liệt sĩ" },
            { name: "support_level", type: "VARCHAR(100)", constraints: "", description: "Định mức/Gói hỗ trợ được hưởng hàng tháng", sample: "Định mức A" }
          ]
        },
        {
          name: "social_programs",
          purpose: "Chiến dịch hỗ trợ, các đợt phát quà Tết, phát học bổng Khuyến học cho người nghèo.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã chương trình", sample: "a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d" },
            { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tên chiến dịch từ thiện/chính sách", sample: "Chương trình Phát quà Tết Bính Ngọ 2026" },
            { name: "budget", type: "DECIMAL(15, 2)", constraints: "", description: "Tổng ngân sách phân bổ", sample: "50000000.00" }
          ]
        },
        {
          name: "support_records",
          purpose: "Nhật ký lưu giữ chi tiết việc nhận hỗ trợ (tiền mặt, nhu yếu phẩm) tránh trùng lặp.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã đợt nhận quà", sample: "b7c8d9e0-f1a2-3b4c-5d6e-7f8a9b0c1d2e" },
            { name: "beneficiary_id", type: "UUID", constraints: "REFERENCES beneficiaries(id)", description: "Người nhận quà", sample: "f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c" },
            { name: "program_id", type: "UUID", constraints: "REFERENCES social_programs(id)", description: "Thuộc chương trình nào", sample: "a6b7c8d9-e0f1-2a3b-4c5d-6e7f8a9b0c1d" },
            { name: "received_date", type: "DATE", constraints: "NOT NULL", description: "Ngày thực tế nhận hỗ trợ", sample: "2026-01-20" }
          ]
        }
      ]
    },
    {
      id: "I",
      title: "I. PHẢN ÁNH HIỆN TRƯỜNG 1022",
      description: "Tiếp nhận phản ánh của cư dân về vệ sinh môi trường, lấn chiếm hẻm, tiếng ồn karaoke, hư hỏng hạ tầng kỹ thuật.",
      tables: [
        {
          name: "incidents",
          purpose: "Tiếp nhận và quản lý cốt lõi thông tin sự vụ phản ánh hiện trường do người dân gửi lên.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã sự vụ phản ánh", sample: "c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f" },
            { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Tiêu đề ngắn gọn của phản ánh", sample: "Xả nước thải hẻm 42 Lương Định Của" },
            { name: "reporter_name", type: "VARCHAR(255)", constraints: "", description: "Họ tên người phản ánh (nếu muốn công khai)", sample: "Trần Hữu Bình" },
            { name: "reporter_phone", type: "VARCHAR(20)", constraints: "", description: "SĐT người phản ánh để phản hồi tiến độ", sample: "0909556677" },
            { name: "description", type: "TEXT", constraints: "NOT NULL", description: "Nội dung phản ánh chi tiết", sample: "Hộ gia đình số 42/3 tự ý xả nước sinh hoạt ra lòng hẻm gây hôi thối" }
          ]
        },
        {
          name: "incident_categories",
          purpose: "Danh mục lĩnh vực phản ánh để tự động điều phối (Môi trường, Tiếng ồn, An ninh, Đô thị...).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã loại phản ánh", sample: "d9e0f1a2-b3c4-5d6e-7f8a-9b0c1d2e3f4a" },
            { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL UNIQUE", description: "Tên lĩnh vực", sample: "Vệ sinh môi trường" }
          ]
        },
        {
          name: "incident_status",
          purpose: "Bảng ghi nhật ký tiến độ xử lý qua các trạng thái (Đã tiếp nhận -> Đang xử lý -> Hoàn thành).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã trạng thái", sample: "e0f1a2b3-c4d5-6e7f-8a9b-0c1d2e3f4a5b" },
            { name: "incident_id", type: "UUID", constraints: "REFERENCES incidents(id)", description: "Gắn với sự vụ nào", sample: "c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f" },
            { name: "status_name", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Trạng thái cập nhật", sample: "Đang xử lý" },
            { name: "updated_at", type: "TIMESTAMP", constraints: "DEFAULT CURRENT_TIMESTAMP", description: "Thời gian cập nhật", sample: "2026-07-12 14:30:00" }
          ]
        },
        {
          name: "incident_processing",
          purpose: "Chi tiết phân công lực lượng (Tổ ANTT, đô thị phường) xử lý thực tế và giải pháp khắc phục.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã phiếu xử lý", sample: "f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c" },
            { name: "incident_id", type: "UUID", constraints: "REFERENCES incidents(id)", description: "Gắn với sự vụ", sample: "c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f" },
            { name: "processor_name", type: "VARCHAR(255)", constraints: "", description: "Họ tên cán bộ trực tiếp xử lý hiện trường", sample: "Nguyễn Văn Sơn - Trưởng KP" },
            { name: "action_taken", type: "TEXT", constraints: "", description: "Nội dung biện pháp xử lý tại chỗ", sample: "Đã làm việc nhắc nhở chủ hộ số 42/3 cam kết đi đường ống thoát thải kín" }
          ]
        }
      ]
    },
    {
      id: "J",
      title: "J. HỆ THỐNG VÀ BẢO MẬT",
      description: "Quản lý người dùng, nhật ký hệ thống (Audit Log), phân quyền bảo mật nhiều lớp, thông báo.",
      tables: [
        {
          name: "users",
          purpose: "Quản lý tài khoản truy cập hệ thống của cán bộ khu phố và tài khoản cư dân.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã tài khoản", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "username", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", description: "Tên đăng nhập hệ thống", sample: "hung.nguyen.kp3" },
            { name: "password_hash", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Mật khẩu mã hóa bảo mật BCrypt/Argon2", sample: "$2a$12$R9h/cIPz9..." },
            { name: "email", type: "VARCHAR(255)", constraints: "UNIQUE", description: "Email phục vụ khôi phục mật khẩu", sample: "bdhkhupho3.ap@gmail.com" }
          ]
        },
        {
          name: "roles",
          purpose: "Quản lý các chức vụ phân quyền truy cập hệ thống (Super Admin, Bí thư, Trưởng KP, Cư dân...).",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã nhóm quyền", sample: "b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e" },
            { name: "name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", description: "Tên nhóm quyền", sample: "Bí thư Chi bộ" },
            { name: "description", type: "TEXT", constraints: "", description: "Quyền hạn của nhóm", sample: "Quản lý Đảng, xem Dashboard, ra nghị quyết" }
          ]
        },
        {
          name: "permissions",
          purpose: "Quản lý chi tiết từng quyền hạn nhỏ (Đọc, Ghi, Sửa, Xóa) trên các module cụ thể.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã quyền chi tiết", sample: "c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f" },
            { name: "role_id", type: "UUID", constraints: "REFERENCES roles(id)", description: "Gắn với nhóm quyền", sample: "b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e" },
            { name: "module", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Tên module phân quyền (dân cư, đảng viên...)", sample: "residents" },
            { name: "action", type: "VARCHAR(50)", constraints: "NOT NULL", description: "Hành động được phép (create / read / update / delete)", sample: "read" }
          ]
        },
        {
          name: "audit_logs",
          purpose: "Nhật ký hệ thống tối quan trọng, lưu vết 100% các hành động đọc/ghi/sửa/xóa dữ liệu cư dân phòng chống rò rỉ.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã log", sample: "d5e6f7a8-b90c-1d2e-3f4a-5b6c7d8e9f0a" },
            { name: "user_id", type: "UUID", constraints: "REFERENCES users(id)", description: "Cán bộ thực hiện hành động", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "action", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Hành động (Sửa thông tin CCCD cư dân CD-00124)", sample: "UPDATE citizens" },
            { name: "ip_address", type: "VARCHAR(50)", constraints: "", description: "Địa chỉ IP thiết bị thực hiện để truy vết", sample: "14.161.20.5" }
          ]
        },
        {
          name: "notifications",
          purpose: "Gửi thông báo hệ thống tự động đến tài khoản cán bộ và người dân cư trú.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã thông báo", sample: "e6f7a8b9-0c1d-2e3f-4a5b-6c7d8e9f0a1b" },
            { name: "user_id", type: "UUID", constraints: "REFERENCES users(id)", description: "Người nhận thông báo", sample: "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d" },
            { name: "content", type: "TEXT", constraints: "NOT NULL", description: "Nội dung tin nhắn", sample: "Phản ánh hẻm 42 vừa được xử lý thành công!" },
            { name: "is_read", type: "BOOLEAN", constraints: "DEFAULT false", description: "Trạng thái đã đọc", sample: "false" }
          ]
        },
        {
          name: "attachments",
          purpose: "Quản lý tệp tin, hình ảnh hiện trường, bản vẽ xây dựng, văn bản hành chính đính kèm.",
          columns: [
            { name: "id", type: "UUID", constraints: "PRIMARY KEY", description: "Mã file", sample: "f7a8b90c-1d2e-3f4a-5b6c-7d8e9f0a1b2c" },
            { name: "entity_type", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Sự vụ gắn file (incident / document)", sample: "incident" },
            { name: "entity_id", type: "UUID", constraints: "NOT NULL", description: "ID sự vụ", sample: "c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f" },
            { name: "file_path", type: "VARCHAR(500)", constraints: "NOT NULL", description: "Đường dẫn tệp trên Cloud Storage", sample: "/uploads/incidents/img42.jpg" }
          ]
        }
      ]
    }
  ];

  // Helper to find selected table details
  const getSelectedTableDef = (): TableDef | undefined => {
    const cat = dbCategories.find(c => c.id === selectedDbCategory);
    return cat?.tables.find(t => t.name === selectedTable);
  };

  // SQL Schema generator
  const generateSqlForTable = (t: TableDef): string => {
    let sql = `CREATE TABLE ${t.name} (\n`;
    const colLines = t.columns.map(col => {
      let line = `  ${col.name} ${col.type}`;
      if (col.constraints) line += ` ${col.constraints}`;
      return line;
    });
    sql += colLines.join(",\n");
    sql += `\n);\n\n`;
    
    // Add custom index suggestion for security & search
    if (t.name === "citizens") {
      sql += `-- Tối ưu hóa truy vấn tìm kiếm nhanh theo CCCD và Tên\n`;
      sql += `CREATE UNIQUE INDEX idx_citizens_cccd ON citizens(cccd);\n`;
      sql += `CREATE INDEX idx_citizens_full_name ON citizens(full_name);\n`;
    } else if (t.name === "incidents") {
      sql += `-- Tối ưu hóa truy vấn tiến độ xử lý phản ánh hiện trường\n`;
      sql += `CREATE INDEX idx_incidents_status ON incidents(id);\n`;
    }
    return sql;
  };

  // GIS advanced SQL queries
  const gisSqlSchema = `-- 1. Kích hoạt tiện ích mở rộng không gian PostGIS nếu chưa có\nCREATE EXTENSION IF NOT EXISTS postgis;\n\n-- 2. Tạo bảng quản lý ranh giới địa lý tổ dân phố (MultiPolygon)\nCREATE TABLE boundaries (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(100) NOT NULL,\n  geom GEOMETRY(MultiPolygon, 4326) -- SRID 4326 (WGS84)\n);\n\n-- 3. Tạo bảng lưu trữ vị trí GPS của từng hộ dân (Point)\nCREATE TABLE households_map (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  household_id UUID REFERENCES households(id),\n  geom GEOMETRY(Point, 4326)\n);\n\n-- 4. Tạo bảng quản lý vị trí camera giám sát an ninh (Point)\nCREATE TABLE cameras (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  camera_code VARCHAR(50) UNIQUE,\n  stream_url VARCHAR(500),\n  geom GEOMETRY(Point, 4326)\n);`;

  const gisQueryExample = `-- 1. Tìm các hộ dân nằm bên trong ranh giới của 'Tổ dân phố 12'\nSELECT h.household_id, h.id\nFROM households_map h, boundaries b\nWHERE b.name = 'Tổ dân phố 12'\n  AND ST_Contains(b.geom, h.geom);\n\n-- 2. Tìm kiếm Camera an ninh trong bán kính 100m tính từ điểm nóng phản ánh tai nạn\nSELECT c.camera_code, ST_Distance(c.geom, ST_SetSRID(ST_MakePoint(106.723456, 10.787654), 4326)) as distance_meters\nFROM cameras c\nWHERE ST_DWithin(\n  c.geom,\n  ST_SetSRID(ST_MakePoint(106.723456, 10.787654), 4326),\n  0.001 -- Khoảng 100 mét trong hệ tọa độ WGS84\n)\nORDER BY distance_meters ASC;`;

  // RBAC permissions matrix
  const rbacRoles = [
    { name: "1. Super Admin", desc: "Toàn quyền cấu hình hệ thống, quản lý cơ sở hạ tầng mạng, sao lưu dữ liệu và kiểm toán log." },
    { name: "2. Bí thư Chi bộ", desc: "Giám sát tối cao, quản lý công tác Đảng, phê duyệt kế hoạch, chỉ thị và xem báo cáo tổng thể." },
    { name: "3. Trưởng Khu phố", desc: "Quản lý dân cư, duyệt cơ sở kinh doanh, chỉ đạo tổ ANTT và giải quyết phản ánh của cư dân." },
    { name: "4. Ban Công tác Mặt trận", desc: "Giám sát chính sách an sinh xã hội, kết nối đoàn thể, theo dõi các quỹ cộng đồng tự quản." },
    { name: "5. Chi hội trưởng Đoàn thể", desc: "Cập nhật danh sách hội viên, báo cáo kinh phí hoạt động đoàn thể mình phụ trách." },
    { name: "6. Tổ Bảo vệ ANTT", desc: "Tiếp nhận thông tin phản ánh hiện trường, giám sát bản đồ an ninh, tuần tra camera." },
    { name: "7. Cán bộ chuyên trách", desc: "Nhập liệu hồ sơ, xử lý hồ sơ hành chính, thực hiện báo cáo theo nghiệp vụ chuyên biệt." },
    { name: "8. Người dân cư trú", desc: "Xem thông báo chính thức, đóng góp ý kiến phản ánh hiện trường, quản lý thông tin gia đình mình." }
  ];

  const rbacMatrix = [
    { module: "Quản lý Dân cư", admin: "Toàn quyền", bithu: "Xem / Giám sát", truongkp: "Duyệt / Sửa", mattran: "Xem thống kê", doanthe: "Không có quyền", antt: "Xem địa chỉ", dan: "Xem nhà mình" },
    { module: "Công tác Đảng bộ", admin: "Toàn quyền", bithu: "Toàn quyền", truongkp: "Xem / Phối hợp", mattran: "Xem", doanthe: "Không có quyền", antt: "Không có quyền", dan: "Không có quyền" },
    { module: "Hộ kinh doanh & PCCC", admin: "Toàn quyền", bithu: "Xem", truongkp: "Duyệt / Cấp phép", mattran: "Không có quyền", doanthe: "Không có quyền", antt: "Kiểm tra PCCC", dan: "Tra cứu" },
    { module: "Phản ánh hiện trường", admin: "Toàn quyền", bithu: "Giám sát", truongkp: "Điều phối", mattran: "Xem", doanthe: "Xem", antt: "Xử lý hiện trường", dan: "Tạo / Theo dõi" },
    { module: "Quản lý Đoàn thể", admin: "Toàn quyền", bithu: "Xem", truongkp: "Xem", mattran: "Toàn quyền", doanthe: "Cập nhật riêng", antt: "Không có quyền", dan: "Đăng ký tham gia" },
    { module: "Bản đồ số GIS & Camera", admin: "Toàn quyền", bithu: "Xem bản đồ", truongkp: "Toàn quyền", mattran: "Xem", doanthe: "Không có quyền", antt: "Xem / Giám sát", dan: "Xem phản ánh" },
    { module: "Quỹ khu phố & An sinh", admin: "Toàn quyền", bithu: "Kiểm toán", truongkp: "Duyệt chi", mattran: "Toàn quyền", doanthe: "Phối hợp", antt: "Không có quyền", dan: "Đóng góp / Tra cứu" }
  ];

  return (
    <div id="plan-architecture-portal" className="space-y-6">
      
      {/* Dynamic Upper Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded-full w-fit mb-3 uppercase">
              Cổng quy hoạch & kiến trúc số
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Đề án & Kiến trúc Kỹ thuật "Khu phố thông minh"
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Hồ sơ kế hoạch chuyển đổi số cấp cơ sở và mô hình thiết kế cơ sở dữ liệu Postgres/PostGIS, phân quyền RBAC phục vụ thực tế cho Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.
            </p>
          </div>
          
          {/* Main Select Mode Toggle */}
          <div className="flex flex-wrap bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full md:w-auto self-stretch md:self-auto shrink-0">
            <button
              onClick={() => setActiveMainSection("roadmap")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainSection === "roadmap"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Activity size={14} />
              Lộ trình Triển khai (21 Bước)
            </button>
            <button
              onClick={() => setActiveMainSection("plan")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainSection === "plan"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <FileText size={14} />
              Kế hoạch Đề án (10 Phần)
            </button>
            <button
              onClick={() => setActiveMainSection("architecture")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainSection === "architecture"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Database size={14} />
              Kiến trúc Kỹ thuật (10 Phần)
            </button>
          </div>
        </div>
      </div>

      {/* RENDER PLAN VIEW (SECTION 1 TO 10) */}
      {activeMainSection === "plan" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Tree for Plan */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-400 tracking-wider font-mono uppercase px-2 pb-2 border-b border-slate-100 mb-3">
              Mục lục kế hoạch đề án
            </div>
            {planSections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActivePlanTab(idx)}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePlanTab === idx
                    ? "bg-slate-100 text-slate-900 font-bold border-l-4 border-emerald-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <ChevronRight size={14} className={activePlanTab === idx ? "text-emerald-600" : "text-slate-400"} />
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/40 rounded-xl p-3 text-[11px] text-emerald-800 space-y-1">
              <span className="font-bold flex items-center gap-1"><Info size={12} /> Thông tin lưu ý:</span>
              <p className="leading-relaxed">Kế hoạch tuân thủ đầy đủ thể thức văn bản hành chính Việt Nam và được phê duyệt thí điểm áp dụng thực tế trên địa bàn.</p>
            </div>
          </div>

          {/* Right Content display for Plan */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[480px]">
            {/* Header style resembling a formal government document */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-center sm:text-left gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">BẢN THẢO TRÌNH PHÊ DUYỆT</span>
                  <h3 className="text-lg font-bold text-slate-900">{planSections[activePlanTab].title.toUpperCase()}</h3>
                </div>
                <span className="text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md font-bold">
                  Dự thảo Đề án KP3 - An Phú
                </span>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6 flex-1 text-slate-700 space-y-4 font-sans text-sm leading-relaxed whitespace-pre-line">
              {planSections[activePlanTab].content.split("\n").map((line, lidx) => {
                if (line.startsWith("- ") || line.startsWith("* ")) {
                  return (
                    <div key={lidx} className="flex gap-2.5 pl-4 py-1">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{line.replace(/^[-*]\s+/, "")}</span>
                    </div>
                  );
                }
                // Handle bold text in plan content
                const boldRegex = /\*\*(.*?)\*\*/g;
                const parts = [];
                let lastIndex = 0;
                let match;
                while ((match = boldRegex.exec(line)) !== null) {
                  if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                  }
                  parts.push(<strong key={match.index} className="text-slate-900 font-bold">{match[1]}</strong>);
                  lastIndex = boldRegex.lastIndex;
                }
                if (lastIndex < line.length) {
                  parts.push(line.substring(lastIndex));
                }

                return (
                  <p key={lidx} className="text-slate-600 font-sans">
                    {parts.length > 0 ? parts : line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* RENDER SYSTEM ARCHITECTURE VIEW */}
      {activeMainSection === "architecture" && (
        <div className="space-y-6">
          
          {/* Sub Navigation Bar for Architecture */}
          <div className="flex bg-white p-2 rounded-xl border border-slate-200 overflow-x-auto gap-1">
            {architectureSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveArchTab(sec.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeArchTab === sec.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={14} />
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* OVERALL ARCHITECTURE TAB */}
          {activeArchTab === "overall" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" />
                  Mô hình dòng chảy dữ liệu kỹ thuật (Data Flow)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống "Khu phố thông minh" được xây dựng theo mô hình dịch vụ phi máy chủ (Serverless Architecture) sử dụng NextJS, Express và Supabase, giúp đảm bảo khả năng mở rộng tối đa, vận hành trơn tru cho trên 12.000 dân cư.
                </p>

                {/* Simulated Mermaid rendering via Tailwind */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed space-y-2 overflow-x-auto relative">
                  <button 
                    onClick={() => handleCopy(`graph TD
    Client[Client App: React/Tailwind] -->|HTTPS/WS| APIGateway[API Gateway: Express Server]
    APIGateway -->|Bussiness Rules & JWT| Auth[Authentication Layer]
    APIGateway -->|Query / Mutate| DB[(PostgreSQL + PostGIS)]
    APIGateway -->|Document AI & Drafting| AI[Gemini 3.5 Flash API]
    APIGateway -->|Upload File| Storage[Supabase Cloud Storage]
    DB -->|Real-time Events| Dashboard[Dashboard Trực quan]`, "mermaid-overall")}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white bg-slate-900 p-1 rounded border border-slate-800"
                    title="Sao chép sơ đồ Mermaid"
                  >
                    {copiedText === "mermaid-overall" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <div className="text-emerald-400 font-bold mb-1">// Mermaid Sơ đồ Kiến trúc</div>
                  <div>graph TD</div>
                  <div className="pl-4">Client[Client App: React/Tailwind] --&gt;|HTTPS/WS| APIGateway[API Gateway: Express Server]</div>
                  <div className="pl-4">APIGateway --&gt;|Bussiness Rules &amp; JWT| Auth[Authentication Layer]</div>
                  <div className="pl-4">APIGateway --&gt;|Query / Mutate| DB[(PostgreSQL + PostGIS)]</div>
                  <div className="pl-4">APIGateway --&gt;|Document AI &amp; Drafting| AI[Gemini 3.5 Flash API]</div>
                  <div className="pl-4">APIGateway --&gt;|Upload File| Storage[Supabase Cloud Storage]</div>
                  <div className="pl-4">DB --&gt;|Real-time Events| Dashboard[Dashboard Trực quan]</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-lg p-3 space-y-1">
                    <span className="font-bold text-xs text-slate-900 block">Frontend &amp; UI Client</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">Xây dựng trên nền tảng React và Tailwind CSS, tích hợp hoạt ảnh mượt mà từ thư viện Motion. Thiết kế responsive tối ưu trên cả điện thoại di động và máy tính bảng cán bộ.</span>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 space-y-1">
                    <span className="font-bold text-xs text-indigo-700 block">Backend &amp; API Layer</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">Sử dụng Express kết hợp công cụ TSX chạy trực tiếp mã nguồn TypeScript. Đóng vai trò proxy bảo mật, giấu hoàn toàn API Key của Gemini và các khóa nhạy cảm khỏi trình duyệt.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs font-mono tracking-wider text-indigo-400 uppercase">Thông số kỹ thuật đề xuất</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between border-b border-indigo-950 pb-1.5">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="font-mono font-bold text-emerald-400">PostgreSQL v16.x</span>
                    </li>
                    <li className="flex justify-between border-b border-indigo-950 pb-1.5">
                      <span className="text-slate-400">Spatial Ext:</span>
                      <span className="font-mono font-bold text-emerald-400">PostGIS v3.4</span>
                    </li>
                    <li className="flex justify-between border-b border-indigo-950 pb-1.5">
                      <span className="text-slate-400">Cloud Backend:</span>
                      <span className="font-mono font-bold text-indigo-300">Supabase Suite</span>
                    </li>
                    <li className="flex justify-between border-b border-indigo-950 pb-1.5">
                      <span className="text-slate-400">AI Platform:</span>
                      <span className="font-mono font-bold text-indigo-300">Google GenAI SDK (Gemini)</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Security Standard:</span>
                      <span className="font-mono font-bold text-emerald-400">JWT + PostgreSQL RLS</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <span className="font-bold text-xs text-slate-800 block">Danh sách API chính đề xuất</span>
                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 justify-between bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-bold">GET</span>
                      <span className="text-slate-600 truncate">/api/residents?status=TamTru</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-blue-700 bg-blue-100 px-1 py-0.5 rounded font-bold">POST</span>
                      <span className="text-slate-600 truncate">/api/incidents (Gửi phản ánh)</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-purple-700 bg-purple-100 px-1 py-0.5 rounded font-bold">POST</span>
                      <span className="text-slate-600 truncate">/api/chat (Trợ lý AI Gemini)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE DATABASE DICTIONARY & SCHEMA TAB */}
          {activeArchTab === "database" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Selector: Domain Categories */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    1. Phân nhóm Dữ liệu
                  </label>
                  <select
                    value={selectedDbCategory}
                    onChange={(e) => {
                      setSelectedDbCategory(e.target.value);
                      const cat = dbCategories.find(c => c.id === e.target.value);
                      if (cat && cat.tables.length > 0) {
                        setSelectedTable(cat.tables[0].name);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-900"
                  >
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    2. Danh sách Bảng ({dbCategories.find(c => c.id === selectedDbCategory)?.tables.length} bảng)
                  </label>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto border border-slate-100 rounded-lg p-1">
                    {dbCategories.find(c => c.id === selectedDbCategory)?.tables.map(t => (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-all cursor-pointer ${
                          selectedTable === t.name
                            ? "bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Table size={13} className="shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <span className="font-bold flex items-center gap-1">💡 Thiết kế Database:</span>
                  <p>Mô hình hóa hoàn thiện 44 bảng dữ liệu, tất cả ID đều dùng chuẩn **UUID v4** để tăng tính bảo mật và chống trùng lặp dữ liệu khi kết xuất đồng bộ.</p>
                </div>
              </div>

              {/* Right View: Table Detail Dictionary & SQL DDL Code */}
              <div className="lg:col-span-8 space-y-6">
                {getSelectedTableDef() && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    
                    {/* Header Table Name */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          TABLE: {selectedTable}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {getSelectedTableDef()?.purpose}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          const def = getSelectedTableDef();
                          if (def) handleCopy(generateSqlForTable(def), `sql-${selectedTable}`);
                        }}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        {copiedText === `sql-${selectedTable}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        Sao chép SQL DDL
                      </button>
                    </div>

                    {/* Dictionary Columns Grid */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans divide-y divide-slate-100">
                        <thead className="bg-slate-100/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Tên cột</th>
                            <th className="px-4 py-3">Kiểu dữ liệu</th>
                            <th className="px-4 py-3">Ràng buộc</th>
                            <th className="px-4 py-3">Mô tả chi tiết</th>
                            <th className="px-4 py-3">Ví dụ dữ liệu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {getSelectedTableDef()?.columns.map(col => (
                            <tr key={col.name} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-mono font-bold text-slate-950">{col.name}</td>
                              <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{col.type}</td>
                              <td className="px-4 py-3">
                                {col.constraints ? (
                                  <span className="font-mono text-[10px] bg-red-50 text-red-700 border border-red-100 px-1 rounded-sm">
                                    {col.constraints}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[10px]">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 max-w-[200px] truncate-none whitespace-normal leading-relaxed text-slate-600">{col.description}</td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{col.sample}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Interactive DDL Generator Preview */}
                    <div className="border-t border-slate-100 p-4 bg-slate-950">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                        <span>// SQL DDL Generator Preview:</span>
                        <span className="text-indigo-400">PostgreSQL Ready</span>
                      </div>
                      <pre className="font-mono text-[10px] text-slate-200 overflow-x-auto p-3 bg-slate-950 border border-slate-800 rounded-lg leading-relaxed max-h-[160px]">
                        {getSelectedTableDef() && generateSqlForTable(getSelectedTableDef()!)}
                      </pre>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* POSTGIS / GIS TAB */}
          {activeArchTab === "gis" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-600" />
                  Mô hình lưu trữ không gian PostGIS
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để vẽ ranh giới tổ dân phố và hiển thị bản đồ trực quan mật độ nhân khẩu, hệ thống tận dụng tối đa sức mạnh của tiện ích **PostGIS** của PostgreSQL, hỗ trợ các đối tượng hình học dạng điểm (Point) và đa giác (Polygon) theo chuẩn không gian WGS84 (SRID 4326).
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] leading-relaxed relative max-h-[300px] overflow-y-auto">
                  <button 
                    onClick={() => handleCopy(gisSqlSchema, "gis-schema")}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white bg-slate-900 p-1 rounded border border-slate-800"
                  >
                    {copiedText === "gis-schema" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <pre>{gisSqlSchema}</pre>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code size={18} className="text-indigo-600" />
                  Các câu truy vấn không gian mẫu (Spatial Query)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  PostGIS hỗ trợ tính toán khoảng cách thực tế, kiểm tra điểm nằm trong đa giác và khoanh vùng camera giám sát xung quanh các khu nhà trọ hoặc điểm nóng ANTT vô cùng nhanh chóng:
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] leading-relaxed relative max-h-[300px] overflow-y-auto">
                  <button 
                    onClick={() => handleCopy(gisQueryExample, "gis-query")}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white bg-slate-900 p-1 rounded border border-slate-800"
                  >
                    {copiedText === "gis-query" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <pre>{gisQueryExample}</pre>
                </div>
              </div>
            </div>
          )}

          {/* RBAC PERMISSIONS MATRIX TAB */}
          {activeArchTab === "rbac" && (
            <div className="space-y-6">
              
              {/* Descriptions of Roles */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={18} className="text-rose-600" />
                  Mô hình Phân quyền người dùng (Role-Based Access Control)
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Để đảm bảo an toàn tuyệt mật cho thông tin cư trú của cư dân (CCCD, SĐT, Địa chỉ), hệ thống cấu hình ma trận phân quyền 8 vai trò (Roles) nghiêm ngặt kết hợp với chính sách bảo mật dòng dữ liệu **Postgres Row Level Security (RLS)**.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rbacRoles.map((role) => (
                    <div key={role.name} className="border border-slate-100 rounded-lg p-3 space-y-1 hover:bg-slate-50 transition-colors">
                      <span className="font-bold text-xs text-slate-900 block">{role.name}</span>
                      <span className="text-[11px] text-slate-500 block leading-relaxed">{role.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Permissions Matrix */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800">Ma trận Phân quyền Quyền hạn cụ thể trên các Module</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans divide-y divide-slate-100">
                    <thead className="bg-slate-100/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Phân hệ Module</th>
                        <th className="px-4 py-3">Admin</th>
                        <th className="px-4 py-3">Bí thư</th>
                        <th className="px-4 py-3">Trưởng KP</th>
                        <th className="px-4 py-3">Mặt trận</th>
                        <th className="px-4 py-3">Đoàn thể</th>
                        <th className="px-4 py-3">Tổ ANTT</th>
                        <th className="px-4 py-3">Dân cư</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rbacMatrix.map((row) => (
                        <tr key={row.module} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900">{row.module}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-emerald-600 font-bold">{row.admin}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{row.bithu}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-indigo-600 font-bold">{row.truongkp}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{row.mattran}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.doanthe}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-rose-600 font-bold">{row.antt}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.dan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* AI AGENT ARCHITECTURE TAB */}
          {activeArchTab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot size={18} className="text-indigo-600" />
                  Mô hình 4 Trợ lý Trí tuệ Nhân tạo riêng biệt
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để hỗ trợ cán bộ tối đa trong các nghiệp vụ hành chính phức tạp, hệ thống thiết lập cơ chế nạp ngữ cảnh nghiệp vụ khác nhau (Context Injection) cho mô hình Gemini 3.5 Flash để hình thành 4 trợ lý ảo chuyên trách:
                </p>

                <div className="space-y-3">
                  <div className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-all">
                    <span className="font-bold text-xs text-indigo-700 block">1. Trợ lý Bí thư (Soạn thảo & Hoạch định)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed mt-1">
                      Được huấn luyện các chỉ thị điều lệ Đảng, hỗ trợ Bí thư phác thảo dự thảo Nghị quyết chi bộ, soạn báo cáo chính trị và tóm tắt biên bản họp chỉ bộ nhanh chóng.
                    </span>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-all">
                    <span className="font-bold text-xs text-emerald-700 block">2. Trợ lý Trưởng Khu phố (Hành chính & Quản lý)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed mt-1">
                      Được nạp dữ liệu thống kê dân số, biểu mẫu hành chính quốc gia. Hỗ trợ dự thảo các thông báo họp khu phố, thống kê biến động nhân khẩu và soạn thảo báo cáo gửi lên UBND Phường.
                    </span>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-all">
                    <span className="font-bold text-xs text-purple-700 block">3. Trợ lý Mặt trận & An sinh (Xã hội & Đoàn thể)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed mt-1">
                      Hỗ trợ lập kế hoạch vận động quỹ nhân đạo, phân loại đề xuất hỗ trợ hộ nghèo, hộ cận nghèo đúng quy định, công bằng.
                    </span>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-all">
                    <span className="font-bold text-xs text-rose-700 block">4. Trợ lý ANTT & Tin báo (Môi trường & An ninh)</span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed mt-1">
                      Tự động phân loại, lọc các phản ánh hiện trường do người dân gửi lên vào đúng nhóm chuyên trách xử lý (Đội trật tự đô thị, Cảnh sát khu vực, Công ty vệ sinh...).
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu size={16} className="text-emerald-600" />
                  Kiến trúc kết nối API Gemini
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tất cả các cuộc gọi mô hình AI đều được thực hiện từ máy chủ Express (`server.ts`) qua gói SDK `@google/genai` bảo mật, sử dụng khóa `process.env.GEMINI_API_KEY` ẩn.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] leading-relaxed relative overflow-x-auto">
                  <div className="text-slate-500 mb-1">// server.ts - Trích đoạn cuộc gọi AI</div>
                  <span className="text-indigo-400">import</span> {"{ GoogleGenAI }"} <span className="text-indigo-400">from</span> <span className="text-emerald-400">"@google/genai"</span>;
                  <br />
                  <span className="text-indigo-400">const</span> ai = <span className="text-indigo-400">new</span> GoogleGenAI({"{"} apiKey: process.env.GEMINI_API_KEY {"}"});
                  <br />
                  <br />
                  <span className="text-indigo-400">const</span> response = <span className="text-indigo-400">await</span> ai.models.generateContent({"{"}
                  <br />
                  &nbsp;&nbsp;model: <span className="text-emerald-400">"gemini-3.5-flash"</span>,
                  <br />
                  &nbsp;&nbsp;contents: messages,
                  <br />
                  &nbsp;&nbsp;config: {"{"} systemInstruction {"}"}
                  <br />
                  {"}"});
                </div>

                <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg p-3 text-[11px] leading-relaxed">
                  <span className="font-bold block">💡 Lợi ích Serverless:</span>
                  Không tốn tài nguyên GPU cục bộ, mô hình chạy tối ưu hóa trên điện toán đám mây Google Cloud với thời gian phản hồi chưa đầy 1 giây.
                </div>
              </div>

            </div>
          )}

          {/* SECURITY & BACKUP TAB */}
          {activeArchTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  Quy trình bảo mật nhiều lớp
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để phòng chống rò rỉ thông tin cá nhân của 12.000 cư dân, hệ thống áp dụng tiêu chuẩn bảo mật chính phủ số:
                </p>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex gap-2.5 items-start">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">Lớp 1</span>
                    <p><strong>Mã hóa đường truyền SSL/TLS:</strong> 100% dữ liệu đi từ trình duyệt của cư dân đến máy chủ được mã hóa bảo mật chống nghe lén HTTPS.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">Lớp 2</span>
                    <p><strong>Bảo mật danh tính JWT:</strong> Xác thực phiên làm việc thông qua token JWT ký số thời gian hết hạn 24 giờ, hỗ trợ Multi-Factor Authentication (MFA).</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">Lớp 3</span>
                    <p><strong>Row Level Security (RLS):</strong> Chính sách bảo mật Postgres RLS chặn hoàn toàn việc can thiệp trái phép. Kể cả tin tặc bypass được API cũng không thể đọc dữ liệu hộ dân khác do DB kiểm tra UUID người dùng trực tiếp.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database size={18} className="text-emerald-600" />
                  Chiến lược Sao lưu & Khôi phục thiên tai
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Đảm bảo hệ thống hoạt động liên tục không gián đoạn 24/7/365, kế hoạch sao lưu được thiết lập tự động hóa hoàn toàn trên nền tảng Supabase Cloud:
                </p>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex gap-2 border-b border-slate-50 pb-2">
                    <div className="text-slate-950 font-bold shrink-0 w-24">Sao lưu hằng ngày (Daily):</div>
                    <span className="text-slate-500">Hệ thống tự động Snapshot toàn bộ Database Postgres + PostGIS vào lúc 02:00 sáng mỗi ngày, lưu giữ 30 phiên bản gần nhất.</span>
                  </div>
                  <div className="flex gap-2 border-b border-slate-50 pb-2">
                    <div className="text-slate-950 font-bold shrink-0 w-24">Sao lưu hằng tuần (Weekly):</div>
                    <span className="text-slate-500">Nén toàn bộ file đính kèm, hình ảnh hiện trường cư dân gửi và kết xuất lưu trữ lạnh (Cold Storage) ngoại tuyến an toàn.</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-slate-950 font-bold shrink-0 w-24">Lưu trữ tối thiểu:</div>
                    <span className="text-slate-500 font-bold text-indigo-600">Lưu trữ tối thiểu 5 năm đối với hồ sơ hành chính, lịch sinh hoạt Đảng bộ và báo cáo tổng hợp khu phố.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RENDER INTERACTIVE ROADMAP (21 PHASES) */}
      {activeMainSection === "roadmap" && (
        <div id="interactive-roadmap-section" className="space-y-6 animate-fade-in">
          
          {/* Header Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity size={20} className="text-amber-500" />
                  Lộ trình Triển khai Kế hoạch thực tế (21 Giai đoạn)
                </h2>
                <p className="text-xs text-slate-500">
                  Hệ thống giám sát, quản lý và nghiệm thu kỹ thuật từng bước xây dựng "Khu phố thông minh" Khu phố 3, Phường An Phú.
                </p>
              </div>
              <button
                onClick={resetRoadmapProgress}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                Khôi phục Mặc định
              </button>
            </div>

            {/* Progress Visualizer */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Tiến độ chung</span>
                  <span className="text-amber-600">{progressPercent}% Hoàn thành</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:col-span-3 text-center">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                  <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider font-mono">Hoàn thành</div>
                  <div className="text-xl font-black text-emerald-700">{completedCount} <span className="text-xs font-normal">bước</span></div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                  <div className="text-xs text-amber-600 font-bold uppercase tracking-wider font-mono">Đang chạy (WIP)</div>
                  <div className="text-xl font-black text-amber-700">{inProgressCount} <span className="text-xs font-normal">bước</span></div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Chưa bắt đầu</div>
                  <div className="text-xl font-black text-slate-600">{notStartedCount} <span className="text-xs font-normal">bước</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Timeline sidebar list */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-[680px] flex flex-col">
              <div className="pb-3 border-b border-slate-100 mb-3 flex justify-between items-center shrink-0">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Danh sách Giai đoạn (1 - 21)</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">Sắp xếp tuần tự</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {roadmapPhases.map((phase, idx) => {
                  const isActive = activeRoadmapPhase === idx;
                  const status = phaseStatuses[phase.id] || "not_started";
                  return (
                    <button
                      key={phase.id}
                      onClick={() => setActiveRoadmapPhase(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                          : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-extrabold shrink-0 ${
                          isActive 
                            ? "bg-amber-500 text-slate-950" 
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {phase.id < 10 ? `0${phase.id}` : phase.id}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-amber-400" : "text-slate-400"}`}>
                            {phase.title}
                          </div>
                          <div className="text-xs font-bold truncate max-w-[210px]">
                            {phase.name}
                          </div>
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      <div className="shrink-0 pl-2">
                        {status === "completed" && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                        {status === "in_progress" && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                          </span>
                        )}
                        {status === "not_started" && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic details pane */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[680px] overflow-y-auto space-y-6 scrollbar-thin">
              {(() => {
                const phase = roadmapPhases[activeRoadmapPhase];
                if (!phase) return null;
                const status = phaseStatuses[phase.id] || "not_started";
                const extra = getPhaseExtraInfo(phase.id);
                
                // Calculate checked count in checklist
                const totalChecks = phase.requirements.length + phase.outputs.length + phase.criteria.length;
                let checkedCount = 0;
                phase.requirements.forEach((_, rIdx) => {
                  if (phaseChecklists[`req-${phase.id}-${rIdx}`]) checkedCount++;
                });
                phase.outputs.forEach((_, oIdx) => {
                  if (phaseChecklists[`out-${phase.id}-${oIdx}`]) checkedCount++;
                });
                phase.criteria.forEach((_, cIdx) => {
                  if (phaseChecklists[`crit-${phase.id}-${cIdx}`]) checkedCount++;
                });
                const checklistPercent = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;

                return (
                  <div className="space-y-6">
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider block w-fit mb-1">
                          {phase.title}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          {getPhaseIcon(phase.iconName, 18, "text-amber-500")}
                          {phase.name}
                        </h3>
                      </div>

                      {/* Interactive Status Selector */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 items-center">
                        <button
                          onClick={() => handleStatusChange(phase.id, "not_started")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            status === "not_started"
                              ? "bg-slate-300 text-slate-800 shadow"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Chưa có
                        </button>
                        <button
                          onClick={() => handleStatusChange(phase.id, "in_progress")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            status === "in_progress"
                              ? "bg-amber-500 text-white shadow"
                              : "text-slate-500 hover:text-amber-600"
                          }`}
                        >
                          Đang chạy
                        </button>
                        <button
                          onClick={() => handleStatusChange(phase.id, "completed")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            status === "completed"
                              ? "bg-emerald-600 text-white shadow"
                              : "text-slate-500 hover:text-emerald-600"
                          }`}
                        >
                          Xong
                        </button>
                      </div>
                    </div>

                    {/* Objective block */}
                    <div className="bg-slate-50 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1">
                      <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-600">Mục tiêu Giai đoạn</div>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {phase.objective}
                      </p>
                    </div>

                    {/* Interactive Checklist Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-slate-500" />
                          Checklist Nghiệm thu ({checkedCount}/{totalChecks})
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                          Đạt {checklistPercent}%
                        </span>
                      </div>

                      {/* Section Checklist Items */}
                      <div className="space-y-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                        
                        {/* Requirements */}
                        <div className="space-y-2">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">1. Nghiệp vụ & Thiết lập</div>
                          <div className="space-y-1.5">
                            {phase.requirements.map((req, rIdx) => {
                              const key = `req-${phase.id}-${rIdx}`;
                              const isChecked = phaseChecklists[key] || false;
                              return (
                                <button
                                  key={key}
                                  onClick={() => toggleChecklist(key)}
                                  className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-slate-100/50 transition-colors text-xs cursor-pointer group"
                                >
                                  <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    isChecked 
                                      ? "bg-emerald-500 border-emerald-500 text-white" 
                                      : "border-slate-300 group-hover:border-slate-400 bg-white"
                                  }`}>
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <span className={`leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                                    {req}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Outputs */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">2. Sản phẩm Đầu ra (Deliverables)</div>
                          <div className="space-y-1.5">
                            {phase.outputs.map((out, oIdx) => {
                              const key = `out-${phase.id}-${oIdx}`;
                              const isChecked = phaseChecklists[key] || false;
                              return (
                                <button
                                  key={key}
                                  onClick={() => toggleChecklist(key)}
                                  className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-slate-100/50 transition-colors text-xs cursor-pointer group"
                                >
                                  <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    isChecked 
                                      ? "bg-emerald-500 border-emerald-500 text-white" 
                                      : "border-slate-300 group-hover:border-slate-400 bg-white"
                                  }`}>
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <span className={`leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                                    {out}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Criteria */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">3. Tiêu chí Đạt (Definition of Done)</div>
                          <div className="space-y-1.5">
                            {phase.criteria.map((crit, cIdx) => {
                              const key = `crit-${phase.id}-${cIdx}`;
                              const isChecked = phaseChecklists[key] || false;
                              return (
                                <button
                                  key={key}
                                  onClick={() => toggleChecklist(key)}
                                  className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-slate-100/50 transition-colors text-xs cursor-pointer group"
                                >
                                  <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    isChecked 
                                      ? "bg-emerald-500 border-emerald-500 text-white" 
                                      : "border-slate-300 group-hover:border-slate-400 bg-white"
                                  }`}>
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <span className={`leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                                    {crit}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Risk & Handover Panel Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Risk Box */}
                      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-red-800 uppercase tracking-wider font-mono">
                          <AlertCircle size={14} className="text-red-600" />
                          Rủi ro Giai đoạn
                        </div>
                        <p className="text-xs text-red-700 leading-relaxed font-medium">
                          <strong>Nguy cơ:</strong> {extra.risk}
                        </p>
                        <p className="text-xs text-emerald-800 leading-relaxed border-t border-red-100/50 pt-2 font-medium">
                          <strong>Khắc phục:</strong> {extra.mitigation}
                        </p>
                      </div>

                      {/* Handover Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                          <BookOpen size={14} className="text-slate-500" />
                          Tài liệu Bàn giao
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          {extra.handover.map((doc, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span className="font-medium truncate">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Prompt Box */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
                          <Bot size={14} />
                          Prompt cho giai đoạn tiếp theo
                        </div>
                        <button
                          onClick={() => handleCopy(phase.prompt, `prompt-${phase.id}`)}
                          className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer"
                        >
                          {copiedText === `prompt-${phase.id}` ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              Đã sao chép!
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              Sao chép Prompt
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-lg text-[11px] text-slate-300 font-mono leading-relaxed select-all max-h-24 overflow-y-auto">
                        {phase.prompt}
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      )}

      {/* FOOTER METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center space-y-1">
          <DollarSign size={20} className="text-emerald-600 mx-auto" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Kinh phí triển khai</span>
          <span className="text-sm font-extrabold text-slate-900">~ 52 triệu VNĐ</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center space-y-1">
          <TrendingUp size={20} className="text-indigo-600 mx-auto" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Số lượng bảng dữ liệu</span>
          <span className="text-sm font-extrabold text-slate-900">44 Bảng thiết kế</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center space-y-1">
          <CalendarDays size={20} className="text-amber-600 mx-auto" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Thời gian triển khai</span>
          <span className="text-sm font-extrabold text-slate-900">8 Tháng kế hoạch</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center space-y-1">
          <Bot size={20} className="text-purple-600 mx-auto" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Trí tuệ nhân tạo</span>
          <span className="text-sm font-extrabold text-slate-900">4 AI Chuyên trách</span>
        </div>
      </div>

    </div>
  );
}
