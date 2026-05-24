import { useState, useEffect, FormEvent } from "react";
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Lock, 
  User, 
  ArrowRight, 
  Globe, 
  Menu,
  FileSpreadsheet,
  Wallet,
  Activity,
  Heart,
  Mail,
  HelpCircle,
  Loader2,
  Chrome,
  AlertTriangle,
  Bell,
  Trash2,
  CheckCheck
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import FinanceDashboard from "./components/FinanceDashboard";
import TaskProductivity from "./components/TaskProductivity";
import FileManager from "./components/FileManager";
import MorvAiAssistant from "./components/MorvAiAssistant";
import UserProfileSettings from "./components/UserProfileSettings";
import AndroidWorkspace from "./components/AndroidWorkspace";
import { Transaction, Budget, SavingsGoal, Debt, Subscription, Task, FileDoc, UserProfile, ChatMessage } from "./types";

import { useFirebase } from "./context/FirebaseContext";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const {
    user,
    loading,
    authError,
    userProfile,
    transactions,
    budgets,
    savings,
    debts,
    subscriptions,
    tasks,
    files,
    chatHistory,
    handleEmailSignup,
    handleEmailSignin,
    handleGoogleLogin,
    handleLogout,
    updateUserProfile,
    onSubmitTransaction,
    onRemoveTransaction,
    onSubmitBudget,
    onSubmitSavingsGoal,
    onSubmitDebt,
    onSubmitSubscription,
    onSubmitTask,
    onSubmitFile,
    onRemoveFile,
    onAddChatMessage,
    notifications,
    onMarkNotificationRead,
    onRemoveNotification,
    receiptScans,
    onSubmitReceiptScan
  } = useFirebase();

  // Core Platform Configuration
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const isRtl = lang === 'ar';

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = !!user;

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setLocalError("");

    const trimmedEmail = authEmail.trim();

    if (authMode === 'signup' && !authName.trim()) {
      setLocalError(isRtl ? "برجاء كتابة الاسم الكامل لتسجيل حسابك التجاري." : "Full business name is required to create a ledger.");
      return;
    }

    if (!trimmedEmail) {
      setLocalError(isRtl ? "برجاء كتابة عنوان البريد الإلكتروني." : "Please enter your enterprise email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setLocalError(isRtl ? "صيغة البريد الإلكتروني غير صالحة. مثال: finance@company.com" : "Invalid email address format. Example: finance@company.com");
      return;
    }

    if (!authPassword) {
      setLocalError(isRtl ? "برجاء كتابة كلمة مرور الخزينة بالتأمين." : "Please enter your vault password.");
      return;
    }

    if (authPassword.length < 6) {
      setLocalError(isRtl ? "كلمة المرور ضعيفة! يجب أن تكون 6 خانات على الأقل لحماية أصولك." : "Password must be at least 6 characters long to secure ledger.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (authMode === 'signup') {
        await handleEmailSignup(authName.trim(), trimmedEmail, authPassword);
      } else {
        await handleEmailSignin(trimmedEmail, authPassword);
      }
    } catch (err: any) {
      setLocalError(err.message || (isRtl ? "حدث خطأ أثناء إجراء التحقق." : "An error occurred checking credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (isSubmitting) return;
    setLocalError("");
    try {
      setIsSubmitting(true);
      await handleGoogleLogin();
    } catch (err: any) {
      setLocalError(err.message || "Failed Google Auth login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Transactions sync adapter
  const handleSetTransactions = async (newVal: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    const resolved = typeof newVal === 'function' ? newVal(transactions) : newVal;
    for (const item of resolved) {
      const existingItem = transactions.find(t => t.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitTransaction(item);
      }
    }
    for (const orig of transactions) {
      if (!resolved.some(item => item.id === orig.id)) {
        await onRemoveTransaction(orig.id);
      }
    }
  };

  // 2. Budgets sync adapter
  const handleSetBudgets = async (newVal: Budget[] | ((prev: Budget[]) => Budget[])) => {
    const resolved = typeof newVal === 'function' ? newVal(budgets) : newVal;
    for (const item of resolved) {
      const existingItem = budgets.find(b => b.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitBudget(item);
      }
    }
  };

  // 3. Savings Goal sync adapter
  const handleSetSavings = async (newVal: SavingsGoal[] | ((prev: SavingsGoal[]) => SavingsGoal[])) => {
    const resolved = typeof newVal === 'function' ? newVal(savings) : newVal;
    for (const item of resolved) {
      const existingItem = savings.find(s => s.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitSavingsGoal(item);
      }
    }
  };

  // 4. Debts sync adapter
  const handleSetDebts = async (newVal: Debt[] | ((prev: Debt[]) => Debt[])) => {
    const resolved = typeof newVal === 'function' ? newVal(debts) : newVal;
    for (const item of resolved) {
      const existingItem = debts.find(d => d.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitDebt(item);
      }
    }
  };

  // 5. Subscriptions sync adapter
  const handleSetSubscriptions = async (newVal: Subscription[] | ((prev: Subscription[]) => Subscription[])) => {
    const resolved = typeof newVal === 'function' ? newVal(subscriptions) : newVal;
    for (const item of resolved) {
      const existingItem = subscriptions.find(s => s.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitSubscription(item);
      }
    }
  };

  // 6. Tasks sync adapter
  const handleSetTasks = async (newVal: Task[] | ((prev: Task[]) => Task[])) => {
    const resolved = typeof newVal === 'function' ? newVal(tasks) : newVal;
    for (const item of resolved) {
      const existingItem = tasks.find(t => t.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitTask(item);
      }
    }
    for (const orig of tasks) {
      if (!resolved.some(item => item.id === orig.id)) {
        try {
          await deleteDoc(doc(db, 'users', user?.uid || '', 'tasks', orig.id));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // 7. Files sync adapter
  const handleSetFiles = async (newVal: FileDoc[] | ((prev: FileDoc[]) => FileDoc[])) => {
    const resolved = typeof newVal === 'function' ? newVal(files) : newVal;
    for (const item of resolved) {
      const existingItem = files.find(f => f.id === item.id);
      if (!existingItem || JSON.stringify(existingItem) !== JSON.stringify(item)) {
        await onSubmitFile(item);
      }
    }
    for (const orig of files) {
      if (!resolved.some(item => item.id === orig.id)) {
        await onRemoveFile(orig.id);
      }
    }
  };

  // 8. Chat sync adapter
  const handleSetChatHistory = async (newVal: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const resolved = typeof newVal === 'function' ? newVal(chatHistory) : newVal;
    for (const item of resolved) {
      if (!chatHistory.some(c => c.id === item.id)) {
        await onAddChatMessage(item);
      }
    }
  };

  // Sync state setters mapping for child components compatibility
  const setTransactions = handleSetTransactions;
  const setBudgets = handleSetBudgets;
  const setSavings = handleSetSavings;
  const setDebts = handleSetDebts;
  const setSubscriptions = handleSetSubscriptions;
  const setTasks = handleSetTasks;
  const setFiles = handleSetFiles;
  const setChatHistory = handleSetChatHistory;
  const setUserProfile = updateUserProfile;

  // Calculations for Home dashboard cards
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const calculatedBalance = userProfile.balanceEGP + totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-[#f4f4f4] flex flex-col items-center justify-center p-6 gap-5 font-sans relative overflow-hidden">
        {/* Futuristic layout visuals */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Building2 className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-sm font-extrabold text-zinc-300 tracking-wide select-none">{isRtl ? "جاري تفعيل بوابة MORV ومزامنة البيانات التشغيلية..." : "Activating MORV Portal & Syncing Ledger Assets..."}</p>
          <div className="w-64 bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
            <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-[45%] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SECURITY SCREEN LOBBY (SIGN IN / OUT / UP)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#030303] text-[#f4f4f4] flex flex-col justify-between items-center p-6 relative overflow-hidden font-sans select-none">
        
        {/* Atmospheric Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Small header logo panel */}
        <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-sans text-lg font-extrabold tracking-tight text-white block">MORV</span>
          </div>

          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 transition-all font-sans"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isRtl ? "English" : "العربية"}</span>
          </button>
        </header>

        {/* Central Auth Core Card */}
        <main className="w-full max-w-md bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 shadow-2xl relative z-10 animate-scale-up py-10">
          {/* Decorative Top Accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-cyan-500 to-emerald-400 opacity-60"></div>
          
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              {authMode === 'signin' 
                ? (isRtl ? "تسجيل الدخول لبوابة الحسابات" : "Sign In to Corporate Ledger") 
                : (isRtl ? "إنشاء حساب تجاري جديد" : "Register Enterprise Account")}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {isRtl 
                ? "أهلاً بك في منصة MORV المعتمدة. برجاء إدخال بيانات الأمان لتشفير خزينتك ومراجعة التدفقات المخصصة." 
                : "Enter credentials to unpack and secure your encrypted Egypt EGP accounting assets."}
            </p>
          </div>

          {(() => {
            const errorToShow = authError || localError;
            const isOperationNotAllowed = errorToShow && (
              errorToShow.includes("operation-not-allowed") ||
              errorToShow.includes("معطلة حالياً") ||
              errorToShow.includes("Email/Password")
            );

            return (
              <>
                {errorToShow && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs text-center font-sans">
                    ⚠️ {errorToShow}
                  </div>
                )}

                {isOperationNotAllowed && (
                  <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-3 text-xs text-yellow-200 font-sans">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-extrabold text-sm">{isRtl ? "مطلوب إجراء في وحدة تحكم Firebase" : "Action Required in Firebase Console"}</p>
                        <p className="leading-relaxed">
                          {isRtl 
                            ? "يجب تمكين تسجيل الدخول بالبريد الإلكتروني/كلمة المرور في لوحة تحكم مشروعك أولاً. اتبع الخطوات التالية:" 
                            : "Email/password authentication is currently disabled in your Firebase console. Please enable it by following:"}
                        </p>
                      </div>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-300 pr-1 text-[11px] leading-relaxed">
                      <li>{isRtl ? "افتح وحدة التحكم بالضغط على الرابط أدناه." : "Click the link below to go to your console."}</li>
                      <li>{isRtl ? "اضغط على (أضف مزوّد جديد) ثم اختر 'البريد الإلكتروني/كلمة المرور'." : "Click on 'Add new provider' and select 'Email/Password'."}</li>
                      <li>{isRtl ? "قم بتفعيل الخيار ثم اضغط على حفظ." : "Enable it and click Save."}</li>
                    </ol>
                    <div className="pt-1 flex flex-col gap-2">
                      <a 
                        href="https://console.firebase.google.com/project/northern-bazaar-q5xj8/authentication/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-center py-2 rounded-lg transition-colors uppercase tracking-wider block"
                      >
                        🚀 {isRtl ? "افتح لوحة تحكم مشروعك مباشرة" : "Open Firebase Console"}
                      </a>
                      <p className="text-[10px] text-center text-zinc-400">
                        Project ID: <code className="bg-black/50 px-1 py-0.5 rounded text-yellow-400">northern-bazaar-q5xj8</code>
                      </p>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-bold">{isRtl ? "الاسم الكامل للمستخدم" : "Full Business Name"}</label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-zinc-500`}>
                    <User className="w-4 h-4 text-zinc-500" />
                  </span>
                  <input 
                    type="text" 
                    value={authName}
                    disabled={isSubmitting}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={isRtl ? "أحمد سليمان" : "Ahmad Soliman"}
                    className={`w-full bg-[#030303] border border-white/5 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all font-sans disabled:opacity-55`}
                  />
                </div>
              </div>
            )}

             <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-bold">{isRtl ? "عنوان البريد الإلكتروني" : "Secured Login Email"}</label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-zinc-500`}>
                  <Mail className="w-4 h-4 text-zinc-500" />
                </span>
                <input 
                  type="email" 
                  value={authEmail}
                  disabled={isSubmitting}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="finance@company.com"
                  className={`w-full bg-[#030303] border border-white/5 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all font-sans disabled:opacity-55`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs text-zinc-400 font-bold">{isRtl ? "رقم المرور للتشفير" : "Vault Password"}</label>
                {authMode === 'signin' && (
                  <button type="button" onClick={() => alert(isRtl ? "تم إرسال رابط إعادة التعيين لبريدك المسجل افتراضياً" : "Reset link sent to demo mail.")} className="text-[10px] text-cyan-400 hover:underline">
                    {isRtl ? "نسيت كلمة المرور؟" : "Forgot Vault Key?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-zinc-500`}>
                  <Lock className="w-4 h-4 text-zinc-500" />
                </span>
                <input 
                  type="password" 
                  value={authPassword}
                  disabled={isSubmitting}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full bg-[#030303] border border-white/5 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all font-sans disabled:opacity-55`}
                />
              </div>
            </div>

            {/* Quick Demo Assist credentials note */}
            <div className="bg-[#030303]/40 p-3 rounded-lg border border-white/5 text-[10px] text-zinc-500 leading-relaxed text-right font-sans">
              🌐 {isRtl ? "إذا كنت مطوراً وتختبر التطبيق، يمكنك تفعيل Email/Password في مشروعك أو تسجيل الدخول السريع باستخدام حساب Google بأي وقت." : "If you are testing features, you can activate Email/Password in your console or quickly log in via Google anytime."}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:opacity-90 text-black font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 duration-205 cursor-pointer disabled:opacity-55"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 text-black animate-spin" />
              ) : (
                <>
                  <span>
                    {authMode === 'signin' 
                      ? (isRtl ? "تسجيل دخول آمن للشركات" : "Decrypt Secured Vault") 
                      : (isRtl ? "تسجيل وتفعيل الخزينة الموحدة" : "Form & Register Vault")}
                  </span>
                  <ArrowRight className={`w-4 h-4 text-black stroke-[3px] ${isRtl ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Google Authentication Section */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-[9px] text-zinc-550 uppercase tracking-widest font-mono">
                {isRtl ? "مصادقة اختيارية بديلة" : "Alternative Secure Method"}
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={isSubmitting}
              className="w-full bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-205 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span>{isRtl ? "الدخول السريع بحساب Google" : "Continue with Google Account"}</span>
            </button>

          </form>

          {/* Mode Switchers */}
          <div className="text-center mt-6 pt-4 border-t border-white/5 text-xs font-sans">
            {authMode === 'signin' ? (
              <p className="text-zinc-500">
                {isRtl ? "ليس لديك حساب تجاري نشط؟" : "Don't have enterprise access yet?"}{" "}
                <button type="button" onClick={() => setAuthMode('signup')} className="text-cyan-400 font-bold hover:underline">
                  {isRtl ? "سجل كحساب جديد" : "Sign up here"}
                </button>
              </p>
            ) : (
              <p className="text-zinc-500">
                {isRtl ? "لديك حساب تجاري مشفر بالفعل؟" : "Already registered corporate ledger?"}{" "}
                <button type="button" onClick={() => setAuthMode('signin')} className="text-cyan-400 font-bold hover:underline">
                  {isRtl ? "سجل دخولك هنا" : "Sign in now"}
                </button>
              </p>
            )}
          </div>
        </main>

        <footer className="shrink-0 text-[11px] text-zinc-650 font-sans text-center pb-2">
          © 2026 MORV Commercial Technologies Egypt Ltd. All financial assets encrypted on TLS 1.3 protocol.
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PLATFORM MAIN APP STRUCTURE (AUTHENTICATED)
  // ----------------------------------------------------
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#030303] text-zinc-150 font-sans relative overflow-x-hidden">
      
      {/* Immersive Atmospheric background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Platform Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        userProfile={{
          name: userProfile.name,
          email: userProfile.email,
          avatarUrl: userProfile.avatarUrl,
          role: userProfile.role
        }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main content viewport layout container */}
      <div className={`transition-all duration-300 ${isRtl ? 'md:mr-[280px]' : 'md:ml-[280px]'} min-h-screen flex flex-col relative z-20`}>
        
        {/* Upper Action/Indicator bar */}
        <header className="h-16 border-b border-white/5 bg-[#080808]/80 px-6 flex items-center justify-between sticky top-0 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-805 text-zinc-400 md:hidden"
            >
              <Menu className="w-5 h-5 text-zinc-200" />
            </button>
            
            {/* Context breadcrumb names */}
            <div>
              <span className="text-xs text-zinc-500">
                {isRtl ? "الواجهة الرئيسية" : "Platform Hub"}
              </span>
              <span className="block text-sm font-bold text-zinc-100 uppercase tracking-tight font-sans">
                {activeTab === 'dashboard' && (isRtl ? 'نظرة عامة على الخزينة' : 'Treasury Desk')}
                {activeTab === 'finance' && (isRtl ? 'سجل الحسابات المعتمد' : 'Corporate General Ledgers')}
                {activeTab === 'tasks' && (isRtl ? 'تنظيم المهام والإنتاجية' : 'Objectives Matrix')}
                {activeTab === 'files' && (isRtl ? 'برنامج المستندات السحابي' : 'Storage Box')}
                {activeTab === 'assistant' && (isRtl ? 'مساعد التوجيه MORV AI' : 'Consultant AI Core')}
                {activeTab === 'settings' && (isRtl ? 'تفضيلات التطبيق والنظام' : 'Console Settings')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Balance Status indicator */}
            <div className="hidden sm:flex items-center gap-3 bg-zinc-955/40 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-zinc-300">
                {isRtl ? "الرصيد الكلي:" : "Ledger Fund:"}{" "}
                <span className="font-extrabold text-[#10b981]">{calculatedBalance.toLocaleString()} {isRtl ? "جنيه" : "EGP"}</span>
              </span>
            </div>

            {/* Real-time sync notifications component dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center"
                title={isRtl ? "التنبيهات والإشعارات" : "Notifications center"}
              >
                <Bell className="w-4 h-4" />
                {((notifications || []).filter(n => !n.isRead).length) > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-550 text-[9px] font-extrabold text-white animate-pulse">
                    {(notifications || []).filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div 
                  className={`absolute top-12 ${isRtl ? 'left-0' : 'right-0'} w-80 bg-[#080808]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-right animate-fade-in`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-extrabold text-white font-sans">
                      🔔 {isRtl ? "الإشعارات ومساعد النظام" : "System Notifications"}
                    </span>
                    {(notifications || []).filter(n => !n.isRead).length > 0 && (
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-bold">
                        {(notifications || []).filter(n => !n.isRead).length} {isRtl ? "سجل عاجل" : "new alert"}
                      </span>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin">
                    {(notifications || []).length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-500">
                        {isRtl ? "الخزينة خالية من التنبيهات المباشرة" : "No active alerts in cache."}
                      </div>
                    ) : (
                      (notifications || []).map((noti) => (
                        <div 
                          key={noti.id} 
                          className={`p-2.5 rounded-xl border transition-all text-right ${
                            noti.isRead 
                              ? 'bg-black/20 border-white/5 opacity-60' 
                              : 'bg-zinc-900/40 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`block text-xs font-bold leading-relaxed ${noti.isRead ? 'text-zinc-400' : 'text-zinc-150'}`}>
                              {noti.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {!noti.isRead && (
                                <button 
                                  onClick={() => onMarkNotificationRead(noti.id)}
                                  className="text-cyan-400 hover:text-cyan-300 p-0.5 cursor-pointer"
                                  title={isRtl ? "تحديد كمقروء" : "Mark read"}
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={() => onRemoveNotification(noti.id)}
                                className="text-rose-500 hover:text-rose-450 p-0.5 cursor-pointer"
                                title={isRtl ? "حذف التنبيه" : "Remove alert"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                            {noti.message}
                          </p>
                          <span className="block text-[8px] text-zinc-500 mt-1 font-mono">
                            {new Date(noti.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 px-3 py-2 rounded-xl border border-white/5 transition-all font-sans cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isRtl ? "English" : "العربية"}</span>
            </button>
          </div>
        </header>

        {/* Core application body views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 relative z-10">
          
          {/* A. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Premium Hero banner */}
              <div className="relative overflow-hidden bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 shadow-2xl text-right animate-fade-in neon-glow-cyan">
                {/* Visual Top Highlight Line */}
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-l from-cyan-500 to-emerald-400 opacity-60"></div>
                <div className="absolute top-[-30%] left-[-10%] w-[320px] h-[320px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-405 font-sans">
                      <Sparkles className="w-4 h-4 animate-pulse text-cyan-400" />
                      <span className="text-xs font-bold uppercase font-mono tracking-widest">{isRtl ? "إحصاءات النظام الذكي" : "Intelligent System Status"}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-sans">
                      {isRtl ? `أهلاً بك مجدداً بحسابك يا ${userProfile.name} !` : `Welcome back, Director ${userProfile.name}`}
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed font-sans">
                      {isRtl 
                        ? (transactions.length === 0 && userProfile.balanceEGP === 0
                          ? "لوحة التحكم فارغة ونشطة. يرجى البدء بإعداد راتبك أو معاملاتك لتتمكن خوارزمياتنا من بناء هيكل التدفق والتحليلات لشركتك."
                          : "أنت متصل بالخادم المالي الآمن لمصر. تحليل التدفقات النقدية ومطابقة النفقات جارٍ تحديثه باستمرار بناءً على إدخالاتك فقط.")
                        : (transactions.length === 0 && userProfile.balanceEGP === 0
                          ? "Your ledger is empty and active. Please start by adding your Salary, Capital funds or transactions to calculate dynamic financial analytics."
                          : "You are connected to the secure local EGP accounting server. All analytics and predictions compute exclusively on user data.")}
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('assistant')}
                    className="bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:opacity-90 text-black font-extrabold px-5 py-3 text-xs rounded-xl flex items-center gap-1.5 transition-all w-full md:w-auto justify-center shadow-[0_0_20px_rgba(6,182,212,0.30)] duration-250 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black stroke-[3px]" />
                    <span>{isRtl ? "استشر MORV AI الآن" : "Query MORV AI"}</span>
                  </button>
                </div>
              </div>

              {/* Accounting Core & Charts rendering */}
              <FinanceDashboard 
                transactions={transactions}
                setTransactions={setTransactions}
                budgets={budgets}
                setBudgets={setBudgets}
                savings={savings}
                setSavings={setSavings}
                debts={debts}
                setDebts={setDebts}
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
                lang={lang}
                userBalance={userProfile.balanceEGP}
              />
            </div>
          )}

          {/* B. ACCOUNTING LEDGER DETAIL */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <FinanceDashboard 
                transactions={transactions}
                setTransactions={setTransactions}
                budgets={budgets}
                setBudgets={setBudgets}
                savings={savings}
                setSavings={setSavings}
                debts={debts}
                setDebts={setDebts}
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
                lang={lang}
                userBalance={userProfile.balanceEGP}
              />
            </div>
          )}

          {/* C. TASKS & PRODUCTIVITY TRACKER MAP */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <TaskProductivity 
                tasks={tasks}
                setTasks={setTasks}
                lang={lang}
              />
            </div>
          )}

          {/* D. REGULATORY CLOUD FILE BOX */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <FileManager 
                files={files}
                setFiles={setFiles}
                lang={lang}
              />
            </div>
          )}

          {/* E. CHAT ASSISTANT TERMINAL */}
          {activeTab === 'assistant' && (
            <div className="space-y-6">
              <MorvAiAssistant 
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                lang={lang}
                userProfile={{
                  name: userProfile.name,
                  balanceEGP: calculatedBalance
                }}
              />
            </div>
          )}

          {/* F. SYSTEM ACCOUNT PANELS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <UserProfileSettings 
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                lang={lang}
                setLang={setLang}
              />
            </div>
          )}

          {/* G. NATIVE ANDROID PORTAL & WORKSPACE */}
          {activeTab === 'android_portal' && (
            <div className="space-y-6">
              <AndroidWorkspace 
                lang={lang}
                transactions={transactions}
                setTransactions={setTransactions}
                onSubmitReceiptScan={onSubmitReceiptScan}
                receiptScans={receiptScans}
              />
            </div>
          )}

        </main>

        <footer className="py-6 border-t border-slate-900 bg-slate-900/20 text-center text-xs text-slate-500 font-sans mt-auto">
          © 2026 MORV AI Platform Inc. - {isRtl ? "مصمم بكل حب لدولة مصر والوطن العربي" : "Crafted with architectural beauty for the MENA SaaS ecosystem"} •
        </footer>
      </div>

    </div>
  );
}
