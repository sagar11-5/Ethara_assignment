import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Projects', icon: FolderKanban, path: '/projects' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0D0D0D] border-b border-[#1F1F1F]">
        <h1 className="text-xl font-bold tracking-tight">TeamSync</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className={cn(
                "fixed lg:static z-50 w-64 h-screen bg-[#111111] border-r border-[#1F1F1F] flex flex-col transition-all duration-300 ease-in-out",
                !isSidebarOpen && "w-0 overflow-hidden"
              )}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                    <FolderKanban className="text-white" size={20} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">TeamSync</h1>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                        location.pathname === item.path
                          ? "bg-indigo-600/10 text-indigo-400"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon size={18} className={cn(
                        "transition-colors",
                        location.pathname === item.path ? "text-indigo-400" : "text-gray-500 group-hover:text-white"
                      )} />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-[#1F1F1F]">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-[#0A0A0A] overflow-y-auto">
          <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
