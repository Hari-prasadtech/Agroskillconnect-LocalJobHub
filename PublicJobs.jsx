import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, MapPin, Search, X, Clock, LogIn, DollarSign,
  HardHat, Hammer, Leaf, Droplets, Zap, Music, Users, Star,
  ChevronRight, Building2, BadgeCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { DEMO_JOBS } from '../data/demoData';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { id: '',               label: 'All Jobs',      icon: Briefcase, bg: 'bg-primary-500' },
  { id: 'construction',   label: 'Construction',  icon: HardHat,   bg: 'bg-orange-500' },
  { id: 'labourers',      label: 'Labourers',     icon: Hammer,    bg: 'bg-amber-500'  },
  { id: 'farming',        label: 'Farming',       icon: Leaf,      bg: 'bg-green-600'  },
  { id: 'plumbing',       label: 'Plumbing',      icon: Droplets,  bg: 'bg-blue-500'   },
  { id: 'electrical',     label: 'Electrical',    icon: Zap,       bg: 'bg-yellow-500' },
  { id: 'event_management', label: 'Events',      icon: Music,     bg: 'bg-purple-600' },
  { id: 'local_workers',  label: 'Local Workers', icon: Users,     bg: 'bg-teal-600'   },
  { id: 'other',          label: 'Other',         icon: Star,      bg: 'bg-neutral-500'},
];

const CATEGORY_COLORS = {
  plumbing:         'bg-blue-100 text-blue-700',
  electrical:       'bg-yellow-100 text-yellow-700',
  farming:          'bg-green-100 text-green-700',
  construction:     'bg-orange-100 text-orange-700',
  event_management: 'bg-purple-100 text-purple-700',
  local_workers:    'bg-teal-100 text-teal-700',
  labourers:        'bg-amber-100 text-amber-700',
};

function normCat(raw) {
  return (raw || '').toLowerCase().replace(/\s+/g, '_');
}

function deadlineInfo(deadline) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (days <= 0) return { text: 'Expired',       cls: 'text-red-600 bg-red-50' };
  if (days <= 3) return { text: days + 'd left',  cls: 'text-orange-600 bg-orange-50' };
  if (days <= 7) return { text: days + 'd left',  cls: 'text-yellow-600 bg-yellow-50' };
  return { text: days + 'd left', cls: 'text-green-600 bg-green-50' };
}

