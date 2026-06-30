import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import annLogo from "../assets/ann-logo.png";
import { ADMIN_MENU_ITEMS } from "../constants/menuItems";
import { BRAND } from "../constants/brand";

export default function AdminLayout({ children, title, subtitle }) {
  const { appUser, logout, isSuperAdmin } = useAuth();
  const permissions = appUser?.permissions || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const canShowItem = (item) => {
    if (isSuperAdmin) return true;
    if (!item.permission) return true;
    return permissions?.[item.permission] === true;
  };

  const filterMenuItems = (items = []) => {
    return items
      .filter(canShowItem)
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }));
  };

  const visibleMenuItems = useMemo(() => {
    return filterMenuItems(ADMIN_MENU_ITEMS);
  }, [permissions, isSuperAdmin]);

  const isActive = (item) => {
    if (!item.path) return false;

    if (item.path === "/admin") {
      return location.pathname === "/admin";
    }

    if (location.pathname === item.path) return true;

    return item.children?.some(isActive);
  };

  const handleNavigate = (path) => {
    if (!path) return;

    navigate(path);
    setMobileSidebarOpen(false);
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const active = isActive(item);
      const Icon = item.icon;
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={`${item.label}-${item.path || level}`}>
          <button
            type="button"
            onClick={() => handleNavigate(item.path)}
            className={`w-full flex items-center gap-3 text-left rounded-xl cursor-pointer font-medium transition ${
              level === 0 ? "px-4 py-3 text-sm" : "px-3 py-2 text-xs"
            } ${
              active
                ? level === 0
                  ? "bg-[var(--ann-pink)] text-white shadow-lg"
                  : "bg-white text-[var(--ann-purple)]"
                : "text-purple-100 hover:bg-white/10"
            }`}
            style={{
              paddingLeft: level === 0 ? undefined : `${12 + level * 10}px`,
            }}
          >
            {Icon && <Icon size={level === 0 ? 18 : 14} />}
            {sidebarOpen && <span>{item.label}</span>}
          </button>

          {sidebarOpen && hasChildren && active && (
            <div className="ml-4 mt-2 space-y-1 border-l border-white/20 pl-3">
              {renderMenuItems(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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

      <nav className="space-y-2">{renderMenuItems(visibleMenuItems)}</nav>

      {sidebarOpen && (
        <div className="mt-auto rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold">System Status</p>
          <p className="text-xs text-purple-100 mt-1">
            All services are under-development
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex">
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
                {title}
              </h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
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
  );
}