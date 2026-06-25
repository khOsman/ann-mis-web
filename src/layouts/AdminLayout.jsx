
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import annLogo from "../assets/ann-logo.png";
import { ADMIN_MENU_ITEMS } from "../constants/menuItems";
import { BRAND } from "../constants/brand";

export default function AdminLayout({ children, title, subtitle }) {
  const { appUser, logout } = useAuth();
  const permissions = appUser?.permissions || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  


  const isActive = (item) => {
    if (item.path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(item.path);
  };

  const canShowItem = (item) => {
    if (!item.permission) return true;
    return permissions?.[item.permission] === true;
  };

  const visibleMenuItems = useMemo(() => {
    return ADMIN_MENU_ITEMS.filter(canShowItem).map((item) => ({
      ...item,
      children: item.children?.filter(canShowItem),
    }));
  }, [permissions]);

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

      <nav className="space-y-2">
        {visibleMenuItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  navigate(item.path);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition ${
                  active
                    ? "bg-[var(--ann-pink)] text-white shadow-lg"
                    : "text-purple-100 hover:bg-white/10"
                }`}
              >
                {Icon && <Icon size={18} />}
                {sidebarOpen && <span>{item.label}</span>}
              </button>

              {sidebarOpen && item.children && active && (
                <div className="ml-4 mt-2 space-y-1 border-l border-white/20 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;

                    return (
                      <button
                        key={child.label}
                        onClick={() => {
                          navigate(child.path);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                          location.pathname === child.path
                            ? "bg-white text-[var(--ann-purple)]"
                            : "text-purple-100 hover:bg-white/10"
                        }`}
                      >
                        {ChildIcon && <ChildIcon size={14} />}
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

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