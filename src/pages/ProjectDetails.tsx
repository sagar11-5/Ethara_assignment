import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  where, getDocs, orderBy
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Project, Task, UserProfile } from '../types';
import { 
  Plus, Users, Settings, PlusCircle, CheckCircle2, Circle, Clock, MoreVertical,
  Calendar, Trash2, UserPlus, Filter, ChevronDown, Check, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'settings'>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Member Management
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    if (!id || !user) return;

    // Real-time project listener
    const unsubProject = onSnapshot(doc(db, 'projects', id), async (docSnap) => {
      if (docSnap.exists()) {
        const pData = { id: docSnap.id, ...docSnap.data() } as Project;
        setProject(pData);
        
        // Fetch full member profiles
        if (pData.memberIds.length > 0) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', 'in', pData.memberIds.slice(0, 10))); // Firestore 'in' limit is 10, normally would need chunking
          const uSnap = await getDocs(q);
          const uData = uSnap.docs.map(d => d.data() as UserProfile);
          setMembers(uData);
        }
      } else {
        navigate('/projects');
      }
      setLoading(false);
    });

    // Real-time tasks listener
    const tasksRef = collection(db, 'projects', id, 'tasks');
    const qTasks = query(tasksRef, orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const tData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      setTasks(tData);
    });

    return () => {
      unsubProject();
      unsubTasks();
    };
  }, [id, user, navigate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !user) return;
    setCreatingTask(true);
    try {
      await addDoc(collection(db, 'projects', project.id, 'tasks'), {
        projectId: project.id,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate,
        assigneeId: taskAssignee,
        status: 'To Do',
        creatorId: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${project.id}/tasks`);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, currentStatus: string) => {
    if (!project) return;
    const nextStatusMap: Record<string, 'To Do' | 'In Progress' | 'Done'> = {
      'To Do': 'In Progress',
      'In Progress': 'Done',
      'Done': 'To Do'
    };
    try {
      await updateDoc(doc(db, 'projects', project.id, 'tasks', taskId), {
        status: nextStatusMap[currentStatus]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}/tasks/${taskId}`);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setAddingMember(true);
    setMemberError('');
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newMemberEmail));
      const uSnap = await getDocs(q);
      
      if (uSnap.empty) {
        setMemberError('User not found');
      } else {
        const userId = uSnap.docs[0].id;
        if (project.memberIds.includes(userId)) {
          setMemberError('User is already a member');
        } else {
          await updateDoc(doc(db, 'projects', project.id), {
            memberIds: arrayUnion(userId)
          });
          setNewMemberEmail('');
          setShowMemberModal(false);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project || userId === project.adminId) return;
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        memberIds: arrayRemove(userId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    try {
      await deleteDoc(doc(db, 'projects', project.id, 'tasks', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${project.id}/tasks/${taskId}`);
    }
  };

  if (loading) return <div className="p-10">Loading Project details...</div>;
  if (!project) return <div className="p-10">Project not found.</div>;

  const isAdmin = user?.uid === project.adminId;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <Link to="/projects" className="text-sm font-semibold text-gray-500 hover:text-indigo-400 transition-colors">Projects</Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm font-bold text-gray-300">{project.name}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter leading-tight text-white">{project.name}</h2>
          <p className="text-gray-400 leading-relaxed">{project.description || 'No description provided.'}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4">
            {members.slice(0, 5).map((m) => (
              <div key={m.uid} className="w-9 h-9 rounded-full border-2 border-[#0A0A0A] bg-[#1A1A1A] flex items-center justify-center overflow-hidden shadow-lg" title={m.name}>
                {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-indigo-400">{m.name.charAt(0)}</span>}
              </div>
            ))}
            {project.memberIds.length > 5 && (
              <div className="w-9 h-9 rounded-full border-2 border-[#0A0A0A] bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                +{project.memberIds.length - 5}
              </div>
            )}
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowMemberModal(true)}
              className="p-2.5 rounded-xl border border-[#1F1F1F] bg-[#111111] hover:bg-[#1A1A1A] hover:border-indigo-500/50 transition-all text-gray-400"
              title="Add Member"
            >
              <UserPlus size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#1F1F1F]">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all relative",
            activeTab === 'tasks' ? "text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          Tasks
          {activeTab === 'tasks' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all relative",
              activeTab === 'settings' ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Team Management
            {activeTab === 'settings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        )}
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Project Tasks ({tasks.length})</h3>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
            >
              <PlusCircle size={18} />
              Add Task
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div 
                key={task.id}
                layout
                className="group bg-[#111111] p-4 rounded-2xl border border-[#1F1F1F] flex items-center gap-4 hover:border-indigo-500/30 transition-all shadow-sm"
              >
                <button 
                  onClick={() => handleUpdateStatus(task.id, task.status)}
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    task.status === 'Done' ? "bg-emerald-500/20 text-emerald-400" : "border-2 border-[#1F1F1F] text-gray-600 hover:border-indigo-500/50"
                  )}
                >
                  {task.status === 'Done' ? <CheckCircle2 size={18} /> : 
                   task.status === 'In Progress' ? <Clock size={14} className="text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]" /> : <div className="w-2.5 h-2.5 rounded-full bg-transparent" />}
                </button>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={cn("font-bold text-sm truncate", task.status === 'Done' ? "line-through text-gray-600" : "text-gray-200")}>{task.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      task.priority === 'High' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : 
                      task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-gray-500 truncate">{task.description}</p>}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {task.dueDate && (
                    <div className="hidden sm:flex items-center gap-1.5 text-gray-600">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {task.assigneeId && (
                    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] flex items-center justify-center text-[10px] font-bold text-indigo-400 shadow-sm" title="Assignee">
                      {members.find(m => m.uid === task.assigneeId)?.name.charAt(0) || '?'}
                    </div>
                  )}
                  {(isAdmin || task.creatorId === user?.uid) && (
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-600 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && (
              <div className="py-20 text-center bg-[#111111]/30 border-2 border-dashed border-[#1F1F1F] rounded-3xl">
                <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1F1F1F] shadow-lg">
                  <PlusCircle size={32} className="text-gray-700" />
                </div>
                <h4 className="font-bold text-gray-400">No tasks yet</h4>
                <p className="text-sm text-gray-600 mt-1">Get started by adding your first task.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-[#111111] p-8 rounded-3xl border border-[#1F1F1F] shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6">Team Members</h3>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.uid} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1A1A1A] transition-all border border-transparent hover:border-[#1F1F1F]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] flex items-center justify-center overflow-hidden font-bold text-indigo-400 shadow-sm">
                      {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-200">
                        {member.name} 
                        {member.uid === project.adminId && (
                          <span className="ml-2 text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-extrabold">Admin</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  {isAdmin && member.uid !== project.adminId && (
                    <button 
                      onClick={() => handleRemoveMember(member.uid)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTaskModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111111] rounded-3xl shadow-2xl z-[101] overflow-hidden border border-[#1F1F1F]"
            >
              <div className="p-8 pb-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">New Task</h3>
                <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><Plus className="rotate-45" size={24}/></button>
              </div>
              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Title</label>
                  <input required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full p-4 bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-gray-700" placeholder="e.g. Design homepage" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Assignee</label>
                  <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="w-full p-4 bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 text-white appearance-none">
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Priority</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map((p) => (
                        <button key={p} type="button" onClick={() => setTaskPriority(p as any)} className={cn("flex-1 py-3 text-[10px] font-bold rounded-xl border transition-all", taskPriority === p ? "bg-indigo-600 text-white border-indigo-500" : "bg-[#0D0D0D] border-[#1F1F1F] text-gray-500 hover:text-gray-300")}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Due Date</label>
                    <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full p-3 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-4 font-bold text-sm rounded-2xl border border-[#1F1F1F] text-gray-400 hover:bg-white/5 transition-all text-center">Cancel</button>
                  <button type="submit" disabled={creatingTask} className="flex-1 py-4 font-bold text-sm rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    {creatingTask ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMemberModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111111] rounded-3xl shadow-2xl z-[101] p-8 border border-[#1F1F1F]">
              <h3 className="text-xl font-bold mb-6 text-white">Invite Team Member</h3>
              {memberError && <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl border border-rose-500/20 flex items-center gap-2"><AlertCircle size={14}/>{memberError}</div>}
              <form onSubmit={handleAddMember} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                  <input required type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full p-4 bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder-gray-700" placeholder="colleague@example.com" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-4 font-bold text-sm rounded-2xl border border-[#1F1F1F] text-gray-400 hover:bg-white/5 transition-all text-center">Cancel</button>
                  <button type="submit" disabled={addingMember} className="flex-1 py-4 font-bold text-sm rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    {addingMember ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
