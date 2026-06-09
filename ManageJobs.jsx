import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Briefcase, MapPin, Users, Eye, Edit2, Trash2,
  CheckCircle, XCircle, Loader, AlertCircle, Calendar,
  ChevronRight, DollarSign, Clock, HardHat, Hammer, Leaf,
  Droplets, Zap, Music, Star, X
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'construction', label: '🏗️ Construction' },
  { id: 'labourers', label: '🔨 Labourers' },
  { id: 'farming', label: '🌾 Farming' },
  { id: 'plumbing', label: '🔧 Plumbing' },
  { id: 'electrical', label: '⚡ Electrical' },
  { id: 'event_management', label: '🎪 Events' },
  { id: 'local_workers', label: '🏘️ Local Workers' },
  { id: 'other', label: '⭐ Other' },
];

export default function ManageJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredJobs = categoryFilter ? jobs.filter(j => j.category === categoryFilter) : jobs;

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('/api/jobs/my');
      setJobs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const deleteJob = async (id) => {
    try {
      await axios.delete(`/api/jobs/${id}`);
      setJobs(j => j.filter(x => x._id !== id));
      setDeleteConfirm(null);
      showToast('Job deleted successfully');
    } catch {
      showToast('Failed to delete job', 'error');
    }
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      const res = await axios.put(`/api/jobs/${job._id}`, { status: newStatus });
      setJobs(j => j.map(x => x._id === job._id ? { ...x, status: newStatus } : x));
      showToast(`Job ${newStatus === 'active' ? 'activated' : 'closed'}`);
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/jobs/${editModal._id}`, editModal);
      setJobs(j => j.map(x => x._id === editModal._id ? res.data : x));
      setEditModal(null);
      showToast('Job updated!');
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <Loader size={36} className="animate-spin text-primary-500"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar/>
      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">My Job Postings</h1>
              <p className="text-neutral-500 text-sm">{jobs.length} job{jobs.length!==1?'s':''} posted</p>
            </div>
            <Link to="/employer/post-job"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              <Plus size={18}/> Post New Job
            </Link>
          </motion.div>

          {/* Category Filter Tabs */}
          {jobs.length > 0 && (
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    categoryFilter === cat.id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {jobs.length === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white rounded-2xl p-12 text-center border border-neutral-100">
              <Briefcase size={48} className="text-neutral-300 mx-auto mb-4"/>
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Jobs Posted Yet</h3>
              <p className="text-neutral-500 mb-6">Start finding great workers by posting your first job.</p>
              <Link to="/employer/post-job" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                <Plus size={16}/> Post First Job
              </Link>
            </motion.div>
          )}

          {/* Jobs Grid */}
          <div className="space-y-4">
            {filteredJobs.map((job, i) => (
              <motion.div key={job._id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                          job.status==='active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : job.status==='pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : job.status==='expired'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : job.status==='rejected'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                          {job.status==='active' ? <CheckCircle size={11}/> : <XCircle size={11}/>}
                          {job.status==='active' ? 'Active' : job.status==='pending' ? '⏳ Awaiting Approval' : job.status==='expired' ? 'Auto-Expired' : job.status==='rejected' ? 'Rejected by Admin' : 'Closed'}
                        </span>
                        {job.jobType && <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg border border-primary-100">{job.jobType}</span>}
                        {job.category && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100 capitalize">{job.category.replace('_',' ')}</span>}
                        {job.allowGroupApply && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-100">👥 Group Apply</span>}
                        {job.isHomeBased && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100">🏠 Home Job</span>}
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">{job.title}</h3>
                      <p className="text-primary-600 font-medium text-sm">{job.company}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center gap-1"><MapPin size={11}/> {job.location || [job.city, job.state, job.pincode].filter(Boolean).join(', ') || 'Location not set'}</span>
                        {job.address && <span className="flex items-center gap-1 text-neutral-400">📍 {job.address}</span>}
                        <span className="flex items-center gap-1"><DollarSign size={11}/> {job.salary||'Not specified'}</span>
                        <span className="flex items-center gap-1"><Users size={11}/> {job.applicantCount||0} applicant{job.applicantCount!==1?'s':''}</span>
                        <span className="flex items-center gap-1"><Eye size={11}/> {job.viewCount||0} views</span>
                        {job.startDate && <span className="flex items-center gap-1"><Calendar size={11}/> Start: {formatDate(job.startDate)}</span>}
                        {job.deadline && <span className="flex items-center gap-1"><Clock size={11}/> Deadline: {formatDate(job.deadline)}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link to={`/employer/applications/${job._id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors">
                        <Users size={13}/> Applicants
                        {job.applicantCount > 0 && <span className="bg-primary-500 text-white rounded-full px-1.5 py-0.5 text-xs">{job.applicantCount}</span>}
                      </Link>
                      <button onClick={()=>setEditModal({...job})}
                        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 text-neutral-600 rounded-lg text-xs font-medium hover:bg-neutral-100 transition-colors">
                        <Edit2 size={13}/> Edit
                      </button>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                    {job.status === 'pending' ? (
                      <span className="text-xs text-amber-600 font-medium px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                        ⏳ Under admin review — will go live once approved
                      </span>
                    ) : (
                      <button onClick={()=>toggleStatus(job)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          job.status==='active'
                            ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
                            : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                        }`}>
                        {job.status==='active'?'Close Job':'Reactivate'}
                      </button>
                    )}
                    <button onClick={()=>setDeleteConfirm(job._id)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                      <Trash2 size={13}/> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Job?</h3>
            <p className="text-neutral-500 text-sm mb-5">This will permanently delete the job posting and all its applications.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 font-medium hover:bg-neutral-50">Cancel</button>
              <button onClick={()=>deleteJob(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Edit Job</h3>
            <div className="space-y-3">
              {[
                {label:'Job Title',key:'title',type:'text'},
                {label:'Salary',key:'salary',type:'text'},
                {label:'Vacancies',key:'vacancies',type:'number'},
                {label:'Address / Location Details',key:'address',type:'text'},
              ].map(({label,key,type})=>(
                <div key={key}>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">{label}</label>
                  <input type={type} value={editModal[key]||''} onChange={e=>setEditModal(m=>({...m,[key]:e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"/>
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Start Date</label>
                <input type="date" value={editModal.startDate ? editModal.startDate.split('T')[0] : ''} onChange={e=>setEditModal(m=>({...m,startDate:e.target.value}))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"/>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Application Deadline</label>
                <input type="date" value={editModal.deadline ? editModal.deadline.split('T')[0] : ''} onChange={e=>setEditModal(m=>({...m,deadline:e.target.value}))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"/>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Description</label>
                <textarea value={editModal.description||''} onChange={e=>setEditModal(m=>({...m,description:e.target.value}))} rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setEditModal(null)} className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 font-medium">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {saving?<><Loader size={16} className="animate-spin"/> Saving...</>:<><CheckCircle size={16}/> Save</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {toast && (
        <motion.div initial={{opacity:0,y:80}} animate={{opacity:1,y:0}}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium z-50 ${toast.type==='error'?'bg-red-500':'bg-primary-500'}`}>
          {toast.type==='error'?<AlertCircle size={16}/>:<CheckCircle size={16}/>} {toast.msg}
        </motion.div>
      )}
    </div>
  );
}
