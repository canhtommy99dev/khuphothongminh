# HỆ THỐNG QUẢN LÝ THÔNG MINH KHU PHỐ 3 AN PHÚ - BỘ NHỚ & QUY TẮC DỰ ÁN

Tài liệu này đóng vai trò là **Bộ nhớ làm việc (Agent Memory)** và **Quy tắc dự án (Project Rules)** dành cho AI Assistant (Antigravity) trong tất cả các phiên làm việc hiện tại và tiếp theo.

---

## 1. TỔNG QUAN DỰ ÁN & ĐỊA BÀN
- **Tên dự án:** Remix Khu phố 3 An Phú - Quản lý thông minh & Cổng Dịch vụ Cư dân số.
- **Địa bàn hành chính:** Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.
- **Quy mô dân cư thực tế trong Database:** 
  - **488 hộ gia đình**
  - **11.632 nhân khẩu** (2.076 Thường trú + 9.556 Tạm trú đã khử trùng CCCD)
  - **3 cơ sở kinh doanh/doanh nghiệp**
- **Thường trực Ban điều hành:**
  - Bí thư Chi bộ: Ông Nguyễn Văn Hùng
  - Trưởng Khu phố: Bà Lê Thị Mai
  - Công an khu vực: Đại úy Trần Quốc Hải
- **Tài khoản quản trị viên tối cao (Admin Bootstrap):**
  - Email: `bdhkhupho3.ap@gmail.com`
  - Mật khẩu: `Trunghuy741`
  - Role: `admin` | Trạng thái: `approved` | Email Confirmed: `true`

---

## 2. KIẾN TRÚC CÔNG NGHỆ & MÃ NGUỒN
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, Motion.
- **Bản đồ số GIS:** Leaflet (WGS-84 CRS), đa giác ranh giới hành chính Khu phố 3 khép kín theo các trục đường Song Hành, Lương Định Của, Mai Chí Thọ. Tọa độ trung tâm: `[10.7935, 106.7445]`.
- **Backend & Serverless:**
  - Local Dev Server: Express + Vite middleware (`server.ts`).
  - Cloud Production Serverless: `api/chat.ts` (xử lý hội thoại Trợ lý AI Gemini 2.5 Flash).
  - Cấu hình điều hướng Vercel: `vercel.json` (SPA rewrites và API routing).

---

## 3. CƠ SỞ DỮ LIỆU SUPABASE & BẢO MẬT RLS
- **Project URL:** `https://wjdgaobhipkgzveidtra.supabase.co`
- **Project ID:** `wjdgaobhipkgzveidtra`
- **Access Token:** `sbp_fc2b41fc33b4edc43b40e83dec70d6f54502c03e`
- **Public Anon Key:** Được lưu trong `.env` và Vercel Environment Variables (`VITE_SUPABASE_ANON_KEY`).
- **Client SDK:** `src/lib/supabase.ts`.
- **Row Level Security (RLS) & Phân quyền:**
  - Bật RLS 100% trên cả 8 bảng: `user_profiles`, `households`, `residents`, `businesses`, `field_reports`, `neighborhood_funds`, `community_news`, `tasks`.
  - Hàm phân quyền: `is_approved_staff(uid)`, `is_admin(uid)`.
  - Cư dân/Khách (Anon): Chỉ được đọc tin tức, tra cứu quỹ, gửi phản ánh 1022. Tuyệt đối bị chặn đọc/ghi bảng `residents` và `households`.
  - Cán bộ đã duyệt (`is_approved_staff`): Đọc và quản lý đầy đủ nhân khẩu, hộ khẩu, nhiệm vụ, quỹ.
  - Quản trị viên (`is_admin`): Quyền duyệt/thu hồi tài khoản cán bộ công tác trong `user_profiles`.

---

