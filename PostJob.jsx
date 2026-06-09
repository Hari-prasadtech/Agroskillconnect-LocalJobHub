import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Briefcase, MapPin, DollarSign, Users,
  Calendar, Tag, X, Sparkles, Save, Loader,
  CheckCircle, AlertCircle, Wand2, Clock, Sun, Moon,
  CalendarDays, Timer, Repeat, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';
import { KASARAGOD_PINCODES, isValidKasaragodPincode } from '../../data/kasaragodPincodes';

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

const TITLE_SKILL_MAP = [
  { keywords: ['cook','catering','chef','kitchen','baker','food'], skills: ['Cooking','Menu Planning','Food Preparation','Catering Service','Kitchen Hygiene','Recipe Knowledge','Spice Handling','Food Safety','Serving','Bulk Cooking'] },
  { keywords: ['plumb','pipe'], skills: ['Plumbing','Pipe Fitting','Leak Repair','Drainage Fitting','Water Supply','Tank Cleaning','Bathroom Fixtures','Valve Installation','Pump Maintenance'] },
  { keywords: ['electric','wiring','panel','solar','cable'], skills: ['Electrical Wiring','Panel Installation','Circuit Testing','Switchboard Installation','Cable Laying','Motor Wiring','Lighting Installation','Solar Panel Setup'] },
  { keywords: ['mason','brick','cement','plaster','construct','build','concreting','scaffold'], skills: ['Masonry','Bricklaying','Plastering','Concreting','Scaffolding','Steel Fixing','Tiling','Roofing','Site Work','Material Handling'] },
  { keywords: ['farm','paddy','crop','harvest','agri','plant','cultivat'], skills: ['Paddy Cultivation','Crop Harvesting','Irrigation Management','Seed Sowing','Organic Farming','Fruit Picking','Land Preparation','Coconut Climbing','Water Management'] },
  { keywords: ['driver','driving','vehicle','transport'], skills: ['Driving','Vehicle Maintenance','Road Navigation','Traffic Rules','Loading & Unloading','Delivery','Route Planning'] },
  { keywords: ['security','guard','watchman','patrol'], skills: ['Security Guard','Surveillance','Patrolling','Access Control','Emergency Response','Crowd Control','Report Writing'] },
  { keywords: ['clean','housekeep','domestic','maid','sweeper'], skills: ['House Keeping','Cleaning','Laundry','Sweeping & Mopping','Waste Disposal','Kitchen Cleaning','Child Care'] },
  { keywords: ['event','wedding','function','decoration','stage','festival'], skills: ['Event Setup','Decoration','Catering','Stage Assembly','Crowd Management','Equipment Handling','Cleanup','AV Setup','Security'] },
  { keywords: ['labour','helper','loader','general work','unload'], skills: ['Material Handling','Site Cleaning','Loading & Unloading','Demolition Work','Digging','General Labor','Concrete Mixing','Waste Disposal'] },
  { keywords: ['carpenter','wood','furniture','joiner'], skills: ['Carpentry','Woodworking','Furniture Making','Joinery','Wood Polishing','Door & Window Fitting'] },
  { keywords: ['paint','painter','coat'], skills: ['Painting','Surface Preparation','Spray Painting','Waterproofing','Putty Work','Varnishing'] },
  { keywords: ['tile','floor','marble','granite'], skills: ['Tiling','Flooring','Surface Preparation','Waterproofing','Grouting','Marble Polishing'] },
  { keywords: ['weld','fabricat','steel','metal'], skills: ['Welding','Metal Fabrication','Steel Fixing','Arc Welding','Gas Cutting','Safety Practices'] },
  { keywords: ['garden','landscape','nursery','plant care'], skills: ['Gardening','Landscaping','Plant Care','Irrigation','Tree Trimming','Pest Control'] },
  { keywords: ['delivery','courier','dispatch','bike'], skills: ['Delivery','Driving','Route Planning','Package Handling','Customer Service','GPS Navigation'] },
  { keywords: ['care','nurse','health','medical','patient'], skills: ['Patient Care','First Aid','Medication Assistance','Hygiene Maintenance','Vital Monitoring','Communication'] },
];