const PublicJobs = () => {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [searchParams] = useSearchParams();

  const [jobs,           setJobs]           = useState([]);
  const [filteredJobs,   setFilteredJobs]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState(searchParams.get('jobType') || '');
  const [activeCategory, setActiveCategory] = useState('');
  const [jobTypeFilter,  setJobTypeFilter]  = useState('');
  const [locationInput,  setLocationInput]  = useState('');
  const [wagesFilter,    setWagesFilter]    = useState('all');

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Daily Wages'];

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { applyFilters(); }, [jobs, searchTerm, activeCategory, jobTypeFilter, locationInput, wagesFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs');
      setJobs(res.data && res.data.length > 0 ? res.data : DEMO_JOBS);
    } catch {
      setJobs(DEMO_JOBS);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let f = jobs;
    if (searchTerm)     f = f.filter(j =>
      j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (activeCategory) f = f.filter(j => normCat(j.workCategory || j.category) === activeCategory);
    if (jobTypeFilter)  f = f.filter(j => j.jobType === jobTypeFilter);
    if (locationInput.trim()) f = f.filter(j => j.location?.toLowerCase().includes(locationInput.trim().toLowerCase()));
    if (wagesFilter !== 'all') {
      f = f.filter(j => {
        if (!j.dailyWages) return false;
        const m = String(j.dailyWages).match(/\d+/);
        if (!m) return false;
        const n = parseInt(m[0]);
        if (wagesFilter === 'above500')  return n >= 500;
        if (wagesFilter === 'above700')  return n >= 700;
        if (wagesFilter === 'above900')  return n >= 900;
        if (wagesFilter === 'above1200') return n >= 1200;
        return true;
      });
    }
    setFilteredJobs(f);
  };

  const handleJobClick = (job) => {
    if (user?.userType === 'worker') {
      navigate(`/worker/jobs/${job._id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar />

      {/* Hero Banner */}
      <section className="gradient-bg pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-neutral-900 mb-2"
          >
            Browse <span className="text-primary-600">Jobs</span>
          </motion.h1>
          <p className="text-neutral-600 mb-6">
            Find opportunities across construction, farming, electrical, plumbing and more
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by job title, company or skill..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-neutral-700"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="Filter by location..."
                className="pl-10 pr-8 py-3 rounded-xl border-2 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-neutral-700 w-52"
              />
              {locationInput && (
                <button onClick={() => setLocationInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={wagesFilter}
              onChange={e => setWagesFilter(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-neutral-700"
            >
              <option value="all">All Daily Wages</option>
              <option value="above500">Above ₹500/day</option>
              <option value="above700">Above ₹700/day</option>
              <option value="above900">Above ₹900/day</option>
              <option value="above1200">Above ₹1,200/day</option>
            </select>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon   = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    active
                      ? `${cat.bg} text-white shadow-md`
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-neutral-600 font-medium">
                Showing <span className="text-primary-600 font-bold">{filteredJobs.length}</span> jobs
                {activeCategory && ` in ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
              </p>
              {(searchTerm || activeCategory || jobTypeFilter || locationInput || wagesFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setActiveCategory(''); setJobTypeFilter(''); setLocationInput(''); setWagesFilter('all'); }}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Clear Filters
                </button>
              )}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral-700 mb-2">No jobs found</h3>
                <p className="text-neutral-500">Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job, index) => {
                  const catKey     = normCat(job.workCategory || job.category);
                  const colorClass = CATEGORY_COLORS[catKey] || 'bg-neutral-100 text-neutral-700';
                  const catLabel   = CATEGORIES.find(c => c.id === catKey)?.label || (job.workCategory || job.category) || 'Other';
                  const dl         = deadlineInfo(job.deadline);
                  const employer   = typeof job.employer === 'object' ? job.employer : null;
                  const isGroup    = Number(job.vacancies || job.workersNeeded || 0) > 2 && !['plumbing','electrical','other'].includes(job.workCategory || job.category || '');

                  return (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleJobClick(job)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-neutral-100 overflow-hidden group cursor-pointer"
                    >
                      <div className="p-5">
                        {/* Title row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-neutral-900 text-base group-hover:text-primary-600 transition-colors leading-tight">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-neutral-500 text-sm">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                {job.company || employer?.name}
                                {employer?.documentApproved && (
                                  <BadgeCheck className="inline w-3.5 h-3.5 text-blue-500 ml-0.5" title="Verified Employer" />
                                )}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-2 whitespace-nowrap ${colorClass}`}>
                            {catLabel}
                          </span>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-neutral-600">
                          <span className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-full">
                            <MapPin className="w-3 h-3" />{job.location || 'Location N/A'}
                          </span>
                          {job.jobType && (
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
                              {job.jobType}
                            </span>
                          )}
                          {isGroup && (
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                              <Users className="w-3 h-3" /> Group Hiring
                            </span>
                          )}
                          {dl && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${dl.cls}`}>
                              <Clock className="w-3 h-3" />{dl.text}
                            </span>
                          )}
                        </div>

                        {/* Salary */}
                        {(job.dailyWages || job.salary)
                          ? (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.dailyWages && <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"><DollarSign className="w-3.5 h-3.5" />{job.dailyWages}</span>}
                              {job.salary && <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100"><Briefcase className="w-3.5 h-3.5" />{job.salary}</span>}
                            </div>
                          )
                          : <p className="text-neutral-500 text-xs italic mb-3">Pay: Negotiable</p>
                        }

                        {/* Description */}
                        <p className="text-neutral-600 text-sm line-clamp-2 mb-4">{job.description}</p>

                        {/* Skills */}
                        {job.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {job.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="bg-neutral-100 text-neutral-500 text-xs px-2 py-0.5 rounded-full">
                                +{job.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                          <span className="text-xs text-neutral-500">
                            {job.vacancies || 1} vacanc{(job.vacancies || 1) === 1 ? 'y' : 'ies'}
                          </span>
                          <span className="flex items-center gap-1 bg-primary-500 text-white text-xs font-semibold px-4 py-2 rounded-lg group-hover:bg-primary-600 transition-colors">
                            {user?.userType === 'worker' ? (
                              <><ChevronRight className="w-3.5 h-3.5" /> View &amp; Apply</>
                            ) : (
                              <><LogIn className="w-3.5 h-3.5" /> Login to Apply</>
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CTA Banner */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-2">Want to Apply for These Jobs?</h3>
            <p className="text-white/80 mb-6">
              Create a free account to apply, track your applications, and get matched with the right employers.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register?type=worker" className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors">
                Register as Worker
              </Link>
              <Link to="/login" className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                Already have account? Login
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-400">&copy; 2025 AgroSkillConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicJobs;
