import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft, Loader, Mail, Phone, MapPin, Building2,
  Save, Edit2, Camera, Check, AlertCircle, User,
  FileText, Hash, Globe, Home, Users, Briefcase
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

const inputCls = (extra = '') =>
  `w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-neutral-50 disabled:text-neutral-600 ${extra}`;

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
    <div className="p-1.5 bg-primary-50 rounded-lg"><Icon className="w-4 h-4 text-primary-600" /></div>
    <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">{title}</h3>
  </div>
);

export default function EmployerMyProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [jobStats, setJobStats] = useState({ total: 0, active: 0, pending: 0 });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pincode: user?.pincode || '',
    city: user?.city || '',
    state: user?.state || '',
    district: user?.district || '',
    gender: user?.gender || '',
    employerType: user?.employerType || 'company',
    companyName: user?.companyName || user?.organizationName || '',
    companyAddress: user?.companyAddress || '',
    companyDescription: user?.companyDescription || '',
    website: user?.website || '',
    workersNeeded: user?.workersNeeded || '',
    otherDetails: user?.otherDetails || '',
  });

  useEffect(() => {
    if (!user || user.userType !== 'employer') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    axios.get('/api/jobs/my').then(res => {
      const jobs = res.data || [];
      setJobStats({
        total: jobs.length,
        active: jobs.filter(j => j.status === 'active').length,
        pending: jobs.filter(j => j.status === 'pending' || j.status === 'pending_approval').length,
      });
    }).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large (max 5MB)', 'error'); return; }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updateData = { ...formData };
      if (selectedImageFile) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          updateData.profileImage = ev.target.result;
          const res = await axios.put('/api/user/profile', updateData);
          if (res.data) updateUser(res.data);
          setSelectedImageFile(null);
          showToast('Profile updated successfully!');
          setIsEditing(false);
        };
        reader.readAsDataURL(selectedImageFile);
        return;
      }
      const res = await axios.put('/api/user/profile', updateData);
      if (res.data) updateUser(res.data);
      showToast('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className={`fixed top-20 right-6 px-6 py-3 rounded-lg text-white shadow-lg z-50 flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.msg}
          </motion.div>
        )}

        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button onClick={() => navigate('/employer/dashboard')}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
                <p className="text-neutral-600 mt-1">Manage your employer account details</p>
              </div>
              <button onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${isEditing ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">

            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
              />
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 mb-8 -mt-16">
                <div className="relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Logo" className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg object-cover" />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <h2 className="text-2xl font-bold text-neutral-900">{formData.companyName || user.name}</h2>
                  <p className="text-neutral-500 font-medium capitalize">{formData.employerType === 'company' ? 'Company / Business' : 'Home Employer'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.accountApproved
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" />Verified</span>
                      : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">⏳ Pending Approval</span>
                    }
                  </div>
                  {isEditing && imagePreview && (
                    <button onClick={() => { setImagePreview(null); setSelectedImageFile(null); }}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold mt-2 block">Remove Logo</button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
                  💡 <strong>Tip:</strong> Click the camera icon to upload a company logo (JPG, PNG, max 5MB)
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Personal Info */}
                <div>
                  <SectionHeader icon={User} title="Contact Person Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Contact Person Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} className={inputCls()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing} className={inputCls()}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input type="email" value={formData.email} disabled className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} placeholder="+91 XXXXX XXXXX" className={inputCls('pl-9')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <SectionHeader icon={MapPin} title="Address & Location" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Pincode</label>
                      <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} disabled={!isEditing} placeholder="671XXX" maxLength={6} className={inputCls()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={!isEditing} className={inputCls()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={!isEditing} className={inputCls()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">District</label>
                      <input type="text" name="district" value={formData.district} onChange={handleChange} disabled={!isEditing} className={inputCls()} />
                    </div>
                  </div>
                </div>

                {/* Employer Type */}
                <div>
                  <SectionHeader icon={Briefcase} title="Employer Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Employer Type</label>
                      <div className="flex gap-3">
                        {[
                          { value: 'company', label: 'Company / Business', icon: Building2 },
                          { value: 'home', label: 'Home Employer', icon: Home },
                        ].map(opt => {
                          const Icon = opt.icon;
                          const selected = formData.employerType === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              disabled={!isEditing}
                              onClick={() => isEditing && setFormData(f => ({ ...f, employerType: opt.value }))}
                              className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-600'} ${!isEditing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                              <Icon className="w-4 h-4" />{opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {formData.employerType === 'company' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Company / Business Name</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} disabled={!isEditing} placeholder="Your company or business name" className={inputCls('pl-9')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Website <span className="text-neutral-400 font-normal">(Optional)</span></label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <input type="url" name="website" value={formData.website} onChange={handleChange} disabled={!isEditing} placeholder="https://www.yourcompany.com" className={inputCls('pl-9')} />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Company Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <textarea name="companyAddress" value={formData.companyAddress} onChange={handleChange} disabled={!isEditing} rows={2} placeholder="Company street address, area, locality..." className={`${inputCls('pl-9')} resize-none`} />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">About Your Company</label>
                          <textarea name="companyDescription" value={formData.companyDescription} onChange={handleChange} disabled={!isEditing} rows={3} placeholder="Tell workers about your company, mission, and work culture..." className={`${inputCls()} resize-none`} />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Number of Workers Needed</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <select name="workersNeeded" value={formData.workersNeeded} onChange={handleChange} disabled={!isEditing} className={inputCls('pl-9')}>
                          <option value="">Select count</option>
                          {formData.employerType === 'home' ? (
                            <>
                              <option value="1">1 worker</option>
                              <option value="2-3">2–3 workers</option>
                              <option value="4-5">4–5 workers</option>
                            </>
                          ) : (
                            <>
                              <option value="1-5">1–5 workers</option>
                              <option value="6-10">6–10 workers</option>
                              <option value="11-20">11–20 workers</option>
                              <option value="20+">20+ workers</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Other Details <span className="text-neutral-400 font-normal">(Optional)</span></label>
                      <input type="text" name="otherDetails" value={formData.otherDetails} onChange={handleChange} disabled={!isEditing} placeholder="Any other relevant details..." className={inputCls()} />
                    </div>
                  </div>
                </div>

                {/* Document Info (read-only) */}
                <div>
                  <SectionHeader icon={FileText} title="Document Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Document Type</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input type="text" value={user?.documentType || 'Not provided'} disabled className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed capitalize" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Document Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input type="text" value={user?.documentNumber || 'Not provided'} disabled className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">Document details can only be changed by contacting admin.</p>
                </div>

                {/* Submit */}
                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-neutral-200">
                    <button type="submit" disabled={loading}
                      className="flex-1 px-6 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)}
                      className="flex-1 px-6 py-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold transition-all">
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-8 border-t border-neutral-200">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1">Account</p>
                  <p className="text-sm font-bold text-green-600">{user.accountApproved ? '✅ Approved' : '⏳ Pending'}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Member Since</p>
                  <p className="text-sm font-bold text-blue-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 text-center">
                  <p className="text-xs font-semibold text-primary-700 uppercase mb-1">Jobs Posted</p>
                  <p className="text-2xl font-bold text-primary-600">{jobStats.total}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Active Jobs</p>
                  <p className="text-2xl font-bold text-amber-600">{jobStats.active}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Document</p>
                  <p className="text-sm font-bold text-purple-600">{user.documentApproved ? '✓ Verified' : '⏳ Pending'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
