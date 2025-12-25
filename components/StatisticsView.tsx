
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PieChart, BarChart3, Trophy, AlertTriangle, Lightbulb, Zap, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Task } from '../types';
import { useLanguage } from '../services/i18n';
import { getLocalISODate } from '../services/dateUtils';

interface StatisticsViewProps {
    tasks: Task[];
}

type TimeRange = 'day' | 'week' | 'month' | 'custom';

// Gamification Logic
const getStatus = (percentage: number) => {
    if (percentage < 40) return { titleKey: 'stats.level_3', descKey: 'stats.level_3_desc', icon: AlertTriangle, color: 'text-orange-400' };
    if (percentage < 80) return { titleKey: 'stats.level_7', descKey: 'stats.level_7_desc', icon: Lightbulb, color: 'text-blue-400' };
    if (percentage < 100) return { titleKey: 'stats.level_11', descKey: 'stats.level_11_desc', icon: Zap, color: 'text-purple-400' };
    return { titleKey: 'stats.level_14', descKey: 'stats.level_14_desc', icon: Crown, color: 'text-yellow-400' };
};

const StatisticsView: React.FC<StatisticsViewProps> = ({ tasks }) => {
    const { t, language } = useLanguage();
    const [range, setRange] = useState<TimeRange>('day');
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- Helpers ---
    const getStartEnd = () => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (range === 'day') {
            // Start/End is same day
        } else if (range === 'week') {
            const day = start.getDay() || 7; // ISO week (1-7)
            if (day !== 1) start.setHours(-24 * (day - 1)); // Go to Monday
            end.setTime(start.getTime() + 6 * 24 * 60 * 60 * 1000); // Go to Sunday
        } else if (range === 'month') {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
        }
        return { start, end };
    };

    const { start, end } = getStartEnd();

    // --- Navigation ---
    const navigate = (dir: 1 | -1) => {
        const newDate = new Date(currentDate);
        if (range === 'day') newDate.setDate(newDate.getDate() + dir);
        else if (range === 'week') newDate.setDate(newDate.getDate() + (dir * 7));
        else if (range === 'month') newDate.setMonth(newDate.getMonth() + dir);
        setCurrentDate(newDate);
    };

    // --- Data Filtering & Processing ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const taskDate = new Date(task.date);
            // Reset time part for safe comparison
            const s = new Date(start); s.setHours(0, 0, 0, 0);
            const e = new Date(end); e.setHours(23, 59, 59, 999);
            const t = new Date(taskDate); t.setHours(12, 0, 0, 0); // mid-day to avoid offset issues

            return t >= s && t <= e;
        });
    }, [tasks, start, end]);

    const metrics = useMemo(() => {
        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, pending, rate };
    }, [filteredTasks]);

    // --- Chart Data ---
    const donutData = [
        { name: 'Completed', value: metrics.completed, color: '#22c55e' },
        { name: 'Pending', value: metrics.pending, color: '#3b82f6' }
    ];

    const barData = useMemo(() => {
        if (range !== 'week') return [];
        const days = language === 'id' ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] :
            language === 'es' ? ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'] :
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Initialize map
        const data = days.map(d => ({ name: d, completed: 0, total: 0 }));

        filteredTasks.forEach(task => {
            const d = new Date(task.date);
            const dayIdx = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
            data[dayIdx].total++;
            if (task.completed) data[dayIdx].completed++;
        });
        return data;
    }, [filteredTasks, range, language]);

    const lineData = useMemo(() => {
        if (range !== 'month') return [];
        // Group by date
        const groups: { [key: string]: { total: number, completed: number } } = {};

        // Fill all days of month
        const d = new Date(start);
        while (d <= end) {
            const dateStr = d.getDate().toString();
            groups[dateStr] = { total: 0, completed: 0 };
            d.setDate(d.getDate() + 1);
        }

        filteredTasks.forEach(task => {
            const dom = new Date(task.date).getDate().toString();
            if (groups[dom]) {
                groups[dom].total++;
                if (task.completed) groups[dom].completed++;
            }
        });

        return Object.keys(groups).map(k => ({
            name: k,
            completed: groups[k].completed,
            total: groups[k].total
        }));
    }, [filteredTasks, start, end, range]);

    // --- Gamification ---
    const status = getStatus(metrics.rate);
    const StatusIcon = status.icon;

    // --- Format Header ---
    const formatDateRange = () => {
        const ops: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        if (range === 'day') return start.toLocaleDateString(language, { ...ops, weekday: 'short', year: 'numeric' });
        if (range === 'month') return start.toLocaleDateString(language, { month: 'long', year: 'numeric' });
        return `${start.toLocaleDateString(language, ops)} - ${end.toLocaleDateString(language, ops)}`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 p-4 md:p-8 overflow-y-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <BarChart3 className="text-blue-500" size={32} />
                        <h2 className="text-2xl md:text-3xl font-bold text-white">{t('stats.title')}</h2>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => navigate(-1)} className="p-2 hover:text-white text-slate-400"><ChevronLeft size={20} /></button>
                        <span className="px-4 font-mono font-bold text-sm text-blue-200 min-w-[140px] text-center capitalize">
                            {formatDateRange()}
                        </span>
                        <button onClick={() => navigate(1)} className="p-2 hover:text-white text-slate-400"><ChevronRight size={20} /></button>
                    </div>
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        {(['day', 'week', 'month'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${range === r ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {t(`stats.range_${r}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">{t('stats.total_tasks')}</p>
                    <p className="text-2xl font-mono text-white">{metrics.total}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">{t('stats.completed')}</p>
                    <p className="text-2xl font-mono text-green-400">{metrics.completed}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">{t('stats.pending')}</p>
                    <p className="text-2xl font-mono text-blue-400">{metrics.pending}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <Trophy size={48} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">{t('stats.success_rate')}</p>
                    <p className={`text-2xl font-mono ${metrics.rate >= 80 ? 'text-yellow-400' : 'text-white'}`}>{metrics.rate}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Main Search/Chart Area */}
                <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl min-h-[300px] flex flex-col">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <PieChart size={18} className="text-purple-400" />
                        Analytics ({t(`stats.range_${range}`)})
                    </h3>

                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {range === 'day' ? (
                                <RechartsPie>
                                    <Pie
                                        data={donutData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RechartsPie>
                            ) : range === 'week' ? (
                                <BarChart data={barData}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="total" fill="#334155" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : (
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gamification Status */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className={`absolute inset-0 opacity-5 bg-${status.color.split('-')[1]}-500/5`}></div>
                    <div className={`w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center mb-6 border-4 border-slate-800 ${status.color} shadow-2xl`}>
                        <StatusIcon size={40} />
                    </div>

                    <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">{t('stats.status_title')}</h3>
                    <h2 className={`text-2xl font-bold mb-3 ${status.color}`}>{t(status.titleKey)}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
                        "{t(status.descKey)}"
                    </p>

                    <div className="w-full bg-slate-950 h-2 rounded-full mt-8 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-purple-500`}
                            style={{ width: `${metrics.rate}%` }}
                        ></div>
                    </div>
                    <p className="text-right w-full text-[10px] text-slate-500 mt-2 font-mono">{metrics.rate}/100 XP</p>
                </div>
            </div>
        </div>
    );
};

export default StatisticsView;
