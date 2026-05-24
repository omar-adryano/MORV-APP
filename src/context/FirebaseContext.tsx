import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Transaction, 
  Budget, 
  SavingsGoal, 
  Debt, 
  Subscription, 
  Task, 
  Habit, 
  Invoice, 
  FileDoc, 
  UserProfile, 
  ChatMessage,
  ReceiptScan,
  AppNotification,
  AnalyticsHistoryRecord
} from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authError: string;
  userProfile: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  savings: SavingsGoal[];
  debts: Debt[];
  subscriptions: Subscription[];
  tasks: Task[];
  habits: Habit[];
  files: FileDoc[];
  chatHistory: ChatMessage[];
  receiptScans: ReceiptScan[];
  notifications: AppNotification[];
  analyticsHistory: AnalyticsHistoryRecord[];
  handleEmailSignup: (name: string, email: string, pass: string) => Promise<void>;
  handleEmailSignin: (email: string, pass: string) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  onSubmitTransaction: (tx: Transaction) => Promise<void>;
  onRemoveTransaction: (id: string) => Promise<void>;
  onSubmitBudget: (budget: Budget) => Promise<void>;
  onSubmitSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  onSubmitDebt: (debt: Debt) => Promise<void>;
  onSubmitSubscription: (sub: Subscription) => Promise<void>;
  onToggleSubscription: (id: string) => Promise<void>;
  onSubmitTask: (task: Task) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onSubmitHabit: (habit: Habit) => Promise<void>;
  onTriggerHabitStreak: (id: string) => Promise<void>;
  onSubmitInvoice: (invoice: Invoice) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onSubmitFile: (file: FileDoc) => Promise<void>;
  onRemoveFile: (id: string) => Promise<void>;
  onAddChatMessage: (msg: ChatMessage) => Promise<void>;
  onClearChatHistory: () => Promise<void>;
  onSubmitReceiptScan: (scan: ReceiptScan) => Promise<void>;
  onRemoveReceiptScan: (id: string) => Promise<void>;
  onSubmitNotification: (notification: AppNotification) => Promise<void>;
  onRemoveNotification: (id: string) => Promise<void>;
  onMarkNotificationRead: (id: string) => Promise<void>;
  onSubmitAnalyticsRecord: (record: AnalyticsHistoryRecord) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: "مدير جديد",
  email: "finance@morv.eg",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
  role: "المدير المالي - Cash Officer",
  balanceEGP: 0,
  monthlySavingsGoal: 0,
  salary: 0,
  currency: "EGP",
  theme: "dark"
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>("");

  // Local state mirrored from Firestore or fallbacks during pending connection
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [receiptScans, setReceiptScans] = useState<ReceiptScan[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [analyticsHistory, setAnalyticsHistory] = useState<AnalyticsHistoryRecord[]>([]);

  // Monitor auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthError("");
      
      if (currentUser) {
        // Build listeners
        setupRealtimeListeners(currentUser.uid);
      } else {
        // Clear references
        setLoading(false);
        setUserProfile(DEFAULT_PROFILE);
        setTransactions([]);
        setBudgets([]);
        setSavings([]);
        setDebts([]);
        setSubscriptions([]);
        setTasks([]);
        setHabits([]);
        setFiles([]);
        setReceiptScans([]);
        setNotifications([]);
        setAnalyticsHistory([]);
        setChatHistory([
          { 
            id: "wel_1", 
            sender: 'assistant', 
            text: "أهلاً بك يا فندم في منصة MORV الذكية لإدارة أموالك وأعمالك. أنا MORV AI مساعدك المالي الحسابي المرتبط في مصر والوطن العربي.\n\nيمكنني مساعدتك في:\n1. تحليل التدفقات النقدية والأرباح.\n2. تقديم توصيات وتنبيهات ادخار ذكية بالجنيه المصري.\n3. قراءة الفواتير وتصنيف المعاملات لشركتك.\n\nكيف يمكنني تسهيل دورك القيادي التجاري اليوم؟", 
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupRealtimeListeners = (uid: string) => {
    const parentPath = `users/${uid}`;

    // 1. Profile listener
    onSnapshot(doc(db, 'users', uid), async (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Document doesn't exist yet, seed initial localized demo data for a pristine user experience
        try {
          const initialProf: UserProfile = {
            name: auth.currentUser?.displayName || "مدير جديد",
            email: auth.currentUser?.email || "owner@morv.eg",
            avatarUrl: auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
            role: "مؤسس الشركة - Founder",
            balanceEGP: 0,
            monthlySavingsGoal: 0,
            salary: 0,
            currency: "EGP",
            theme: "dark"
          };
          await setDoc(doc(db, 'users', uid), initialProf);
          setUserProfile(initialProf);
          await seedInitialData(uid);
        } catch (err) {
          console.error("Failed to seed initial user profile: ", err);
        }
      }
      setLoading(false);
    }, (error) => {
      // Catch Firestore permission violations safely matching instructions JSON specs
      handleFirestoreError(error, OperationType.GET, parentPath);
    });

    // 2. Transactions
    onSnapshot(collection(db, 'users', uid, 'transactions'), (snap) => {
      const list: Transaction[] = [];
      snap.forEach(d => list.push(d.data() as Transaction));
      // Sort desc by date
      list.sort((a,b) => b.date.localeCompare(a.date));
      setTransactions(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/transactions`));

    // 3. Budgets
    onSnapshot(collection(db, 'users', uid, 'budgets'), (snap) => {
      const list: Budget[] = [];
      snap.forEach(d => list.push(d.data() as Budget));
      setBudgets(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/budgets`));

    // 4. Savings
    onSnapshot(collection(db, 'users', uid, 'savingsGoals'), (snap) => {
      const list: SavingsGoal[] = [];
      snap.forEach(d => list.push(d.data() as SavingsGoal));
      setSavings(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/savingsGoals`));

    // 5. Debts
    onSnapshot(collection(db, 'users', uid, 'debts'), (snap) => {
      const list: Debt[] = [];
      snap.forEach(d => list.push(d.data() as Debt));
      setDebts(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/debts`));

    // 6. Subscriptions
    onSnapshot(collection(db, 'users', uid, 'subscriptions'), (snap) => {
      const list: Subscription[] = [];
      snap.forEach(d => list.push(d.data() as Subscription));
      setSubscriptions(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/subscriptions`));

    // 7. Tasks
    onSnapshot(collection(db, 'users', uid, 'tasks'), (snap) => {
      const list: Task[] = [];
      snap.forEach(d => list.push(d.data() as Task));
      setTasks(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/tasks`));

    // 8. Habits
    onSnapshot(collection(db, 'users', uid, 'habits'), (snap) => {
      const list: Habit[] = [];
      snap.forEach(d => list.push(d.data() as Habit));
      setHabits(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/habits`));

    // 9. Files
    onSnapshot(collection(db, 'users', uid, 'files'), (snap) => {
      const list: FileDoc[] = [];
      snap.forEach(d => list.push(d.data() as FileDoc));
      setFiles(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/files`));

    // 10. Chat
    onSnapshot(collection(db, 'users', uid, 'chatHistory'), (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach(d => list.push(d.data() as ChatMessage));
      list.sort((a,b) => a.timestamp.localeCompare(b.timestamp));
      setChatHistory(list.length > 0 ? list : [
        { 
          id: "wel_1", 
          sender: 'assistant', 
          text: "أهلاً بك يا فندم في منصة MORV الذكية لإدارة أموالك وأعمالك. أنا MORV AI مساعدك المالي الحسابي المرتبط في مصر والوطن العربي.\n\nيمكنني مساعدتك في:\n1. تحليل التدفقات النقدية والأرباح.\n2. تقديم توصيات وتنبيهات ادخار ذكية بالجنيه المصري.\n3. قراءة الفواتير وتصنيف المعاملات لشركتك.\n\nكيف يمكنني تسهيل دورك القيادي التجاري اليوم؟", 
          timestamp: new Date().toISOString() 
        }
      ]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/chatHistory`));

    // 11. Receipt Scans
    onSnapshot(collection(db, 'users', uid, 'receiptScans'), (snap) => {
      const list: ReceiptScan[] = [];
      snap.forEach(d => list.push(d.data() as ReceiptScan));
      setReceiptScans(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/receiptScans`));

    // 12. Persistent Notifications
    onSnapshot(collection(db, 'users', uid, 'notifications'), (snap) => {
      const list: AppNotification[] = [];
      snap.forEach(d => list.push(d.data() as AppNotification));
      list.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
      setNotifications(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/notifications`));

    // 13. Analytics snapshots record history
    onSnapshot(collection(db, 'users', uid, 'analyticsHistory'), (snap) => {
      const list: AnalyticsHistoryRecord[] = [];
      snap.forEach(d => list.push(d.data() as AnalyticsHistoryRecord));
      list.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
      setAnalyticsHistory(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `${parentPath}/analyticsHistory`));
  };

  // Seed sample database for pristine demo
  const seedInitialData = async (uid: string) => {
    try {
      // Clear database starter seeding for pristine, user-driven empty states
      const welcomeNotification: AppNotification = {
        id: "nt_onboarding",
        title: "مرحباً بك في منصة MORV الماليّة 🚀",
        message: "ابدأ مسارك الآن بإضافة ملفك المالي وإدخال 'الراتب الأساسي' أو 'رأس المال الأولي' لتفعيل حاسبة التدفق الذكي.",
        type: "info",
        timestamp: new Date().toISOString(),
        isRead: false
      };
      await setDoc(doc(db, 'users', uid, 'notifications', welcomeNotification.id), welcomeNotification);
    } catch (err) {
      console.error("Failed to seed initial user dataset: ", err);
    }
  };

  const translateAuthError = (err: any): string => {
    const code = err?.code || "";
    if (code === "auth/operation-not-allowed") {
      return "خطأ: ميزة التسجيل بالبريد وكلمة المرور معطلة حالياً في مشروع Firebase. يرجى تفعيلها من لوحة التحكم (Authentication -> Sign-in method -> Email/Password).";
    }
    if (code === "auth/invalid-email") {
      return "يرجى كتابة عنوان بريد إلكتروني صحيح.";
    }
    if (code === "auth/user-disabled") {
      return "تم إيقاف هذا الحساب التجاري. يرجى مراجعة المسؤولين.";
    }
    if (code === "auth/user-not-found") {
      return "لا يوجد حساب مسجل بهذا البريد الإلكتروني.";
    }
    if (code === "auth/wrong-password") {
      return "كلمة المرور غير صحيحة. يرجى مراجعة الحقل والمحاولة مجدداً.";
    }
    if (code === "auth/email-already-in-use") {
      return "صندوق البريد هذا مسجل بالفعل لحساب تجاري آخر.";
    }
    if (code === "auth/weak-password") {
      return "كلمة المرور ضعيفة للغاية. يرجى إدخال 6 أحرف أو أرقام على الأقل.";
    }
    if (code === "auth/invalid-credential") {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "تم إغلاق نافذة المصادقة المنبثقة للتحقق قبل الاكتمال.";
    }
    return err?.message || "حدث خطأ غير متوقع أثناء عملية التحقق والأمان.";
  };

  // Auth operations
  const handleEmailSignup = async (name: string, email: string, pass: string) => {
    try {
      setAuthError("");
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = credential.user.uid;
      const initialProf: UserProfile = {
        name,
        email,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
        role: "مؤسس الشركة - Founder",
        balanceEGP: 0,
        monthlySavingsGoal: 0,
        salary: 0,
        currency: "EGP",
        theme: "dark"
      };
      await setDoc(doc(db, 'users', uid), initialProf);
      setUserProfile(initialProf);
      await seedInitialData(uid);
    } catch (err: any) {
      const translated = translateAuthError(err);
      setAuthError(translated);
      throw new Error(translated);
    }
  };

  const handleEmailSignin = async (email: string, pass: string) => {
    try {
      setAuthError("");
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const translated = translateAuthError(err);
      setAuthError(translated);
      throw new Error(translated);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const translated = translateAuthError(err);
      setAuthError(translated);
      throw new Error(translated);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // Client Mutations sync to Firestore
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const updated = { ...userProfile, ...profile };
      await setDoc(doc(db, 'users', user.uid), updated);
      setUserProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitTransaction = async (tx: Transaction) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${tx.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', tx.id), tx);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onRemoveTransaction = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onSubmitBudget = async (budget: Budget) => {
    if (!user) return;
    const path = `users/${user.uid}/budgets/${budget.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'budgets', budget.id), budget);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitSavingsGoal = async (goal: SavingsGoal) => {
    if (!user) return;
    const path = `users/${user.uid}/savingsGoals/${goal.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'savingsGoals', goal.id), goal);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitDebt = async (debt: Debt) => {
    if (!user) return;
    const path = `users/${user.uid}/debts/${debt.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'debts', debt.id), debt);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitSubscription = async (sub: Subscription) => {
    if (!user) return;
    const path = `users/${user.uid}/subscriptions/${sub.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'subscriptions', sub.id), sub);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onToggleSubscription = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/subscriptions/${id}`;
    try {
      const match = subscriptions.find(s => s.id === id);
      if (match) {
        await setDoc(doc(db, 'users', user.uid, 'subscriptions', id), {
          ...match,
          isActive: !match.isActive
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitTask = async (task: Task) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${task.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onToggleTask = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const match = tasks.find(t => t.id === id);
      if (match) {
        await setDoc(doc(db, 'users', user.uid, 'tasks', id), {
          ...match,
          completed: !match.completed
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitHabit = async (habit: Habit) => {
    if (!user) return;
    const path = `users/${user.uid}/habits/${habit.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'habits', habit.id), habit);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onTriggerHabitStreak = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/habits/${id}`;
    try {
      const match = habits.find(h => h.id === id);
      if (match) {
        const compl = !match.completedToday;
        await setDoc(doc(db, 'users', user.uid, 'habits', id), {
          ...match,
          completedToday: compl,
          streak: compl ? match.streak + 1 : Math.max(0, match.streak - 1)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitInvoice = async (invoice: Invoice) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${invoice.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'invoices', invoice.id), invoice);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onDeleteInvoice = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'invoices', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onSubmitFile = async (file: FileDoc) => {
    if (!user) return;
    const path = `users/${user.uid}/files/${file.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'files', file.id), file);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onRemoveFile = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/files/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'files', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onAddChatMessage = async (msg: ChatMessage) => {
    if (!user) return;
    const path = `users/${user.uid}/chatHistory/${msg.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'chatHistory', msg.id), msg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onClearChatHistory = async () => {
    if (!user) return;
    const path = `users/${user.uid}/chatHistory`;
    try {
      // For simplicity/safety, we can't delete bulk easily via security rules block-updates.
      // So we can delete items iteratively or clear state locally/overwrite.
      for(const m of chatHistory) {
         await deleteDoc(doc(db, 'users', user.uid, 'chatHistory', m.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onSubmitReceiptScan = async (scan: ReceiptScan) => {
    if (!user) return;
    const path = `users/${user.uid}/receiptScans/${scan.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'receiptScans', scan.id), scan);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onRemoveReceiptScan = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/receiptScans/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'receiptScans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onSubmitNotification = async (notification: AppNotification) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications/${notification.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'notifications', notification.id), notification);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onRemoveNotification = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const onMarkNotificationRead = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications/${id}`;
    try {
      const match = notifications.find(n => n.id === id);
      if (match) {
        await setDoc(doc(db, 'users', user.uid, 'notifications', id), {
          ...match,
          isRead: true
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onSubmitAnalyticsRecord = async (record: AnalyticsHistoryRecord) => {
    if (!user) return;
    const path = `users/${user.uid}/analyticsHistory/${record.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'analyticsHistory', record.id), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <FirebaseContext.Provider value={{
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
      habits,
      files,
      chatHistory,
      receiptScans,
      notifications,
      analyticsHistory,
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
      onToggleSubscription,
      onSubmitTask,
      onToggleTask,
      onSubmitHabit,
      onTriggerHabitStreak,
      onSubmitInvoice,
      onDeleteInvoice,
      onSubmitFile,
      onRemoveFile,
      onAddChatMessage,
      onClearChatHistory,
      onSubmitReceiptScan,
      onRemoveReceiptScan,
      onSubmitNotification,
      onRemoveNotification,
      onMarkNotificationRead,
      onSubmitAnalyticsRecord
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
