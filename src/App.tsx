import React, { useState, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { 
  initialResidents, 
  initialHouseholds, 
  initialBusinesses, 
  initialReports, 
  initialPartyMembers,
  initialWelfareRecipients,
  initialCommunityEvents,
  initialFundContributions,
  initialNewsList
} from "./mockData";
import { 
  Resident, 
  Household, 
  Business, 
  FieldReport, 
  PartyMember, 
  ActiveTab,
  WelfareRecipient,
  CommunityEvent,
  FundContribution,
  AdministrativeForm,
  TargetGisItem,
  LocalNews
} from "./types";
import { initialAdministrativeForms } from "./mockForms";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CitizenManagement from "./components/CitizenManagement";
import ResidentsPage from "./page/ResidentsPage";
import HouseholdManagement from "./components/HouseholdManagement";
import BusinessManagement from "./components/BusinessManagement";
import EnterpriseManagement from "./components/EnterpriseManagement";
import GisMap from "./components/GisMap";
import TaskAndSchedule from "./components/TaskAndSchedule";
import AiAssistant from "./components/AiAssistant";
import FieldReflections from "./components/FieldReflections";
import PartyBranch from "./components/PartyBranch";
import SocialWelfare from "./components/SocialWelfare";
import CommunityEvents from "./components/CommunityEvents";
import NeighborhoodFunds from "./components/NeighborhoodFunds";
import PlanArchitecture from "./components/PlanArchitecture";
import LoginAndRegister from "./components/LoginAndRegister";
import SettingsAndPermissions, { PendingRegistration } from "./components/SettingsAndPermissions";
import AdministrativeForms from "./components/AdministrativeForms";
import { inferRelationToOwner, extractBirthYear, autoExtractHostelBusinesses } from "./utils/householdRecognitionUtils";
import CitizenLandingPage from "./components/CitizenLandingPage";
import { 
  ROUTES, 
  navigate, 
  getDashboardExtensionPath, 
  getTabFromDashboardPath, 
  Link 
} from "./routes";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  Users,
  ShieldAlert,
  ChevronDown,
  Info,
  LockKeyhole
} from "lucide-react";

export const PUBLIC_CITIZEN_USER = {
  username: "cudan",
  fullName: "Cư dân Khu phố 3",
  role: "nguoidan" as const,
};

