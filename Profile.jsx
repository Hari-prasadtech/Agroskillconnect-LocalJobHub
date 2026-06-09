import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Phone, MapPin, Globe, Users, Save,
  ChevronLeft, Loader, CheckCircle, AlertCircle, Camera, User,
  X, Shield, Eye, EyeOff, Mail, Briefcase, HardHat, Leaf,
  Wrench, Zap, Home, Star, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';
import { KASARAGOD_PINCODES } from '../../data/kasaragodPincodes';

const WORK_CATEGORIES = [
  { value: 'construction', label: 'Construction', icon: HardHat },
  { value: 'farming', label: 'Farming', icon: Leaf },
  { value: 'plumbing', label: 'Plumbing', icon: Wrench },
  { value: 'electrical', label: 'Electrical', icon: Zap },
  { value: 'local_workers', label: 'Local Workers', icon: Home },
  { value: 'event_management', label: 'Events', icon: Users },
  { value: 'other', label: 'Other', icon: Star },
];

const WORKERS_NEEDED_OPTIONS = ['1-5', '5-10', '10-20', '20-50', '50+'];
const COMPANY_SIZE_OPTIONS = ['1-10', '10-50', '50-200', '200-500', '500+'];

export default function EmployerProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', pincode: '', city: '', state: '', address: '',
    companyName: '', organizationName: '', workCategory: '',
    workersNeeded: '', companySize: '', website: '', gender: '',
    about: '', otherDetails: '', profileImage: '',
    documentType: 'pan', documentNumber: '',
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [showDocNumber, setShowDocNumber] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('Employer user data:', user); // Debug
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        pincode: user.pincode || '',
        city: user.city || 'Kasaragod',
        state: user.state || 'Kerala',
        address: user.address || '',
        companyName: user.companyName || '',
        organizationName: user.organizationName || '',
        workCategory: user.workCategory || '',
        workersNeeded: user.workersNeeded || '',
        companySize: user.companySize || '',
        website: user.website || '',
        gender: user.gender || '',
        about: user.about || '',
        otherDetails: user.otherDetails || '',
        profileImage: user.profileImage || '',
        documentType: user.documentType || 'pan',
        documentNumber: user.documentNumber || '',
      });
      setImgPreview(user.profileImage || '');
    }
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { const d = ev.target.result; setImgPreview(d); setForm(f => ({ ...f, profileImage: d })); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/user/profile', form);
      updateUser(res.data);
      showToast('Profile saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.message || 'Failed to save profile', 'error');
    } finally { setSaving(false); }
  };

  const pincodeInfo = KASARAGOD_PINCODES.find(p => p.pincode === form.pincode);

  const F = ({ label, children }) => (
    <div>
      <label className="block text-sm font-medium text-neutral-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/employer/dashboard')} className="p-2 rounded-xl hover:bg-white hover:shadow transition-all">
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Company Profile</h1>
              <p className="text-neutral-500 text-sm">Your registration details — help workers find you</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Profile Photo */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Camera size={17} className="text-primary-500" /> Profile / Company Photo
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-100 border-4 border-primary-200 flex items-center justify-center">
                    {imgPreview ? <img src={imgPreview} alt="Profile" className="w-full h-full object-cover" /> : <Building2 size={32} className="text-primary-400" />}
                  </div>
                  <label htmlFor="empImgInput" className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 shadow-md">
                    <Camera size={14} className="text-white" />
                  </label>
                  <input id="empImgInput" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">Upload company / profile photo</p>
                  <p className="text-xs text-neutral-500">JPG, PNG or GIF · Max 2 MB</p>
                  {imgPreview && (
                    <button type="button" onClick={() => { setImgPreview(''); setForm(f => ({ ...f, profileImage: '' })); }}
                      className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Contact Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <User size={17} className="text-primary-500" /> Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Contact Person Name *">
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={`${inputCls} pl-9`} placeholder="Your name" required />
                  </div>
                </F>
                <F label="Email">
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <input value={form.email} disabled className={`${inputCls} pl-9 bg-neutral-50 text-neutral-500`} />
                  </div>
                </F>
                <F label="Phone Number">
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={`${inputCls} pl-9`} placeholder="+91-XXXXXXXXXX" />
                  </div>
                </F>
                <F label="Pincode">
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <select value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                      className={`${inputCls} pl-9 bg-white`}>
                      <option value="">Select pincode</option>
                      {KASARAGOD_PINCODES.map(p => (
                        <option key={p.pincode + p.area} value={p.pincode}>{p.pincode} – {p.area}</option>
                      ))}
                    </select>
                  </div>
                  {pincodeInfo && <p className="text-xs text-primary-600 mt-1 ml-1">{pincodeInfo.area}, {pincodeInfo.taluk} Taluk</p>}
                </F>
                <F label="District / State">
                  <input value="Kasaragod, Kerala" disabled className={`${inputCls} bg-neutral-50 text-neutral-500`} />
                </F>
                <div className="sm:col-span-2">
                  <F label="Complete Address *">
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                      <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                        className={`${inputCls} pl-9 resize-none`} placeholder="Building name, street, area, locality…" />
                    </div>
                  </F>
                </div>
                <F label="Gender *">
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className={`${inputCls} bg-white`}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </F>
              </div>
            </motion.div>

            {/* Organisation Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Building2 size={17} className="text-primary-500" /> Organisation Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user?.employerType === 'company' ? (
                  <F label="Organisation Name">
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                      <input value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                        className={`${inputCls} pl-9`} placeholder="Your organisation name" />
                    </div>
                  </F>
                ) : (
                  <F label="Company / Business Name">
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                      <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                        className={`${inputCls} pl-9`} placeholder="Your company or business name" />
                    </div>
                  </F>
                )}
                <F label="Website (Optional)">
                  <div className="relative">
                    <Globe size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      className={`${inputCls} pl-9`} placeholder="www.yourcompany.com" />
                  </div>
                </F>
                <F label="Company Size">
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                    <select value={form.companySize} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))}
                      className={`${inputCls} pl-9 bg-white`}>
                      <option value="">Select size</option>
                      {COMPANY_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o} employees</option>)}
                    </select>
                  </div>
                </F>
              </div>
            </motion.div>

            {/* Hiring Requirements */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Briefcase size={17} className="text-primary-500" /> Hiring Requirements
              </h2>

              {/* Work Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-600 mb-2">Work Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WORK_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = form.workCategory === cat.value;
                    return (
                      <button key={cat.value} type="button"
                        onClick={() => setForm(f => ({ ...f, workCategory: cat.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                        }`}>
                        <Icon size={15} className={isActive ? 'text-primary-600' : 'text-neutral-400'} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workers Needed */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Workers Typically Needed</label>
                <div className="flex flex-wrap gap-2">
                  {WORKERS_NEEDED_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({ ...f, workersNeeded: opt }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.workersNeeded === opt
                          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                      }`}>
                      {opt} workers
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* About & Other Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <FileText size={17} className="text-primary-500" /> About & Additional Info
              </h2>
              <div className="space-y-4">
                <F label="About Your Organisation">
                  <textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell workers about your company, what you do, working culture…" />
                </F>
                <F label="Other Details (Optional)">
                  <textarea value={form.otherDetails} onChange={e => setForm(f => ({ ...f, otherDetails: e.target.value }))} rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Any additional details, certifications, special requirements…" />
                </F>
              </div>
            </motion.div>

            {/* Document */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Shield size={17} className="text-primary-500" /> Document Verification
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Document Type">
                  <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value, documentNumber: '' }))}
                    className={`${inputCls} bg-white`}>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="voterId">Voter ID</option>
                    <option value="driverlicense">Driving Licence</option>
                    <option value="passport">Passport</option>
                  </select>
                </F>
                <F label="Document Number">
                  <div className="relative">
                    <Shield size={15} className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input type={showDocNumber ? 'text' : 'password'}
                      value={form.documentNumber}
                      onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                      className={`${inputCls} pl-9 pr-10`}
                      placeholder="Enter document number" />
                    <button type="button" onClick={() => setShowDocNumber(!showDocNumber)}
                      className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600">
                      {showDocNumber ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </F>
              </div>
            </motion.div>

            {/* Save */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button type="submit" disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-base">
                {saving ? <><Loader size={18} className="animate-spin" /> Saving…</> : <><Save size={18} /> Save Profile</>}
              </button>
            </motion.div>
          </form>
        </div>
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-primary-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}
