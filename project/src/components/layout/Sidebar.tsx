import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Package, Tag, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Produk', icon: Package },
    { path: '/categories', label: 'Kategori', icon: Tag },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1B4332] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <ShoppingBag className="w-6 h-6" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Toko Haji</span>
          <span className="text-xs text-white/70">Umroh Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/15 border-l-3 border-[#C9A84C] text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 mx-3 mb-6 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all w-full"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Keluar</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-[240px] md:block md:z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1B4332] text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-64 z-50 md:hidden">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg bg-[#1B4332] text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};
