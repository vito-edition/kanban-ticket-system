import type { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { useBoards } from "../../hooks/useBoards";
import { useLogout } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../ui/Avatar";

const navItems = [
  { label: "Dashboard", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "My Tickets", href: "/tickets", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export const Sidebar: FC = () => {
  const { data: boards } = useBoards();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-bold text-lg">KanbanFlow</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-primary-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )
            }
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}

        {boards && boards.length > 0 && (
          <div className="pt-4">
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Boards</p>
            {boards.map((board) => (
              <NavLink
                key={board.id}
                to={`/boards/${board.id}`}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: board.color }}
                />
                <span className="truncate">{board.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-700">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-1 rounded" title="Logout">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
