import React, { useState, FormEvent } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  DollarSign, 
  PieChart as PieIcon, 
  Sparkles, 
  FileText,
  AlertCircle,
  PiggyBank,
  Hourglass,
  Calendar,
  Check,
  UploadCloud,
  Loader2,
  Trash2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  Legend,
  Cell
} from "recharts";
import { Transaction, Budget, SavingsGoal, Debt, Subscription } from "../types";
import { useFirebase } from "../context/FirebaseContext";

interface FinanceProps {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  budgets: Budget[];
  setBudgets: (b: Budget[]) => void;
  savings: SavingsGoal[];
  setSavings: (s: SavingsGoal[]) => void;
  debts: Debt[];
  setDebts: (d: Debt[]) => void;
  subscriptions: Subscription[];
  setSubscriptions: (sub: Subscription[]) => void;
  lang: 'ar' | 'en';
  userBalance: number;
}

export default function FinanceDashboard({
  transactions,
  setTransactions,
  budgets,
  setBudgets,
  savings,
  setSavings,
  debts,
  setDebts,
  subscriptions,
  setSubscriptions,
  lang,
  userBalance
}: FinanceProps) {
  const isRtl = lang === 'ar';
  const { 
    onSubmitReceiptScan, 
    receiptScans, 
    onRemoveReceiptScan,
    userProfile,
    updateUserProfile,
    onSubmitBudget,
    onSubmitTask
  } = useFirebase();

  // State managers
  const [activeSegment, setActiveSegment] = useState<'transactions' | 'budgets' | 'savings' | 'debts' | 'subscriptions'>('transactions');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrImageBase64, setOcrImageBase64] = useState<string>("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Modal/Form Inputs
  const [showAddTx, setShowAddTx] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState(isRtl ? "أعمال" : "Business");
  const [txDesc, setTxDesc] = useState("");

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtContact, setDebtContact] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtType, setDebtType] = useState<'to_pay' | 'to_collect'>('to_pay');
  const [debtDate, setDebtDate] = useState("");

  // New Modals
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [inputSalary, setInputSalary] = useState("");
  const [inputInitialBalance, setInputInitialBalance] = useState("");

  const [showAddBudget, setShowAddBudget] = useState(false);
  const [inputBudgetCategory, setInputBudgetCategory] = useState("");
  const [inputBudgetLimit, setInputBudgetLimit] = useState("");

  const [showAddTask, setShowAddTask] = useState(false);
  const [inputTaskTitle, setInputTaskTitle] = useState("");
  const [inputTaskPriority, setInputTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [inputTaskCategory, setInputTaskCategory] = useState(isRtl ? "المالية" : "Finance");

  // Statistics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentNetBalance = (userProfile?.balanceEGP || 0) + totalIncome - totalExpense;

  // Categories list
  const arabicCategories = ["أعمال", "مأكولات ومشروبات", "تكنولوجيا", "شتى", "رواتب", "اشتراكات", "تسوق"];
  const englishCategories = ["Business", "Food & Dining", "Technology", "Miscellaneous", "Salary", "Subscriptions", "Shopping"];
  const categoriesToUse = isRtl ? arabicCategories : englishCategories;

  // Recharts cashflow parser: Dynamically mapped from actual user-profile salary and real transaction records
  const dataFlow = [
    ...(userProfile?.salary ? [{ name: isRtl ? "المرتب الشهري" : "Monthly Salary", Income: userProfile.salary, Expense: 0 }] : []),
    ...transactions.slice().reverse().map((tx) => ({
      name: tx.title,
      Income: tx.type === 'income' ? tx.amount : 0,
      Expense: tx.type === 'expense' ? tx.amount : 0,
    }))
  ];

  // OCR file process handler
  const processOcrImage = async (file: File) => {
    setOcrLoading(true);
    setOcrResult(null);
    setOcrError("");
    setOcrImageBase64("");

    try {
      if (!file.type.startsWith("image/")) {
        setOcrError(isRtl ? "الملف المرفوع ليس صورة صالحة." : "Uploaded file is not a valid image.");
        setOcrLoading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setOcrImageBase64(base64String); // Save real image preview url/string
        const rawBase64 = base64String.split(",")[1];

        try {
          const resp = await fetch("/api/gemini/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: rawBase64,
              mimeType: file.type
            })
          });

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.error || "OCR request failed");
          }

          const data = await resp.json();
          setOcrResult(data);
        } catch (e: any) {
          console.error(e);
          setOcrError(e.message || (isRtl ? "حدث خطأ أثناء معالجة صورة الفاتورة بالذكاء الاصطناعي." : "Error extracting invoice details via AI."));
        } finally {
          setOcrLoading(false);
        }
      };

      reader.onerror = () => {
        setOcrError(isRtl ? "تعذر قراءة ملف الصورة." : "Could not read image file.");
        setOcrLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setOcrError(isRtl ? "حدث خطأ مالي غير متوقع." : "An unexpected error occurred.");
      setOcrLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processOcrImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processOcrImage(e.target.files[0]);
    }
  };

  const handleApplyOcrResult = async () => {
    if (!ocrResult) return;
    const cleanId = "tx_" + Date.now();
    const newTx: Transaction = {
      id: cleanId,
      title: ocrResult.vendor || (isRtl ? "فاتورة مستخرجة" : "Extracted Receipt"),
      amount: typeof ocrResult.amount === 'number' ? ocrResult.amount : parseFloat(ocrResult.amount) || 0,
      type: 'expense',
      category: ocrResult.category || (isRtl ? "أعمال" : "Business"),
      date: ocrResult.date || new Date().toISOString().split('T')[0],
      description: (isRtl ? "مستخرج تلقائياً عبر الذكاء الاصطناعي" : "Automatically scanned via MORV AI") + 
        (ocrResult.paymentType ? ` (${isRtl ? 'طريقة الدفع' : 'Payment'}: ${ocrResult.paymentType})` : ""),
      invoiceNo: "MRV-OCR-" + Math.floor(1000 + Math.random() * 9000),
      imageDataUrl: ocrImageBase64 || undefined, // Link receipt image to transaction
      paymentType: ocrResult.paymentType || undefined
    };
    setTransactions([newTx, ...transactions]);

    try {
      await onSubmitReceiptScan({
        id: "rc_" + Date.now(),
        vendor: ocrResult.vendor || (isRtl ? "فاتورة مستخرجة" : "Extracted Receipt"),
        amount: typeof ocrResult.amount === 'number' ? ocrResult.amount : parseFloat(ocrResult.amount) || 0,
        category: ocrResult.category || (isRtl ? "أعمال" : "Business"),
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        confidence: ocrResult.confidence || 0.96,
        extractedItems: ocrResult.extractedItems || [],
        paymentType: ocrResult.paymentType || undefined,
        imageDataUrl: ocrImageBase64 || undefined // Store image in saved database receipt
      });
    } catch (e) {
      console.error("Failed to commit receipt scan persistently: ", e);
    }

    setOcrResult(null);
    setOcrImageBase64("");
  };

  const handleAddTransactionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      title: txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
      description: txDesc,
      invoiceNo: "MRV-" + Math.floor(1000 + Math.random() * 9000),
    };
    setTransactions([newTx, ...transactions]);
    setTxTitle("");
    setTxAmount("");
    setTxDesc("");
    setShowAddTx(false);
  };

  const handleAddGoalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    const newGoal: SavingsGoal = {
      id: "goal_" + Date.now(),
      title: goalTitle,
      targetAmount: parseFloat(goalTarget),
      currentAmount: 0,
      dueDate: goalDate || "2026-12-31",
      category: isRtl ? "ادخار مالي" : "Personal Savings"
    };
    setSavings([...savings, newGoal]);
    setGoalTitle("");
    setGoalTarget("");
    setShowAddGoal(false);
  };

  const handleAddDebtSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!debtContact || !debtAmount) return;
    const newDebt: Debt = {
      id: "debt_" + Date.now(),
      contactName: debtContact,
      amount: parseFloat(debtAmount),
      paidAmount: 0,
      dueDate: debtDate || "2026-06-30",
      type: debtType
    };
    setDebts([...debts, newDebt]);
    setDebtContact("");
    setDebtAmount("");
    setShowAddDebt(false);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleSalarySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const slry = parseFloat(inputSalary);
    const blnc = parseFloat(inputInitialBalance);
    if (isNaN(slry) && isNaN(blnc)) return;
    try {
      await updateUserProfile({
        salary: isNaN(slry) ? (userProfile?.salary || 0) : slry,
        balanceEGP: isNaN(blnc) ? (userProfile?.balanceEGP || 0) : blnc
      });
      setInputSalary("");
      setInputInitialBalance("");
      setShowAddSalary(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBudgetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(inputBudgetLimit);
    if (!inputBudgetCategory || isNaN(limit)) return;
    try {
      await onSubmitBudget({
        id: "b_" + Date.now(),
        category: inputBudgetCategory,
        limitAmount: limit,
        spentAmount: 0,
        period: new Date().toISOString().slice(0, 7) // "2026-05"
      });
      setInputBudgetCategory("");
      setInputBudgetLimit("");
      setShowAddBudget(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputTaskTitle) return;
    try {
      await onSubmitTask({
        id: "tsk_" + Date.now(),
        title: inputTaskTitle,
        completed: false,
        priority: inputTaskPriority,
        category: inputTaskCategory,
        dueDate: new Date().toISOString().split('T')[0],
        time: "12:00"
      });
      setInputTaskTitle("");
      setShowAddTask(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isLedgerEmpty = transactions.length === 0 && (userProfile?.salary || 0) === 0 && (userProfile?.balanceEGP || 0) === 0;
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const expenseProgress = totalBudgetLimit > 0 ? Math.min(100, Math.floor((totalExpense / totalBudgetLimit) * 100)) : 0;
  const incomeProgress = userProfile?.salary ? Math.min(100, Math.floor((totalIncome / userProfile.salary) * 100)) : 0;

  // Real-time calculated dynamic AI recommendation insight
  const getAiRecommendation = () => {
    const savingsRate = (totalIncome + (userProfile?.salary || 0)) > 0
      ? Math.round((((totalIncome + (userProfile?.salary || 0)) - totalExpense) / (totalIncome + (userProfile?.salary || 0))) * 100)
      : 0;
    
    if (isLedgerEmpty) {
      return isRtl 
        ? "بوابة التحليل المالي نشطة ومؤمنة بالكامل بالذكاء الاصطناعي لمشروعك في مصر. يرجى إدخال مرتبك أو رصيد البداية لبدء تقديم الإرشادات." 
        : "MORV financial analyzer is active. Please define your salary or capital balance to populate AI insights.";
    }

    if (totalExpense > (totalIncome + (userProfile?.salary || 0))) {
      return isRtl 
        ? `⚠️ تنبيه تجاوز الصرف: تفوق نفقاتك ناتج مدخولاتك بنسبة المتجاوز. ننصح بخفض تصنيفات النفقات ومراجعة الاشتراكات المستمرة.` 
        : `⚠️ Overspending Warning: Outflows currently exceed your active income streams. Pruning unused subscriptions is highly recommended.`;
    }

    if (savingsRate < 20) {
      return isRtl 
        ? `تنبيه من MORV AI: معدل الادخار الحالي هو ${savingsRate}% وهو أقل من المستوى المستهدف الآمن (20%). يفضل تخصيص ميزانية صارمة للأقسام.` 
        : `MORV AI Analyst: Current savings rate is ${savingsRate}%, which is below the safe target benchmark of 20%. Consider setting firm limits.`;
    }

    return isRtl 
      ? `تحليل مالي ممتاز: معدل الادخار الفعلي الحقيقي هو ${savingsRate}% وهو في النطاق الاستثماري الآمن والمستدام لمستقبل الأصول لشركتك.` 
      : `Solid Financial Health: Your real-time savings rate sits at a healthy ${savingsRate}%. Capital accumulation remains on schedule.`;
  };

  return (
    <div className="space-y-6">
      
      {isLedgerEmpty ? (
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 animate-fade-in text-right" dir="rtl">
          {/* Dynamic Arabic onboarding headers */}
          <div className="space-y-2 border-b border-white/5 pb-6">
            <div className="flex items-center justify-end gap-2 text-cyan-405">
              <Sparkles className="w-5 h-5 animate-pulse text-cyan-455" />
              <h3 className="text-lg font-extrabold text-white font-sans">بوابة MORV المالية - ابدأ تهيئة خزينتك الشخصية</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-3xl">
              منصتك آمنة ونشطة بالكامل. حرصاً على مصداقية الأرقام والتقارير المحاسبية، قمنا بإزالة كافة البيانات والنسب الافتراضية. MORV تبدأ الآن كدفتر معاملات حقيقي وفارغ بانتظار مدخلاتك الشخصية الحقيقية لترتيب التدفقات، والاشتراكات، والالتزامات والادخار بالذكاء الحسابي.
            </p>
          </div>

          {/* Onboarding bento actions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-right font-sans">
            
            {/* 1. Setup Salary Card */}
            <button 
              type="button"
              onClick={() => setShowAddSalary(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">💵 ابدأ بإضافة مرتبك الشهري</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">أدخل راتبك الشهري الأساسي ومقدار السيولة والمال الحالي بخزينتك للبدء.</p>
              </div>
            </button>

            {/* 2. Record transactional Income/Expense */}
            <button 
              type="button"
              onClick={() => setShowAddTx(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">📝 أضف أول مصروف أو دخل</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">قم بتسجيل النفقات اليومية ومصادر التدفق الحقيقي لضبط الخزينة وتتبع حركاتك.</p>
              </div>
            </button>

            {/* 3. Setup Savings Goal */}
            <button 
              type="button"
              onClick={() => setShowAddGoal(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">🎯 حدد أول هدف ادخاري مالي</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">تحديد أهداف مادية واضحة والتوفير لها من التدفق الفعلي التراكمي.</p>
              </div>
            </button>

            {/* 4. Add Debts/Installments */}
            <button 
              type="button"
              onClick={() => setShowAddDebt(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-rose-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-rose-400 transition-colors">⏳ سجل التزام أو قسط أو دين</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">مراقبة المطلوبات للعملاء وتواريخ الأقساط لحفظ استقرار الائتمان.</p>
              </div>
            </button>

            {/* 5. Add Custom Category Budget Limit */}
            <button 
              type="button"
              onClick={() => setShowAddBudget(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">📉 أنشئ ميزانية تصنيف تفصيلية</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">تخصيص حدود صرف شهرية للأقسام وفئات الرعاية لوقف تجاوز الموازنة.</p>
              </div>
            </button>

            {/* 6. Add Productivity Tasks */}
            <button 
              type="button"
              onClick={() => setShowAddTask(true)}
              className="text-right p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 bg-black/40 hover:bg-black/60 transition-all duration-200 group flex flex-col justify-between h-40 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">✅ جدد مهامك المحاسبية المقررة</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-normal">ربط وتنظيم التقارير والأنشطة المالية بلوحة تتبع الإنتاجية المتكاملة.</p>
              </div>
            </button>

          </div>
        </div>
      ) : (
        <>
          {/* FINANCIAL SUMMARY HIGHLIGHT CARDS (BENTO LAYOUT) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Remaining Balance Card */}
            <div className="relative overflow-hidden bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-zinc-400">
                  {isRtl ? "صافي الرصيد الحالي" : "Net Available Ledger"}
                </span>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black font-extrabold text-xs shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                  LE
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold font-sans text-cyan-400 tracking-tight">
                  {currentNetBalance.toLocaleString()} <span className="text-sm font-normal text-zinc-400">EGP</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddSalary(true)}
                  className="mt-4 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-sans cursor-pointer focus:outline-none"
                >
                  ⚙️ {isRtl ? "إعداد الراتب والرصيد الافتتاحي" : "Configure Salary & Opening Funds"}
                </button>
              </div>
            </div>

            {/* Total Income Card */}
            <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-zinc-400">
                  {isRtl ? "إجمالي المدخولات" : "Total Business Income"}
                </span>
                <TrendingUp className="w-5 h-5 text-[#10b981]" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold font-sans text-white">
                  + {totalIncome.toLocaleString()} <span className="text-sm text-zinc-400 font-normal">EGP</span>
                </p>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${incomeProgress}%` }}></div>
                </div>
                <p className="text-xs text-zinc-550 mt-2 font-sans">
                  {userProfile?.salary 
                    ? (isRtl ? `${incomeProgress}% من راتبك المعتمد بـ ${userProfile.salary.toLocaleString()} ج.م` : `${incomeProgress}% of base ${userProfile.salary.toLocaleString()} EGP salary`)
                    : (isRtl ? "لم يتم تحديد المرتب الشهري بعد" : "Base salary remains unconfigured")}
                </p>
              </div>
            </div>

            {/* Total Expenses Card */}
            <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-zinc-400">
                  {isRtl ? "المصروفات الخارجة" : "Operating Outflows"}
                </span>
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold font-sans text-rose-455">
                  - {totalExpense.toLocaleString()} <span className="text-xs text-zinc-400 font-normal">EGP</span>
                </p>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${expenseProgress}%` }}></div>
                </div>
                <p className="text-xs text-zinc-550 mt-2 font-sans">
                  {totalBudgetLimit > 0 
                    ? (isRtl ? `مستهلك ${expenseProgress}% من ميزانيات أقسامك (${totalBudgetLimit.toLocaleString()} ج.م)` : `Used ${expenseProgress}% of total designated limits (${totalBudgetLimit.toLocaleString()} EGP)`)
                    : (isRtl ? "سقوف المصاريف الاسترشادية غير مفعّلة" : "Guideline operating budget cap is inactive")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Flow Chart */}
            <div className="lg:col-span-2 bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-white font-sans">{isRtl ? "تحليل السيولة والتدفق النقدي" : "Live Corporate Cash Flow"}</h3>
                  <p className="text-xs text-zinc-500 font-sans">{isRtl ? "تقدير تدفق مالي تراكمي بالجنيه المصري" : "Cumulative localized analytics"}</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-black rounded-xl border border-white/5">
                  <button className="text-xs font-bold px-3 py-1 bg-zinc-900 rounded-lg text-cyan-400 cursor-pointer">{isRtl ? "شهر" : "Month"}</button>
                  <button className="text-xs font-semibold px-3 py-1 text-zinc-450 hover:text-white cursor-pointer">{isRtl ? "ربع" : "Quarter"}</button>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
                    <YAxis stroke="#52525b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#080808", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="Income" name={isRtl ? "الدخل" : "Income"} stroke="#22d3ee" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="Expense" name={isRtl ? "المصاريف" : "Expense"} stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI OCR SCANNER CARD */}
            <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                  <Sparkles className="w-5 h-5 animate-pulse text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-sans">{isRtl ? "توصيات قارئ الفواتير والذكاء المالي" : "Live AI Auditing Desk"}</h3>
                </div>
                
                {/* Real dynamic AI prompt box */}
                <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs text-zinc-300 leading-relaxed font-sans mt-3 text-right" dir="rtl">
                  <p className="font-bold text-cyan-400 mb-1">💡 {isRtl ? "مشورة خبير MORV المستقرة" : "MORV AI Real Insighter"}</p>
                  <p>{getAiRecommendation()}</p>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('ocr-file-picker')?.click()}
                  className={`mt-4 border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer bg-black/40 relative duration-200 select-none ${
                    isDragging ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-white/5 hover:border-cyan-500/40'
                  }`}
                  title={isRtl ? "اسحب هنا أو اضغط للاختيار" : "Drag files here or click to browse"}
                >
                  <input 
                    id="ocr-file-picker"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelectorChange}
                    disabled={ocrLoading}
                  />
                  <UploadCloud className={`w-7 h-7 mx-auto mb-1.5 transition-transform ${isDragging ? 'text-cyan-400 -translate-y-1' : 'text-zinc-550'}`} />
                  <span className="block text-xs font-bold text-zinc-350 mb-0.5 font-sans">
                    {isRtl ? "اسحب وأدرج الوصل لقراءته" : "Drag & Drop Image or Browse"}
                  </span>
                  
                  {ocrLoading && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-cyan-400 font-sans">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جاري قراءة الفاتورة بـ MORV AI..." : "Running OCR Audits..."}</span>
                    </div>
                  )}
                </div>
              </div>

              {ocrError && (
                <div className="mt-3 p-2 text-center bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-sans">
                  ⚠️ {ocrError}
                </div>
              )}

              {ocrResult && (
                <div className="mt-4 p-3.5 bg-zinc-950/60 rounded-xl border border-cyan-500/20 text-xs text-zinc-300 space-y-3 animate-fade-in text-right" dir="rtl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isRtl ? "مراجعة تفاصيل الفاتورة المستخرجة" : "Review Extracted Invoice"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${ocrResult.confidence >= 0.85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {isRtl ? `ثقة: ${Math.round(ocrResult.confidence * 100)}%` : `Match: ${Math.round(ocrResult.confidence * 100)}%`}
                    </span>
                  </div>

                  {ocrResult.confidence < 0.85 && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-snug">
                      ⚠️ {isRtl ? "درجة دقة القراءة التلقائية منخفضة. يرجى تدقيق ومراجعة البيانات التالية يدوياً لضمان الدقة." : "Low confidence detected. Proposing manual verification of fields below."}
                    </div>
                  )}

                  {/* Editable Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "اسم المتجر" : "Vendor / Store"}</label>
                      <input 
                        type="text" 
                        value={ocrResult.vendor || ""} 
                        onChange={(e) => setOcrResult({ ...ocrResult, vendor: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-slate-200 focus:border-cyan-500 outline-none placeholder-zinc-650"
                        placeholder={isRtl ? "اسم المتجر" : "Vendor Name"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "المبلغ الإجمالي (EGP)" : "Amount (EGP)"}</label>
                        <input 
                          type="number" 
                          value={ocrResult.amount || ""} 
                          onChange={(e) => setOcrResult({ ...ocrResult, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-slate-200 font-sans focus:border-cyan-500 outline-none placeholder-zinc-650"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "طريقة الدفع" : "Payment Type"}</label>
                        <input 
                          type="text" 
                          value={ocrResult.paymentType || ""} 
                          onChange={(e) => setOcrResult({ ...ocrResult, paymentType: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-slate-200 focus:border-cyan-500 outline-none"
                          placeholder={isRtl ? "مثال: نقدي، بطاقة" : "e.g., Cash, Card"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "التاريخ" : "Date"}</label>
                        <input 
                          type="date" 
                          value={ocrResult.date || ""} 
                          onChange={(e) => setOcrResult({ ...ocrResult, date: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-slate-200 font-sans focus:border-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "التصنيف" : "Category"}</label>
                        <select 
                          value={ocrResult.category || ""} 
                          onChange={(e) => setOcrResult({ ...ocrResult, category: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-slate-200 focus:border-cyan-500 outline-none"
                        >
                          {categoriesToUse.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "العناصر المستخرجة" : "Extracted Items"}</label>
                      <textarea 
                        rows={2}
                        value={ocrResult.extractedItems?.join(", ") || ""} 
                        onChange={(e) => setOcrResult({ 
                          ...ocrResult, 
                          extractedItems: e.target.value.split(",").map(i => i.trim()).filter(Boolean) 
                        })}
                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none placeholder-zinc-650"
                        placeholder={isRtl ? "افصل بين العناصر بفاصلة" : "Separate items with comma"}
                      />
                    </div>
                  </div>

                  {/* Show original Image preview */}
                  {ocrImageBase64 && (
                    <div className="mt-2.5">
                      <span className="text-[10px] text-zinc-500 block mb-1 font-bold">{isRtl ? "صورة الفاتورة المرفوعة" : "Uploaded Receipt Image"}</span>
                      <div className="rounded-lg overflow-hidden border border-white/5 bg-black/30 flex items-center justify-center max-h-32">
                        <img 
                          src={ocrImageBase64} 
                          alt="Uploaded receipt preview" 
                          className="max-h-32 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleApplyOcrResult}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors mt-2 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>{isRtl ? "إقرار وإدراج في الحسابات" : "Approve & Add Entry"}</span>
                  </button>
                </div>
              )}

              {/* Persistent Scan Logs */}
              <div className="mt-4 border-t border-white/5 pt-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2 text-right font-bold">
                  {isRtl ? "لوح الفواتير المستخرجة المحفوظة" : "Saved Scanned Ledger Receipts"}
                </span>
                {receiptScans && receiptScans.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {receiptScans.map((scan) => (
                      <div key={scan.id} className="p-2 bg-zinc-950/20 rounded-lg border border-white/5 flex items-center justify-between text-[11px] gap-2">
                        <button 
                          onClick={() => onRemoveReceiptScan(scan.id)} 
                          className="text-rose-500 hover:text-rose-450 p-1 cursor-pointer shrink-0 transition-colors"
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-right flex-1 min-w-0">
                          <div className="font-bold text-zinc-300 truncate">{scan.vendor}</div>
                          <div className="text-[9px] text-zinc-500">
                            {scan.date} • {scan.category}
                            {scan.paymentType && ` • ${scan.paymentType}`}
                          </div>
                        </div>
                        {scan.imageDataUrl && (
                          <div 
                            onClick={() => setPreviewImageUrl(scan.imageDataUrl || null)}
                            className="shrink-0 w-8 h-8 rounded overflow-hidden border border-white/10 bg-black flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors" 
                            title={isRtl ? "عرض صورة الفاتورة" : "View Receipt Image"}
                          >
                            <img src={scan.imageDataUrl} alt="Receipt" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="font-mono text-cyan-400 font-bold shrink-0">{scan.amount} EGP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/10 border border-dashed border-white/5 rounded-xl text-center">
                    <p className="text-zinc-400 text-xs font-sans">
                      {isRtl ? "لا توجد فواتير مرفوعة حتى الآن." : "لا توجد فواتير مرفوعة حتى الآن."}
                    </p>
                    <p className="text-zinc-550 text-[10px] mt-1 font-sans">
                      {isRtl ? "قم برفع أول فاتورة لبدء التحليل الذكي." : "قم برفع أول فاتورة لبدء التحليل الذكي."}
                    </p>
                  </div>
                )}
              </div>

              {/* Real Full-Screen Preview Overlay Modal */}
              {previewImageUrl && (
                <div className="fixed inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                  <div className="relative max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-zinc-400 select-none">
                        {isRtl ? "معاينة الفاتورة المستخرجة" : "Extracted Receipt Visual Log"}
                      </span>
                      <button 
                        onClick={() => setPreviewImageUrl(null)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-805 border border-white/5 text-zinc-350 hover:text-white transition-all cursor-pointer"
                      >
                        {isRtl ? "إغلاق" : "Close"}
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto flex items-center justify-center rounded-lg bg-black/40">
                      <img 
                        src={previewImageUrl} 
                        alt="Receipt Full Preview" 
                        className="max-h-[70vh] object-contain rounded" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>

      {/* DETAILED LEDGER CONTROLS */}
      <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Navigation tabs */}
        <div className="flex flex-wrap border-b border-white/5 bg-black/40 p-2 gap-1.5">
          <button 
            onClick={() => setActiveSegment('transactions')}
            className={`px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSegment === 'transactions' ? 'bg-zinc-900 border border-white/10 text-cyan-400 font-extrabold shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📊 {isRtl ? "دفتر القيود والمعاملات" : "Transactions Ledger"}
          </button>
          
          <button 
            onClick={() => setActiveSegment('budgets')}
            className={`px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSegment === 'budgets' ? 'bg-zinc-900 border border-white/10 text-cyan-400 font-extrabold shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📉 {isRtl ? "توزيع الميزانيات" : "Budgets"}
          </button>

          <button 
            onClick={() => setActiveSegment('savings')}
            className={`px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSegment === 'savings' ? 'bg-zinc-900 border border-white/10 text-cyan-400 font-extrabold shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎯 {isRtl ? "أهداف الادخار" : "Savings Goals"}
          </button>

          <button 
            onClick={() => setActiveSegment('debts')}
            className={`px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSegment === 'debts' ? 'bg-zinc-900 border border-white/10 text-cyan-400 font-extrabold shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            💵 {isRtl ? "الديون والالتزامات" : "Debts & Claims"}
          </button>
        </div>

        {/* Dynamic Display Segment */}
        <div className="p-6">
          
          {/* 1. TRANSACTIONS TAB */}
          {activeSegment === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-white text-base font-sans">{isRtl ? "حركة الخزينة والقيود اليومية" : "Finance Transactions Data"}</h4>
                  <p className="text-xs text-zinc-500 font-sans">{isRtl ? "مراقبة تاريخ التدفقات بالنظرة التفصيلية" : "Review ledger and history"}</p>
                </div>
                <button 
                  onClick={() => setShowAddTx(true)}
                  className="bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:opacity-90 text-black px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-black stroke-[3px]" />
                  <span>{isRtl ? "إضافة قيد مالي" : "New Transaction"}</span>
                </button>
              </div>

              {/* Transactions grid list */}
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/20">
                <table className="w-full text-right border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-950/80 text-zinc-455 text-xs border-b border-white/5 font-sans">
                      <th className="p-4 text-start">{isRtl ? "المعاملة" : "Transaction Title"}</th>
                      <th className="p-4">{isRtl ? "التصنيف" : "Category"}</th>
                      <th className="p-4">{isRtl ? "الرمز كود" : "Document ref"}</th>
                      <th className="p-4 text-center">{isRtl ? "الحالة" : "Type"}</th>
                      <th className="p-4 text-start">{isRtl ? "القيمة" : "Amount"}</th>
                      <th className="p-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-sans text-zinc-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs font-sans">
                          {isRtl ? "⚠️ لا توجد قيود مسجلة بالدفتر حتى الآن." : "No transactions logged in the ledger."}
                          <p className="mt-1 text-[11px] text-zinc-550">
                            {isRtl ? "ابدأ بالضغط على 'إضافة قيد مالي' في الأعلى لتسجيل أول حركة." : "Click on 'New Transaction' above to record cash movements."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-start font-sans">
                            <p className="font-bold text-zinc-100">{tx.title}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{tx.date}</p>
                          </td>
                          <td className="p-4 text-zinc-350">{tx.category}</td>
                          <td className="p-3 font-mono text-xs text-slate-400">{tx.invoiceNo || "N/A"}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded text-xs leading-none font-bold ${
                              tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {tx.type === 'income' ? (isRtl ? 'وارد' : 'Income') : (isRtl ? 'مصروف' : 'Expense')}
                            </span>
                          </td>
                          <td className={`p-3 text-start font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                            {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()} EGP
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1 px-2 rounded text-rose-500 hover:bg-slate-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. BUDGETS TAB */}
          {activeSegment === 'budgets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-100 font-sans">{isRtl ? "حدود ميزانيات الأقسام لتتبع الإنفاق" : "Active Budget Guidelines"}</h4>
                  <p className="text-xs text-zinc-500 font-sans">{isRtl ? "وزن النفقات الإجمالية مقابل حدود ميزانيات التصنيف" : "Formulate structural spending guardrails"}</p>
                </div>
                <button 
                  onClick={() => setShowAddBudget(true)}
                  className="bg-purple-500 hover:bg-purple-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
                  <span>{isRtl ? "إعداد حد ميزانية" : "Add Budget Limit"}</span>
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className="text-center py-12 bg-black/30 border border-white/5 rounded-2xl p-6 font-sans">
                  <PieIcon className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-200">{isRtl ? "لا توجد ميزانيات أقسام نشطة بعد." : "No active budgets limits set."}</p>
                  <p className="text-xs text-zinc-500 mt-1">{isRtl ? "أنشئ سقوف نفقات للأقسام لتتبع استهلاك السيولة ومنع تجاوز الحد." : "Set a customized category limit."}</p>
                  <button 
                    onClick={() => setShowAddBudget(true)}
                    className="mt-4 bg-purple-500 hover:bg-purple-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    {isRtl ? "إنشاء ميزانية قسم" : "Define Budget Category"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {budgets.map((b) => {
                    const percent = Math.min(100, Math.floor((b.spentAmount / b.limitAmount) * 100));
                    return (
                      <div key={b.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-200">{b.category}</p>
                            <p className="text-[10px] text-slate-400">{isRtl ? "ميزانية استرشادية" : "Allowance Guide"}</p>
                          </div>
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 ${percent > 85 ? 'text-rose-400 border border-rose-500/10' : 'text-emerald-400'}`}>
                            {percent}%
                          </span>
                        </div>
                        
                        {/* Bar indicator */}
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${percent > 85 ? 'bg-rose-400' : 'bg-emerald-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-850/60">
                          <span>{isRtl ? "مستهلك:" : "Consumed:"} {b.spentAmount.toLocaleString()} EGP</span>
                          <span>{isRtl ? "الأقصى المسموح:" : "Limit:"} {b.limitAmount.toLocaleString()} EGP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. SAVINGS GOALS */}
          {activeSegment === 'savings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-100 font-sans">{isRtl ? "متابعة أهداف وحصالة المدخرات الاستشارية" : "Smart Capital Savings Goals"}</h4>
                  <p className="text-xs text-slate-500 font-sans">{isRtl ? "تنظيم وتجنيب مبالغ ومراكمة رأس المال" : "Save for major assets and growth"}</p>
                </div>
                <button 
                  onClick={() => setShowAddGoal(true)}
                  className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,182,128,0.2)]"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
                  <span>{isRtl ? "إعداد هدف جديد" : "New Goal"}</span>
                </button>
              </div>

              {savings.length === 0 ? (
                <div className="text-center py-12 bg-black/30 border border-white/5 rounded-2xl p-6 font-sans">
                  <PiggyBank className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-200">{isRtl ? "لم يتم إعداد مستهدفات وحصالة الادخار بعد." : "No savings targets defined."}</p>
                  <p className="text-xs text-zinc-500 mt-1">{isRtl ? "جدول مستهدفاتك المادية وسجل مدخراتك لمراكمتها بالذكاء المالي." : "Plan assets and manage growth."}</p>
                  <button 
                    onClick={() => setShowAddGoal(true)}
                    className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    {isRtl ? "إعداد هدف جديد" : "New Goal"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savings.map((g) => {
                    const savedPercent = Math.min(100, Math.floor((g.currentAmount / g.targetAmount) * 100));
                    return (
                      <div key={g.id} className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="w-5 h-5 text-emerald-400" />
                            <span className="font-bold text-slate-200">{g.title}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{g.dueDate}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full" style={{ width: `${savedPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-emerald-400">{isRtl ? "المدخر حالياً:" : "Current:"} {g.currentAmount.toLocaleString()} EGP</span>
                          <span className="text-slate-400">{isRtl ? "المستهدف:" : "Target:"} {g.targetAmount.toLocaleString()} EGP</span>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-850">
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = savings.map(x => x.id === g.id ? {...x, currentAmount: x.currentAmount + 1000} : x);
                              setSavings(updated);
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            💸 {isRtl ? "ادخر 1000 ج.م إضافي" : "Add 1000 EGP"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. DEBTS & CLAIMS */}
          {activeSegment === 'debts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-100 font-sans">{isRtl ? "سجل التزامات السداد والتحصيلات" : "Liabilities & Claims Ledger"}</h4>
                  <p className="text-xs text-slate-400 font-sans">{isRtl ? "تسجيل ماتريد تحصيله من العملاء أو تسديده للموردين" : "Track payable debts or collection limits"}</p>
                </div>
                <button 
                  onClick={() => setShowAddDebt(true)}
                  className="bg-rose-500 hover:bg-rose-455 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
                  <span>{isRtl ? "تسجيل مطالبة/التزام" : "Register Debt"}</span>
                </button>
              </div>

              {debts.length === 0 ? (
                <div className="text-center py-12 bg-black/30 border border-white/5 rounded-2xl p-6 font-sans">
                  <Hourglass className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-200">{isRtl ? "لا توجد التزامات سداد، أقساط، أو مطالبات عملاء." : "No debts or claims registered."}</p>
                  <p className="text-xs text-zinc-500 mt-1">{isRtl ? "حتى الآن، التزاماتك صافية ومعاملاتك الائتمانية آمنة!" : "Your debt ledger is clean and secure."}</p>
                  <button 
                    onClick={() => setShowAddDebt(true)}
                    className="mt-4 bg-rose-500 hover:bg-rose-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    {isRtl ? "تسجيل التزام" : "Register Claim or Debt"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {debts.map((d) => (
                    <div key={d.id} className="p-4 bg-slate-950/40 rounded-lg border border-slate-800 flex justify-between items-center">
                      {"to_pay" === d.type ? d.dueDate ? (
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                            d.type === 'to_pay' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {d.type === 'to_pay' ? (isRtl ? 'مستحق للمورد' : 'Payable Debt') : (isRtl ? 'مستحق تحصيله من عميل' : 'Receivable Claim')}
                          </span>
                          <p className="font-bold text-slate-200 font-sans">{d.contactName}</p>
                          <p className="text-[10px] text-slate-500 font-sans">{isRtl ? "مستحق بتاريخ:" : "Due Date:"} {d.dueDate}</p>
                        </div>
                      ) : null : (
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 bg-emerald-500/10 text-emerald-405`}>
                            {isRtl ? 'مطالبة من عميل' : 'Receivable Claim'}
                          </span>
                          <p className="font-bold text-slate-200 font-sans">{d.contactName}</p>
                          <p className="text-[10px] text-slate-500 font-sans">{isRtl ? "مستحق بتاريخ:" : "Due Date:"} {d.dueDate}</p>
                        </div>
                      )}
                      <div className="text-start">
                        <p className="font-sans font-bold text-slate-200">{d.amount.toLocaleString()} EGP</p>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = debts.map(x => x.id === d.id ? {...x, amount: 0} : x);
                            setDebts(updated.filter(x => x.amount > 0));
                          }}
                          className="mt-2 text-[10px] text-emerald-400 hover:underline block font-sans cursor-pointer focus:outline-none"
                        >
                          ✅ {isRtl ? "تسوية كاملة" : "Settle Fully"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      </>
      )}

      {/* POPUP MODALS */}
      
      {/* 1. Transaction Form Modal */}
      {showAddTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddTransactionSubmit} 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 animate-scale-up"
          >
            <h4 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-2">
              📝 {isRtl ? "إضافة قيد مالي جديد" : "Add New Transaction Record"}
            </h4>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "اسم العملية / الوصف" : "Item Title"}</label>
              <input 
                type="text" 
                value={txTitle} 
                onChange={(e) => setTxTitle(e.target.value)}
                placeholder={isRtl ? "مثال: مبيعات مشروع البرمجيات" : "Software sale"}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">{isRtl ? "نوع القيد المالي" : "Type"}</label>
                <select 
                  value={txType} 
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="expense">{isRtl ? "خارج / مصروف" : "Expense"}</option>
                  <option value="income">{isRtl ? "وارد / دخل" : "Income"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">{isRtl ? "القيمة بالجنيه" : "Value EGP"}</label>
                <input 
                  type="number" 
                  value={txAmount} 
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="3400"
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "التصنيف" : "Category"}</label>
              <select 
                value={txCategory} 
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {categoriesToUse.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "ملاحظات وتفاصيل إضافية" : "Additional Details"}</label>
              <textarea 
                value={txDesc} 
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowAddTx(false)}
                className="bg-slate-800 text-slate-400 text-xs font-bold px-4 py-2 rounded-lg"
              >
                {isRtl ? "إلغاء الأمر" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg"
              >
                {isRtl ? "حفظ القيد" : "Save and Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Savings Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddGoalSubmit} 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h4 className="text-base font-bold text-slate-100">{isRtl ? "إنشاء هدف ادخاري" : "New Savings Target"}</h4>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{isRtl ? "عنوان الهدف" : "Goal Title"}</label>
              <input 
                type="text" 
                value={goalTitle} 
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder={isRtl ? "مثال: شراء لابتوب لبرمجة MORV" : "Coding Server"}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{isRtl ? "القيمة المطلوبة" : "Target Limit"}</label>
              <input 
                type="number" 
                value={goalTarget} 
                onChange={(e) => setGoalTarget(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddGoal(false)} className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded">{isRtl ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded">{isRtl ? "حفظ" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddDebtSubmit} 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h4 className="text-base font-bold text-slate-100">{isRtl ? "تسجيل مطالبة مالية / دين" : "Register Debt / Claim"}</h4>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">{isRtl ? "اسم الطرف الثاني" : "Contact Person"}</label>
              <input 
                type="text" 
                value={debtContact} 
                onChange={(e) => setDebtContact(e.target.value)}
                placeholder={isRtl ? "مثال: مصلحة الضرائب أو المورد خالد" : "Supplier Khalid"}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{isRtl ? "تصنيف العملية" : "Type"}</label>
                <select 
                  value={debtType} 
                  onChange={(e) => setDebtType(e.target.value as 'to_pay' | 'to_collect')}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="to_pay">{isRtl ? "أنا مدين له (دفع)" : "Payable Debt"}</option>
                  <option value="to_collect">{isRtl ? "هو مدين لي (تحصيل)" : "Receivable Claim"}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">{isRtl ? "القيمة بالجنيه" : "Value"}</label>
                <input 
                  type="number" 
                  value={debtAmount} 
                  onChange={(e) => setDebtAmount(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddDebt(false)} className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded">{isRtl ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded">{isRtl ? "حفظ" : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Salary & Launch Funds Modal */}
      {showAddSalary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSalarySubmit} 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h4 className="text-base font-bold text-slate-100 font-sans">💵 {isRtl ? "تهيئة الراتب والسيولة النقدية" : "Setup base Funds & Salary"}</h4>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-sans">
              {isRtl ? "تتأسس الحسابات والتدفقات بناء على المدخل الأساسي للراتب والمبلغ المتاح حالياً بخزينتك." : "Initial cash balance and salary drive future metrics."}
            </p>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "الراتب الشهري الأساسي (ج.م)" : "Monthly Salary (EGP)"}</label>
              <input 
                type="number" 
                value={inputSalary} 
                onChange={(e) => setInputSalary(e.target.value)}
                placeholder={userProfile?.salary?.toString() || "25000"}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 font-sans">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "الرصيد/السيولة الأولية بالمحفظة (ج.م)" : "Initial Capital Balance (EGP)"}</label>
              <input 
                type="number" 
                value={inputInitialBalance} 
                onChange={(e) => setInputInitialBalance(e.target.value)}
                placeholder={userProfile?.balanceEGP?.toString() || "100000"}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddSalary(false)} className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded">{isRtl ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded">{isRtl ? "حفظ وتثبيت" : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Budget category Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleBudgetSubmit} 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h4 className="text-base font-bold text-slate-100 font-sans">📉 {isRtl ? "تعيين ميزانية وسقف مالي" : "Define Budget Category Limit"}</h4>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "اسم القسم أو التصنيف المخصص" : "Category Name"}</label>
              <input 
                type="text" 
                value={inputBudgetCategory} 
                onChange={(e) => setInputBudgetCategory(e.target.value)}
                placeholder={isRtl ? "مثال: مأكولات، سيرفرات، إعلانات" : "Servers, Dining"}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "سقف الإنفاق الأقصى (ج.م)" : "Budget Spending Limit"}</label>
              <input 
                type="number" 
                value={inputBudgetLimit} 
                onChange={(e) => setInputBudgetLimit(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddBudget(false)} className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded">{isRtl ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="bg-purple-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded">{isRtl ? "حفظ" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Accounting Productivity Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddTaskSubmit} 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h4 className="text-base font-bold text-slate-100 font-sans">✅ {isRtl ? "إضافة مهمة تشغيلية/مالية" : "Log Action Plan Task"}</h4>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">{isRtl ? "عنوان المهمة" : "Task Title"}</label>
              <input 
                type="text" 
                value={inputTaskTitle} 
                onChange={(e) => setInputTaskTitle(e.target.value)}
                placeholder={isRtl ? "مثال: مراجعة الإقرار الضريبي للربع الأول" : "Review Q1 tax reports"}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">{isRtl ? "الأهمية / الأولوية" : "Priority"}</label>
                <select 
                  value={inputTaskPriority} 
                  onChange={(e) => setInputTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="high">{isRtl ? "عالية جداً" : "High"}</option>
                  <option value="medium">{isRtl ? "متوسطة" : "Medium"}</option>
                  <option value="low">{isRtl ? "منخفضة" : "Low"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">{isRtl ? "القسم والمظلة" : "Category"}</label>
                <input 
                  type="text" 
                  value={inputTaskCategory} 
                  onChange={(e) => setInputTaskCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddTask(false)} className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded">{isRtl ? "إلغاء" : "Cancel"}</button>
              <button type="submit" className="bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded">{isRtl ? "تأكيد المهمة" : "Add Task"}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
