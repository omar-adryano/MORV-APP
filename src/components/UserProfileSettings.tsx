import { useState, FormEvent } from "react";
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Users, 
  Lock, 
  Globe, 
  Check, 
  UserPlus, 
  Sparkles,
  Info
} from "lucide-react";
import { UserProfile } from "../types";

interface SettingsProps {
  userProfile: UserProfile;
  setUserProfile: (up: UserProfile) => void;
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
}

export default function UserProfileSettings({
  userProfile,
  setUserProfile,
  lang,
  setLang
}: SettingsProps) {
  const isRtl = lang === 'ar';

  // State managers
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileRole, setProfileRole] = useState(userProfile.role);
  const [profileGoal, setProfileGoal] = useState(userProfile.monthlySavingsGoal.toString());
  const [updateFeedback, setUpdateFeedback] = useState("");

  const [team, setTeam] = useState([
    { id: "e1", name: isRtl ? "سارة علي" : "Sara Ali", email: "sara.ali@company.com", role: isRtl ? "مراقب حسابات مالي" : "Lead Accountant", active: true },
    { id: "e2", name: isRtl ? "يوسف القاضي" : "Youssef Elgady", email: "youssef.q@company.com", role: isRtl ? "مدير اللوجستيات" : "Operations Supervisor", active: false }
  ]);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState(isRtl ? "محلل مالي" : "Financial Analyst");

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setUserProfile({
      ...userProfile,
      name: profileName,
      role: profileRole,
      monthlySavingsGoal: parseFloat(profileGoal) || 5000
    });
    setUpdateFeedback(isRtl ? "تم تحديث الملف وتأمين البيانات المشفرة!" : "Profile updated and secured successfully!");
    setTimeout(() => setUpdateFeedback(""), 3500);
  };

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;
    const newM = {
      id: "mem_" + Date.now(),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      active: true
    };
    setTeam([...team, newM]);
    setNewMemberName("");
    setNewMemberEmail("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: ACTIVE PROFILE FIELDS AND SECURITY CONSOLE */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile Info Sheet */}
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-100">
              <User className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold">{isRtl ? "إعدادات الملف الشخصي والشركة" : "Profile & Business Identity"}</h3>
            </div>
            
            <button 
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {isRtl ? "حفظ التغييرات" : "Save Settings"}
            </button>
          </div>

          {updateFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{updateFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "اسم المستخدم الثنائي" : "Full Name"}</label>
              <input 
                type="text" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "دورك الوظيفي التجاري" : "Corporate Role"}</label>
              <input 
                type="text" 
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "البريد الإلكتروني المعتمد" : "Secured Corporate Email"}</label>
              <input 
                type="email" 
                value={userProfile.email}
                disabled
                className="w-full bg-slate-950/60 border border-slate-850 rounded-lg p-2.5 text-slate-500 text-xs cursor-not-allowed"
              />
              <span className="block text-[10px] text-slate-500 mt-1">{isRtl ? "مسجل وآمن عبر شبكة MORV" : "ReadOnly verified connection"}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "مستهدف الادخار شهرياً بالجنيه" : "Target Savings Goal (EGP)"}</label>
              <input 
                type="number" 
                value={profileGoal}
                onChange={(e) => setProfileGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* User security keys & Simulated Firebase MFA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-100 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">{isRtl ? "خيارات الحماية والمصادقة المتقدمة" : "Enterprise Security Console"}</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-855 rounded-lg">
              <div>
                <p className="text-xs font-bold text-slate-200">{isRtl ? "المصادقة الثنائية (MFA)" : "Two-Factor Verification (MFA)"}</p>
                <p className="text-[10px] text-slate-500">{isRtl ? "طلب رمز PIN إضافي عند سحب المبالغ" : "Secure all EGP funds exits"}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Active</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-855 rounded-lg">
              <div>
                <p className="text-xs font-bold text-slate-200">{isRtl ? "مزامنة حساب Google" : "Google SSO Connection"}</p>
                <p className="text-[10px] text-slate-500">{isRtl ? "سجل الدخول بنقرة واحدة بحسابك الموحد" : "Single Sign-on connected"}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">Connected</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: PREFERENCES, LANGUAGE TOGGLES AND TEAM ACCESS */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* System parameters Language */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-100 border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold">{isRtl ? "لغة عرض منصة MORV" : "System Core Language"}</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-955 rounded-lg">
            
            {/* Arabic toggle */}
            <button
              onClick={() => setLang('ar')}
              className={`text-xs px-4 py-2 rounded-md font-bold transition-all ${
                lang === 'ar' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              العربية (الافتراضية)
            </button>

            {/* English toggle */}
            <button
              onClick={() => setLang('en')}
              className={`text-xs px-4 py-2 rounded-md font-bold transition-all ${
                lang === 'en' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              English Menu
            </button>

          </div>
          
          <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-850 text-[10px] text-slate-500 leading-relaxed">
            💡 {isRtl 
              ? "منصة MORV مهيأة بشكل كامل للتدفقات والضرائب بالجنيه المصري (EGP). تغيير اللغة يؤثر على واجهات المستخدم فقط." 
              : "MORV is natively optimized for Egyptian Pound (EGP) transactions, compliance, and slang advice."}
          </div>
        </div>

        {/* Simulated Staff & User controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center text-slate-100 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold">{isRtl ? "فريق العمل ومستويات الإذن" : "Advising Staff Panel"}</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{team.length} {isRtl ? "موظفين" : "members"}</span>
          </div>

          <div className="space-y-2">
            {team.map(m => (
              <div key={m.id} className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{m.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{m.email}</p>
                </div>
                <div className="text-start">
                  <span className="text-[10px] text-emerald-400 block">{m.role}</span>
                  <span className="block text-[8px] text-slate-500 text-end">Active</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddMember} className="pt-3 border-t border-slate-850 space-y-2">
            <input 
              type="text" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder={isRtl ? "اسم الموظف الجديد..." : "Full name"}
              required
              className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
            />
            <input 
              type="email" 
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
            />
            <button 
              type="submit"
              className="w-full bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-semibold py-1 rounded text-[10px] transition-colors"
            >
              ➕ {isRtl ? "دعوة عضو جديد للفريق" : "Invite Associate"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
