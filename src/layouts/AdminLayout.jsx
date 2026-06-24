import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import annLogo from "../assets/ann-logo.png";
import { ADMIN_MENU_ITEMS } from "../constants/menuItems";
import { BRAND } from "../constants/brand";

export default function AdminLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(item.path);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex">
      <aside className="hidden lg:flex lg:w-56 xl:w-60 bg-[var(--ann-purple)] text-white px-5 py-6 flex-col">
        <div className="flex items-center gap-3 mb-8">
          <img
            src={annLogo}
            alt={BRAND.fullName}
            className="w-14 h-14 object-contain bg-white-200 rounded-2xl "
          />
          <div>
            <h1 className="text-lg xl:text-xl text-[var(--ann-pink)] font-extrabold leading-tight">
              {BRAND.appName} <span className="text-white">{BRAND.mis}</span>
            </h1>
            <p className="text-xs text-pink-200">{BRAND.tagline}</p>
          </div>
        </div>

        <nav className="space-y-2">
         {ADMIN_MENU_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <div key={item.label}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition ${
                    active
                      ? "bg-[var(--ann-pink)] text-white shadow-lg"
                      : "text-purple-100 hover:bg-white/10"
                  }`}
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                </button>

                {item.children && active && (
                  <div className="ml-4 mt-2 space-y-1 border-l border-white/20 pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      return (
                        <button
                          key={child.label}
                          onClick={() => navigate(child.path)}
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

        <div className="mt-auto rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold">System Status</p>
          <p className="text-xs text-purple-100 mt-1">All services are under-development</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-auto lg:h-20 bg-white border-b border-gray-200 px-4 sm:px-6 xl:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ann-text-dark)]">
              {title}
            </h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* <button
              onClick={() => navigate("/admin/cohorts/create")}
              className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              + Create Cohort
            </button> */}

            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
            >
              Logout
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}