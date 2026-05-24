import { 
  Building2, 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  FolderOpen, 
  MessageSquareCode, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Smartphone
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'ar' | 'en';
  userProfile: { name: string; email: string; avatarUrl: string; role: string };
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  lang,
  userProfile,
  onLogout,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const isRtl = lang === 'ar';

  const menuItems = [
    {
      id: 'dashboard',
      label: isRtl ? 'الرئيسية' : 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'finance',
      label: isRtl ? 'الحسابات والمالية' : 'Finance & Ledger',
      icon: Wallet
    },
    {
      id: 'tasks',
      label: isRtl ? 'المهام والإنتاجية' : 'Tasks & Progress',
      icon: CheckSquare
    },
    {
      id: 'files',
      label: isRtl ? 'حقيبة المستندات' : 'File Manager',
      icon: FolderOpen
    },
    {
      id: 'assistant',
      label: isRtl ? 'مساعد مورف AI' : 'MORV AI Assistant',
      icon: MessageSquareCode
    },
    {
      id: 'android_portal',
      label: isRtl ? 'بوابة هاتف MORV' : 'MORV Android Portal',
      icon: Smartphone
    },
    {
      id: 'settings',
      label: isRtl ? 'خيارات النظام' : 'System Settings',
      icon: Settings
    }
  ];

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div 
          id="sidebar-overlay"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 flex flex-col w-[280px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-white/5 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* LOGO Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Building2 className="w-5.5 h-5.5 text-black" />
            </div>
            <div>
              <span className="font-sans text-xl font-bold tracking-tight text-white block">MORV</span>
              <span className="block text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
                {isRtl ? 'الإصدار الذكي' : 'SMART PRO'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1 rounded text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full gap-3 px-4 py-3 text-sm rounded-xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-tr from-cyan-500/15 to-emerald-400/5 text-cyan-400 border-r-2 border-r-cyan-400 font-extrabold shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="font-sans text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile Details Footer */}
        <div className="p-4 border-t border-white/5 bg-[#080808]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/40 border border-white/5">
            <img
              src={userProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
              alt="Avatar"
              className="object-cover w-10 h-10 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">{userProfile.name}</p>
              <p className="text-xs text-zinc-500 truncate">{userProfile.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-full gap-2 px-3 py-2.5 mt-4 text-xs font-semibold text-rose-455 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{isRtl ? 'خروج آمن' : 'Secure Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