export const CANBO_USER = {
  username: "canbo",
  fullName: "Nguyễn Văn Hùng",
  role: "canbo" as const,
  phone: "0901234567"
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTab: string;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "Đã xảy ra lỗi khi tải phân hệ" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary caught an error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.fallbackTab !== this.props.fallbackTab && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Không thể tải phân hệ</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống phát hiện lỗi hiển thị tạm thời: {this.state.errorMessage}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: "" });
                this.props.onReset();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Tải lại phân hệ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    fullName: string;
    role: "canbo" | "nguoidan";
    cccd?: string;
    householdCode?: string;
    phone?: string;
  } | null>(PUBLIC_CITIZEN_USER);

  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([
    {
      id: "REG-001",
      fullName: "Trần Minh Tâm",
      gender: "Nam",
      birthDate: "14/05/1998",
      cccd: "079200114567",
      phone: "0934455667",
      status: "Thường trú",
      occupation: "Kỹ sư phần mềm",
      address: "42 Lương Định Của, Phường An Phú",
      householdId: "HK-301",
      relationToOwner: "Con",
      coordinates: "10°56'07.5\"N 106°44'38.0\"E",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    },
    {
      id: "REG-002",
      fullName: "Lê Thị Hồng Sâm",
      gender: "Nữ",
      birthDate: "20/11/1992",
      cccd: "079305128912",
      phone: "0886677889",
      status: "Tạm trú",
      occupation: "Nhân viên văn phòng",
      address: "Hẻm 30 Lương Định Của",
      householdId: "HK-302",
      relationToOwner: "Vợ",
      coordinates: "10°56'09.1\"N 106°44'36.5\"E",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
    }
  ]);

  const [residentPermissions, setResidentPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    forms: true,
    residents: false,
    households: false,
    enterprises: true,
    businesses: true,
    gis: true,
    tasks: true,
    ai: true,
    reports: true,
    party: true,
    welfare: true,
    cultural: true,
    finance: true,
    plan: true,
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [citizenSubView, setCitizenSubView] = useState<ActiveTab | null>(null);
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [households, setHouseholds] = useState<Household[]>(initialHouseholds);
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [reports, setReports] = useState<FieldReport[]>(initialReports);
  const [partyMembers] = useState<PartyMember[]>(initialPartyMembers);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Đồng bộ route từ URL pathname: /dashboard, /dashboard/("sidebar content"), /login
  useEffect(() => {
    const handleLocationSync = () => {
      const pathname = window.location.pathname;
      const tab = getTabFromDashboardPath(pathname);
      if (tab) {
        setCurrentUser(CANBO_USER);
        setActiveTab(tab as ActiveTab);
        setCitizenSubView(null);
      } else if (pathname === "/login") {
        setCurrentUser(null);
      }
    };

    handleLocationSync();
    window.addEventListener("popstate", handleLocationSync);
    window.addEventListener("app:navigate", handleLocationSync);
    return () => {
      window.removeEventListener("popstate", handleLocationSync);
      window.removeEventListener("app:navigate", handleLocationSync);
    };
  }, []);

  // Nạp toàn bộ Dữ liệu thật từ Supabase PostgreSQL (11.632 Cư dân & 488 Hộ)
  useEffect(() => {
    async function fetchSupabaseData() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        setIsDataLoading(true);

        // 1. Fetch Households thật
        let loadedHouseholds: Household[] = [];
        const { data: dbHouseholds, error: hErr } = await (supabase as any)
          .from("households")
          .select("*")
          .order("code", { ascending: true });

        if (!hErr && dbHouseholds && dbHouseholds.length > 0) {
          loadedHouseholds = dbHouseholds.map((h: any) => ({
            id: h.id,
            code: h.code,
            ownerName: h.owner_name,
            address: h.address,
            memberCount: h.member_count || 1,
            coordinates: h.coordinates || "10.7935, 106.7445",
            type: "Thường trú",
            members: []
          }));
          setHouseholds(loadedHouseholds);
        }

        // 2. Fetch Residents thật (Tải toàn bộ 11.632 cư dân qua phân trang Supabase)
        let allResidents: any[] = [];
        let fromIdx = 0;
        const batchSize = 1000;
        let keepFetching = true;

        while (keepFetching && fromIdx < 20000) {
          const { data: chunk, error: rErr } = await (supabase as any)
            .from("residents")
            .select("*")
            .order("created_at", { ascending: false })
            .range(fromIdx, fromIdx + batchSize - 1);

          if (rErr || !chunk || chunk.length === 0) {
            keepFetching = false;
          } else {
            allResidents = allResidents.concat(chunk);
            if (chunk.length < batchSize) {
              keepFetching = false;
            } else {
              fromIdx += batchSize;
            }
          }
        }

        let mappedResidents: Resident[] = [];
        if (allResidents.length > 0) {
          mappedResidents = allResidents.map((r: any) => ({
            id: r.id,
            fullName: r.full_name,
            gender: (r.gender as "Nam" | "Nữ") || "Nam",
            birthDate: r.birth_date ? r.birth_date.split("-").reverse().join("/") : "Chưa cập nhật",
            cccd: r.cccd,
            phone: r.phone || "",
            status: (r.status as "Thường trú" | "Tạm trú" | "Tạm vắng") || "Thường trú",
            occupation: r.occupation || "",
            address: r.address || r.current_address || r.permanent_address || "Khu phố 3, Phường An Phú, TP. Thủ Đức",
            permanentAddress: r.permanent_address || undefined,
            temporaryAddress: r.current_address || r.address || undefined,
            currentAddress: r.current_address || r.address || undefined,
            fatherName: r.father_name || undefined,
            motherName: r.mother_name || undefined,
            temporaryRegDate: r.temporary_reg_date || undefined,
            temporaryExpDate: r.temporary_exp_date || undefined,
            managementStatus: r.management_status || undefined,
            householdId: r.household_code || (r.status === "Tạm trú" ? "Tạm trú" : "Chưa cập nhật"),
            relationToOwner: r.relation_to_owner || "Thành viên",
            workplace: r.workplace || undefined,
            avatar: r.gender === "Nữ" 
              ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" 
              : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          }));
          setResidents(mappedResidents);

          // Tự động liên kết nhân khẩu & suy luận quan hệ gia phả vào từng Sổ Hộ Khẩu (Không cần bấm thủ công)
          if (loadedHouseholds.length > 0) {
            // Gom nhóm cư dân theo mã hộ khẩu
            const resByHousehold: { [code: string]: Resident[] } = {};
            mappedResidents.forEach(res => {
              const code = res.householdId?.trim();
              if (code && code !== "Chưa cập nhật" && code !== "Tạm trú" && code !== "N/A") {
                if (!resByHousehold[code]) resByHousehold[code] = [];
                resByHousehold[code].push(res);
              }
            });

            const enrichedHouseholds = loadedHouseholds.map(h => {
              const matchedResidents = resByHousehold[h.code] || [];
              if (matchedResidents.length === 0) return h;

              // Tìm chủ hộ trong nhóm
              let owner = matchedResidents.find(r => {
                const rel = (r.relationToOwner || "").trim().toLowerCase();
                return rel === "chủ hộ" || r.fullName.trim().toUpperCase() === h.ownerName.trim().toUpperCase();
              }) || matchedResidents[0];

              const membersList = matchedResidents.map(r => {
                const isOwner = r.cccd === owner.cccd || r.fullName.trim().toUpperCase() === h.ownerName.trim().toUpperCase();
                const inferredRel = isOwner ? "Chủ hộ" : inferRelationToOwner(r, owner, matchedResidents);
                return {
                  name: r.fullName,
                  relation: inferredRel,
                  cccd: r.cccd,
                  birthYear: extractBirthYear(r.birthDate),
                  phone: r.phone && r.phone !== "N/A" ? r.phone : undefined
                };
              });

              return {
                ...h,
                ownerName: owner ? owner.fullName : h.ownerName,
                memberCount: membersList.length,
                members: membersList
              };
            });

            setHouseholds(enrichedHouseholds);
          }
        }

        // 3. Fetch Businesses (Bao gồm Doanh nghiệp, Hộ kinh doanh & Cơ sở lưu trú, Nhà trọ)
        const { data: dbBusinesses } = await (supabase as any).from("businesses").select("*");
        if (dbBusinesses && dbBusinesses.length > 0) {
          const loadedBusinesses: Business[] = dbBusinesses.map((b: any) => {
            // Đối chiếu với initialBusinesses để kế thừa thông tin giàu chi tiết (hình ảnh, nhật ký kiểm tra, sổ đỏ...)
            const matchedMock = initialBusinesses.find(ib => 
              (ib.internalCode && ib.internalCode === b.internal_code) ||
              ib.name.trim().toLowerCase() === b.name.trim().toLowerCase() ||
              ib.id === b.id
            );

            return {
              ...(matchedMock || {}),
              id: matchedMock ? matchedMock.id : b.id,
              internalCode: b.internal_code || matchedMock?.internalCode,
              name: b.name,
              taxCode: b.tax_code || matchedMock?.taxCode || "",
              type: (b.business_type as any) || matchedMock?.type || "Hộ kinh doanh",
              businessType: (b.business_type as any) || matchedMock?.businessType || "Hộ kinh doanh",
              industryGroup: b.industry_group || matchedMock?.industryGroup || "Khác",
              owner: b.owner_name || matchedMock?.owner || "",
              phone: b.phone || matchedMock?.phone || "",
              address: b.address,
              licenseNumber: b.license_number || matchedMock?.licenseNumber || "",
              status: (b.status as any) || matchedMock?.status || "Đang hoạt động",
              safetyCertified: b.safety_certified ?? matchedMock?.safetyCertified ?? true,
              employeeCount: b.employee_count || matchedMock?.employeeCount || 1,
              coordinates: b.coordinates || matchedMock?.coordinates || "10.7935, 106.7445",
              isAccommodation: b.is_accommodation ?? matchedMock?.isAccommodation ?? false,
              soPhong: b.room_count || matchedMock?.soPhong || 0,
              soNguoiLuuTru: b.guest_count || matchedMock?.soNguoiLuuTru || 0,
              image: matchedMock?.image || b.image_url || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500"
            };
          });

          // Bổ sung các cơ sở trong initialBusinesses nếu chưa có trong DB
          const existingCodes = new Set(loadedBusinesses.map(b => b.internalCode || b.name));
          initialBusinesses.forEach(ib => {
            const key = ib.internalCode || ib.name;
            if (!existingCodes.has(key)) {
              loadedBusinesses.push(ib);
            }
          });

          // Tự động nhận diện & liên kết các cơ sở nhà trọ từ dữ liệu 11.632 cư dân (tương tự Nhà trọ Phạm Văn Bình)
          if (mappedResidents.length > 0) {
            const autoHostels = autoExtractHostelBusinesses(mappedResidents, loadedBusinesses);
            if (autoHostels.length > 0) {
              loadedBusinesses.push(...autoHostels);
            }
          }

          setBusinesses(loadedBusinesses);
        }

        // 4. Fetch Field Reports (1022)
        const { data: dbReports } = await (supabase as any).from("field_reports").select("*");
        if (dbReports && dbReports.length > 0) {
          setReports(dbReports.map((rep: any) => ({
            id: rep.id,
            title: rep.title,
            category: (rep.category as any) || "Trật tự đô thị",
            location: rep.location,
            description: rep.description,
            reporterName: rep.reporter_name || "Cư dân ẩn danh",
            reporterPhone: rep.reporter_phone || "",
            status: (rep.status as any) || "Đã tiếp nhận",
            priority: (rep.priority as any) || "Bình thường",
            createdAt: new Date(rep.created_at || Date.now()).toLocaleDateString("vi-VN"),
            images: rep.image_urls || []
          })));
        }

        // 5. Fetch Community News
        const { data: dbNews } = await (supabase as any)
          .from("community_news")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbNews && dbNews.length > 0) {
          setNewsList(dbNews.map((n: any) => ({
            id: n.id,
            title: n.title,
            category: n.category,
            content: n.content,
            author: n.author_name,
            date: new Date(n.created_at).toLocaleDateString("vi-VN"),
            isPinned: n.is_pinned ?? false
          })));
        }

        // 6. Fetch Neighborhood Funds
        const { data: dbFunds } = await (supabase as any)
          .from("neighborhood_funds")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbFunds && dbFunds.length > 0) {
          setFundContributions(dbFunds.map((f: any) => ({
            id: f.id,
            householdCode: f.household_code || "N/A",
            ownerName: f.payer_or_receiver || "Cư dân đóng góp",
            amount: Number(f.amount) || 0,
            fundName: f.fund_name,
            status: f.status === "Chưa nộp" ? "Chưa nộp" : "Đã nộp",
            paidAt: f.created_at ? new Date(f.created_at).toLocaleDateString("vi-VN") : undefined
          })));
        }
      } catch (e) {
        console.warn("Lỗi nạp dữ liệu từ Supabase:", e);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchSupabaseData();
  }, []);
  
  // New State variables for the 3 additional views
  const [welfareRecipients, setWelfareRecipients] = useState<WelfareRecipient[]>(initialWelfareRecipients);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(initialCommunityEvents);
  const [fundContributions, setFundContributions] = useState<FundContribution[]>(initialFundContributions);
  const [administrativeForms, setAdministrativeForms] = useState<AdministrativeForm[]>(initialAdministrativeForms);
  const [newsList, setNewsList] = useState<LocalNews[]>(() => {
    try {
      const saved = localStorage.getItem("kp3_local_news");
      return saved ? JSON.parse(saved) : initialNewsList;
    } catch {
      return initialNewsList;
    }
  });

  const handleAddNews = async (newNews: LocalNews) => {
    setNewsList(prev => [newNews, ...prev]);
    setNotifications(prev => [
      { id: Date.now(), text: `Đã công bố bản tin mới: ${newNews.title}`, unread: true },
      ...prev
    ]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await (supabase as any).from("community_news").insert({
          title: newNews.title,
          category: newNews.category,
          content: newNews.content,
          author_name: newNews.author,
          is_pinned: newNews.isPinned ?? false,
          is_urgent: newNews.category === "Thông báo khẩn"
        }).select().single();

        if (data && !error) {
          setNewsList(prev => prev.map(n => n.id === newNews.id ? { ...n, id: data.id } : n));
        }
      } catch (e) {
        console.warn("Supabase add news error:", e);
      }
    }
  };

  const handleUpdateNews = async (updatedNews: LocalNews) => {
    setNewsList(prev => prev.map(n => n.id === updatedNews.id ? updatedNews : n));
    setNotifications(prev => [
      { id: Date.now(), text: `Đã cập nhật bài viết: ${updatedNews.title}`, unread: true },
      ...prev
    ]);

    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from("community_news").update({
          title: updatedNews.title,
          category: updatedNews.category,
          content: updatedNews.content,
          author_name: updatedNews.author,
          is_pinned: updatedNews.isPinned ?? false
        }).eq("id", updatedNews.id);
      } catch (e) {
        console.warn("Supabase update news error:", e);
      }
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    setNewsList(prev => prev.filter(n => n.id !== newsId));

    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from("community_news").delete().eq("id", newsId);
      } catch (e) {
        console.warn("Supabase delete news error:", e);
      }
    }
  };

  // Target item for GIS Map navigation & sync
  const [targetGisItem, setTargetGisItem] = useState<TargetGisItem | null>(null);

  const handleNavigateToGis = (item: TargetGisItem) => {
    setTargetGisItem(item);
    setActiveTab("gis");
  };

  // Notifications State Mock
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Phản ánh mới hẻm 42 vừa được gửi", unread: true },
    { id: 2, text: "Yêu cầu duyệt GPKD Cửa hàng 247", unread: true }
  ]);

  // Form Management Handlers
  const handleAddForm = (newForm: AdministrativeForm) => {
    setAdministrativeForms(prev => [newForm, ...prev]);
    setNotifications(prev => [
      { id: Date.now(), text: `Cán bộ đã thêm biểu mẫu: ${newForm.code} - ${newForm.title}`, unread: true },
      ...prev
    ]);
  };

  const handleUpdateForm = (updatedForm: AdministrativeForm) => {
    setAdministrativeForms(prev => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
    setNotifications(prev => [
      { id: Date.now(), text: `Cán bộ đã cập nhật biểu mẫu: ${updatedForm.code}`, unread: true },
      ...prev
    ]);
  };

  const handleDeleteForm = (formId: string) => {
    const f = administrativeForms.find(form => form.id === formId);
    setAdministrativeForms(prev => prev.filter(form => form.id !== formId));
    if (f) {
      setNotifications(prev => [
        { id: Date.now(), text: `Cán bộ đã xóa biểu mẫu: ${f.code}`, unread: true },
        ...prev
      ]);
    }
  };

  // Handlers for State Management
  const handleAddResident = (newResident: Resident) => {
    setResidents([newResident, ...residents]);
    
    // Auto-update household members if matched
    const hhId = newResident.householdId;
    setHouseholds(households.map(hh => {
      if (hh.code === hhId) {
        return {
          ...hh,
          memberCount: hh.memberCount + 1,
          members: [...hh.members, {
            name: newResident.fullName,
            relation: newResident.relationToOwner,
            cccd: newResident.cccd,
            phone: newResident.phone,
            birthYear: parseInt(newResident.birthDate.split("/")[2]) || 1990
          }]
        };
      }
      return hh;
    }));
  };

  const handleDeleteResident = (id: string) => {
    const resToDelete = residents.find(r => r.id === id);
    setResidents(residents.filter(r => r.id !== id));

    if (resToDelete) {
      const hhId = resToDelete.householdId;
      setHouseholds(households.map(hh => {
        if (hh.code === hhId) {
          const updatedMembers = hh.members.filter(m => m.cccd !== resToDelete.cccd);
          return {
            ...hh,
            memberCount: updatedMembers.length,
            members: updatedMembers
          };
        }
        return hh;
      }));
    }
  };

  const handleAddHousehold = (newH: Household) => {
    setHouseholds([newH, ...households]);
    
    // Add owner to residents roster
    const ownerRes: Resident = {
      id: "R" + (residents.length + 1).toString().padStart(3, "0"),
      fullName: newH.ownerName,
      gender: "Nam",
      birthDate: "01/01/1975",
      cccd: newH.members[0]?.cccd || "N/A",
      phone: newH.members[0]?.phone || "N/A",
      status: (newH.type === "Tạm trú" ? "Tạm trú" : "Thường trú") as "Thường trú" | "Tạm trú",
      occupation: "Kinh doanh",
      address: newH.address,
      householdId: newH.code,
      relationToOwner: "Chủ hộ",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      joinDate: new Date().toLocaleDateString("vi-VN")
    };
    setResidents([ownerRes, ...residents]);
  };

  const handleToggleBusinessCertification = (id: string) => {
    setBusinesses(businesses.map(b => {
      if (b.id === id) {
        return { ...b, safetyCertified: !b.safetyCertified };
      }
      return b;
    }));
  };

  const handleUpdateBusinessStatus = (id: string, status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt" | "Chuyển địa điểm" | "Chưa xác minh") => {
    setBusinesses(businesses.map(b => {
      if (b.id === id) {
        return { ...b, status };
      }
      return b;
    }));
  };

  const handleAddReport = async (newReport: FieldReport) => {
    setReports(prev => [newReport, ...prev]);
    setNotifications(prev => [
      { id: Date.now(), text: `Phản ánh mới: "${newReport.title}"`, unread: true },
      ...prev
    ]);

    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from("field_reports").insert({
          title: newReport.title,
          category: newReport.category,
          location: newReport.location,
          description: newReport.description,
          reporter_name: newReport.reporterName,
          reporter_phone: newReport.reporterPhone,
          status: "Đã tiếp nhận",
          priority: "Bình thường",
          image_urls: newReport.beforeImage ? [newReport.beforeImage] : []
        });
      } catch (err) {
        console.warn("Supabase insert report error:", err);
      }
    }
  };

  const handleUpdateReportStatus = async (
    id: string, 
    status: "Đã tiếp nhận" | "Đang xử lý" | "Đã giải quyết", 
    actorName: string = "Cán bộ quản lý",
    actionDetail: string = "Cập nhật tiến độ xử lý phản ánh."
  ) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const timeStr = new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour12: false });
        const afterImg = status === "Đã giải quyết" 
          ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300" 
          : r.afterImage;

        return {
          ...r,
          status,
          afterImage: afterImg,
          timeline: [
            ...r.timeline,
            {
              time: timeStr,
              title: status === "Đang xử lý" ? "Xác minh & Đang giải quyết" : "Đã xử lý hoàn thành",
              description: actionDetail,
              actor: actorName
            }
          ]
        };
      }
      return r;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from("field_reports").update({
          status,
          resolved_at: status === "Đã giải quyết" ? new Date().toISOString() : null,
          response_content: actionDetail
        }).eq("id", id);
      } catch (err) {
        console.warn("Supabase update report error:", err);
      }
    }
  };

  const handleAddWelfareRecipient = (newRec: WelfareRecipient) => {
    setWelfareRecipients([newRec, ...welfareRecipients]);
  };

  const handleUpdateWelfareStatus = (id: string, status: WelfareRecipient["status"]) => {
    setWelfareRecipients(welfareRecipients.map(w => w.id === id ? { ...w, status } : w));
  };

  const handleDeleteWelfareRecipient = (id: string) => {
    setWelfareRecipients(welfareRecipients.filter(w => w.id !== id));
  };

  const handleAddCommunityEvent = (newEvent: CommunityEvent) => {
    setCommunityEvents([newEvent, ...communityEvents]);
  };

  const handleUpdateEventStatus = (id: string, status: CommunityEvent["status"]) => {
    setCommunityEvents(communityEvents.map(e => e.id === id ? { ...e, status } : e));
  };

  const handleAddFundContribution = async (newCont: FundContribution) => {
    setFundContributions(prev => [newCont, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).from("neighborhood_funds").insert({
          transaction_type: "thu",
          fund_name: newCont.fundName,
          household_code: newCont.householdCode,
          payer_or_receiver: newCont.ownerName,
          amount: newCont.amount,
          description: `Đóng góp ${newCont.fundName} hộ ${newCont.householdCode}`,
          evidence_code: `PT-${Date.now().toString().slice(-4)}`,
          status: newCont.status || "Đã nộp",
          approved_by: "Ban điều hành KP3"
        });
      } catch (err) {
        console.warn("Supabase insert fund error:", err);
      }
    }
  };

  const handleUpdateContributionStatus = (id: string, status: FundContribution["status"], paidAt?: string) => {
    setFundContributions(fundContributions.map(c => c.id === id ? { ...c, status, paidAt } : c));
  };

  const handleApproveRegistration = (reg: PendingRegistration) => {
    const newRes: Resident = {
      id: "R" + (residents.length + 1).toString().padStart(3, "0"),
      fullName: reg.fullName,
      gender: reg.gender,
      birthDate: reg.birthDate,
      cccd: reg.cccd,
      phone: reg.phone,
      status: reg.status as "Thường trú" | "Tạm trú",
      occupation: reg.occupation,
      address: reg.address,
      householdId: reg.householdId,
      relationToOwner: reg.relationToOwner,
      avatar: reg.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      joinDate: new Date().toLocaleDateString("vi-VN")
    };

    setResidents([newRes, ...residents]);

    setHouseholds(households.map(hh => {
      if (hh.code === reg.householdId) {
        return {
          ...hh,
          memberCount: hh.memberCount + 1,
          members: [...hh.members, {
            name: reg.fullName,
            relation: reg.relationToOwner,
            cccd: reg.cccd,
            phone: reg.phone,
            birthYear: parseInt(reg.birthDate.split("/")[2]) || 1995
          }]
        };
      }
      return hh;
    }));

    setPendingRegistrations(pendingRegistrations.filter(r => r.id !== reg.id));

    setNotifications([
      { id: Date.now(), text: `Đã duyệt nhập khẩu thành công cho ${reg.fullName} vào hộ ${reg.householdId}`, unread: true },
      ...notifications
    ]);
  };

  const handleRejectRegistration = (id: string) => {
    setPendingRegistrations(pendingRegistrations.filter(r => r.id !== id));
  };

  // Tab Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Bảng Điều Hành Tổng Quan";
      case "residents": return "Quản lý Nhân Khẩu & Dân cư";
      case "households": return "Hệ thống Quản lý Sổ Hộ khẩu";
      case "enterprises": return "Quản lý Doanh nghiệp Vừa & Nhỏ (DNNVV)";
      case "businesses": 
        if (typeof window !== "undefined") {
          if (window.location.pathname.includes("/addshow")) return "Đăng ký Cơ sở Kinh doanh Mới (/addshow)";
          if (/edit_buss?iness/i.test(window.location.pathname)) return "Chỉnh sửa Thông tin Cơ sở Kinh doanh";
        }
        return "Quản lý Cơ sở Kinh doanh KP3";
      case "gis": return "Bản đồ số không gian GIS";
      case "ai": return "Hỏi đáp tự động Trợ lý AI";
      case "reports": return "Tiếp nhận Phản ánh Hiện trường 1022";
      case "party": return "Công tác Đảng & Dân vận mặt trận";
      case "welfare": return "An sinh Xã hội & Trợ cấp";
      case "cultural": return "Tin tức & Sự kiện";
      case "finance": return "Quỹ Tự quản & Đóng góp Khu phố";
      case "plan": return "Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu";
      case "settings": return "Cấu hình Hệ thống & Duyệt hồ sơ";
      default: return "Hệ thống Quản lý";
    }
  };

  if (!currentUser) {
    return (
      <LoginAndRegister
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab("dashboard");
        }}
        onRegisterSubmit={(newReg) => {
          setPendingRegistrations([newReg, ...pendingRegistrations]);
        }}
        householdCodes={households.map(h => h.code)}
        onBackToLanding={() => {
          setCurrentUser(PUBLIC_CITIZEN_USER);
          setCitizenSubView(null);
          navigate(ROUTES.HOME);
        }}
      />
    );
  }

  // 1. CỔNG NGƯỜI DÂN (LANDING PAGE) LÀ TRANG CHỦ MẶC ĐỊNH
  if (currentUser.role === "nguoidan" && !citizenSubView) {
    return (
      <CitizenLandingPage
        residents={residents}
        households={households}
        businesses={businesses}
        reports={reports}
        forms={administrativeForms}
        events={communityEvents}
        news={newsList}
        onAddReport={handleAddReport}
        onOpenStaffLogin={() => {
          setCurrentUser(CANBO_USER);
          setActiveTab("dashboard");
          setCitizenSubView(null);
          navigate(ROUTES.DASHBOARD);
        }}
        onSwitchToCanBo={() => {
          setCurrentUser(CANBO_USER);
          setActiveTab("dashboard");
          setCitizenSubView(null);
          navigate(ROUTES.DASHBOARD);
        }}
        onNavigateToTab={(tab) => {
          setCitizenSubView(tab);
          setActiveTab(tab);
        }}
      />
    );
  }

  // 2. KHI CƯ DÂN ĐANG XEM TIỆN ÍCH CHI TIẾT (GIS, AI, QUỸ, BIỂU MẪU...)
  if (currentUser.role === "nguoidan" && citizenSubView) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Citizen Subview Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCitizenSubView(null);
                setActiveTab("dashboard");
                navigate(ROUTES.HOME);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Quay lại Cổng Thông Tin Cư Dân"
            >
              <span>← Trang Chủ Cổng Cư Dân</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-[#073B72] truncate max-w-[200px] sm:max-w-md">
                {getTabTitle()}
              </h2>
              <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
                • KP3, An Phú
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentUser(CANBO_USER);
                setActiveTab("dashboard");
                setCitizenSubView(null);
                navigate(ROUTES.DASHBOARD);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#073B72] hover:bg-[#005BAC] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Vào Cổng dành cho cán bộ quản lý"
            >
              <LockKeyhole size={13} className="text-blue-300" />
              <span>Cổng cán bộ</span>
            </button>
          </div>
        </header>

        {/* Subview Content */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto min-w-0">
          <AppErrorBoundary fallbackTab={citizenSubView} onReset={() => setActiveTab(citizenSubView)}>
            {citizenSubView === "gis" && (
              <GisMap 
                households={households}
                onUpdateHouseholds={setHouseholds}
                residents={residents}
                onUpdateResidents={setResidents}
                businesses={businesses}
                onUpdateBusinesses={setBusinesses}
                targetGisItem={targetGisItem}
                onClearTargetGisItem={() => setTargetGisItem(null)}
              />
            )}
            {citizenSubView === "ai" && (
              <AiAssistant />
            )}
            {citizenSubView === "finance" && (
              <NeighborhoodFunds 
                contributions={fundContributions}
                onAddContribution={handleAddFundContribution}
                onUpdateContributionStatus={handleUpdateContributionStatus}
                households={households}
              />
            )}
            {citizenSubView === "forms" && (
              <AdministrativeForms 
                forms={administrativeForms}
                onAddForm={handleAddForm}
                onUpdateForm={handleUpdateForm}
                onDeleteForm={handleDeleteForm}
                currentUser={currentUser} 
              />
            )}
            {citizenSubView === "reports" && (
              <FieldReflections 
                reports={reports} 
                onAddReport={handleAddReport} 
                onUpdateReportStatus={handleUpdateReportStatus} 
                onUpdateReports={setReports}
                currentUser={currentUser}
              />
            )}
            {citizenSubView === "party" && (
              <PartyBranch 
                partyMembers={partyMembers} 
                residents={residents}
              />
            )}
            {citizenSubView === "welfare" && (
              <SocialWelfare 
                recipients={welfareRecipients}
                onUpdateStatus={handleUpdateWelfareStatus}
                onAddRecipient={handleAddWelfareRecipient}
                onDeleteRecipient={handleDeleteWelfareRecipient}
                residents={residents}
              />
            )}
            {citizenSubView === "cultural" && (
              <CommunityEvents 
                events={communityEvents}
                onAddEvent={handleAddCommunityEvent}
                onUpdateEventStatus={handleUpdateEventStatus}
                newsList={newsList}
                onAddNews={handleAddNews}
                onUpdateNews={handleUpdateNews}
                onDeleteNews={handleDeleteNews}
              />
            )}
            {citizenSubView === "plan" && (
              <PlanArchitecture />
            )}
          </AppErrorBoundary>
        </main>
      </div>
    );
  }

  // 3. CỔNG CÁN BỘ QUẢN LÝ (KHU VỰC NGHIỆP VỤ RIÊNG)
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          navigate(getDashboardExtensionPath(tab));
        }} 
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(PUBLIC_CITIZEN_USER);
          setActiveTab("dashboard");
          navigate(ROUTES.HOME);
        }}
        onSwitchRole={() => {
          if (currentUser.role === "nguoidan") {
            setCurrentUser(CANBO_USER);
            navigate(ROUTES.DASHBOARD);
          } else {
            setCurrentUser(PUBLIC_CITIZEN_USER);
            navigate(ROUTES.HOME);
          }
          setActiveTab("dashboard");
        }}
        residentPermissions={residentPermissions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 min-w-0 transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 shrink-0 shadow-2xs transition-all">
          <div className="flex items-center gap-2 sm:gap-3 pl-12 md:pl-0 flex-1 min-w-0 mr-2 sm:mr-4">
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base lg:text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px] sm:max-w-md lg:max-w-xl">
              {currentUser.role === "nguoidan" && activeTab === "dashboard" ? "Cổng Dịch Vụ Cư Dân Số" : getTabTitle()}
            </h2>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              KP3 • P. An Phú • TP. Thủ Đức
            </span>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Info button for Plan & Database design */}
            <Link
              to={getDashboardExtensionPath("plan")}
              id="header-info-plan"
              onClick={() => {
                setActiveTab("plan");
                navigate(getDashboardExtensionPath("plan"));
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer relative group ${
                activeTab === "plan" 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu (/dashboard/plan)"
            >
              <Info size={18} className="sm:w-5 sm:h-5" />
              {/* Tooltip */}
              <span className="absolute top-10 right-0 bg-slate-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu (/dashboard/plan)
              </span>
            </Link>

            {/* Notifications panel toggle button */}
            <div className="relative group">
              <button 
                id="header-notifications"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
              >
                <Bell size={18} className="sm:w-5 sm:h-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown on hover */}
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-3 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
                  <span className="font-bold text-xs text-slate-700">Thông báo mới nhận</span>
                  <button 
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="py-1 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${n.unread ? "bg-rose-500" : "bg-slate-300"}`}></span>
                      <span>{n.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Indicator & Quick Switch */}
            {currentUser.role === "nguoidan" ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Cổng Cư dân</span>
                </div>
                <button
                  id="header-login-canbo"
                  onClick={() => {
                    setCurrentUser(CANBO_USER);
                    setActiveTab("dashboard");
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  title="Chuyển sang Bàn làm việc Cán bộ quản lý"
                >
                  <span className="hidden sm:inline">Đăng nhập </span><span>Cán bộ</span>
                </button>
                <button
                  id="header-open-auth"
                  onClick={() => setCurrentUser(null)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
                  title="Đăng nhập tài khoản cá nhân / Đăng ký nhân khẩu mới"
                >
                  <span>Tài khoản</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>Cán bộ</span>
                </div>
                <button
                  id="header-back-cudan"
                  onClick={() => {
                    setCurrentUser(PUBLIC_CITIZEN_USER);
                    setCitizenSubView(null);
                    setActiveTab("dashboard");
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  title="Quay lại Cổng Cư dân số (Trang chủ Landing Page)"
                >
                  <span className="hidden sm:inline">Về Cổng </span><span>Cư dân</span>
                </button>
                <button
                  id="header-logout-auth"
                  onClick={() => setCurrentUser(null)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
                  title="Mở màn hình đăng nhập tài khoản / đăng ký nhân khẩu mới"
                >
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            {/* User identity display */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              {currentUser.role === "canbo" ? (
                <>
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 block">{currentUser.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Bí thư Chi bộ KP3</span>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                </>
              ) : (
                <>
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 block">Cư dân Khu phố 3</span>
                    <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider block">Cổng mở toàn dân</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    <Users size={16} />
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic view routing based on tab state */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto min-w-0">
          <AppErrorBoundary fallbackTab={activeTab} onReset={() => setActiveTab(activeTab)}>
          {activeTab === "dashboard" && (
            <Dashboard 
              residents={residents} 
              households={households} 
              businesses={businesses} 
              reports={reports} 
              forms={administrativeForms}
              setActiveTab={setActiveTab} 
              currentUser={currentUser}
            />
          )}

          {activeTab === "residents" && (
            <ResidentsPage
              residents={residents}
              households={households}
              currentUser={currentUser}
              residentPermissions={residentPermissions}
              onAddResident={handleAddResident}
              onDeleteResident={handleDeleteResident}
              onUpdateResidents={setResidents}
              onUpdateHouseholds={setHouseholds}
              onNavigateToGis={handleNavigateToGis}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "households" && (
            currentUser?.role === "nguoidan" && !residentPermissions.households ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Không có quyền tra cứu Sổ Hộ Khẩu</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Theo quy định bảo vệ thông tin cá nhân và an ninh dữ liệu, vai trò Cư dân không được phép tra cứu Sổ hộ khẩu điện tử & thông tin nhân khẩu của các hộ gia đình. Chức năng này chỉ dành riêng cho Cán bộ Quản lý.
                </p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Quay về Cổng cư dân
                </button>
              </div>
            ) : (
              <HouseholdManagement 
                households={households} 
                onAddHousehold={handleAddHousehold} 
                residents={residents}
                onUpdateHouseholds={setHouseholds}
                onUpdateResidents={setResidents}
                onNavigateToGis={handleNavigateToGis}
              />
            )
          )}

          {activeTab === "enterprises" && (
            <EnterpriseManagement 
              businesses={businesses} 
              residents={residents}
              households={households}
              onToggleCertification={handleToggleBusinessCertification} 
              onUpdateStatus={handleUpdateBusinessStatus} 
              onUpdateBusinesses={setBusinesses}
              onNavigateToGis={handleNavigateToGis}
            />
          )}

          {activeTab === "businesses" && (
            <BusinessManagement 
              businesses={businesses} 
              residents={residents}
              households={households}
              onToggleCertification={handleToggleBusinessCertification} 
              onUpdateStatus={handleUpdateBusinessStatus} 
              onUpdateBusinesses={setBusinesses}
              onNavigateToGis={handleNavigateToGis}
            />
          )}

          {activeTab === "gis" && (
            <GisMap 
              households={households}
              onUpdateHouseholds={setHouseholds}
              residents={residents}
              onUpdateResidents={setResidents}
              businesses={businesses}
              onUpdateBusinesses={setBusinesses}
              targetGisItem={targetGisItem}
              onClearTargetGisItem={() => setTargetGisItem(null)}
            />
          )}

          {activeTab === "tasks" && (
            <TaskAndSchedule />
          )}

          {activeTab === "ai" && (
            <AiAssistant />
          )}

          {activeTab === "reports" && (
            <FieldReflections 
              reports={reports} 
              onAddReport={handleAddReport} 
              onUpdateReportStatus={handleUpdateReportStatus} 
              onUpdateReports={setReports}
              currentUser={currentUser}
            />
          )}

          {activeTab === "forms" && (
            currentUser?.role === "canbo" ? (
              <SettingsAndPermissions
                defaultSubTab="forms"
                pendingRegistrations={pendingRegistrations}
                onApproveRegistration={handleApproveRegistration}
                onRejectRegistration={handleRejectRegistration}
                residentPermissions={residentPermissions}
                onTogglePermission={(key) => {
                  setResidentPermissions(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }));
                }}
                forms={administrativeForms}
                onAddForm={handleAddForm}
                onUpdateForm={handleUpdateForm}
                onDeleteForm={handleDeleteForm}
                newsList={newsList}
                onAddNews={handleAddNews}
                onUpdateNews={handleUpdateNews}
                onDeleteNews={handleDeleteNews}
                currentUser={currentUser}
              />
            ) : (
              <AdministrativeForms 
                forms={administrativeForms}
                onAddForm={handleAddForm}
                onUpdateForm={handleUpdateForm}
                onDeleteForm={handleDeleteForm}
                currentUser={currentUser} 
              />
            )
          )}

          {activeTab === "party" && (
            <PartyBranch 
              partyMembers={partyMembers} 
              residents={residents}
            />
          )}

          {activeTab === "welfare" && (
            <SocialWelfare 
              recipients={welfareRecipients}
              onUpdateStatus={handleUpdateWelfareStatus}
              onAddRecipient={handleAddWelfareRecipient}
              onDeleteRecipient={handleDeleteWelfareRecipient}
              residents={residents}
            />
          )}

          {activeTab === "cultural" && (
            <CommunityEvents 
              events={communityEvents}
              onAddEvent={handleAddCommunityEvent}
              onUpdateEventStatus={handleUpdateEventStatus}
              newsList={newsList}
              onAddNews={handleAddNews}
              onUpdateNews={handleUpdateNews}
              onDeleteNews={handleDeleteNews}
            />
          )}

          {activeTab === "finance" && (
            <NeighborhoodFunds 
              contributions={fundContributions}
              onAddContribution={handleAddFundContribution}
              onUpdateContributionStatus={handleUpdateContributionStatus}
              households={households}
            />
          )}

          {activeTab === "plan" && (
            <PlanArchitecture />
          )}

          {activeTab === "settings" && (
            <SettingsAndPermissions
              defaultSubTab="news"
              pendingRegistrations={pendingRegistrations}
              onApproveRegistration={handleApproveRegistration}
              onRejectRegistration={handleRejectRegistration}
              residentPermissions={residentPermissions}
              onTogglePermission={(key) => {
                setResidentPermissions(prev => ({
                  ...prev,
                  [key]: !prev[key]
                }));
              }}
              forms={administrativeForms}
              onAddForm={handleAddForm}
              onUpdateForm={handleUpdateForm}
              onDeleteForm={handleDeleteForm}
              newsList={newsList}
              onAddNews={handleAddNews}
              onUpdateNews={handleUpdateNews}
              onDeleteNews={handleDeleteNews}
              currentUser={currentUser}
            />
          )}
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}
