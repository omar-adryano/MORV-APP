import { useState, FormEvent } from "react";
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2, 
  CalendarDays, 
  Activity, 
  Sparkles, 
  Flame, 
  Check, 
  ListTodo,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { Task, Habit } from "../types";

interface TasksProps {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  lang: 'ar' | 'en';
}

export default function TaskProductivity({
  tasks,
  setTasks,
  lang
}: TasksProps) {
  const isRtl = lang === 'ar';

  // Habits lists state 
  const [habits, setHabits] = useState<Habit[]>([
    { id: "h1", name: isRtl ? "مراجعة تقرير الخزينة اليومي" : "Daily Treasury Balance Check", streak: 5, completedToday: true },
    { id: "h2", name: isRtl ? "تجهيز فواتير عملاء الدعم" : "Deploy client invoice reminders", streak: 12, completedToday: false },
    { id: "h3", name: isRtl ? "تخطيط ميزانية تسويق June" : "Audit weekly marketing budgets", streak: 3, completedToday: false }
  ]);

  // Task list filters
  const [filterSegment, setFilterSegment] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskCategory, setTaskCategory] = useState("أعمال / Business");

  // Statistics calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const productivityPercentage = totalTasksCount > 0 ? Math.floor((completedTasksCount / totalTasksCount) * 100) : 100;

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    const newTask: Task = {
      id: "tsk_" + Date.now(),
      title: taskTitle,
      completed: false,
      priority: taskPriority,
      category: taskCategory,
      dueDate: new Date().toISOString().split('T')[0],
      time: "10:00"
    };
    setTasks([...tasks, newTask]);
    setTaskTitle("");
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Toggle habit trigger
  const handleToggleHabit = (id: string) => {
    const updated = habits.map(h => {
      if (h.id === id) {
        const completed = !h.completedToday;
        return {
          ...h,
          completedToday: completed,
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    });
    setHabits(updated);
  };

  // Filter tasks output
  const filteredTasks = tasks.filter(t => {
    if (filterSegment === 'pending') return !t.completed;
    if (filterSegment === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: ACTIVE SPREADSHEETS AND CREATION */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Task Planner Card */}
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-sans">
                <ListTodo className="w-5 h-5 text-cyan-400" />
                {isRtl ? "منظم ومجدول المهام اليومية" : "Daily Planner Engine"}
              </h3>
              <p className="text-xs text-zinc-450 font-sans mt-0.5">
                {isRtl ? "تنظيم مصفوفة المهام وتحديد مستويات الأهمية لدعم مبيعات شركتك" : "Sequence objectives of high strategic value"}
              </p>
            </div>

            {/* Quick Filter toggle sliders */}
            <div className="flex p-1 bg-black rounded-xl border border-white/5 shrink-0 font-sans">
              <button 
                onClick={() => setFilterSegment('all')}
                className={`text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterSegment === 'all' ? 'bg-zinc-900 text-cyan-400 font-bold' : 'text-zinc-500'
                }`}
              >
                {isRtl ? "الكل" : "All"}
              </button>
              <button 
                onClick={() => setFilterSegment('pending')}
                className={`text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterSegment === 'pending' ? 'bg-zinc-900 text-cyan-400 font-bold' : 'text-zinc-500'
                }`}
              >
                {isRtl ? "قيد التنفيذ" : "Pending"}
              </button>
              <button 
                onClick={() => setFilterSegment('completed')}
                className={`text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterSegment === 'completed' ? 'bg-zinc-900 text-cyan-400 font-bold' : 'text-zinc-500'
                }`}
              >
                {isRtl ? "المكتملة" : "Completed"}
              </button>
            </div>
          </div>

          {/* Inline creation widget */}
          <form onSubmit={handleAddTask} className="flex gap-2.5 mb-6">
            <input 
              type="text" 
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={isRtl ? "اكتب هنا مهمتك الجديدة.. مثال: تدقيق فواتير الضرائب" : "What is the next enterprise task?"}
              className="flex-1 bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
              required
            />
            
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="hidden sm:block bg-black border border-white/5 text-xs rounded-xl px-3 text-zinc-300 focus:border-cyan-500/50 focus:outline-none font-sans"
            >
              <option value="high">🔴 {isRtl ? "عاجل" : "High"}</option>
              <option value="medium">🟡 {isRtl ? "متوسط" : "Medium"}</option>
              <option value="low">🟢 {isRtl ? "منخفض" : "Low"}</option>
            </select>

            <button 
              type="submit"
              className="bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:opacity-90 text-black px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black stroke-[3px]" />
              <span className="hidden sm:inline">{isRtl ? "إضافة" : "Add"}</span>
            </button>
          </form>

          {/* Tasks Grid listings */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
               <div className="text-center py-12 text-zinc-500 font-sans">
                <Check className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                <p className="text-sm">{isRtl ? "كل المهام تمت جدولتها بنجاح يا فندم!" : "No tasks selected for this filter."}</p>
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div 
                  key={t.id} 
                  className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                    t.completed 
                      ? 'bg-black/20 border-white/5 opacity-55 shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]' 
                      : 'bg-[#0f0f0f]/60 border-white/5 hover:border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button 
                      type="button" 
                      onClick={() => handleToggleTask(t.id)}
                      className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${t.completed ? 'text-cyan-400' : 'text-zinc-550 hover:text-cyan-400'}`}
                    >
                      {t.completed ? <CheckCircle className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
                    </button>
                    
                    <div className="min-w-0 font-sans">
                      <span className={`block text-xs text-zinc-150 ${t.completed ? 'line-through text-zinc-500 font-light' : 'font-semibold'}`}>
                        {t.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-sans">
                        <span className="flex items-center gap-0.5 text-zinc-500">
                          <Clock className="w-3 text-cyan-550" /> {t.dueDate}
                        </span>
                        <span>•</span>
                        <span className="bg-zinc-950 px-2 py-0.5 rounded-lg text-zinc-400 border border-white/5">{t.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold leading-none font-mono ${
                      t.priority === 'high' 
                        ? 'bg-rose-500/10 text-rose-455 border border-rose-500/10' 
                        : t.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                    }`}>
                      {t.priority === 'high' ? (isRtl ? 'عاجل جداً' : 'Urgent') : t.priority === 'medium' ? (isRtl ? 'متوسط' : 'Medium') : (isRtl ? 'بسيط' : 'Normal')}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 rounded text-rose-455 hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ANALYTICS CARDS & HABITS MATRICES */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Productivity gauges */}
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2 font-sans">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h4 className="font-extrabold text-white text-sm">{isRtl ? "معدل الإنتاجية اليومية" : "Productivity Meter"}</h4>
          </div>

          <div className="text-center py-5 bg-black/40 rounded-xl border border-white/5 p-4 font-sans">
            <span className="block text-4xl font-extrabold font-sans bg-gradient-to-tr from-cyan-400 to-emerald-455 bg-clip-text text-transparent mb-1">{productivityPercentage}%</span>
            <span className="block text-xs text-zinc-500 mt-1">
              {isRtl ? `جاري إكمال ${completedTasksCount} مهمة من أصل ${totalTasksCount}` : `Completed ${completedTasksCount} out of ${totalTasksCount}`}
            </span>
            
            <div className="w-full bg-zinc-955 h-2.5 mt-4 rounded-full overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500" style={{ width: `${productivityPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Daily Habit Tracker Ring */}
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4 font-sans">
            <div className="flex items-center gap-2 text-white">
              <Flame className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
              <h4 className="font-extrabold text-sm">{isRtl ? "متابعة العادات اليومية" : "Habit Tracker Matrix"}</h4>
            </div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">streaks</span>
          </div>

          <div className="space-y-3">
            {habits.map((h) => (
              <div 
                key={h.id}
                className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between transition-all hover:border-cyan-500/15 font-sans"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleHabit(h.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      h.completedToday 
                        ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 border-transparent text-black' 
                        : 'border-zinc-800 text-transparent hover:border-cyan-500/40'
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[3px] ${h.completedToday ? 'text-black' : 'text-transparent'}`} />
                  </button>
                  <span className={`text-xs text-zinc-200 mt-0.5 ${h.completedToday ? 'font-medium text-zinc-500 line-through' : ''}`}>
                    {h.name}
                  </span>
                </div>

                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-full border border-amber-500/10">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {h.streak}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
