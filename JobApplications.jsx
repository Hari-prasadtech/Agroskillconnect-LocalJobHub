import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Award, Briefcase,
  CheckCircle, XCircle, Clock, Eye, X, Loader,
  Users, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';

// ─── Group Members Panel (defined outside to avoid React hooks violation) ──────
const GroupMembersPanel = ({ members }) => {
  const [expanded, setExpanded] = useState(true); // auto-expanded for employer visibility
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (!members || members.length === 0) return null;

  return (
    <div className="mt-4 border-t border-blue-100 pt-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-blue-700 font-semibold text-sm hover:text-blue-900 transition w-full"
      >
        <Users className="w-4 h-4" />
        Group Members ({members.length})
        {expanded
          ? <ChevronUp className="w-4 h-4 ml-auto" />
          : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {members.map((m, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {m.name?.charAt(0) || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900">{m.name || '—'}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-sm text-neutral-600">
                        {m.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-500" /> {m.phone}
                          </div>
                        )}
                        {m.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-500" /> {m.email}
                          </div>
                        )}
                        {m.address && (
                          <div className="flex items-center gap-1 sm:col-span-2">
                            <MapPin className="w-3 h-3 text-blue-500" /> {m.address}
                          </div>
                        )}
                        {m.skills && (
                          <div className="flex items-center gap-1 sm:col-span-2">
                            <Award className="w-3 h-3 text-blue-500" /> {m.skills}
                          </div>
                        )}
                      </div>

                      {/* Aadhar Card Image */}
                      {m.documentImage ? (
                        <div className="mt-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs font-semibold text-indigo-700 mb-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-500" /> Aadhar Card
                          </p>
                          {m.documentImage.startsWith('data:image') ? (
                            <button
                              onClick={() => setSelectedDoc(m.documentImage)}
                              className="relative group"
                            >
                              <img
                                src={m.documentImage}
                                alt={`${m.name} Aadhar`}
                                className="w-40 h-24 object-cover rounded-lg border-2 border-indigo-300 hover:border-indigo-500 transition cursor-pointer"
                              />
                              <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-xs text-indigo-600 mt-1 font-medium">Click to enlarge</p>
                            </button>
                          ) : (
                            <a
                              href={m.documentImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition"
                            >
                              <Eye className="w-3 h-3" /> View Document
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> No Aadhar card uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Lightbox */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute -top-10 right-0 text-white hover:text-neutral-300"
            >
              <X className="w-7 h-7" />
            </button>
            <img src={selectedDoc} alt="Member Aadhar Card" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const JobApplications = () => {
  const { user } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { appId, decision, workerName }
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchJobAndApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        axios.get(`/api/jobs/${jobId}`),
        axios.get('/api/applications'),
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data.filter(app => app.job?._id === jobId || app.job === jobId));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const viewWorkerProfile = async (workerId) => {
    try {
      const response = await axios.get(`/api/user/profile/${workerId}`);
      setSelectedWorker(response.data);
      setShowWorkerModal(true);
    } catch (error) {
      console.error('Error fetching worker profile:', error);
    }
  };

  const handleDecision = async (appId, decision) => {
    setActionLoading(true);
    try {
      await axios.put(`/api/applications/${appId}/decision`, { decision });
      await fetchJobAndApplications();
      setConfirmModal(null);
      showToast(`Application ${decision === 'accepted' ? 'accepted' : 'rejected'} successfully!`, decision === 'accepted' ? 'success' : 'error');
    } catch (error) {
      console.error('Error updating application:', error);
      showToast('Failed to update application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Worker Profile Modal ─────────────────────────────────────────────
  const WorkerProfileModal = () => {
    if (!selectedWorker) return null;

    const fullLocation = selectedWorker.location
      || [selectedWorker.address, selectedWorker.city, selectedWorker.state, selectedWorker.pincode].filter(Boolean).join(', ')
      || null;

    const displayLocation = selectedWorker.location
      || [selectedWorker.city, selectedWorker.state].filter(Boolean).join(', ')
      || selectedWorker.address
      || null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Worker Profile</h2>
            <button onClick={() => setShowWorkerModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Profile Hero */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {selectedWorker.name?.charAt(0)?.toUpperCase() || 'W'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-neutral-900">{selectedWorker.name}</h3>
                  {selectedWorker.workCategory && (
                    <p className="text-green-700 font-semibold capitalize mt-0.5">{selectedWorker.workCategory.replace(/_/g, ' ')}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-600">
                    {selectedWorker.gender && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-green-500" />
                        <span className="capitalize">{selectedWorker.gender}</span>
                      </span>
                    )}
                    {displayLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        {displayLocation}
                      </span>
                    )}
                    {selectedWorker.experience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-green-500" />
                        {selectedWorker.experience}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border-2 border-neutral-200 p-5">
              <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" /> Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedWorker.email && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                    <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500 font-medium">Email</p>
                      <p className="text-sm font-semibold text-neutral-800 truncate">{selectedWorker.email}</p>
                    </div>
                  </div>
                )}
                {selectedWorker.phone && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500 font-medium">Phone</p>
                      <p className="text-sm font-semibold text-neutral-800">{selectedWorker.phone}</p>
                    </div>
                  </div>
                )}
                {selectedWorker.gender && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                    <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500 font-medium">Gender</p>
                      <p className="text-sm font-semibold text-neutral-800 capitalize">{selectedWorker.gender}</p>
                    </div>
                  </div>
                )}
                {(displayLocation || selectedWorker.pincode) && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500 font-medium">Location</p>
                      <p className="text-sm font-semibold text-neutral-800 truncate">
                        {fullLocation || displayLocation || `Pincode: ${selectedWorker.pincode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Show a note if contact info is missing */}
              {!selectedWorker.email && !selectedWorker.phone && (
                <p className="text-sm text-neutral-400 italic mt-2">Contact information not provided.</p>
              )}
            </div>

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWorker.experience && (
                <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-5">
                  <h4 className="font-bold text-neutral-900 mb-2 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" /> Experience
                  </h4>
                  <p className="text-neutral-700 font-semibold">{selectedWorker.experience}</p>
                </div>
              )}
              {selectedWorker.availability && (
                <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-5">
                  <h4 className="font-bold text-neutral-900 mb-2">Availability</h4>
                  <p className="text-neutral-700 font-semibold">{selectedWorker.availability}</p>
                </div>
              )}
            </div>

            {/* Skills */}
            {selectedWorker.skills?.length > 0 && (
              <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-5">
                <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" /> Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {selectedWorker.languages?.length > 0 && (
              <div className="bg-green-50 rounded-xl border-2 border-green-200 p-5">
                <h4 className="font-bold text-neutral-900 mb-3">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.languages.map((lang, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {selectedWorker.about && (
              <div className="bg-neutral-50 rounded-xl border-2 border-neutral-200 p-5">
                <h4 className="font-bold text-neutral-900 mb-2">About</h4>
                <p className="text-neutral-700 leading-relaxed">{selectedWorker.about}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Application Card ─────────────────────────────────────────────────
  const ApplicationCard = ({ application }) => {
    const worker = application.applicant;
    const isPending = application.employerStatus === 'pending';
    const isAccepted = application.employerStatus === 'accepted';
    const isRejected = application.employerStatus === 'rejected';

    // Helper function to get full location
    const getLocation = () => {
      return worker?.location || [worker?.city, worker?.state].filter(Boolean).join(', ') || worker?.address || 'Not specified';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition"
      >
        {/* Header with Name and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {worker?.name?.charAt(0) || 'W'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">{worker?.name || 'N/A'}</h3>
              <p className="text-neutral-600 capitalize text-sm">{worker?.workCategory?.replace(/_/g, ' ') || 'Worker'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
            {isAccepted && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Accepted
              </span>
            )}
            {isRejected && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Rejected
              </span>
            )}
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-medium">Email</p>
              <p className="text-sm font-medium text-neutral-900 truncate">{worker?.email || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-medium">Phone</p>
              <p className="text-sm font-medium text-neutral-900">{worker?.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-medium">Gender</p>
              <p className="text-sm font-medium text-neutral-900 capitalize">{worker?.gender || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-medium">Location</p>
              <p className="text-sm font-medium text-neutral-900 truncate">{getLocation()}</p>
            </div>
          </div>
        </div>

        {/* Experience and Availability */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-neutral-100">
          <div>
            <p className="text-sm text-neutral-600 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-green-600" /> Experience
            </p>
            <p className="font-medium text-neutral-900">{worker?.experience || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-green-600" /> Availability
            </p>
            <p className="font-medium text-neutral-900">{worker?.availability || 'Not specified'}</p>
          </div>
        </div>

        {/* Skills */}
        {worker?.skills?.length > 0 && (
          <div className="mb-4 pb-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-600 mb-2 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-green-600" /> Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cover Letter */}
        {application.coverLetter && (
          <div className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <p className="text-sm text-neutral-600 mb-2 font-medium">Cover Letter</p>
            <p className="text-neutral-700 text-sm">{application.coverLetter}</p>
          </div>
        )}

        {/* Group Application Badge */}
        {(application.isGroupApplication || application.groupMembers?.length > 0) && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              Group Application — {1 + (application.groupMembers?.length || 0)} workers total
            </span>
          </div>
        )}

        {/* Group Members + Documents */}
        {application.groupMembers?.length > 0 && (
          <GroupMembersPanel members={application.groupMembers} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-neutral-200 mt-4">
          <button
            onClick={() => viewWorkerProfile(worker?._id)}
            className="flex-1 bg-blue-100 text-blue-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> View Full Profile
          </button>
          {isPending && (
            <>
              <button
                onClick={() => setConfirmModal({ appId: application._id, decision: 'accepted', workerName: worker?.name })}
                className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => setConfirmModal({ appId: application._id, decision: 'rejected', workerName: worker?.name })}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader className="w-12 h-12 text-green-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/employer/manage-jobs" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">{job?.title || 'Job'} Applications</h1>
          <p className="text-neutral-600">Review and manage applications for this position</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-neutral-600 mb-1">Total Applications</p><p className="text-3xl font-bold text-neutral-900">{applications.length}</p></div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-neutral-600 mb-1">Pending Review</p><p className="text-3xl font-bold text-amber-600">{applications.filter(a => a.employerStatus === 'pending').length}</p></div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-neutral-600 mb-1">Accepted</p><p className="text-3xl font-bold text-green-600">{applications.filter(a => a.employerStatus === 'accepted').length}</p></div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Applications Yet</h3>
            <p className="text-neutral-600">Applications will appear here once workers apply and admin approves them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map(app => <ApplicationCard key={app._id} application={app} />)}
          </div>
        )}
      </div>

      {showWorkerModal && <WorkerProfileModal />}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {toast.type === 'error'
              ? <XCircle className="w-5 h-5" />
              : <CheckCircle className="w-5 h-5" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  confirmModal.decision === 'accepted'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}
              >
                {confirmModal.decision === 'accepted'
                  ? <CheckCircle className="w-10 h-10 text-green-600" />
                  : <XCircle className="w-10 h-10 text-red-600" />}
              </motion.div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                {confirmModal.decision === 'accepted' ? 'Accept Application?' : 'Reject Application?'}
              </h3>
              <p className="text-neutral-600 text-sm mb-6">
                {confirmModal.decision === 'accepted'
                  ? <>You are about to <span className="font-semibold text-green-700">accept</span> the application from <span className="font-semibold">{confirmModal.workerName}</span>. They will be notified.</>
                  : <>You are about to <span className="font-semibold text-red-700">reject</span> the application from <span className="font-semibold">{confirmModal.workerName}</span>. This cannot be undone.</>
                }
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 font-semibold hover:bg-neutral-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDecision(confirmModal.appId, confirmModal.decision)}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    confirmModal.decision === 'accepted'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : confirmModal.decision === 'accepted' ? (
                    <><CheckCircle className="w-4 h-4" /> Confirm Accept</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Confirm Reject</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobApplications;
