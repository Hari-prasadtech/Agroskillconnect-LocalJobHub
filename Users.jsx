import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Trash2, Loader, AlertCircle,
  CheckCircle, UserX, Eye, Phone,
  Briefcase, Building2, ShieldCheck, X, Power,
  FileText, Hash, User
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

const ROLE_CFG = {
  worker:   { label:'Worker',   bg:'bg-green-50',   text:'text-green-700',   border:'border-green-200',  icon:Briefcase },
  employer: { label:'Employer', bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',   icon:Building2 },
  admin:    { label:'Admin',    bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200', icon:ShieldCheck },
};

function RoleBadge({role}) {
  const c = ROLE_CFG[role] || ROLE_CFG.worker;
  const Icon = c.icon;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}><Icon size={11}/>{c.label}</span>;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-neutral-900 mt-0.5">{value || <span className="text-neutral-400 italic">Not provided</span>}</span>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/admin/users');
      setUsers(Array.isArray(r.data) ? r.data : r.data?.users || []);
    } catch(e) {
      console.error(e);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                           u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.userType === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'approved' && u.accountApproved) ||
                           (statusFilter === 'pending' && !u.accountApproved);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openVerifyModal = (user) => {
    setVerifyModal(user);
  };

  const closeVerifyModal = () => {
    setVerifyModal(null);
  };

  const approveUser = useCallback(async (userId, approved) => {
    setApprovingId(userId);
    setUsers(u => u.map(x => x._id === userId ? { ...x, accountApproved: approved } : x));
    if (verifyModal?._id === userId) {
      setVerifyModal(m => m ? { ...m, accountApproved: approved } : m);
    }
    try {
      await axios.put(`/api/admin/users/${userId}/approve`, { approved });
      showToast(approved ? '✅ User approved successfully' : '❌ User rejected');
      closeVerifyModal();
    } catch(e) {
      setUsers(u => u.map(x => x._id === userId ? { ...x, accountApproved: !approved } : x));
      showToast('Failed to update user', 'error');
    } finally {
      setApprovingId(null);
    }
  }, [verifyModal]);

  const toggleActive = useCallback(async (user) => {
    const newIsActive = !user.isActive;
    setUsers(u => u.map(x => x._id === user._id ? { ...x, isActive: newIsActive } : x));
    try {
      await axios.put(`/api/admin/users/${user._id}`, { isActive: newIsActive });
      showToast(`User ${newIsActive ? 'activated' : 'deactivated'}`);
    } catch(e) {
      setUsers(u => u.map(x => x._id === user._id ? { ...x, isActive: !newIsActive } : x));
      showToast('Failed to update user', 'error');
    }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(u => u.filter(x => x._id !== userId));
      setDeleteConfirm(null);
      closeVerifyModal();
      showToast('User deleted successfully');
    } catch(e) {
      showToast('Failed to delete user', 'error');
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="pt-24 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-20 right-6 px-6 py-3 rounded-lg text-white shadow-lg z-[60] flex items-center gap-2 ${
                toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
                <p className="text-neutral-600">Manage workers, employers, and verify documents</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">{users.length}</div>
              <div className="text-sm text-neutral-600">Total Users</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 outline-none">
              <option value="all">All Roles</option>
              <option value="worker">Workers</option>
              <option value="employer">Employers</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 outline-none">
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Users', val: users.length, cls: 'text-blue-600 bg-blue-50 border-blue-200' },
              { label: 'Approved', val: users.filter(u => u.accountApproved).length, cls: 'text-green-600 bg-green-50 border-green-200' },
              { label: 'Pending Review', val: users.filter(u => !u.accountApproved).length, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
                <div className="text-2xl font-bold">{s.val}</div>
                <div className="text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No users found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map(user => (
                  <div key={user._id} className="p-4 hover:bg-neutral-50 transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-neutral-900">{user.name}</h3>
                          <RoleBadge role={user.userType} />
                          {user.roles && Array.isArray(user.roles) && user.roles.length > 1 && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <span className="text-lg">👥</span> Dual
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Deactivated</span>
                          )}
                          {user.accountApproved
                            ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={10}/>Approved</span>
                            : <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending</span>
                          }
                        </div>
                        <p className="text-sm text-neutral-500">{user.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                          {user.phone && <span className="flex items-center gap-1"><Phone size={10}/>{user.phone}</span>}
                          {user.documentType && <span className="flex items-center gap-1"><FileText size={10}/>{user.documentType}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap flex-shrink-0">
                        <button onClick={() => openVerifyModal(user)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5">
                          <Eye size={13}/> Review & Verify
                        </button>
                        <button onClick={() => toggleActive(user)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            user.isActive ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                          }`}>
                          <Power size={13}/>{user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteConfirm(user._id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5">
                          <Trash2 size={13}/> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document Verification Modal */}
        <AnimatePresence>
          {verifyModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={closeVerifyModal}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                  <h2 className="text-xl font-bold text-neutral-900">
                    Document Verification — {verifyModal.name}
                  </h2>
                  <button onClick={closeVerifyModal} className="p-2 hover:bg-neutral-100 rounded-lg">
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* User Info */}
                  <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <User size={13}/> User Information
                    </h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <InfoRow label="Name" value={verifyModal.name} />
                      <InfoRow label="Email" value={verifyModal.email} />
                      <InfoRow label="Phone" value={verifyModal.phone} />
                      <InfoRow label="Type" value={verifyModal.userType} />
                      {verifyModal.roles && Array.isArray(verifyModal.roles) && verifyModal.roles.length > 1 && (
                        <InfoRow label="Registration" value={`${verifyModal.roles.join(' + ')} (Dual)`} />
                      )}
                      <InfoRow label="Document Type" value={verifyModal.documentType} />
                      <InfoRow label="Document Number" value={verifyModal.documentNumber} />
                      <InfoRow label="Pincode" value={verifyModal.pincode} />
                      <InfoRow label="Address" value={verifyModal.address} />
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${verifyModal.accountApproved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    {verifyModal.accountApproved
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <AlertCircle className="w-5 h-5 text-amber-500" />
                    }
                    <span className={`text-sm font-semibold ${verifyModal.accountApproved ? 'text-green-700' : 'text-amber-700'}`}>
                      Account Status: {verifyModal.accountApproved ? '✅ Approved' : '⏳ Pending Review'}
                    </span>
                  </div>

                  {/* Document Image */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="flex items-center p-4 bg-neutral-50 border-b border-neutral-200">
                      <FileText className="w-5 h-5 text-neutral-600 mr-2" />
                      <span className="font-bold text-neutral-800">Uploaded Document Image</span>
                    </div>
                    <div className="p-4">
                      {verifyModal.documentImage ? (
                        <img
                          src={verifyModal.documentImage}
                          alt="Document"
                          className="w-full max-h-64 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                        />
                      ) : (
                        <div className="p-4 bg-neutral-100 rounded-xl text-center">
                          <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-sm text-neutral-500">No document image uploaded by this user</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons — Approve / Reject / Close */}
                <div className="flex gap-3 p-6 border-t border-neutral-100">
                  <button
                    onClick={() => approveUser(verifyModal._id, true)}
                    disabled={approvingId === verifyModal._id}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {approvingId === verifyModal._id ? <Loader className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                    Approve User
                  </button>
                  <button
                    onClick={() => approveUser(verifyModal._id, false)}
                    disabled={approvingId === verifyModal._id}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {approvingId === verifyModal._id ? <Loader className="w-4 h-4 animate-spin"/> : <UserX className="w-4 h-4"/>}
                    Reject User
                  </button>
                  <button onClick={closeVerifyModal}
                    className="px-6 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-6 h-6 text-red-500" /></div>
                  <h3 className="text-lg font-bold text-neutral-900">Delete User?</h3>
                </div>
                <p className="text-neutral-600 mb-6 text-sm">This will permanently delete the account and all associated data. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 px-4 rounded-lg border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50">Cancel</button>
                  <button onClick={() => deleteUser(deleteConfirm)}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
