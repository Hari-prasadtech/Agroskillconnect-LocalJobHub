import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Loader, AlertCircle, CheckCircle, X,
  Briefcase, User, Award, MapPin, Calendar, DollarSign
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/applications');
      setApplications(Array.isArray(r.data) ? r.data : r.data?.applications || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(a => {
      const matchesSearch = a.applicant?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           a.job?.title?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'approved' && a.adminApproved) ||
                           (statusFilter === 'pending' && !a.adminApproved);
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const approveApplication = useCallback(async (appId, approved) => {
    try {
      await axios.put(`/api/admin/applications/${appId}/approve`, { approved });
      setApplications(a => a.map(x => x._id === appId ? { ...x, adminApproved: approved } : x));
      if (selected?._id === appId) setSelected(s => ({ ...s, adminApproved: approved }));
      showToast(approved ? 'Application approved & forwarded to employer' : 'Application rejected');
    } catch {
      showToast('Failed to update application', 'error');
    }
  }, [selected]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">Application Management</h1>
              <p className="text-neutral-600 mt-1">Review worker applications before forwarding to employers</p>
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
              placeholder="Search by worker name or job title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">All Applications</option>
            <option value="pending">Awaiting Account Approval</option>
            <option value="approved">Forwarded to Employer</option>
          </select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading applications...</p>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">No applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map(app => (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {app.applicant?.name || 'Unknown Worker'}
                        </h3>
                        <p className="text-sm text-neutral-600 truncate">
                          Applied for: <span className="font-medium">{app.job?.title || 'Deleted Job'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {app.adminApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle size={11} /> Forwarded to Employer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <AlertCircle size={11} /> Awaiting Account Approval
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(app)}
                    className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition text-sm font-medium"
                  >
                    Review
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900">Application Review</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Worker Info */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">Worker Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-600 uppercase">Name</p>
                    <p className="font-medium text-neutral-900">{selected.applicant?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 uppercase">Email</p>
                    <p className="font-medium text-neutral-900">{selected.applicant?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 uppercase">Phone</p>
                    <p className="font-medium text-neutral-900">{selected.applicant?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 uppercase">Experience</p>
                    <p className="font-medium text-neutral-900">{selected.applicant?.experience || 'N/A'} years</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selected.applicant?.skills && selected.applicant.skills.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.applicant.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Info */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Job Details</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-blue-700">Job Title</p>
                    <p className="font-medium text-neutral-900">{selected.job?.title || 'Deleted Job'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Salary</p>
                    <p className="font-medium text-neutral-900">{selected.job?.salary || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Location</p>
                    <p className="font-medium text-neutral-900">
                      {selected.job?.location ||
                        [selected.job?.address, selected.job?.city, selected.job?.state, selected.job?.pincode]
                          .filter(Boolean).join(', ') ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">Application Status</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-purple-700">Current Status</p>
                    <p className={`font-medium ${selected.adminApproved ? 'text-green-600' : 'text-amber-600'}`}>
                      {selected.adminApproved ? '✓ Forwarded to Employer' : '⏱ Awaiting Worker Account Approval'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">Applied On</p>
                    <p className="font-medium text-neutral-900">
                      {selected.appliedAt || selected.createdAt
                        ? new Date(selected.appliedAt || selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions — Admin views only; employer handles accept/reject */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                {!selected.adminApproved && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex-1">
                    ℹ️ This application will be forwarded to the employer automatically once the worker's account is approved.
                  </p>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 min-w-[120px] bg-neutral-200 text-neutral-700 py-3 px-4 rounded-lg hover:bg-neutral-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
