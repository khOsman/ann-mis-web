import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import annLogo from "../assets/ann-logo.png";
import { ADMIN_MENU_ITEMS } from "../constants/menuItems";
import { BRAND } from "../constants/brand";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[var(--ann-bg)] flex">
      <aside className="hidden lg:flex lg:w-64 xl:w-72 bg-[var(--ann-purple)] text-white px-5 py-6 flex-col">
        <div className="flex items-center gap-3 mb-8">
          <img
            src={annLogo}
            alt={BRAND.fullName}
            className="w-14 h-14 object-contain bg-white rounded-2xl p-1"
          />

          <div>
            <h1 className="text-lg xl:text-xl font-extrabold leading-tight">
              {BRAND.appName}
            </h1>
            <p className="text-xs text-pink-200">{BRAND.tagline}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {ADMIN_MENU_ITEMS.map((item, index) => (
            <div
              key={item.label}
              className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition ${
                index === 0
                  ? "bg-[var(--ann-pink)] text-white shadow-lg"
                  : "text-purple-100 hover:bg-white/10"
              }`}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold">System Status</p>
          <p className="text-xs text-purple-100 mt-1">All services running</p>
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
            <button className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90">
              + Create Form
            </button>

            <button
              onClick={() => signOut(auth)}
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