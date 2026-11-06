import { AdministrativeForm } from "./types";

export const initialAdministrativeForms: AdministrativeForm[] = [
  {
    id: "FORM-001",
    code: "Mẫu CT01",
    title: "Tờ khai thay đổi thông tin cư trú",
    category: "Cư trú & Hộ khẩu",
    issuingBody: "Bộ Công an (Thông tư số 56/2021/TT-BCA)",
    description: "Sử dụng khi công dân thực hiện các thủ tục đăng ký thường trú, tạm trú, tách hộ, khai báo tạm vắng, thay đổi chủ hộ hoặc điều chỉnh thông tin cư trú trên Cơ sở dữ liệu quốc gia về dân cư.",
    requiredDocuments: [
      "Bản chính Tờ khai CT01 đã điền đầy đủ thông tin",
      "Bản sao hoặc xuất trình bản chính CCCD/Hộ chiếu còn hạn",
      "Giấy tờ, tài liệu chứng minh chỗ ở hợp pháp (Sổ hồng/hợp đồng thuê nhà có công chứng)",
      "Ý kiến đồng ý của chủ hộ/chủ sở hữu chỗ ở hợp pháp (ghi vào tờ khai)"
    ],
    processingTime: "01 - 03 ngày làm việc",
    fee: "Miễn phí (Trực tuyến qua VNeID/Cổng DVC)",
    fileFormat: "DOCX / PDF",
    fileSize: "48 KB",
    downloadCount: 384,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------
Mẫu CT01 ban hành kèm theo TT số 56/2021/TT-BCA

TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ

Kính gửi: Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh

1. Họ, chữ đệm và tên: [NGUYỄN VĂN A]
2. Ngày, tháng, năm sinh: [01/01/1990]       3. Giới tính: [Nam/Nữ]
4. Số định danh cá nhân/Số CCCD: [079090001234]
5. Số điện thoại liên hệ: [0901234567]      6. Email: [cudan@anphu.vn]
7. Nơi thường trú: [Số 42/3 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
8. Nơi tạm trú: [...........................................................................]
9. Nơi ở hiện tại: [Số 42/3 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
10. Nghề nghiệp, nơi làm việc: [Kỹ sư phần mềm]
11. Họ, chữ đệm và tên chủ hộ: [NGUYỄN VĂN A]
12. Quan hệ với chủ hộ: [Chủ hộ]

13. NỘI DUNG ĐỀ NGHỊ:
Đăng ký thường trú / Nhập khẩu thành viên gia đình vào Sổ hộ khẩu số HK-301 tại địa chỉ số 42/3 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.

14. Những thành viên trong hộ gia đình cùng thay đổi:
- Người thứ 1: [Họ tên, ngày sinh, CCCD, quan hệ]
- Người thứ 2: [Họ tên, ngày sinh, CCCD, quan hệ]

Ý KIẾN CỦA CHỦ HỘ                      NGƯỜI KÊ KHAI
(Ký, ghi rõ họ tên)                  (Ký, ghi rõ họ tên)
`
  },
  {
    id: "FORM-002",
    code: "Mẫu ĐN-SN01",
    title: "Đơn xin cấp biển số nhà / Giấy chứng nhận số nhà",
    category: "Địa chính & Nhà ở",
    issuingBody: "UBND Phường An Phú & UBND TP. Thủ Đức",
    description: "Áp dụng cho các hộ dân xây dựng nhà mới, cải tạo nhà ở, nhà trong hẻm chưa được gắn số hoặc có nhu cầu đổi, cấp lại biển số nhà để thuận tiện trong liên hệ thư tín, giao dịch hành chính và điện nước.",
    requiredDocuments: [
      "Đơn đề nghị cấp số nhà theo mẫu (có xác nhận hiện trạng của Khu phố 3)",
      "Bản sao Giấy phép xây dựng hoặc Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở",
      "Bản vẽ hiện trạng vị trí nhà đất hoặc sơ đồ vị trí tuyến hẻm",
      "Ảnh chụp mặt tiền căn nhà thực tế"
    ],
    processingTime: "05 - 07 ngày làm việc",
    fee: "Lệ phí cấp biển số theo quy định HĐND",
    fileFormat: "DOCX / PDF",
    fileSize: "52 KB",
    downloadCount: 512,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

ĐƠN ĐỀ NGHỊ CẤP BIỂN SỐ NHÀ
(Dành cho nhà ở riêng lẻ, căn hộ, công trình xây dựng)

Kính gửi: 
- Ủy ban nhân dân Phường An Phú, TP. Thủ Đức
- Ban Điều hành Khu phố 3, Phường An Phú

Tôi tên là: [NGUYỄN VĂN A]
Sinh ngày: [01/01/1980]           Số CCCD: [079080004567]
Địa chỉ thường trú: [Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
Số điện thoại liên hệ: [0918765432]

Là chủ sở hữu căn nhà tọa lạc tại:
Thửa đất số: [..................] Tờ bản đồ số: [..................]
Tuyến hẻm: [Hẻm 42 Lương Định Của], Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.

Hiện trạng căn nhà:
- Nhà cấp [......], kết cấu: [Bê tông cốt thép / Tường gạch mái tôn], số tầng: [......]
- Diện tích xây dựng: [......] m2. Diện tích sàn: [......] m2.
- Giấy phép xây dựng số: [................../GPXD do UBND TP. Thủ Đức cấp] ngày [..../..../........]

Lý do xin cấp: [Nhà mới xây dựng hoàn thiện / Chưa được đánh số nhà / Đổi lại số nhà cũ]

Kính đề nghị UBND Phường An Phú và cơ quan có thẩm quyền khảo sát, cấp biển số nhà chính thức cho gia đình tôi.

XÁC NHẬN CỦA KHU PHỐ 3                   NGƯỜI LÀM ĐƠN
(Ký và ghi rõ họ tên)                 (Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-003",
    code: "Mẫu Phụ lục III-1",
    title: "Giấy đề nghị đăng ký hộ kinh doanh cá thể",
    category: "Hộ kinh doanh",
    issuingBody: "Bộ Kế hoạch & Đầu tư (Nghị định 01/2021/NĐ-CP)",
    description: "Biểu mẫu bắt buộc cho các cá nhân, thành viên hộ gia đình mở cửa hàng ăn uống, tạp hóa, cà phê, giặt ủi, thời trang, sửa chữa xe trên địa bàn Khu phố 3 đăng ký thành lập Hộ kinh doanh cá thể.",
    requiredDocuments: [
      "Giấy đề nghị đăng ký hộ kinh doanh theo mẫu",
      "Bản sao CCCD của chủ hộ kinh doanh và các thành viên tham gia",
      "Hợp đồng thuê địa điểm kinh doanh hoặc Giấy tờ sở hữu mặt bằng",
      "Chứng chỉ hành nghề / Giấy tờ an toàn vệ sinh thực phẩm (đối với ngành nghề có điều kiện)"
    ],
    processingTime: "03 ngày làm việc",
    fee: "100.000 VNĐ / lần cấp",
    fileFormat: "DOCX / PDF",
    fileSize: "64 KB",
    downloadCount: 429,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------
Phụ lục III-1 ban hành kèm theo Thông tư số 01/2021/TT-BKHĐT

GIẤY ĐỀ NGHỊ ĐĂNG KÝ HỘ KINH DOANH

Kính gửi: Phòng Kinh tế - Kế hoạch / Bộ phận Một cửa UBND TP. Thủ Đức

Tôi là: [LÊ THỊ B]
Giới tính: [Nữ]               Sinh ngày: [15/08/1985]
Dân tộc: [Kinh]               Quốc tịch: [Việt Nam]
Số CCCD: [079185002345] cấp ngày: [10/05/2021] nơi cấp: [Cục Cảnh sát QLHC về TTXH]
Địa chỉ thường trú: [56 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
Điện thoại: [0938987654]      Email: [tiemgiat.anphu@gmail.com]

ĐĂNG KÝ HỘ KINH DOANH VỚI CÁC NỘI DUNG SAU:
1. Tên hộ kinh doanh: [HỘ KINH DOANH TIỆM GIẶT ỦI AN PHÚ]
2. Địa điểm kinh doanh: [Số 42/12 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
3. Ngành, nghề kinh doanh chính: [Dịch vụ giặt ủi, sấy khô quần áo đồ gia dụng]
4. Vốn kinh doanh: [100.000.000 VNĐ] (Bằng chữ: Một trăm triệu đồng)
5. Số lượng lao động: [02 người]

Tôi cam kết:
- Chịu trách nhiệm trước pháp luật về tính hợp pháp, chính xác và trung thực của thông tin kê khai.
- Chấp hành nghiêm chỉnh các quy định pháp luật về PCCC, trật tự đô thị và an toàn vệ sinh.

CHỦ HỘ KINH DOANH
(Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-004",
    code: "Mẫu CT02",
    title: "Tờ khai đề nghị xác nhận thông tin về cư trú",
    category: "Cư trú & Hộ khẩu",
    issuingBody: "Bộ Công an (Thông tư số 56/2021/TT-BCA)",
    description: "Được dùng khi công dân cần cấp Giấy xác nhận thông tin về cư trú (thay thế sổ hộ khẩu giấy) để phục vụ giải quyết thủ tục nhà đất, vay vốn ngân hàng, đăng ký kết hôn, chuyển trường học cho con em.",
    requiredDocuments: [
      "Bản chính Tờ khai CT02",
      "Xuất trình bản chính Căn cước công dân gắn chip hoặc tài khoản VNeID mức 2"
    ],
    processingTime: "Trong ngày (hoặc tối đa 01 ngày làm việc)",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "42 KB",
    downloadCount: 620,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------
Mẫu CT02 ban hành kèm theo TT số 56/2021/TT-BCA

TỜ KHAI ĐỀ NGHỊ XÁC NHẬN THÔNG TIN VỀ CƯ TRÚ

Kính gửi: Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh

1. Người yêu cầu xác nhận:
Họ, chữ đệm và tên: [...........................................................................]
Ngày, tháng, năm sinh: [..../..../........]         Giới tính: [Nam/Nữ]
Số định danh cá nhân/CCCD: [................................................]
Số điện thoại: [................................] Email: [........................................]
Nơi thường trú: [Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]

2. Nội dung đề nghị xác nhận:
Xác nhận thời gian thường trú thực tế của tôi và các thành viên gia đình từ năm [............] đến nay phục vụ thủ tục: [Làm hồ sơ chuyển quyền sở hữu nhà đất / Làm hồ sơ vay vốn ngân hàng].

NGƯỜI KÊ KHAI
(Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-005",
    code: "Mẫu XN-KP03",
    title: "Đơn xin xác nhận tình trạng cư trú thực tế tại Khu phố 3",
    category: "Cư trú & Hộ khẩu",
    issuingBody: "Ban Điều hành Khu phố 3, Phường An Phú",
    description: "Dành cho cư dân tạm trú, công nhân thuê trọ, sinh viên hoặc người lao động cần Tổ dân phố và Trưởng khu phố xác nhận tình trạng sinh sống thực tế trên địa bàn để nộp hồ sơ xin việc, bảo hiểm xã hội.",
    requiredDocuments: [
      "Đơn xin xác nhận tình trạng cư trú",
      "Bản sao CCCD và Hợp đồng thuê phòng trọ/nhà ở",
      "Sổ khai báo lưu trú hoặc ảnh chụp thông tin VNeID"
    ],
    processingTime: "Ngay trong buổi làm việc",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "38 KB",
    downloadCount: 295,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

ĐƠN XIN XÁC NHẬN TÌNH TRẠNG CƯ TRÚ THỰC TẾ

Kính gửi:
- Ban Điều hành Khu phố 3, Phường An Phú
- Cảnh sát Khu vực phụ trách Khu phố 3

Tôi tên là: [TRẦN THỊ C]
Sinh ngày: [20/11/1995]           CCCD số: [079195009876]
Quê quán: [...........................................................................]
Hiện đang tạm trú thực tế tại: [Phòng số 4, nhà số 30/8 Lương Định Của, Tổ 2, Khu phố 3, Phường An Phú]
Chủ nhà trọ / Hộ gia đình cho thuê: [................................................]
Thời gian bắt đầu cư trú tại địa phương: Từ tháng [..../........] đến nay.

Mục đích xin xác nhận: [Bổ sung hồ sơ xin việc làm / Hoàn thiện hồ sơ hưởng trợ cấp BHXH]

XÁC NHẬN CỦA TRƯỞNG KHU PHỐ 3             NGƯỜI LÀM ĐƠN
(Ký, ghi rõ họ tên)                   (Ký, ghi rõ họ tên)
`
  },
  {
    id: "FORM-006",
    code: "Mẫu SC-01",
    title: "Đơn thông báo cải tạo, sửa chữa nhà ở không thay đổi kết cấu",
    category: "Địa chính & Nhà ở",
    issuingBody: "UBND Phường An Phú (Bộ phận Đô thị - Xây dựng)",
    description: "Thủ tục thông báo khi sửa chữa nhỏ như lợp lại mái tôn, thay gạch nền, sơn sửa tường, chống thấm dột nhà ở trong các tuyến hẻm Khu phố 3 nhằm tránh bị xử phạt trật tự xây dựng.",
    requiredDocuments: [
      "Đơn thông báo sửa chữa nhà ở theo mẫu",
      "Bản sao Giấy chứng nhận quyền sở hữu nhà đất",
      "Bản cam kết không lấn chiếm hẻm và dọn xà bần trong ngày"
    ],
    processingTime: "01 ngày làm việc (Tiếp nhận & lưu biên nhận)",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "44 KB",
    downloadCount: 310,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

ĐƠN THÔNG BÁO CẢI TẠO, SỬA CHỮA NHÀ Ở

Kính gửi: 
- Ủy ban nhân dân Phường An Phú (Bộ phận Quản lý trật tự đô thị)
- Ban Điều hành Khu phố 3

Chủ nhà: [PHẠM VĂN D]
Số CCCD: [079075001122]           Điện thoại: [0909333444]
Địa chỉ căn nhà sửa chữa: [Số 18/2 Lương Định Của, Khu phố 3, Phường An Phú]

Nội dung sửa chữa gồm:
- Sơn lại toàn bộ tường trong và ngoài nhà.
- Chống dột và thay mới tôn mái hiên.
- Không nâng tầng, không cơi nới diện tích, không thay đổi kết cấu chịu lực của công trình.

Thời gian thi công dự kiến: Từ ngày [..../..../2026] đến ngày [..../..../2026].
Cam kết: Tập kết vật liệu gọn gàng trong khuôn viên đất, không đổ rác thải xây dựng ra hẻm.

CHỦ HỘ GIA ĐÌNH
(Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-007",
    code: "Mẫu TP-HN01",
    title: "Tờ khai cấp Giấy xác nhận tình trạng hôn nhân",
    category: "Hộ tịch & Tư pháp",
    issuingBody: "Bộ Tư pháp (Thông tư số 04/2020/TT-BTP)",
    description: "Dùng để xin cấp giấy xác nhận tình trạng độc thân hoặc chưa kết hôn của công dân thường trú tại Khu phố 3 để đăng ký kết hôn, chuyển nhượng nhà đất, vay vốn ngân hàng.",
    requiredDocuments: [
      "Tờ khai theo mẫu quy định",
      "Bản sao CCCD của người yêu cầu",
      "Trích lục bản án ly hôn (nếu đã ly hôn) hoặc Giấy chứng tử của vợ/chồng (nếu vợ/chồng đã mất)"
    ],
    processingTime: "Tối đa 03 ngày làm việc",
    fee: "Miễn phí hoặc lệ phí theo quy định HĐND",
    fileFormat: "DOCX / PDF",
    fileSize: "46 KB",
    downloadCount: 478,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

TỜ KHAI CẤP GIẤY XÁC NHẬN TÌNH TRẠNG HÔN NHÂN

Kính gửi: Ủy ban nhân dân Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh

Họ, chữ đệm, tên người yêu cầu: [...........................................................................]
Nơi cư trú: [Số 42 Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]
Số CCCD: [................................] Cấp ngày: [..../..../........]
Trong thời gian cư trú tại Phường An Phú từ ngày [..../..../........] đến nay:
Tình trạng hôn nhân: [Chưa đăng ký kết hôn với ai / Đã ly hôn theo Bản án số ......]

Mục đích sử dụng Giấy xác nhận: [Làm thủ tục đăng ký kết hôn / Giao dịch chuyển nhượng bất động sản]

Tôi cam đoan nội dung kê khai là đúng sự thật và hoàn toàn chịu trách nhiệm trước pháp luật.

NGƯỜI KÊ KHAI
(Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-008",
    code: "Mẫu PCCC-01",
    title: "Bản cam kết an toàn PCCC & Trật tự đô thị cho hộ kinh doanh",
    category: "Hộ kinh doanh",
    issuingBody: "Công an Phường An Phú & Ban Điều hành Khu phố 3",
    description: "Bản cam kết bắt buộc đối với các hộ kinh doanh nhà trọ, quán ăn, xưởng mộc, tiệm tạp hóa trong khu dân cư về việc trang bị bình chữa cháy, không lấn chiếm lối thoát nạn hẻm chung.",
    requiredDocuments: [
      "Bản cam kết ký tên của chủ cơ sở",
      "Bản sao Giấy chứng nhận đăng ký hộ kinh doanh",
      "Biên bản kiểm tra phương tiện PCCC tại chỗ"
    ],
    processingTime: "Ký cam kết trực tiếp tại cuộc họp hoặc Tổ tự quản",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "40 KB",
    downloadCount: 260,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

BẢN CAM KẾT ĐẢM BẢO AN TOÀN PCCC VÀ TRẬT TỰ ĐÔ THỊ
(Áp dụng cho hộ kinh doanh, nhà ở kết hợp sản xuất kinh doanh tại Khu phố 3)

Tên cơ sở kinh doanh: [...........................................................................]
Chủ cơ sở: [...............................................................................................]
Địa chỉ kinh doanh: [Số ...... Lương Định Của, Khu phố 3, Phường An Phú]
Số điện thoại: [.........................................................................................]

CAM KẾT THỰC HIỆN ĐẦY ĐỦ CÁC NỘI DUNG SAU:
1. Trang bị tối thiểu 02 bình chữa cháy xách tay (bình bột ABC hoặc khí CO2) còn hạn sử dụng.
2. Hệ thống dây dẫn điện đi trong ống bảo vệ, có aptomat ngắt điện tự động.
3. Không buôn bán, kê bàn ghế, bảng hiệu lấn chiếm lòng lề đường và lòng hẻm.
4. Mở lối thoát hiểm thứ 2 đối với nhà ở kết hợp kinh doanh có chuồng cọp.

ĐẠI DIỆN KHU PHỐ 3                        CHỦ CƠ SỞ KINH DOANH
(Ký xác nhận)                             (Ký, ghi rõ họ tên)
`
  },
  {
    id: "FORM-009",
    code: "Mẫu NĐ20-01",
    title: "Tờ khai đề nghị trợ cấp xã hội / Hỗ trợ người cao tuổi",
    category: "An sinh xã hội",
    issuingBody: "Bộ Lao động - TB&XH (Nghị định 20/2021/NĐ-CP)",
    description: "Thủ tục xét duyệt nhận trợ cấp hằng tháng cho người cao tuổi từ 80 tuổi trở lên không có lương hưu, người khuyết tật nặng hoặc đối tượng có hoàn cảnh đặc biệt khó khăn.",
    requiredDocuments: [
      "Tờ khai thông tin cá nhân theo mẫu",
      "Bản sao CCCD và thẻ BHYT (nếu có)",
      "Giấy xác nhận tình trạng khuyết tật (đối với người khuyết tật)"
    ],
    processingTime: "07 - 10 ngày làm việc (qua Hội đồng xét duyệt phường)",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "50 KB",
    downloadCount: 340,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

TỜ KHAI ĐỀ NGHỊ TRỢ CẤP XÃ HỘI HÀNG THÁNG

Kính gửi: Hội đồng xét duyệt chính sách xã hội Phường An Phú, TP. Thủ Đức

1. Đối tượng đề nghị trợ cấp:
Họ và tên: [...........................................................................]
Ngày tháng năm sinh: [..../..../........]         Giới tính: [Nam/Nữ]
Số CCCD: [................................................]
Nơi ở hiện nay: [Khu phố 3, Phường An Phú, TP. Hồ Chí Minh]

2. Thuộc diện đối tượng:
[ ] Người từ đủ 80 tuổi trở lên không có lương hưu, trợ cấp BHXH hằng tháng.
[ ] Người khuyết tật đặc biệt nặng / nặng.
[ ] Trẻ em có hoàn cảnh đặc biệt khó khăn.

NGƯỜI KÊ KHAI / NGƯỜI ĐẠI DIỆN
(Ký và ghi rõ họ tên)
`
  },
  {
    id: "FORM-010",
    code: "Mẫu QĐ213-CB",
    title: "Phiếu nhận xét đảng viên sinh hoạt nơi cư trú (Quy định 213)",
    category: "Tổ dân phố & Chi bộ",
    issuingBody: "Ban Chấp hành Trung ương Đảng (Quy định 213-QĐ/TW)",
    description: "Dành cho cán bộ, công chức, viên chức là đảng viên đang công tác gửi về Chi ủy Chi bộ Khu phố 3 xin nhận xét, đánh giá việc chấp hành chủ trương, nghĩa vụ công dân nơi cư trú cuối năm.",
    requiredDocuments: [
      "Phiếu nhận xét đảng viên sinh hoạt nơi cư trú theo mẫu",
      "Bản tự kiểm điểm tóm tắt quá trình tham gia hoạt động tại khu dân cư"
    ],
    processingTime: "02 - 03 ngày làm việc",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "45 KB",
    downloadCount: 580,
    templateContent: `ĐẢNG CỘNG SẢN VIỆT NAM
-----------------
PHIẾU NHẬN XÉT ĐẢNG VIÊN SINH HOẠT NƠI CƯ TRÚ
(Theo Quy định số 213-QĐ/TW ngày 02/01/2020 của Bộ Chính trị)

Kính gửi: Chi ủy Chi bộ Khu phố 3, Đảng bộ Phường An Phú

Họ và tên đảng viên: [...........................................................................]
Ngày sinh: [..../..../........]         Số thẻ đảng viên: [................................]
Đang sinh hoạt tại Chi bộ cơ quan: [................................................]
Địa chỉ nơi cư trú hiện nay: [Số ...... Lương Định Của, Khu phố 3, Phường An Phú]

Ý KIẾN NHẬN XÉT CỦA CHI ỦY KHU PHỐ 3:
1. Về chấp hành chủ trương của Đảng, chính sách, pháp luật của Nhà nước và quy định của khu dân cư:
[ ] Tốt              [ ] Khá             [ ] Trung bình
2. Về mối quan hệ với nhân dân và tham gia các cuộc họp, phong trào của Khu phố 3:
[ ] Tích cực         [ ] Đầy đủ          [ ] Chưa thường xuyên

T/M CHI ỦY KHU PHỐ 3
BÍ THƯ
(Ký, ghi rõ họ tên và đóng dấu)
`
  },
  {
    id: "FORM-011",
    code: "Mẫu NA17",
    title: "Phiếu khai báo tạm trú cho người nước ngoài (Bilingual)",
    category: "Cư trú & Hộ khẩu",
    issuingBody: "Bộ Công an & Cục QLXNC (Thông tư 53/2016/TT-BCA)",
    description: "Áp dụng cho người nước ngoài tạm trú tại nhà trọ, nhà cho thuê, khách sạn, căn hộ hoặc cơ sở lưu trú trên địa bàn Khu phố 3, Phường An Phú khai báo tạm trú với cơ quan Công an phường theo Luật 47/2014/QH13.",
    requiredDocuments: [
      "Bản chính Phiếu khai báo tạm trú Mẫu NA17 (điền đầy đủ tiếng Việt hoặc tiếng Anh)",
      "Bản chính Hộ chiếu hoặc giấy tờ có giá trị đi lại quốc tế còn thời hạn của người nước ngoài",
      "Thị thực (Visa) hoặc Thẻ tạm trú (TRC) hoặc Giấy miễn thị thực hợp lệ",
      "Hợp đồng thuê nhà, xác nhận của chủ cơ sở lưu trú hoặc văn bản bảo lãnh của cơ quan, doanh nghiệp"
    ],
    processingTime: "Ngay trong ngày làm việc (Hoặc trực tuyến tức thì qua Cổng DVC Bộ Công an)",
    fee: "Miễn phí",
    fileFormat: "DOCX / PDF",
    fileSize: "52 KB",
    downloadCount: 420,
    templateContent: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / SOCIALIST REPUBLIC OF VIETNAM
Độc lập - Tự do - Hạnh phúc / Independence - Freedom - Happiness
-----------------
Mẫu NA17 ban hành kèm theo Thông tư số 53/2016/TT-BCA ngày 28/12/2016 của Bộ Công an

PHIẾU KHAI BÁO TẠM TRÚ CHO NGƯỜI NƯỚC NGOÀI
TEMPORARY RESIDENCE DECLARATION FOR FOREIGNERS

Kính gửi (To): Công an Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh

1. Họ và tên / Full name (in capital letters): [...........................................................................]
2. Giới tính / Sex: [Nam / Nữ (Male / Female)]
3. Ngày, tháng, năm sinh / Date of birth: [..../..../........]
4. Quốc tịch / Nationality: [...........................................................................]
5. Hộ chiếu số / Passport number: [...........................................................................]
   Có giá trị đến ngày / Expiry date: [..../..../........]
   Cơ quan cấp / Issuing authority: [...........................................................................]
6. Nghề nghiệp / Occupation: [...........................................................................]
   Nơi làm việc hoặc cơ quan bảo lãnh / Sponsoring org: [....................................................]
   Số Giấy phép lao động (GPLĐ) / Work permit No.: [.........................................................]
7. Thị thực hoặc Thẻ cư trú / Visa or TRC:
   Loại / Type: [Thẻ tạm trú (TRC) / Visa LĐ / Visa ĐT / Miễn thị thực]
   Số hiệu / Number: [................................................]
   Có giá trị từ / Valid from: [..../..../........] đến / to: [..../..../........]
8. Địa chỉ cơ sở lưu trú tại Việt Nam / Temporary address in Vietnam:
   Số [......] đường Lương Định Của, Khu phố 3, Phường An Phú, TP. Hồ Chí Minh
9. Mã số khai báo tạm trú trực tuyến (Cổng DVC): [KBTT-AP-2024-ONLINE]
10. Chủ cơ sở lưu trú / Người bảo lãnh (Host / Landlord):
    Họ tên & SĐT liên hệ: [...........................................................................]

TP. Thủ Đức, ngày .... tháng .... năm 202...

NGƯỜI NƯỚC NGOÀI KHAI BÁO       CHỦ CƠ SỞ LƯU TRÚ       XÁC NHẬN CÔNG AN PHƯỜNG AN PHÚ
   (Ký, ghi rõ họ tên)         (Ký, ghi rõ họ tên)               (Ký, đóng dấu)
`
  }
];