function getSkillsByTitle(title) {
  if (!title) return [];
  const lower = title.toLowerCase();
  const matched = new Set();
  TITLE_SKILL_MAP.forEach(({ keywords, skills }) => {
    if (keywords.some(k => lower.includes(k))) {
      skills.forEach(s => matched.add(s));
    }
  });
  return [...matched];
}

const CATEGORY_OPTIONS = [
  { value:'construction',     label:'🏗️ Construction' },
  { value:'labourers',        label:'🔨 Labourers' },
  { value:'farming',          label:'🌾 Farming' },
  { value:'plumbing',         label:'🔧 Plumbing' },
  { value:'electrical',       label:'⚡ Electrical' },
  { value:'event_management', label:'🎪 Event Management' },
  { value:'local_workers',    label:'🏘️ Local Workers' },
  { value:'other',            label:'⭐ Other' },
];

const JOB_TYPE_OPTIONS = ['Full-time','Part-time','Seasonal','Contract','Daily Wages'];
const EXPERIENCE_OPTIONS = ['Fresher','1-2 years','2-4 years','3-5 years','4-6 years','5+ years','Any'];

const initialForm = {
  title:'', company:'', pincode:'', city:'', state:'', address:'', 
  salary:'', jobType:'', experience:'', vacancies:'', description:'',
  skills:[], deadline:'', startDate:'', category:'', groupHiring: false, groupHiringDetails: '',
  maxApplications:'',
  workDays:'', workHoursFrom:'', workHoursTo:'', contractDuration:''
};

