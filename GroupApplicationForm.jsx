import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, X, Phone, User, FileText, AlertCircle,
  CheckCircle, Loader, Info, Mail, MapPin, Upload
} from 'lucide-react';

const emptyMember = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  skills: '',
  documentImage: null,
  documentPreview: null,
});

const GroupApplicationForm = ({ job, onSubmit, onCancel, loading }) => {
  const [isGroupApplication, setIsGroupApplication] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [error, setError] = useState('');

  const addGroupMember = () => {
    setError('');
    
    if (!job.allowGroupApply) {
      setError('This job does not accept group applications');
      return;
    }
    
    // Use job vacancies/workersNeeded as the limit (including the leader)
    const maxSize = parseInt(job.vacancies) || parseInt(job.workersNeeded) || job.maxGroupSize || 10;
    const totalIncludingNewMember = groupMembers.length + 1; // +1 for the leader
    
    if (totalIncludingNewMember >= maxSize) {
      setError(`Maximum group size is ${maxSize} (including you as leader). Only ${maxSize - 1} additional member${maxSize - 1 === 1 ? '' : 's'} allowed.`);
      return;
    }

    // Additional validation: check if all current members have required fields before adding new one
    for (let i = 0; i < groupMembers.length; i++) {
      const m = groupMembers[i];
      if (!m.name.trim()) { 
        setError(`Please complete Worker ${i + 1}'s information (Full name required) before adding another member`); 
        return; 
      }
      if (!m.phone.trim()) { 
        setError(`Please complete Worker ${i + 1}'s information (Phone required) before adding another member`); 
        return; 
      }
      if (!m.skills.trim()) { 
        setError(`Please complete Worker ${i + 1}'s information (Skills required) before adding another member`); 
        return; 
      }
    }

    setGroupMembers([...groupMembers, emptyMember()]);
  };

  const removeGroupMember = (index) => {
    setGroupMembers(groupMembers.filter((_, i) => i !== index));
  };

  const updateGroupMember = (index, field, value) => {
    const updated = [...groupMembers];
    updated[index] = { ...updated[index], [field]: value };
    setGroupMembers(updated);
  };

  const handleDocumentUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateGroupMember(index, 'documentImage', ev.target.result);
      updateGroupMember(index, 'documentPreview', URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
  const validateEmail = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (!coverLetter.trim()) {
      setError('Please add a cover letter');
      return false;
    }
    if (isGroupApplication && groupMembers.length === 0) {
      setError('Please add at least one group member or switch to individual application');
      return false;
    }
    if (isGroupApplication) {
      for (let i = 0; i < groupMembers.length; i++) {
        const m = groupMembers[i];
        if (!m.name.trim()) { setError(`Full name is required for Worker ${i + 1}`); return false; }
        if (!m.phone.trim()) { setError(`Phone number is required for Worker ${i + 1}`); return false; }
        if (!validatePhone(m.phone)) { setError(`Invalid phone number for Worker ${i + 1} (must be 10 digits)`); return false; }
        if (m.email && !validateEmail(m.email)) { setError(`Invalid email address for Worker ${i + 1}`); return false; }
        if (!m.skills.trim()) { setError(`Skills are required for Worker ${i + 1}`); return false; }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (!validateForm()) return;
    onSubmit({
      coverLetter,
      groupMembers: isGroupApplication ? groupMembers.map(m => ({
        name: m.name,
        phone: m.phone,
        email: m.email || '',
        address: m.address || '',
        skills: m.skills,
        documentImage: m.documentImage || null,
      })) : [],
      isGroupApplication,
    });
  };

  const totalWorkers = isGroupApplication ? 1 + groupMembers.length : 1;

  return (
    <div className="space-y-6">
      {/* Application Type Toggle */}
      <div className="bg-white rounded-xl border-2 border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="font-bold text-lg">Application Type</h3>
              <p className="text-sm text-neutral-600">Choose how you want to apply</p>
            </div>
          </div>
          {job.allowGroupApply && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
              <CheckCircle className="w-3 h-3" />
              Group Allowed
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setIsGroupApplication(false); setGroupMembers([]); setError(''); }}
            className={`p-4 rounded-lg border-2 transition-all ${
              !isGroupApplication ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
            }`}
          >
            <User className={`w-6 h-6 mx-auto mb-2 ${!isGroupApplication ? 'text-primary-600' : 'text-neutral-400'}`} />
            <div className="font-semibold">Individual</div>
            <div className="text-xs text-neutral-500 mt-1">Apply for yourself</div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!job.allowGroupApply) { setError('This job does not accept group applications'); return; }
              setIsGroupApplication(true); setError('');
            }}
            disabled={!job.allowGroupApply}
            className={`p-4 rounded-lg border-2 transition-all ${
              isGroupApplication ? 'border-primary-500 bg-primary-50' :
              job.allowGroupApply ? 'border-neutral-200 hover:border-primary-300' :
              'border-neutral-100 bg-neutral-50 cursor-not-allowed'
            }`}
          >
            <Users className={`w-6 h-6 mx-auto mb-2 ${
              isGroupApplication ? 'text-primary-600' : job.allowGroupApply ? 'text-neutral-400' : 'text-neutral-300'
            }`} />
            <div className={`font-semibold ${!job.allowGroupApply && 'text-neutral-400'}`}>Group Leader</div>
            <div className="text-xs text-neutral-500 mt-1">{job.allowGroupApply ? 'Bring your team' : 'Not available'}</div>
          </motion.button>
        </div>
      </div>

      {/* Group Info Banner */}
      {isGroupApplication && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-blue-900">Group Application Guidelines</div>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>You'll be the group leader responsible for your team</li>
                <li>Provide accurate details for each worker</li>
                <li>Member documents are shared directly with the employer</li>
                <li>Name, phone, and skills are required; email and address are optional</li>
                {(job.vacancies || job.workersNeeded) && (() => { const v = parseInt(job.vacancies) || parseInt(job.workersNeeded); return <li>📍 <strong>Vacancies Available: {v}</strong> (including you as leader - {v - 1} additional member{v - 1 === 1 ? '' : 's'} allowed)</li>; })()}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cover Letter */}
      <div>
        <label className="block text-neutral-700 font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          Cover Letter / Message *
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
          placeholder={isGroupApplication
            ? "Introduce yourself as a group leader and describe your team's experience..."
            : "Why are you a good fit for this position?"}
        />
        <div className="text-xs text-neutral-500 mt-1">{coverLetter.length} characters</div>
      </div>

      {/* Group Members Section */}
      {isGroupApplication && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Group Members</h3>
              <p className="text-sm text-neutral-600">
                Add details for each worker ({groupMembers.length} added, Total: {totalWorkers})
              </p>
            </div>
            <button
              type="button"
              onClick={addGroupMember}
              disabled={
                groupMembers.length >= (parseInt(job.vacancies) || parseInt(job.workersNeeded) || 10) - 1 ||
                groupMembers.some(m => !m.name.trim() || !m.phone.trim() || !m.skills.trim())
              }
              title={
                groupMembers.some(m => !m.name.trim() || !m.phone.trim() || !m.skills.trim())
                  ? 'Complete all current worker details before adding another'
                  : groupMembers.length >= (parseInt(job.vacancies) || parseInt(job.workersNeeded) || 10) - 1
                  ? 'Maximum workers reached'
                  : 'Add a new worker to your team'
              }
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                groupMembers.length >= (parseInt(job.vacancies) || parseInt(job.workersNeeded) || 10) - 1 ||
                groupMembers.some(m => !m.name.trim() || !m.phone.trim() || !m.skills.trim())
                  ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Worker
            </button>
          </div>

          <AnimatePresence>
            {groupMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border-2 border-neutral-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold text-sm">{index + 1}</span>
                    </div>
                    <h4 className="font-semibold">Worker {index + 1}</h4>
                  </div>
                  <button type="button" onClick={() => removeGroupMember(index)} className="text-red-600 hover:text-red-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateGroupMember(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                      placeholder="Worker's full name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => updateGroupMember(index, 'phone', e.target.value)}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:border-primary-500 transition ${
                        member.phone && !/^[6-9]\d{9}$/.test(member.phone.replace(/\D/g, ''))
                          ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                      }`}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    {member.phone && !/^[6-9]\d{9}$/.test(member.phone.replace(/\D/g, '')) && (
                      <p className="text-xs text-red-500 mt-0.5">Enter valid 10-digit mobile number</p>
                    )}
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                      <span className="text-xs text-neutral-400 ml-1">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateGroupMember(index, 'email', e.target.value)}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:border-primary-500 transition ${
                        member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)
                          ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                      }`}
                      placeholder="worker@example.com"
                    />
                    {member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email) && (
                      <p className="text-xs text-red-500 mt-0.5">Enter a valid email address</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Skills <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.skills}
                      onChange={(e) => updateGroupMember(index, 'skills', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                      placeholder="e.g., Masonry, Carpentry, Welding"
                    />
                  </div>

                  {/* Address (optional) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Address
                      <span className="text-xs text-neutral-400 ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={member.address}
                      onChange={(e) => updateGroupMember(index, 'address', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                      placeholder="House / Street / Village, District"
                    />
                  </div>

                  {/* Document Image */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> ID / Document for Verification
                      <span className="text-xs text-neutral-400 ml-1">(Optional — visible to employer only)</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-3 transition ${
                      member.documentPreview ? 'border-green-300 bg-green-50' : 'border-neutral-200 hover:border-primary-300'
                    }`}>
                      {member.documentPreview ? (
                        <div className="flex items-center gap-3">
                          {member.documentImage?.startsWith('data:image') && (
                            <img src={member.documentPreview} alt="doc" className="w-16 h-16 object-cover rounded-lg border" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Document uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() => { updateGroupMember(index, 'documentImage', null); updateGroupMember(index, 'documentPreview', null); }}
                              className="text-xs text-red-500 hover:text-red-700 mt-1"
                            >Remove</button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer py-2">
                          <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                          <span className="text-xs text-neutral-500">Click to upload Aadhar / ID / Any document</span>
                          <span className="text-xs text-neutral-400 mt-0.5">JPG, PNG or PDF accepted</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(index, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {groupMembers.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No workers added yet. Click "Add Worker" to start building your team.</p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-neutral-900">Application Summary</div>
            <div className="text-sm text-neutral-600 mt-1">
              {isGroupApplication
                ? `Applying as Group Leader with ${groupMembers.length} worker${groupMembers.length !== 1 ? 's' : ''} (Total: ${totalWorkers})`
                : 'Applying as individual worker'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{totalWorkers}</div>
            <div className="text-xs text-neutral-500">Total Workers</div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      {isGroupApplication && groupMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900">Direct to Employer</div>
              <div className="text-sm text-blue-700 mt-1">
                Your group application and member documents will be sent directly to the employer for review. No admin approval required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GroupApplicationForm;