## 4. HẠ TẦNG CLOUD & DEPLOYMENT VERCEL
- **Tổ chức Vercel:** `khupho3-s-projects`
- **Tên dự án Vercel:** `bdhkp3`
- **Personal Access Token:** `vcp_2E4YuC4RETScN01BRUIPtrVSTijX4JyB2EehKF8BMXqtuTWfFh2sIBhQ`
- **Domain Production chính thức:**
  👉 **[https://bdhkp3.vercel.app](https://bdhkp3.vercel.app)**
- **GitHub Repository (Public):**
  👉 **[https://github.com/nghiemquynh0210/khuphothongminh](https://github.com/nghiemquynh0210/khuphothongminh)**
- **Git Commit Author chuẩn:** `Khupho3 <bdhkhupho3.ap@gmail.com>` (Bắt buộc giữ author này để Vercel không chặn deployment).
- **Lệnh Deploy nhanh:**
  ```bash
  npx vercel --prod --yes --token vcp_2E4YuC4RETScN01BRUIPtrVSTijX4JyB2EehKF8BMXqtuTWfFh2sIBhQ
  ```

---

## 5. CẤU HÌNH MCP SERVERS (.agents/mcp_config.json)
Dự án đã thiết lập 2 MCP Servers hoạt động:
1. **Supabase MCP:** `@supabase/mcp-server-supabase@latest` kết nối trực tiếp database `wjdgaobhipkgzveidtra`.
2. **Vercel MCP:** `@modelcontextprotocol/server-vercel` kết nối quản trị và theo dõi triển khai Vercel.

---

## 6. DANH MỤC TÍNH NĂNG ĐÃ HOÀN THIỆN & CHUYỂN ĐỔI DATABASE THẬT
1. **Nạp & Đồng bộ Dữ liệu Cư dân Quy mô lớn:**
   - Đã nạp thành công **11.632 nhân khẩu** (Thường trú & Tạm trú) và **488 hộ gia đình** từ file Excel vào Supabase PostgreSQL.
   - Cơ chế tải dữ liệu khách hàng theo batch cursor/range tối ưu trong `App.tsx` giúp load 11.632 dòng mượt mà, không nghẽn mạng.
2. **Quản lý Hộ khẩu & Tự nhận diện Hộ vĩnh viễn (`HouseholdAutoRecognition.tsx`):**
   - Thuật toán phân tích cấu trúc gia đình, tự nhận diện Chủ hộ và thành viên.
   - Nút **"Đồng bộ Toàn bộ vào Sổ Hộ Khẩu"** và **"Đồng bộ từng hộ"** đã được kết nối trực tiếp lệnh `UPSERT` vào bảng `households` và cập nhật `residents` trong PostgreSQL -> Lưu vĩnh viễn, không bị mất sau khi đăng xuất/tải lại trang.
3. **Quản lý Dân cư & Dán văn bản thô / Excel (`CitizenManagement.tsx`):**
   - Modal phân tích thông minh cho phép copy/paste dữ liệu thô hoặc nạp Excel, tự động chuẩn hóa và batch upsert trực tiếp vào database.
4. **Hệ thống Supabase Auth & Luồng Phê duyệt Cán bộ:**
   - Đăng ký cán bộ mới chuyển vào trạng thái `pending`.
   - Phân hệ **Cài đặt & Phân quyền (`SettingsAndPermissions.tsx`)** cho phép Bí thư Chi bộ xem danh sách và duyệt 1-chạm (`approved`).
   - Đăng nhập thật qua `supabase.auth.signInWithPassword()`, khôi phục mật khẩu qua email.
   - Tài khoản Admin chính thức: `bdhkhupho3.ap@gmail.com` / `Trunghuy741`.
5. **Cổng Dịch vụ Cư Dân Số (`CitizenLandingPage.tsx`):**
   - Tiếp nhận phản ánh 1022 lưu thẳng vào `field_reports`.
   - Hiển thị tin tức cộng đồng và quỹ khu phố minh bạch từ database thật.
6. **Chuẩn Hóa Trường Dữ Liệu Địa Chỉ & Chi Tiết Cư Dân (Thường Trú & Tạm Trú):**
   - **Thường trú (2.076 nhân khẩu):** Phân định rạch ròi **Địa chỉ thường trú (Cột H)** và **Chỗ ở hiện tại (Cột J)**. Tích hợp bổ sung **Họ tên cha (Cột K)**, **Họ tên mẹ (Cột L)**, **Tình trạng quản lý (Cột N)**.
   - **Tạm trú (9.556 nhân khẩu):** Phân định chuẩn xác **Địa chỉ tạm trú / Chỗ ở hiện tại tại KP3 (Cột G)** và **Địa chỉ thường trú gốc ở quê quán (Cột J)**. Tích hợp **Ngày đăng ký tạm trú (Cột H)**, **Ngày hết hạn tạm trú (Cột I)**, **Tình trạng quản lý (Cột L)**, tách số điện thoại chủ trọ. Loại bỏ hoàn toàn việc gán nhầm thông tin thường trú gốc vào trường nơi làm việc (workplace).
   - **Thông tin chi tiết cư dân (`CitizenManagement.tsx`):** Mọi trường thông tin chưa có trong file (học vấn, hôn nhân, nghề nghiệp, BHYT, NVQS...) đều hiển thị trung thực là **"Chưa cập nhật"**, tuyệt đối không dùng giá trị giả lập/hardcoded.
   - **Database Supabase:** Đã bổ sung 7 cột chuyên dụng (`permanent_address`, `current_address`, `father_name`, `mother_name`, `temporary_reg_date`, `temporary_exp_date`, `management_status`) và cập nhật đồng bộ thành công toàn bộ 11.632 nhân khẩu.

7. **Tự Động Nhận Diện Hộ Gia Đình & Suy Luận Cây Phả Hệ Tự Động (`HouseholdAutoRecognition.tsx` & `householdRecognitionUtils.ts`):**
   - **Tự động 100% khi khởi động ứng dụng:** Khi tải 11.632 cư dân từ Supabase, hệ thống tự động gom nhóm, liên kết toàn bộ thành viên vào Sổ hộ khẩu điện tử tương ứng và suy luận quan hệ mà người dùng không cần bấm bất kỳ nút nào thủ công.
   - **Thuật toán phả hệ thông minh:** Tự động đối chiếu chéo `Họ tên cha`, `Họ tên mẹ`, `Giới tính`, `Năm sinh` để xác định chính xác: `Chủ hộ`, `Vợ/Chồng`, `Con trai/Con gái`, `Cháu nội/Cháu ngoại`, `Bố/Mẹ`, `Con dâu/Con rể`, `Anh/Chị/Em`.
   - **Hỗ trợ đầy đủ cả Thường trú & Tạm trú:** Nhận diện theo mã hộ khẩu (Thường trú) hoặc phân cụm địa chỉ chuẩn hóa (Tạm trú).
   - **Tối ưu hóa UI/UX:** Tích hợp phân trang `Pagination` (10 hộ/trang) tại màn hình "Tự Nhận Diện Hộ", loại bỏ triệt để hiện tượng lag DOM khi render hàng trăm/nghìn hộ.

8. **Cảnh Báo Hết Hạn Tạm Trú Trước 01 Tháng & Bóc Tách / Liên Kết Cơ Sở Kinh Doanh Nhà Trọ:**
   - **Bóc tách thông tin nhà trọ thông minh (`parseAccommodationInfo`):** Tự động phân tích các chuỗi dữ liệu phức tạp như `"Nhà trọ Phạm Văn Bình (SĐT: 0913137155) 17/A3 Khu phố 3, Phường An Phú, Thành phố Hồ Chí Minh"`, tách thành:
     + Tên chủ trọ / Tên cơ sở: `Phạm Văn Bình` / `Nhà trọ Phạm Văn Bình`
     + Số điện thoại liên hệ: `0913137155` (có nút bấm gọi `tel:` trực tiếp)
     + Địa chỉ phòng trọ chuẩn hóa: `17/A3 Khu phố 3`
   - **Cảnh báo hết hạn tạm trú trước 01 tháng (`getTemporaryResidenceExpiryStatus`):**
     + So khớp ngày hết hạn tạm trú (`temporaryExpDate`) với thời gian thực.
     + Nếu còn hạn <= 30 ngày (trước 01 tháng): Hiển thị badge vàng/cam nhấp nháy `⚠️ Sắp hết hạn tạm trú (còn X ngày)`.
     + Nếu đã quá hạn: Hiển thị badge đỏ `🚨 Đã hết hạn tạm trú (quá X ngày)`.
     + Tích hợp Banner cảnh báo điều hành và Bộ lọc nhanh theo thời hạn tạm trú trên thanh công cụ `CitizenManagement.tsx`.
   - **Liên kết Cơ sở Kinh doanh Nhà trọ & Số người lưu trú thực tế (`BusinessManagement.tsx`):**
     + Tự động tính toán số người lưu trú thực tế từ danh sách cư dân (`residents`) bằng hàm `isResidentInAccommodation`.
     + Khi bấm vào cơ sở kinh doanh nhà trọ (ví dụ `Nhà trọ Phạm Văn Bình` tại `17/A3`): Hiển thị chính xác số người thực tế (81 người đối khớp từ 11.632 cư dân) và hiển thị bảng chi tiết danh sách cư dân lưu trú (Họ tên, CCCD, SĐT, Quê quán/Thường trú gốc, Thời hạn tạm trú, Cảnh báo hạn).
     + Hỗ trợ xuất danh sách cư dân lưu trú ra file Excel 1-chạm (`handleExportHostelResidents`).

9. **Khắc Phục Phân Hệ Cơ Sở Kinh Doanh & Đồng Bộ Cơ Sở Lưu Trú Vào Database Supabase:**
   - **Nguyên nhân trước đó:** Bảng `businesses` trên Supabase PostgreSQL trước đây chỉ có 3 dòng mẫu và thiếu các cột lưu trú (`is_accommodation`, `room_count`, `guest_count`), khiến hàm fetch từ DB ghi đè lên danh sách và không hiển thị các nhà trọ.
   - **Đã khắc phục:**
     + Bổ sung các cột `is_accommodation`, `room_count`, `guest_count`, `pccc_passed`, `scale`, `has_cam_ket_an_ninh` vào bảng `businesses` trên Supabase PostgreSQL.
     + Đồng bộ toàn bộ 13 cơ sở kinh doanh & nhà trọ lưu trú vào bảng `businesses` (bao gồm `Nhà trọ Phạm Văn Bình`, `Nhà trọ An Phú Khang`, `Nhà nghỉ Bình Minh`...).
     + Nâng cấp hàm nạp dữ liệu trong [src/App.tsx](file:///d:/Download/khuphothongminh/src/App.tsx) để tự động đối chiếu, kế thừa metadata phong phú và giữ đầy đủ các trường thông tin.
     + Kiểm tra trực quan qua Chrome DevTools MCP: UI render chuẩn xác 13 cơ sở, 3 cơ sở lưu trú (57 phòng), mở modal chi tiết Nhà trọ Phạm Văn Bình hiển thị đầy đủ 81 cư dân lưu trú thực tế cùng nút xuất Excel.

10. **Tối Ưu Hóa Toàn Diện UI/UX Phân Hệ Cơ Sở Kinh Doanh (Card View & Table View):**
   - **Card View:**
     + Tách tên cơ sở ra ngoài ảnh, in đậm 14px, loại bỏ hiện tượng bị che khuất / cắt cụt chữ (`truncate`) trên chân ảnh.
     + Đưa mã giấy phép (`licenseNumber`) và huy hiệu `Cơ sở lưu trú` lên các góc ảnh một cách tinh tế.
     + Thiết kế khối thông tin lưu trú nền cam hổ phách cao cấp với micro-stat `phòng • tầng` và huy hiệu `✓ CSDL`.
     + Khối Địa chính format dạng mono 1 hàng (`Tờ 272, Thửa 55 • 150 m² ODT`), không bị ngắt rớt dòng.
     + Footer hiển thị trọn vẹn 100% họ tên chủ hộ (`Nguyễn Văn Hùng`, `Trần Thị Lan`, `Phạm Văn Bình`) và căn chỉnh đều đặn nút `Sổ đỏ` cùng `✓ PCCC`.
   - **Table View:**
     + Bổ sung ảnh thumbnail đại diện tròn bo góc 10x10.
     + Sửa lỗi rớt dòng tại cột Trạng thái (`Đang hoạt động` nằm trên 1 hàng duy nhất với chấm tròn pulse sinh động).
     + Cột lưu trú căn chỉnh thẳng hàng tuyệt đối giữa số người và tag `✓ CSDL`.
     + Sửa nút `Hồ sơ` từ hình bầu dục dọc méo mó thành nút bấm chuẩn UI chữ nhật bo góc với icon mắt và chữ nằm ngang cân đối.

11. **Tự Động Nhận Diện & Liên Kết Cơ Sở Nhà Trọ Từ Dữ Liệu Dân Cư (`autoExtractHostelBusinesses`):**
   - **Tự động bóc tách & phát hiện 108 cơ sở nhà trọ:** Phân tích toàn diện 11.632 cư dân (đặc biệt 9.556 cư dân tạm trú), bóc tách địa chỉ phòng trọ, SĐT chủ trọ và tên chủ hộ để gom nhóm tạo thành các cơ sở kinh doanh lưu trú chuẩn xác (e.g. `Nhà trọ Đặng Văn Độ`, `Nhà trọ Đồng Thị Gái`, `Nhà trọ Phạm Thị Thanh Thủy`, `Nhà trọ Phạm Thị Hiền`, `Nhà trọ Cao Thị Mỹ Linh`...).
   - **Đồng bộ layout chuẩn 100% không vỡ khung:** Mọi cơ sở nhà trọ mới đều có cấu trúc hiển thị đồng nhất tuyệt đối với `Nhà trọ An Phú Khang`, `Nhà nghỉ Bình Minh` và `Nhà trọ Phạm Văn Bình`: `🛏️ X phòng • Y tầng` | `👥 Z người` | Khối Địa chính mono 1 dòng | Tên chủ hộ và badge PCCC cân đối.
   - **Xem chi tiết & Xuất Excel 1-chạm:** Khi click vào bất kỳ cơ sở nhà trọ nào hoặc bấm `👁️ Hồ sơ`, modal mở ra hiển thị danh sách toàn bộ cư dân đang lưu trú tại cơ sở đó (Họ tên, ngày sinh, CCCD, quê quán thường trú gốc, thời hạn tạm trú, cảnh báo hết hạn) và nút `Xuất DS Excel (X người)`.
   - **Đồng bộ vĩnh viễn vào Supabase PostgreSQL:** Đã thêm nút `Lưu vào Supabase CSDL` và đồng bộ thành công toàn bộ 108 cơ sở lưu trú vào bảng `businesses` trên Supabase, đảm bảo dữ liệu tồn tại vĩnh viễn và không bị mất sau khi tải lại trang.

12. **Đồng Bộ Hóa Số Liệu Thực Tế Trên Toàn Hệ Thống Tổng Quan Cán Bộ & Cổng Cư Dân (`Dashboard.tsx` & `CitizenLandingPage.tsx`):**
   - **Xóa bỏ hoàn toàn số liệu giả lập:** Loại bỏ các số liệu mock cũ (1.420 dân, 350 hộ, 45 cơ sở, 1.045 thường trú, 320 tạm trú...).
   - **Liên kết 100% CSDL Supabase PostgreSQL thời gian thực:**
     + **Dân cư thực tế:** **11.632 nhân khẩu** (Nam: 6.005 người chiếm 51.6% • Nữ: 5.627 người chiếm 48.4%).
     + **Hộ khẩu thực tế:** **488 hộ gia đình** số hóa (bình quân 4.3 người/hộ).
     + **Doanh nghiệp & Cơ sở kinh doanh:** **118 cơ sở** (7 Doanh nghiệp TNHH/Cổ phần có MST • 111 Cơ sở kinh doanh tại chỗ gồm 108 cơ sở nhà trọ với 553 phòng).
     + **Phân bố cư trú trực quan trên biểu đồ BarChart:** Thường trú **2.076 người**, Tạm trú **9.556 người**.
   - **Tích hợp khối "Chỉ Số Quản Lý Dân Cư & Cảnh Báo Điều Hành KP3":**
     + **Cơ cấu Độ tuổi (Luật Căn cước 2023):** Trẻ em (<14t): 1.311 | Độ tuổi lao động (14-59t): 9.883 | Người cao tuổi (≥60t): 438.
     + **Cảnh báo Tạm trú thời gian thực (Công an KV):** Sắp hết hạn (≤30 ngày): 245 người (badge cảnh báo nhấp nháy) | Đã quá hạn: 533 người (badge đỏ) | An toàn: 8.778 hồ sơ.
     + **Mạng lưới Nhà trọ:** 108 cơ sở • 553 phòng • 9.556 khách tạm trú đối khớp thực tế.
     + **Tra cứu Sổ hộ khẩu:** Mẫu tra cứu chuẩn xác `HK-001`, `HK-002`... liên kết trực tiếp với dữ liệu 488 hộ gia đình.

---

## 8. TRẠNG THÁI HỆ THỐNG & ĐỊNH HƯỚNG TIẾP THEO
- **Trạng thái Build:** ✅ TypeScript không lỗi (`npx tsc --noEmit` exit 0), Vite build thành công sạch sẽ.
- **Trạng thái Deployment:**
  - Production Vercel: 👉 **[https://bdhkp3.vercel.app](https://bdhkp3.vercel.app)**
  - Local Dev Server: `http://localhost:3000`
- **Kế hoạch tiếp theo:**
  - Triển khai xuất báo cáo thống kê dân cư (Thường trú/Tạm trú/Người cao tuổi) ra file Excel/PDF chuẩn biểu mẫu Bộ Công an.
  - Tích hợp thêm gửi thông báo email/webhook khi có phản ánh hiện trường 1022 mới gửi lên từ cư dân.

