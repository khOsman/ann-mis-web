import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  UserCircle,
  Users,
  List,
  GraduationCap,
  Rocket,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import annLogo from "../assets/ann-logo.png";
import { BRAND } from "../constants/brand";
import { ROUTES } from "../constants/routes";
import {
  CHAMPION_ROLES,
  CHAMPION_ROLE_LABELS,
  getChampionRoles,
} from "../constants/champions";
import ImpersonationBanner from "../components/common/ImpersonationBanner";

// A champion can hold more than one role at once, so every applicable
// section is unioned in rather than picking just the first match.
function buildMenuItems(roles) {
  const items = [
    { label: "Dashboard", path: ROUTES.championHome, icon: LayoutDashboard },
    { label: "Profile", path: ROUTES.championMyProfile, icon: UserCircle },
  ];

  if (roles.includes(CHAMPION_ROLES.SELECTION_COMMITTEE)) {
    items.push({
      label: "FGDs",
      icon: Users,
      children: [
        { label: "FGD Rosters", path: ROUTES.championFGDRosters, icon: List },
        { label: "Assigned FGDs", path: ROUTES.championFGDs, icon: List },
      ],
    });
  }

  if (
    roles.includes(CHAMPION_ROLES.FACILITATOR) ||
    roles.includes(CHAMPION_ROLES.CO_FACILITATOR)
  ) {
    items.push({
      label: "Classroom",
      path: ROUTES.championClassroom,
      icon: GraduationCap,
    });
  }

  if (roles.includes(CHAMPION_ROLES.MENTOR)) {
    items.push({ label: "Projects", path: ROUTES.championProjects, icon: Rocket });
  }

  items.push({ label: "Reports", path: null, icon: BarChart3, disabled: true });

  return items;
}

export default function ChampionLayout({ children, title, subtitle }) {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const championRoles = useMemo(() => getChampionRoles(appUser), [appUser]);
  const menuItems = useMemo(() => buildMenuItems(championRoles), [championRoles]);
  const roleLabel =
    championRoles.length > 0
      ? championRoles.map((r) => CHAMPION_ROLE_LABELS[r] || r).join(", ")
      : "Champion";

  const isActive = (item) => item.path && location.pathname === item.path;

  const handleNavigate = (item) => {
    if (item.disabled || !item.path) return;
    navigate(item.path);
    setMobileSidebarOpen(false);
  };

  const renderChildItems = (children) =>
    children.map((child) => {
      const childActive = isActive(child);

      return (
        <button
          key={child.label}
          type="button"
          onClick={() => handleNavigate(child)}
          className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2 text-xs font-medium transition ${
            childActive
              ? "bg-white text-[var(--ann-purple)]"
              : "text-purple-100 hover:bg-white/10 cursor-pointer"
          }`}
        >
          {child.label}
        </button>
      );
    });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderMenuItems = () =>
    menuItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.label}>
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => handleNavigate(item)}
            className={`w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 text-sm font-medium transition ${
              item.disabled
                ? "text-purple-200/50 cursor-not-allowed"
                : active
                ? "bg-[var(--ann-pink)] text-white shadow-lg cursor-pointer"
                : hasChildren
                ? "text-purple-100 cursor-default"
                : "text-purple-100 hover:bg-white/10 cursor-pointer"
            }`}
          >
            {Icon && <Icon size={18} />}
            {sidebarOpen && (
              <span className="flex items-center gap-2">
                {item.label}
                {item.disabled && (
                  <span className="text-[10px] uppercase tracking-wide bg-white/10 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </span>
            )}
          </button>

          {sidebarOpen && hasChildren && (
            <div className="ml-4 mt-2 space-y-1 border-l border-white/20 pl-3">
              {renderChildItems(item.children)}
            </div>
          )}
        </div>
      );
    });

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8">
        <img
          src={annLogo}
          alt={BRAND.fullName}
          className="w-14 h-14 object-contain rounded-2xl"
        />

        {sidebarOpen && (
          <div>
            <h1 className="text-lg xl:text-xl text-[var(--ann-pink)] font-extrabold leading-tight">
              {BRAND.appName} <span className="text-white">{BRAND.mis}</span>
            </h1>
            <p className="text-xs text-pink-200">{BRAND.tagline}</p>
          </div>
        )}
      </div>

      <nav className="space-y-2">{renderMenuItems()}</nav>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex flex-col">
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
      <aside
        className={`hidden lg:flex bg-[var(--ann-purple)] text-white px-5 py-6 flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:w-56 xl:w-60" : "lg:w-20"
        }`}
      >
        <SidebarContent />
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <aside className="relative w-72 h-full bg-[var(--ann-purple)] text-white px-5 py-6 flex flex-col">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X size={22} />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="h-auto lg:h-20 bg-white border-b border-gray-200 px-4 sm:px-6 xl:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden border border-gray-300 rounded-xl p-2 text-gray-700"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="hidden lg:block border border-gray-300 rounded-xl p-2 text-gray-700 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ann-text-dark)]">
                {title || "Champion"}
              </h2>
              <p className="text-sm text-gray-500">
                {subtitle || `${appUser?.champion_code || ""} • ${roleLabel}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
          >
            Logout
          </button>
        </header>

        {children}
      </main>
      </div>
    </div>
  );
}
