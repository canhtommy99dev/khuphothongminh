import React, { useEffect, useState } from "react";

/**
 * Định nghĩa các hằng số Route tập trung của toàn bộ ứng dụng.
 * Hỗ trợ mở rộng link: /dashboard/("sidebar content") cho toàn bộ phân hệ cán bộ.
 */
export const ROUTES = {
  HOME: "/",
  REFLECTION: "/reflection",
  FORMS: "/forms",
  NOTICES: "/notices",
  NEWS: "/news",
  LEADERSHIP: "/leadership",
  SCHEDULE: "/schedule",

  // Cổng cán bộ / Quản trị
  CANBO: "/dashboard",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",

  // Mở rộng link theo cú pháp: /dashboard/("sidebar content")
  DASHBOARD_RESIDENTS: "/dashboard/residents",
  DASHBOARD_HOUSEHOLDS: "/dashboard/households",
  DASHBOARD_ENTERPRISES: "/dashboard/enterprises",
  DASHBOARD_BUSINESSES: "/dashboard/businesses",
  DASHBOARD_GIS: "/dashboard/gis",
  DASHBOARD_TASKS: "/dashboard/tasks",
  DASHBOARD_AI: "/dashboard/ai",
  DASHBOARD_REPORTS: "/dashboard/reports",
  DASHBOARD_PARTY: "/dashboard/party",
  DASHBOARD_WELFARE: "/dashboard/welfare",
  DASHBOARD_CULTURAL: "/dashboard/cultural",
  DASHBOARD_FINANCE: "/dashboard/finance",
  DASHBOARD_PLAN: "/dashboard/plan",
  DASHBOARD_SETTINGS: "/dashboard/settings",
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export type LandingRoute =
  | "all"
  | "reflection"
  | "forms"
  | "notices"
  | "news"
  | "leadership"
  | "schedule";

export interface RouteConfig {
  id: LandingRoute;
  label: string;
  path: string;
  description: string;
}

/**
 * Danh sách cấu hình các Route trên Cổng Cư Dân
 */
export const APP_ROUTES: RouteConfig[] = [
  {
    id: "reflection",
    label: "Phản ánh",
    path: ROUTES.REFLECTION,
    description: "Gửi phản ánh hiện trường & tra cứu hồ sơ"
  },
  {
    id: "forms",
    label: "Biểu mẫu",
    path: ROUTES.FORMS,
    description: "Kho biểu mẫu hành chính tải về"
  },
  {
    id: "notices",
    label: "Thông báo",
    path: ROUTES.NOTICES,
    description: "Thông báo chính thức & khẩn từ Ban Điều Hành"
  },
  {
    id: "news",
    label: "Tin tức",
    path: ROUTES.NEWS,
    description: "Bản tin đời sống, phong trào thi đua KP3"
  },
  {
    id: "leadership",
    label: "Cán bộ",
    path: ROUTES.LEADERSHIP,
    description: "Cơ cấu thường trực Chi bộ, BĐH, CSKV"
  },
  {
    id: "schedule",
    label: "Lịch hoạt động",
    path: ROUTES.SCHEDULE,
    description: "Lịch sinh hoạt cộng đồng & tiếp dân"
  }
];

/**
 * Tạo đường dẫn mở rộng cho Cổng Cán bộ: /dashboard/("sidebar content")
 */
export function getDashboardExtensionPath(sidebarContentId: string): string {
  if (!sidebarContentId || sidebarContentId === "dashboard") {
    return ROUTES.DASHBOARD;
  }
  return `/dashboard/${sidebarContentId}`;
}

/**
 * Phân tích URL pathname để trích xuất tab Cán bộ tương ứng từ /dashboard/(sidebar content)
 */
export function getTabFromDashboardPath(pathname: string): string | null {
  if (!pathname) return null;
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  
  if (clean === "dashboard" || clean === "canbo") {
    return "dashboard";
  }

  if (clean.startsWith("dashboard/")) {
    const sub = clean.replace(/^dashboard\//, "").split("/")[0];
    return sub || "dashboard";
  }

  // Hỗ trợ tương thích ngược nếu người dùng gõ trực tiếp /residents hoặc /gis
  const validTabs = [
    "dashboard",
    "residents",
    "households",
    "enterprises",
    "businesses",
    "gis",
    "tasks",
    "ai",
    "reports",
    "party",
    "welfare",
    "cultural",
    "finance",
    "plan",
    "settings"
  ];

  if (validTabs.includes(clean)) {
    return clean;
  }

  return null;
}

/**
 * Phân giải Route ID (LandingRoute) từ URL pathname thực tế
 */
export function getRouteFromPath(pathname: string): LandingRoute {
  if (!pathname) return "all";
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/" || clean === "") return "all";

  const matched = APP_ROUTES.find(
    r => r.path === clean || clean === r.path || clean.startsWith(`${r.path}/`)
  );
  return matched ? matched.id : "all";
}

/**
 * Lấy URL pathname thực tế từ Route ID
 */
export function getPathFromRoute(id: LandingRoute | string): string {
  if (id === "all" || id === "") return ROUTES.HOME;
  const matched = APP_ROUTES.find(r => r.id === id);
  return matched ? matched.path : (id.startsWith("/") ? id : `/${id}`);
}

const NAVIGATE_EVENT = "app:navigate";

/**
 * Điều hướng SPA bằng HTML5 History API (pushState / replaceState),
 * loại bỏ hoàn toàn hash (#) và phát sự kiện đồng bộ toàn ứng dụng.
 */
export function navigate(
  to: string,
  options?: { replace?: boolean; scrollToTop?: boolean }
) {
  if (typeof window === "undefined") return;

  const targetPath = to.startsWith("/") ? to : `/${to}`;

  // Tránh pushState trùng URL hiện tại
  if (window.location.pathname !== targetPath) {
    if (options?.replace) {
      window.history.replaceState({}, "", targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
    }
  }

  // Xóa hash dư thừa nếu có
  if (window.location.hash) {
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
  }

  if (options?.scrollToTop !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.dispatchEvent(
    new CustomEvent(NAVIGATE_EVENT, { detail: { path: targetPath } })
  );
}

/**
 * Hook trả về pathname hiện tại của trình duyệt và lắng nghe popstate + navigate
 */
export function useCurrentPath(): string {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname || "/";
  });

  useEffect(() => {
    const handleUpdate = () => {
      setPathname(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handleUpdate);
    window.addEventListener(NAVIGATE_EVENT, handleUpdate);

    return () => {
      window.removeEventListener("popstate", handleUpdate);
      window.removeEventListener(NAVIGATE_EVENT, handleUpdate);
    };
  }, []);

  return pathname;
}

/**
 * Hook trả về thông tin Route hiện tại và hàm điều hướng
 */
export function useCurrentRoute() {
  const pathname = useCurrentPath();
  const route = getRouteFromPath(pathname);
  return {
    route,
    pathname,
    navigate
  };
}

/**
 * Component Link chuẩn SEO & Accessibility, điều hướng Client-side mượt mà,
 * không load lại trang, không dùng hash (#).
 */
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace = false, onClick, className = "", children, ...rest }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Cho phép mở tab mới / cửa sổ mới với các phím bổ trợ thông thường
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      e.preventDefault();
      onClick?.(e);
      navigate(to, { replace });
    };

    return (
      <a
        ref={ref}
        href={to}
        onClick={handleClick}
        className={className}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
Link.displayName = "Link";

/**
 * Component NavLink hỗ trợ tự động kích hoạt activeClassName khi đang ở route tương ứng
 */
export interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  exact?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    {
      to,
      activeClassName = "",
      className = "",
      exact = true,
      children,
      ...rest
    },
    ref
  ) => {
    const currentPath = useCurrentPath();
    const isActive = exact ? currentPath === to : currentPath.startsWith(to);
    const resolvedClass = `${className} ${isActive ? activeClassName : ""}`.trim();

    return (
      <Link ref={ref} to={to} className={resolvedClass} {...rest}>
        {children}
      </Link>
    );
  }
);
NavLink.displayName = "NavLink";
