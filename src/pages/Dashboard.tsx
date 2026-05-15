import React, { useEffect, useState } from 'react';
import { collectionGroup, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Task, Project } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Layout as LayoutIcon, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Query projects where user is a member
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(projectsRef, where('memberIds', 'array-contains', user.uid));
        const projectsSnap = await getDocs(projectsQuery);
        setProjectsCount(projectsSnap.size);

        const allTasks: Task[] = [];
        for (const pDoc of projectsSnap.docs) {
          const tasksRef = collection(db, 'projects', pDoc.id, 'tasks');
          const tasksSnap = await getDocs(tasksRef);
          tasksSnap.forEach(tDoc => {
            allTasks.push({ id: tDoc.id, ...tDoc.data() } as Task);
          });
        }
        setTasks(allTasks);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('Down'));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'To Do').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    done: tasks.filter(t => t.status === 'Done').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      return new Date(t.dueDate) < new Date();
    }).length
  };

  const statusData = [
    { name: 'To Do', value: stats.todo, color: '#6B7280' },
    { name: 'In Progress', value: stats.inProgress, color: '#6366F1' },
    { name: 'Done', value: stats.done, color: '#10B981' },
  ];

  const priorityData = [
    { priority: 'Low', count: tasks.filter(t => t.priority === 'Low').length },
    { priority: 'Medium', count: tasks.filter(t => t.priority === 'Medium').length },
    { priority: 'High', count: tasks.filter(t => t.priority === 'High').length },
  ];

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Workspace Overview</h2>
          <p className="text-gray-400">You're currently contributing to {projectsCount} projects.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#1F1F1F] rounded-full shadow-lg">
          <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", backendStatus === 'ok' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50")} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">System: {backendStatus}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("bg-[#141414] p-6 rounded-2xl border flex items-center gap-4 transition-all hover:translate-y-[-2px]", stat.border)}
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-[#141414] p-8 rounded-2xl border border-[#1F1F1F]">
          <h3 className="text-lg font-bold text-white mb-6">Task Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px' }}
                  itemStyle={{ color: '#F3F4F6' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-[#141414] p-8 rounded-2xl border border-[#1F1F1F]">
          <h3 className="text-lg font-bold text-white mb-6">Tasks by Priority</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F1F" />
                <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #1F1F1F', borderRadius: '12px', color: '#F3F4F6' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
