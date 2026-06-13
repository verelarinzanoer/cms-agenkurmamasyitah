import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Produk',
  '/products/new': 'Tambah Produk',
  '/categories': 'Kategori',
};

export const TopBar = () => {
  const { user } = useAuth();
  const pathname = window.location.pathname;
  const title = pageTitles[pathname] || 'Dashboard';

  const getInitials = (email?: string) => {
    if (!email) return 'AD';
    return email
      .split('@')[0]
      .split('')
      .slice(0, 2)
      .map((c) => c.toUpperCase())
      .join('');
  };

  return (
    <div className="md:ml-[240px] bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between h-16">
      <h1 className="text-lg font-bold text-[#1B4332]">{title}</h1>

      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 bg-[#C9A84C]">
          <AvatarFallback className="text-[#1B4332] font-semibold">
            {getInitials(user?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-900">{user?.email?.split('@')[0] || 'Admin'}</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
      </div>
    </div>
  );
};
