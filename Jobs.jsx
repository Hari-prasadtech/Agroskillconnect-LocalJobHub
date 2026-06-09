import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Search, Trash2, Loader, AlertCircle, CheckCircle,
  X, MapPin, DollarSign, Users, Calendar, Building2, Filter
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/jobs');
      setJobs(Array.isArray(r.data) ? r.data : r.data?.jobs || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(j => {
        const matchesSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
                             j.company?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'approved' && j.adminApproved) ||
                             (statusFilter === 'pending' && !j.adminApproved);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (!a.adminApproved && b.adminApproved) return -1;
        if (a.adminApproved && !b.adminApproved) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [jobs, search, statusFilter]);

  const approveJob = useCallback(async (jobId, approved) => {
    try {
      await axios.put(`/api/admin/jobs/${jobId}/approve`, { approved });
      setJobs(j => j.map(x => x._id === jobId ? { ...x, adminApproved: approved } : x));
      showToast(approved ? '✅ Job approved' : '❌ Job rejected');
    } catch {
      showToast('Failed to update job', 'error');
    }
  }, []);

  const deleteJob = useCallback(async (jobId) => {
    try {
      await axios.delete(`/api/admin/jobs/${jobId}`);
      setJobs(j => j.filter(x => x._id !== jobId));
      setDeleteConfirm(null);
      showToast('Job deleted');
    } catch {
      showToast('Failed to delete job', 'error');
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">Job Management</h1>
              <p className="text-neutral-600 mt-1">Review and approve job postings</p>
            </div>
          </div>
        </motion.div>

        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {toast.msg}
          </motion.div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading jobs...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">{job.title}</h3>
                        <p className="text-sm text-neutral-600 truncate">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-sm text-neutral-600 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} /> {job.salary}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {job.workersNeeded || 1} workers
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {job.adminApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <AlertCircle size={11} /> Pending Review
                        </span>
                      )}
                      {job.workersNeeded > 2 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          👥 Group Hire
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    {!job.adminApproved && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => approveJob(job._id, true)}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => approveJob(job._id, false)}
                          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-sm font-medium flex items-center gap-2"
                        >
                          <X size={16} /> Reject
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteConfirm(job._id)}
                      className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Delete Job?</h3>
            </div>
            <p className="text-neutral-600 mb-6 text-sm">This will permanently remove this job posting and all related data. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 rounded-lg border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(deleteConfirm)}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
