import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Briefcase, FileText, TrendingUp, AlertTriangle,
  LogOut, User, Activity, Database, Lock, Eye, Clock, CheckCircle, 
  BarChart3, Download, AlertCircle, DollarSign, Check, X, FileCheck,
  UserCheck, UserX, Briefcase as BriefcaseIcon, FileSearch, Loader, 
  Edit2, Save, XCircle, Zap, Brain
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });

  const [editableStats, setEditableStats] = useState({});
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [documentVerifying, setDocumentVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user || user.userType !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, jobsRes, appsRes] = await Promise.all([
        axios.get('/api/admin/users').catch(e => { console.error('Users fetch:', e); throw e; }),
        axios.get('/api/admin/jobs').catch(e => { console.error('Jobs fetch:', e); throw e; }),
        axios.get('/api/admin/applications').catch(e => { console.error('Apps fetch:', e); throw e; })
      ]);

      const usersList = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || [];
      const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data?.jobs || [];
      const appsList = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data?.applications || [];

      setUsers(usersList);
      setJobs(jobsList);
      setApplications(appsList);

      const newStats = {
        totalUsers: usersList.length,
        pendingUsers: usersList.filter(u => !u.accountApproved).length,
        approvedUsers: usersList.filter(u => u.accountApproved).length,
        totalJobs: jobsList.length,
        pendingJobs: jobsList.filter(j => !j.adminApproved).length,
        approvedJobs: jobsList.filter(j => j.adminApproved).length,
        totalApplications: appsList.length,
        pendingApplications: appsList.filter(a => !a.adminApproved).length
      };

      setStats(newStats);
      setEditableStats(newStats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // AI-powered document verification
  const verifyDocumentWithAI = useCallback(async (userId) => {
    setDocumentVerifying(true);
    setVerificationResult(null);
    try {
      // Call AI verification endpoint
      const response = await axios.post(`/api/admin/users/${userId}/verify-document`);
      setVerificationResult(response.data);
    } catch (error) {
      console.error('Document verification error:', error);
      setVerificationResult({
        verified: false,
        reason: error.response?.data?.error || 'Verification failed'
      });
    } finally {
      setDocumentVerifying(false);
    }
  }, []);

  const approveUser = useCallback(async (userId, approved) => {
    try {
      await axios.put(`/api/admin/users/${userId}/approve`, { approved });
      await fetchAllData();
      setSelectedUser(null);
      setVerificationResult(null);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to update user status');
    }
  }, [fetchAllData]);

  const approveJob = useCallback(async (jobId, approved) => {
    try {
      await axios.put(`/api/admin/jobs/${jobId}/approve`, { approved });
      await fetchAllData();
    } catch (error) {
      console.error('Error approving job:', error);
      alert('Failed to update job status');
    }
  }, [fetchAllData]);

  const approveApplication = useCallback(async (appId, approved) => {
    try {
      await axios.put(`/api/admin/applications/${appId}/approve`, { approved });
      await fetchAllData();
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to update application status');
    }
  }, [fetchAllData]);

  // Filter and search functionality
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'approved' && u.accountApproved) ||
                           (filterStatus === 'pending' && !u.accountApproved);
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterStatus]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           j.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'approved' && j.adminApproved) ||
                           (filterStatus === 'pending' && !j.adminApproved);
      return matchesSearch && matchesFilter;
    });
  }, [jobs, searchTerm, filterStatus]);

  const filteredApplications = useMemo(() => {
    return applications.filter(a => {
      const matchesSearch = a.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.job?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'approved' && a.adminApproved) ||
                           (filterStatus === 'pending' && !a.adminApproved);
      return matchesSearch && matchesFilter;
    });
  }, [applications, searchTerm, filterStatus]);

  if (!user || user.userType !== 'admin') {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">Admin Dashboard</h1>
              <p className="text-neutral-600 mt-1">Manage users, jobs, and applications with AI-powered verification</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
              <StatCard label="Pending Users" value={stats.pendingUsers} icon={Clock} color="amber" pending />
              <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} color="green" />
              <StatCard label="Pending Jobs" value={stats.pendingJobs} icon={Clock} color="amber" pending />
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {['overview', 'users', 'jobs', 'applications'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSearchTerm(''); setFilterStatus('all'); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === tab
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search and Filter */}
            {activeTab !== 'overview' && (
              <div className="mb-6 flex gap-4 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 lg:col-span-2"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Recent Users
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.slice(0, 5).map(u => (
                      <div key={u._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                        <div>
                          <p className="font-medium text-neutral-900">{u.name}</p>
                          <p className="text-sm text-neutral-600">{u.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.accountApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.accountApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Stats Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                >
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Applications Pending</span>
                      <span className="font-bold text-lg text-amber-600">{stats.pendingApplications}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Active Jobs</span>
                      <span className="font-bold text-lg text-green-600">{stats.approvedJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Verified Users</span>
                      <span className="font-bold text-lg text-blue-600">{stats.approvedUsers}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-neutral-900">{u.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {u.userType}
                          </span>
                          {u.accountApproved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">{u.email} • {u.phone}</p>
                        <p className="text-sm text-neutral-500">
                          Document: {u.documentType?.toUpperCase()} - {u.documentNumber}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          u.accountApproved
                            ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {u.accountApproved ? 'View Details' : 'Review & Verify'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {filteredJobs.map(j => (
                  <motion.div
                    key={j._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-xl border border-neutral-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-neutral-900">{j.title}</h4>
                          {j.workersNeeded > 1 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              👥 {j.workersNeeded} workers
                            </span>
                          )}
                          {j.adminApproved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✓ Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">
                          {j.company} • {j.location} • {j.salary}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Posted by: {j.employer?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {!j.adminApproved && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveJob(j._id, true)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => approveJob(j._id, false)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-3">
                {filteredApplications.map(app => (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-xl border border-neutral-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-neutral-900">
                            {app.applicant?.name || 'Unknown Worker'}
                          </h4>
                          {app.adminApproved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✓ Forwarded to Employer
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">
                          Applied for: <span className="font-medium">{app.job?.title || 'Unknown Job'}</span>
                        </p>
                        <p className="text-sm text-neutral-500">
                          Skills: {app.applicant?.skills?.join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {!app.adminApproved && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveApplication(app._id, true)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve & Forward
                        </button>
                        <button
                          onClick={() => approveApplication(app._id, false)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* User Verification Modal */}
            {selectedUser && (
              <UserVerificationModal
                user={selectedUser}
                documentVerifying={documentVerifying}
                verificationResult={verificationResult}
                onVerify={() => verifyDocumentWithAI(selectedUser._id)}
                onApprove={(approved) => approveUser(selectedUser._id, approved)}
                onClose={() => {
                  setSelectedUser(null);
                  setVerificationResult(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color = 'primary', pending = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 hover:shadow-md transition"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-neutral-900">{value}</p>
        {pending && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Requires Action
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${
        color === 'blue' ? 'bg-blue-100 text-blue-600' :
        color === 'green' ? 'bg-green-100 text-green-600' :
        color === 'amber' ? 'bg-amber-100 text-amber-600' :
        'bg-neutral-100 text-neutral-600'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

const UserVerificationModal = ({ user, documentVerifying, verificationResult, onVerify, onApprove, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">
            Document Verification - {user.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-600 uppercase">Name</p>
                <p className="font-medium text-neutral-900">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase">Email</p>
                <p className="font-medium text-neutral-900">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase">Phone</p>
                <p className="font-medium text-neutral-900">{user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase">Type</p>
                <p className="font-medium text-neutral-900">{user.userType}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase">Document Type</p>
                <p className="font-medium text-neutral-900">{user.documentType?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 uppercase">Document Number</p>
                <p className="font-medium text-neutral-900">{user.documentNumber}</p>
              </div>
            </div>
          </div>

          {/* AI Verification Section */}
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">AI Document Verification</h3>
            </div>

            {!verificationResult ? (
              <button
                onClick={onVerify}
                disabled={documentVerifying}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {documentVerifying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verifying Document...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Run AI Verification
                  </>
                )}
              </button>
            ) : (
              <div className={`p-4 rounded-lg ${verificationResult.verified ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {verificationResult.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {verificationResult.verified ? 'Document Verified' : 'Verification Failed'}
                  </span>
                </div>
                <p className="text-sm">{verificationResult.reason || verificationResult.message}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={() => onApprove(true)}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve User
            </button>
            <button
              onClick={() => onApprove(false)}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject User
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-200 text-neutral-700 py-3 px-4 rounded-lg hover:bg-neutral-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
