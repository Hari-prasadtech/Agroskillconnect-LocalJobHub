import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Users, Phone, Shield, AlertCircle,
  Loader, MessageCircle, FileText, User, Clock
} from 'lucide-react';
import axios from '../utils/axios';

const AdminGroupVerification = ({ application, onUpdate }) => {
  const [verifying, setVerifying] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState('');

  const { groupMembers = [], applicant, job, groupSize, createdAt, adminApproval } = application;
  const isGroupApp = groupMembers.length > 0;

  const verificationTier = groupSize <= 10 ? 'Small' : groupSize <= 30 ? 'Medium' : 'Large';
  const verificationTime = groupSize <= 10 ? '1-2 hours' : groupSize <= 30 ? '6-12 hours' : '24-48 hours';

  const sendSMSVerification = async () => {
    setSendingSMS(true);
    setError('');
    try {
      await axios.post(`/api/admin/applications/${application._id}/send-sms-verification`);
      alert('SMS verification sent to all group members');
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  const approveApplication = async () => {
    setVerifying(true);
    setError('');
    try {
      await axios.put(`/api/admin/applications/${application._id}/approve`, {
        adminApproval: 'approved'
      });
      alert('Application approved successfully');
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setVerifying(false);
    }
  };

  const rejectApplication = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setRejecting(true);
    setError('');
    try {
      await axios.put(`/api/admin/applications/${application._id}/reject`, {
        adminApproval: 'rejected',
        rejectionReason
      });
      alert('Application rejected');
      setShowRejectModal(false);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isGroupApp ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            {isGroupApp ? (
              <Users className="w-6 h-6 text-purple-600" />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isGroupApp ? `Group Application (${groupSize} workers)` : 'Individual Application'}
            </h3>
            <p className="text-sm text-neutral-600">
              {applicant?.name} • {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          adminApproval === 'approved' ? 'bg-green-100 text-green-700' :
          adminApproval === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {adminApproval === 'approved' ? 'Approved' :
           adminApproval === 'rejected' ? 'Rejected' :
           'Pending Verification'}
        </div>
      </div>

      {/* Job Info */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="text-sm font-medium text-neutral-500 mb-1">Applying For</div>
        <div className="font-semibold text-lg">{job?.title}</div>
        <div className="text-sm text-neutral-600 mt-1">{job?.company} • {job?.location}</div>
      </div>

      {/* Group Verification Info */}
      {isGroupApp && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-semibold mb-1">Verification Tier</div>
              <div className="text-lg font-bold text-blue-900">{verificationTier}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-semibold mb-1">Group Size</div>
              <div className="text-lg font-bold text-purple-900">{groupSize} workers</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs text-orange-600 font-semibold mb-1">Est. Review Time</div>
              <div className="text-sm font-bold text-orange-900">{verificationTime}</div>
            </div>
          </div>

          {/* Verification Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-900">Verification Requirements</div>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  {groupSize <= 10 && (
                    <>
                      <li>✓ Check all phone numbers are valid</li>
                      <li>✓ Send SMS verification to each member</li>
                      <li>✓ Verify at least 80% respond</li>
                    </>
                  )}
                  {groupSize > 10 && groupSize <= 30 && (
                    <>
                      <li>✓ SMS verification required</li>
                      <li>✓ Aadhar numbers recommended</li>
                      <li>✓ Check for duplicate phones</li>
                    </>
                  )}
                  {groupSize > 30 && (
                    <>
                      <li>✓ Full verification required</li>
                      <li>✓ Aadhar mandatory for all members</li>
                      <li>✓ May require video/in-person verification</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Group Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Group Members ({groupMembers.length})</h4>
              <button
                onClick={sendSMSVerification}
                disabled={sendingSMS || adminApproval !== 'pending'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 transition text-sm flex items-center gap-2"
              >
                {sendingSMS ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><MessageCircle className="w-4 h-4" /> Send SMS to All</>
                )}
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {groupMembers.map((member, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-bold text-sm">{idx + 1}</span>
                        </div>
                        <div className="font-semibold">{member.name}</div>
                        {member.verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600">
                        <div><Phone className="w-3 h-3 inline mr-1" />{member.phone}</div>
                        <div>Age: {member.age}</div>
                        <div className="col-span-2">Skills: {member.skills}</div>
                        {member.aadharNumber && (
                          <div className="col-span-2 text-xs">
                            <Shield className="w-3 h-3 inline mr-1" />
                            Aadhar: {member.aadharNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter */}
      <div>
        <div className="text-sm font-semibold text-neutral-700 mb-2">Cover Letter</div>
        <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700">
          {application.coverLetter || 'No cover letter provided'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {adminApproval === 'pending' && (
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={verifying || rejecting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-neutral-300 transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={approveApplication}
            disabled={verifying || rejecting}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-neutral-300 transition flex items-center justify-center gap-2"
          >
            {verifying ? (
              <><Loader className="w-5 h-5 animate-spin" /> Approving...</>
            ) : (
              <><CheckCircle className="w-5 h-5" /> Approve Application</>
            )}
          </button>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="font-bold text-lg mb-4">Reject Application</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
              placeholder="Provide a reason for rejection (will be sent to applicant)"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={rejectApplication}
                disabled={rejecting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-neutral-300 transition"
              >
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminGroupVerification;
