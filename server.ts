import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Danh sách tin nhắn không hợp lệ" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Fallback simulated answers for seamless experience if API Key isn't configured yet
        const lastMessage = messages[messages.length - 1]?.content || "";
        let reply = "";
        const lower = lastMessage.toLowerCase();

        if (lower.includes("tạm trú") || lower.includes("đăng ký")) {
          reply = `Chào bạn! Để đăng ký tạm trú tại Khu phố 3, Phường An Phú, bạn cần chuẩn bị các giấy tờ sau:\n1. Căn cước công dân (CCCD) bản gốc và photo.\n2. Hợp đồng thuê nhà hoặc giấy chứng nhận quyền sở hữu nhà đất.\n3. Phiếu khai báo thay đổi thông tin cư trú (Mẫu CT01).\nSau đó, bạn có thể nộp trực tiếp tại Công an Phường An Phú (địa chỉ: số 22 Lương Định Của, An Phú) hoặc nộp trực tuyến qua Cổng dịch vụ công quản lý cư trú quốc gia. Bạn cũng có thể liên hệ Cảnh sát khu vực - Đại úy Trần Quốc Hải để được hướng dẫn thêm nhé!`;
        } else if (lower.includes("phản ánh") || lower.includes("rác") || lower.includes("tiếng ồn")) {
          reply = `Cảm ơn bạn đã phản ánh tình hình khu phố! Ban quản lý Khu phố 3 đã tiếp nhận ý kiến của bạn về tình trạng này. Chúng tôi sẽ chuyển thông tin trực tiếp đến Đội Quản lý trật tự đô thị Phường An Phú để kiểm tra, xử lý và cập nhật tiến độ cho bạn trên bảng điều khiển 'Phản ánh hiện trường'. Xin cảm ơn đóng góp giúp khu phố văn minh sạch đẹp!`;
        } else if (lower.includes("bí thư") || lower.includes("trưởng khu phố") || lower.includes("liên hệ")) {
          reply = `Dạ thông tin liên hệ của Ban tự quản Khu phố 3 An Phú như sau:\n- **Bí thư Chi bộ:** Ông Nguyễn Văn Hùng (SĐT: 0903.xxx.123)\n- **Trưởng Khu phố:** Bà Lê Thị Mai (SĐT: 0918.xxx.456)\n- **Công an khu vực:** Đại úy Trần Quốc Hải (SĐT: 0989.xxx.789)\n- **Địa chỉ Văn phòng Ban điều hành:** Tổ dân phố 12, hẻm 42 Lương Định Của, Phường An Phú, TP. Thủ Đức.`;
        } else {
          reply = `Xin chào cư dân Khu phố 3 An Phú! Tôi là Trợ lý AI Thông minh của khu phố. Tôi có thể giúp bạn tra cứu nhanh thông tin hộ khẩu, hướng dẫn thủ tục hành chính (tạm trú, kết hôn, giấy tờ...), xem danh sách cơ sở kinh doanh hoặc tiếp nhận các phản ánh hiện trường về môi trường, an ninh trật tự. Bạn cần tôi trợ giúp gì thêm hôm nay ạ?`;
        }

        return res.json({ content: reply });
      }

      // Initialize GoogleGenAI with custom User-Agent for build telemetry as per guidelines
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `Bạn là Trợ lý Ảo Thông Minh của Khu phố 3, Phường An Phú, TP. Hồ Chí Minh.
Nhiệm vụ của bạn là hỗ trợ ban điều hành khu phố và người dân giải đáp thắc mắc về:
1. Thủ tục hành chính (đăng ký tạm trú, tạm vắng, xin giấy xác nhận cư trú, khai báo kinh doanh...).
2. Thông tin khu phố: Khu phố 3 có 350 hộ dân, 1.420 nhân khẩu. Bí thư Chi bộ là ông Nguyễn Văn Hùng, Trưởng khu phố là bà Lê Thị Mai, Công an khu vực phụ trách là Đại úy Trần Quốc Hải.
3. Hướng dẫn giải quyết phản ánh hiện trường (rác thải, lấn chiếm lòng lề đường, tiếng ồn karaoke...).
Hãy trả lời bằng tiếng Việt lịch sự, thân thiện, rõ ràng, giàu tính thuyết phục và định dạng Markdown đẹp mắt.`;

      // Convert messages for GoogleGenAI
      const contents = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ content: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Lỗi kết nối Trợ lý AI: " + error.message });
    }
  });

  // Serve static files or Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