export default function PostJob() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(initialForm);
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);
  const [pincodeMatches, setPincodeMatches] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pincodeWarning, setPincodeWarning] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const pincodeRef = useRef(null);
  const skillRef = useRef(null);

  // Built-in AI Job Description Generator (No API Key Needed)
  const generateAIDescription = async () => {
    if (!form.title) {
      showToast('Please enter a Job Title first', 'error');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await axios.post('/api/ai/generate-description', {
        title: form.title,
        category: form.category,
        skills: form.skills,
        jobType: form.jobType,
        experience: form.experience,
        vacancies: form.vacancies,
        salary: form.salary,
      });

      if (response.data?.description) {
        setForm(prev => ({ ...prev, description: response.data.description }));
        showToast('✨ AI description generated!', 'success');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const msg = error.response?.data?.error || 'Could not generate description. Please write manually.';
      showToast(msg, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Redirect if not employer
  useEffect(() => {
    if (!authLoading && user && user.userType !== 'employer') {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Initialize form from user data
  useEffect(() => {
    if (user && user.userType === 'employer') {
      console.log('PostJob: Setting form with user data:', user);
      setForm(prev => ({
        ...prev,
        company: user.companyName || user.organizationName || '',
        pincode: user.pincode || '',
        city: user.city || 'Kasaragod',
        state: user.state || 'Kerala',
        address: user.address || '',
      }));
    }
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Update skill suggestions when title changes
    if (name === 'title') {
      setSkillSuggestions(getSkillsByTitle(value));
    }
  };

  // Pincode autocomplete
  const handlePincodeChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, pincode: value }));
    
    if (value.length > 0) {
      const matches = KASARAGOD_PINCODES.filter(p => p.pincode.includes(value));
      setPincodeMatches(matches);
      setShowPincodeDropdown(matches.length > 0);
    } else {
      setPincodeMatches([]);
      setShowPincodeDropdown(false);
      setPincodeWarning('');
    }
    
    if (value && !isValidKasaragodPincode(value)) {
      setPincodeWarning('⚠️ Please use a valid Kasaragod pincode');
    } else {
      setPincodeWarning('');
    }
  };

  const selectPincode = (pincode) => {
    setForm(prev => ({ ...prev, pincode }));
    setPincodeMatches([]);
    setShowPincodeDropdown(false);
    setPincodeWarning('');
  };

  // Skill input handlers
  const handleSkillInput = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9\s&,\-]*$/.test(value)) {
      setSkillInput(value);
      const baseSuggestions = getSkillsByTitle(form.title);
      if (value.trim().length > 0) {
        const filtered = baseSuggestions.filter(s =>
          s.toLowerCase().includes(value.toLowerCase()) && !form.skills.includes(s)
        );
        setSkillSuggestions(filtered);
      } else {
        setSkillSuggestions(baseSuggestions.filter(s => !form.skills.includes(s)));
      }
    }
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
      setSkillSuggestions(prev => prev.filter(x => x !== s));
      setSkillInput('');
      setShowSkillDropdown(false);
    }
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== skill) }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (skillInput.trim()) addSkill(skillInput);
    } else if (e.key === ',') {
      e.preventDefault();
      if (skillInput.trim()) addSkill(skillInput);
    } else if (e.key === 'Escape') {
      setSkillInput('');
      setShowSkillDropdown(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.title || !form.category || !form.pincode || !form.address || !form.description) {
      showToast('Please fill all required fields (*)', 'error');
      return;
    }
    
    if (!isValidKasaragodPincode(form.pincode)) {
      showToast('Please enter a valid Kasaragod pincode', 'error');
      return;
    }
    
    if (form.skills.length === 0) {
      showToast('Please add at least one skill', 'error');
      return;
    }

    if (!form.vacancies || parseInt(form.vacancies) < 1) {
      showToast('Please enter number of vacancies', 'error');
      return;
    }

    if (!form.startDate) {
      showToast('Please select a start date', 'error');
      return;
    }

    if (!form.deadline) {
      showToast('Please select an application deadline', 'error');
      return;
    }

    if (new Date(form.deadline) < new Date()) {
      showToast('Application deadline cannot be in the past', 'error');
      return;
    }

    setSaving(true);
    try {
      const jobPayload = {
        ...form,
        vacancies: parseInt(form.vacancies),
        status: 'pending',
      };

      const response = await axios.post('/api/jobs', jobPayload);
      
      showToast('✅ Job posted successfully! Pending admin approval', 'success');
      setTimeout(() => {
        navigate('/employer/jobs');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to post job';
      showToast(errorMsg, 'error');
      console.error('Error posting job:', err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center">
              <Loader size={32} className="mx-auto mb-4 animate-spin text-primary-500" />
              <p className="text-neutral-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || user.userType !== 'employer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center">
              <AlertCircle size={32} className="mx-auto mb-4 text-red-500" />
              <p className="text-neutral-600 mb-4">Only employers can post jobs. Please login as employer.</p>
              <Link to="/login" className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center gap-4 mb-8">
            <Link to="/employer/dashboard" className="p-2 rounded-lg hover:bg-white hover:shadow transition-all">
              <ChevronLeft size={20} className="text-neutral-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Post a New Job</h1>
              <p className="text-neutral-500 text-sm">Fill all required fields marked with *</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit}>

            {/* Basic Details */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-5">
              <h2 className="text-lg font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Briefcase size={18} className="text-primary-500" /> Job Details *
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Job Title *">
                  <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="e.g., Plumbing Technician" required />
                </FormField>
                
                <FormField label="Category *">
                  <select name="category" value={form.category} onChange={handleChange} className={`${inputCls} bg-white`} required>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>

                                  <FormField label="Company Name">
                    <input name="company" value={form.company} onChange={handleChange} className={inputCls} placeholder="Your company name" />
                  </FormField>

                <FormField label="Job Type *">
                  <select name="jobType" value={form.jobType} onChange={handleChange} className={`${inputCls} bg-white`} required>
                    <option value="">Select job type</option>
                    {JOB_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>
              </div>
            </motion.div>

            {/* Location & Salary */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-5">
              <h2 className="text-lg font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-primary-500" /> Location & Compensation *
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Pincode with autocomplete */}
                <FormField label="Pincode *" hint="Start typing to see suggestions">
                  <div className="relative" ref={pincodeRef}>
                    <MapPin size={15} className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input 
                      type="text"
                      name="pincode" 
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      onFocus={() => {
                        if (form.pincode.length > 0 && pincodeMatches.length > 0) {
                          setShowPincodeDropdown(true);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowPincodeDropdown(false), 200)}
                      className={`${inputCls} pl-9`}
                      placeholder="Type pincode"
                      maxLength="6"
                      required
                    />
                    {/* Pincode dropdown */}
                    {showPincodeDropdown && pincodeMatches.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {pincodeMatches.slice(0, 8).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectPincode(p.pincode);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-50 hover:text-primary-700 transition-colors border-b border-neutral-50 last:border-0"
                          >
                            <span className="font-medium">{p.pincode}</span>
                            <span className="text-neutral-500 ml-2 text-xs">– {p.area}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {pincodeWarning && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                      {pincodeWarning}
                    </div>
                  )}
                </FormField>

                <FormField label="City *">
                  <input name="city" value={form.city} disabled className={`${inputCls} bg-neutral-100`} />
                </FormField>

                <FormField label="State *">
                  <input name="state" value={form.state} disabled className={`${inputCls} bg-neutral-100`} />
                </FormField>

                <FormField label="Salary (Optional)">
                  <input name="salary" value={form.salary} onChange={handleChange} className={inputCls} placeholder="e.g., 15000-20000" />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Detailed Address *">
                    <textarea name="address" value={form.address} onChange={handleChange} rows={2} className={inputCls} placeholder="Street, area, location details" required />
                  </FormField>
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-5">
              <h2 className="text-lg font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Tag size={18} className="text-primary-500" /> Requirements *
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                  <FormField label="Experience *">
                    <select name="experience" value={form.experience} onChange={handleChange} className={`${inputCls} bg-white`} required>
                      <option value="">Select experience level</option>
                      {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FormField>

                <FormField label="Vacancies *">
                  <input type="number" name="vacancies" value={form.vacancies} onChange={handleChange} className={inputCls} placeholder="Number of positions" min="1" required />
                </FormField>

                <FormField label="Start Date *" hint="When do you need workers to start?">
                  <div className="relative">
                    <CalendarDays size={15} className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input 
                      type="date" 
                      name="startDate" 
                      value={form.startDate} 
                      onChange={handleChange} 
                      className={`${inputCls} pl-9`}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </FormField>

                                  <FormField label="Working Days" hint="e.g. Monday to Saturday">
                    <select name="workDays" value={form.workDays} onChange={handleChange} className={inputCls}>
                      <option value="">Select working days</option>
                      <option value="Monday to Friday">Monday to Friday</option>
                      <option value="Monday to Saturday">Monday to Saturday</option>
                      <option value="Monday to Sunday">Monday to Sunday</option>
                      <option value="5 days a week">5 days a week</option>
                      <option value="6 days a week">6 days a week</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </FormField>

                                  <FormField label="Work Hours From">
                    <input type="time" name="workHoursFrom" value={form.workHoursFrom} onChange={handleChange} className={inputCls} />
                  </FormField>

                                  <FormField label="Work Hours To">
                    <input type="time" name="workHoursTo" value={form.workHoursTo} onChange={handleChange} className={inputCls} />
                  </FormField>

                                  <FormField label="Contract Duration" hint="e.g. 6 months, 1 year, Permanent">
                    <select name="contractDuration" value={form.contractDuration} onChange={handleChange} className={inputCls}>
                      <option value="">Select duration</option>
                      <option value="1 month">1 month</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Seasonal">Seasonal</option>
                      <option value="Project-based">Project-based</option>
                    </select>
                  </FormField>

                <FormField label="Application Deadline *" hint="Last date to apply for this job">
                  <div className="relative">
                    <Timer size={15} className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input 
                      type="date" 
                      name="deadline" 
                      value={form.deadline} 
                      onChange={handleChange} 
                      className={`${inputCls} pl-9`}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Max Applications (Optional)" hint="Auto-close this job after this many applications. Leave blank for unlimited.">
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type="number"
                      name="maxApplications"
                      value={form.maxApplications}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                      min="1"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  {form.maxApplications && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      🔒 Job will auto-close after {form.maxApplications} application{parseInt(form.maxApplications)!==1?'s':''}
                    </p>
                  )}
                </FormField>

                {/* Group Hiring Option - Shows when vacancies > 2 */}
                {form.vacancies && parseInt(form.vacancies) > 2 && (
                  <div className="sm:col-span-2 bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="groupHiring"
                        id="groupHiring"
                        checked={form.groupHiring}
                        onChange={(e) => setForm(prev => ({ ...prev, groupHiring: e.target.checked }))}
                        className="mt-1 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="groupHiring" className="text-sm font-semibold text-primary-700 cursor-pointer flex items-center gap-2">
                          🤝 Enable Group Hiring
                          <span className="inline-block px-2.5 py-0.5 bg-primary-200 text-primary-700 text-xs font-bold rounded-full">
                            Max {form.vacancies} spots
                          </span>
                        </label>
                        <p className="text-xs text-primary-600 mt-1">Allow multiple workers to work together on this job. Each group leader can bring up to {parseInt(form.vacancies) - 1} team members (total {form.vacancies} including leader).</p>
                        
                        {form.groupHiring && (
                          <div className="mt-3 p-3 bg-primary-100 rounded-lg border border-primary-300">
                            <div className="text-xs text-primary-700 font-semibold mb-2">📊 Vacancy Breakdown</div>
                            <p className="text-xs text-primary-600 mb-2">Available positions: <strong>{form.vacancies}</strong></p>
                            <p className="text-xs text-primary-600 mb-3">Group leader can add up to: <strong>{parseInt(form.vacancies) - 1}</strong> additional member{parseInt(form.vacancies) - 1 !== 1 ? 's' : ''}</p>
                            <label className="block text-xs font-medium text-primary-700 mb-2">Group Details (Optional)</label>
                            <textarea
                              name="groupHiringDetails"
                              value={form.groupHiringDetails}
                              onChange={handleChange}
                              rows={2}
                              className={`${inputCls} text-sm`}
                              placeholder="E.g., 'Team leads required', 'Group coordination needed', 'Budget allocation per group member'"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills with autocomplete */}
              <div className="mt-5">
              <FormField label="Required Skills *">
                <div className="relative" ref={skillRef}>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={handleSkillInput}
                    onKeyDown={handleSkillKeyDown}
                    onFocus={() => {
                      const baseSuggestions = getSkillsByTitle(form.title).filter(s => !form.skills.includes(s));
                      setSkillSuggestions(baseSuggestions);
                    }}
                    className={inputCls}
                    placeholder={form.title ? "Filter suggestions or type custom skill + Enter" : "Enter job title first to see suggestions"}
                  />

                  {/* Skill suggestion chips */}
                  {skillSuggestions.filter(s => !form.skills.includes(s)).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-neutral-400 mb-1.5">Suggested — tap to add:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillSuggestions.filter(s => !form.skills.includes(s)).slice(0, 16).map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addSkill(s)}
                            className="px-3 py-1 bg-primary-50 border border-primary-200 text-primary-700 text-xs rounded-full hover:bg-primary-100 hover:border-primary-400 transition-colors"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected skills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.skills.map(s => (
                      <div key={s} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="hover:text-primary-900">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Job Description *">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <textarea 
                        name="description" 
                        value={form.description} 
                        onChange={handleChange} 
                        rows={4} 
                        className={`${inputCls} flex-1`} 
                        placeholder="Describe the job in detail" 
                        required 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateAIDescription}
                      disabled={aiGenerating || !form.title}
                      className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      {aiGenerating ? (
                        <><Loader size={16} className="animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 size={16} /> ✨ Generate with AI</>
                      )}
                    </button>
                    <p className="text-xs text-neutral-500">💡 Enter a Job Title to generate a description</p>
                  </div>
                </FormField>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}>
              <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">⏳ Pending Admin Approval</p>
                  <p className="text-xs text-amber-700 mt-0.5">Your job post will be reviewed by our admin team. It will <strong>not be visible to workers</strong> until approved. You'll be notified once it goes live.</p>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-xl disabled:opacity-60 transition-all text-base flex items-center justify-center gap-2"
              >
                {saving ? <><Loader size={20} className="animate-spin" /> Posting...</> : <><Briefcase size={20} /> Post Job</>}
              </button>
            </motion.div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{opacity:0,y:80}}
          animate={{opacity:1,y:0}}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium z-50 ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-primary-500'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}
