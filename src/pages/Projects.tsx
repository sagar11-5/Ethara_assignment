import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Project } from '../types';
import { Plus, Search, Folder, Users, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'projects'), where('memberIds', 'array-contains', user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: newName,
        description: newDesc,
        adminId: user.uid,
        memberIds: [user.uid],
        createdAt: new Date().toISOString()
      });
      setProjects([...projects, { id: docRef.id, name: newName, description: newDesc, adminId: user.uid, memberIds: [user.uid], createdAt: new Date().toISOString() }]);
      setShowModal(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Projects</h2>
          <p className="text-gray-400">Manage and collaborate on team projects.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
        >
          <Plus size={18} />
          New Project
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm text-white placeholder-gray-600 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-[#111111]/50 animate-pulse rounded-2xl border border-[#1F1F1F]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group bg-[#141414] p-6 rounded-2xl border border-[#1F1F1F] hover:border-indigo-500/50 transition-all h-full flex flex-col shadow-sm"
              >
                <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors border border-[#222222]">
                  <Folder className="text-gray-500 group-hover:text-white transition-colors" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-grow">{project.description || 'No description provided.'}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-[#1F1F1F]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 group-hover:text-gray-400">
                    <Users size={14} />
                    <span>{project.memberIds.length} Members</span>
                  </div>
                  <div className="text-gray-500 group-hover:text-indigo-400 transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-12 text-center bg-[#111111]/30 border border-dashed border-[#1F1F1F] rounded-2xl">
              <p className="text-gray-500">No projects found.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Backdrop */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-[#0C0A09]/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111111] rounded-2xl shadow-2xl z-[101] p-8 border border-[#1F1F1F]"
            >
              <h3 className="text-xl font-bold mb-6 text-white">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Project Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm text-white placeholder-gray-700"
                    placeholder="e.g. Q3 Roadmap"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm text-white placeholder-gray-700 min-h-[100px]"
                    placeholder="Describe the goals of this project..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-[#1F1F1F] rounded-xl font-semibold text-sm text-gray-400 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
                  >
                    {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Project'}
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
