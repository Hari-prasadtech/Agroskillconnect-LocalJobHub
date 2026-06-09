import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { 
  Briefcase, Users, TrendingUp, Award, Construction, Tractor, 
  Zap, Wrench, Droplet, HardHat, Search, Clock, Send, 
  ChevronRight, Star, Building2, User, CheckCircle, ChevronDown, X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from '../utils/axios';

const Landing = () => {
  const navigate = useNavigate();
  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref4, inView4] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.3 });

  // Enhanced search states
  const [jobTypeInput, setJobTypeInput] = useState('');
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [filteredJobTypes, setFilteredJobTypes] = useState([]);

  // Comprehensive job types with Kerala focus
  const jobTypes = [
    'Farmer', 'Construction Worker', 'Laborer', 'Plumber', 'Electrician',
    'Carpenter', 'Mason', 'Welder', 'Painter', 'Mechanic',
    'Grass Cutter', 'Coconut Climber', 'Gardner', 'House Keeper',
    'Tile Worker', 'Steel Fixer', 'Driver', 'Warehouse Worker',
    'Kitchen Helper', 'Cleaner', 'Security Guard', 'Delivery Person',
    'Farm Worker', 'Rice Mill Worker', 'Rubber Tapper', 'Toddy Tapper',
    'Fisher', 'Livestock Caretaker', 'AC Technician', 'Refrigerator Mechanic'
  ];



  // Filter job types based on input
  useEffect(() => {
    if (jobTypeInput.length > 0) {
      const filtered = jobTypes.filter(job =>
        job.toLowerCase().includes(jobTypeInput.toLowerCase())
      );
      setFilteredJobTypes(filtered.slice(0, 8));
      setShowJobSuggestions(filtered.length > 0);
    } else {
      setFilteredJobTypes([]);
      setShowJobSuggestions(false);
    }
  }, [jobTypeInput]);



  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (jobTypeInput) params.append('jobType', jobTypeInput);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Animated Counter Component
  const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!statsInView) return;
      
      let startTime;
      let animationFrame;
      
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;
        
        if (progress < 1) {
          setCount(Math.floor(end * progress));
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [statsInView, end, duration]);
    
    return <span>{count}{suffix}</span>;
  };

  const industries = [
    { name: 'Construction', icon: Construction, desc: 'Skilled builders & contractors' },
    { name: 'Farming', icon: Tractor, desc: 'Agricultural workers & farmers' },
    { name: 'Electrical', icon: Zap, desc: 'Licensed electricians' },
    { name: 'Plumbing', icon: Droplet, desc: 'Expert plumbers' },
    { name: 'Laborers', icon: HardHat, desc: 'General labor workforce' },
    { name: 'Local Workers', icon: Users, desc: 'Community-based workers' },
  ];

  const stats = [
    { value: '500+', label: 'Active Jobs in Kasaragod', icon: Briefcase, numValue: 500, suffix: '+' },
    { value: '2,500+', label: 'Registered Workers', icon: Users, numValue: 2500, suffix: '+' },
    { value: '150+', label: 'Local Businesses', icon: Building2, numValue: 150, suffix: '+' },
    { value: '95%', label: 'Success Rate', icon: TrendingUp, numValue: 95, suffix: '%' },
  ];

  const steps = [
    {
      number: '1',
      title: 'Register Account',
      desc: 'Create your profile as a worker or employer in minutes',
      link: '/register',
      linkText: 'Register Now'
    },
    {
      number: '2',
      title: 'Find Job',
      desc: 'Search for jobs that match your skills and location',
      link: '/jobs',
    },
    {
      number: '3',
      title: 'Apply Job',
      desc: 'Apply to companies and get hired instantly',
      link: '/login',
      linkText: 'Get Started'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with 3D Design */}
      <section className="gradient-bg pt-32 pb-20 relative overflow-hidden">
        {/* Animated 3D background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                Kasaragod's Premier{' '}
                <span className="text-gradient">Job Connect Platform</span>
              </h1>
              <p className="text-lg text-neutral-600">
                Connecting skilled workers with employers across Kasaragod district. From Kanhangad 
                to Manjeshwar, Uppala to Kasaragod town - find local opportunities 
                that match your expertise in Kerala's northernmost district.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </div>

              {/* Enhanced Search Bar with Job Type + Location */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-neutral-100">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-primary-600" />
                  Find Your Perfect Job
                </h3>
                
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {/* Job Type Input with Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-neutral-600 mb-2">
                      Job Type
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={jobTypeInput}
                        onChange={(e) => setJobTypeInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., Plumber, Electrician, Farmer..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-neutral-700 font-medium transition-all duration-300 hover:border-primary-300"
                      />
                      {jobTypeInput && (
                        <button
                          onClick={() => {
                            setJobTypeInput('');
                            setShowJobSuggestions(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Job Type Suggestions Dropdown */}
                    {showJobSuggestions && filteredJobTypes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-primary-200 max-h-60 overflow-y-auto z-50"
                      >
                        {filteredJobTypes.map((job, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => {
                              setJobTypeInput(job);
                              setShowJobSuggestions(false);
                            }}
                            className="px-4 py-3 hover:bg-primary-50 cursor-pointer transition-colors border-b border-neutral-100 last:border-b-0 flex items-center gap-2"
                          >
                            <Briefcase className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-neutral-900 font-medium">{job}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Search className="w-6 h-6" />
                  <span>Search Jobs</span>
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                <p className="text-xs text-neutral-500 mt-3 text-center">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Popular: Cashew Worker, Coconut Climber, Construction Worker, Beedi Worker
                </p>
              </div>
            </motion.div>

            {/* Right Side - Modern 3D Recruitment Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main 3D Illustration - Professional Recruitment Scene */}
                <div className="relative z-10">
                  <svg viewBox="0 0 600 600" className="w-full h-auto drop-shadow-2xl">
                    {/* Background gradient circle */}
                    <defs>
                      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#E0F2FE', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#F0F9FF', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#2563EB', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#F8FAFC', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>

                    {/* Background circle */}
                    <circle cx="300" cy="300" r="280" fill="url(#bgGrad)" opacity="0.6"/>

                    {/* Laptop/Computer Screen - Main Focus */}
                    <g transform="translate(150, 200)">
                      {/* Laptop base */}
                      <rect x="0" y="180" width="300" height="15" rx="8" fill="#334155" opacity="0.9"/>
                      <rect x="-10" y="195" width="320" height="8" rx="4" fill="#1E293B" opacity="0.8"/>
                      
                      {/* Laptop screen */}
                      <rect x="10" y="20" width="280" height="160" rx="12" fill="#1F2937" stroke="#0F172A" strokeWidth="4"/>
                      <rect x="20" y="30" width="260" height="140" rx="8" fill="url(#screenGrad)"/>
                      
                      {/* Screen content - Job Search Interface */}
                      <g transform="translate(30, 40)">
                        {/* Search bar */}
                        <rect x="10" y="5" width="220" height="25" rx="12" fill="#FFFFFF" opacity="0.95"/>
                        <circle cx="25" cy="17.5" r="6" fill="#1abb7d"/>
                        <rect x="40" y="12" width="140" height="3" rx="1.5" fill="#94A3B8"/>
                        <rect x="40" y="18" width="100" height="3" rx="1.5" fill="#CBD5E1"/>
                        
                        {/* Job Cards */}
                        <g transform="translate(10, 40)">
                          <rect x="0" y="0" width="100" height="35" rx="8" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="2"/>
                          <rect x="8" y="8" width="25" height="3" rx="1.5" fill="#1abb7d"/>
                          <rect x="8" y="14" width="60" height="2" rx="1" fill="#94A3B8"/>
                          <rect x="8" y="18" width="40" height="2" rx="1" fill="#CBD5E1"/>
                          <circle cx="85" cy="18" r="8" fill="#10B981"/>
                          <path d="M 82 18 L 84 20 L 88 16" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        </g>
                        
                        <g transform="translate(120, 40)">
                          <rect x="0" y="0" width="100" height="35" rx="8" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="2"/>
                          <rect x="8" y="8" width="25" height="3" rx="1.5" fill="#3B82F6"/>
                          <rect x="8" y="14" width="60" height="2" rx="1" fill="#94A3B8"/>
                          <rect x="8" y="18" width="40" height="2" rx="1" fill="#CBD5E1"/>
                          <circle cx="85" cy="18" r="8" fill="#F59E0B"/>
                          <text x="85" y="21" fontSize="10" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">!</text>
                        </g>

                        <g transform="translate(10, 85)">
                          <rect x="0" y="0" width="210" height="30" rx="8" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="2"/>
                          <rect x="8" y="8" width="35" height="3" rx="1.5" fill="#8B5CF6"/>
                          <rect x="8" y="14" width="80" height="2" rx="1" fill="#94A3B8"/>
                          <rect x="8" y="18" width="60" height="2" rx="1" fill="#CBD5E1"/>
                          <rect x="175" y="8" width="25" height="14" rx="4" fill="#1abb7d"/>
                          <text x="187.5" y="18" fontSize="8" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Apply</text>
                        </g>
                      </g>
                      
                      {/* Camera notch */}
                      <circle cx="150" cy="30" r="3" fill="#374151"/>
                    </g>

                    {/* Resume/Profile Card - Floating Left */}
                    <g transform="translate(40, 280)">
                      <rect x="0" y="0" width="120" height="160" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.15))"/>
                      
                      {/* Profile photo */}
                      <circle cx="60" cy="35" r="20" fill="#1abb7d"/>
                      <circle cx="60" cy="35" r="18" fill="#10B981"/>
                      <circle cx="60" cy="32" r="8" fill="#FFFFFF"/>
                      <path d="M 48 43 Q 60 50 72 43" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      
                      {/* Name lines */}
                      <rect x="25" y="65" width="70" height="4" rx="2" fill="#1F2937"/>
                      <rect x="35" y="73" width="50" height="3" rx="1.5" fill="#94A3B8"/>
                      
                      {/* Info lines */}
                      <rect x="15" y="90" width="90" height="3" rx="1.5" fill="#CBD5E1"/>
                      <rect x="15" y="98" width="80" height="3" rx="1.5" fill="#CBD5E1"/>
                      <rect x="15" y="106" width="70" height="3" rx="1.5" fill="#CBD5E1"/>
                      
                      {/* Skills */}
                      <rect x="15" y="125" width="35" height="12" rx="6" fill="#1abb7d" opacity="0.2"/>
                      <rect x="18" y="128" width="29" height="6" rx="3" fill="#1abb7d"/>
                      <rect x="55" y="125" width="35" height="12" rx="6" fill="#3B82F6" opacity="0.2"/>
                      <rect x="58" y="128" width="29" height="6" rx="3" fill="#3B82F6"/>
                      
                      {/* Verified badge */}
                      <circle cx="105" cy="15" r="12" fill="#10B981"/>
                      <path d="M 100 15 L 103 18 L 110 11" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>

                    {/* Search Magnifier - Floating Right */}
                    <g transform="translate(460, 320)">
                      <circle cx="30" cy="30" r="35" fill="#3B82F6" opacity="0.1"/>
                      <circle cx="30" cy="30" r="25" fill="none" stroke="#3B82F6" strokeWidth="5"/>
                      <line x1="48" y1="48" x2="65" y2="65" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round"/>
                      <circle cx="30" cy="30" r="15" fill="#FFFFFF" opacity="0.5"/>
                    </g>

                    {/* Job Icons Floating Around */}
                    <g opacity="0.8">
                      {/* Construction helmet */}
                      <g transform="translate(100, 150)">
                        <ellipse cx="20" cy="25" rx="20" ry="8" fill="#FFD93D" opacity="0.3"/>
                        <ellipse cx="20" cy="20" rx="20" ry="10" fill="#FFD93D" stroke="#F59E0B" strokeWidth="2"/>
                        <rect x="10" y="17" width="20" height="5" rx="2" fill="#FFA500"/>
                      </g>

                      {/* Wrench */}
                      <g transform="translate(480, 180)">
                        <rect x="0" y="15" width="8" height="30" rx="3" fill="#64748B" stroke="#475569" strokeWidth="2" transform="rotate(20 4 30)"/>
                        <circle cx="6" cy="8" r="7" fill="#64748B" stroke="#475569" strokeWidth="2"/>
                      </g>

                      {/* Plant/Agriculture */}
                      <g transform="translate(120, 480)">
                        <path d="M 15 30 Q 15 20 20 15 Q 25 20 25 30" fill="#10B981" stroke="#059669" strokeWidth="2"/>
                        <path d="M 10 30 Q 10 22 14 18 Q 18 22 18 30" fill="#10B981" stroke="#059669" strokeWidth="2"/>
                        <line x1="20" y1="30" x2="20" y2="40" stroke="#10B981" strokeWidth="2"/>
                      </g>

                      {/* Star ratings */}
                      <g transform="translate(480, 480)">
                        <path d="M 15 10 L 17 16 L 23 16 L 18 20 L 20 26 L 15 22 L 10 26 L 12 20 L 7 16 L 13 16 Z" fill="#F59E0B"/>
                        <path d="M 35 12 L 37 18 L 43 18 L 38 22 L 40 28 L 35 24 L 30 28 L 32 22 L 27 18 L 33 18 Z" fill="#F59E0B"/>
                      </g>
                    </g>

                    {/* Decorative circles */}
                    <circle cx="520" cy="100" r="15" fill="#1abb7d" opacity="0.15"/>
                    <circle cx="80" cy="540" r="20" fill="#3B82F6" opacity="0.1"/>
                    <circle cx="500" cy="520" r="18" fill="#F59E0B" opacity="0.15"/>
                  </svg>
                </div>
                
                {/* Floating 3D stat cards */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 -right-4 bg-white rounded-2xl shadow-2xl p-4 border-2 border-primary-100"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">500+</p>
                      <p className="text-xs text-neutral-600">Local Jobs</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-20 -left-4 bg-white rounded-2xl shadow-2xl p-4 border-2 border-accent-100"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary-500" />
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">Verified</p>
                      <p className="text-xs text-neutral-600">Employers</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 right-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-2xl p-3"
                >
                  <TrendingUp className="w-8 h-8 text-white" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 right-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full p-3 shadow-lg"
                >
                  <Users className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section ref={statsRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <motion.div 
                    className="bg-primary-100 rounded-full p-4"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <stat.icon className="w-8 h-8 text-primary-600" />
                  </motion.div>
                </div>
                <h3 className="text-4xl font-bold text-primary-600">
                  {statsInView ? <AnimatedCounter end={stat.numValue} suffix={stat.suffix} /> : '0'}
                </h3>
                <p className="text-neutral-600 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Provide Section */}
      <section id="industries" ref={ref1} className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Industries We Serve</h2>
            <p className="section-subtitle">
              Connecting skilled workers across multiple industries in Kasaragod district
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView1 ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-neutral-100 group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <industry.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">{industry.name}</h3>
                <p className="text-xs text-neutral-600">{industry.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Comprehensive solutions for workers and employers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 rounded-lg p-4">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">For Workers</h3>
                  <p className="text-neutral-600 mb-4">
                    Find jobs matching your skills with AI-powered matching, build your professional 
                    portfolio, get verified, and access career growth resources.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-primary-500" />
                      <span>Job Search & Matching</span>
                    </li>
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-primary-500" />
                      <span>Profile Verification</span>
                    </li>
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-primary-500" />
                      <span>Career Development</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-accent-100 rounded-lg p-4">
                  <Building2 className="w-8 h-8 text-accent-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">For Employers</h3>
                  <p className="text-neutral-600 mb-4">
                    Access a local pool of verified Kasaragod workers, post jobs easily, use smart 
                    candidate matching, and hire with confidence.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-accent-500" />
                      <span>Local Kasaragod Talent</span>
                    </li>
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-accent-500" />
                      <span>Smart Matching</span>
                    </li>
                    <li className="flex items-center space-x-2 text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-accent-500" />
                      <span>Secure Hiring Process</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link to="/services" className="btn-primary inline-flex items-center space-x-2">
              <span>View All Services</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={ref2} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              How it <span className="text-primary-500">Work</span>
            </h2>
            <p className="section-subtitle">
              Explore the following simple steps to help you find a job easily
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="mb-6">
                  <span className="text-6xl font-bold text-primary-200">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral-600 mb-4">{step.desc}</p>
                <Link
                  to={step.link}
                  className="text-primary-500 hover:text-primary-600 font-medium inline-flex items-center space-x-1"
                >
                  <span>{step.linkText}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section ref={ref3} className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Choose Your Path</h2>
            <p className="section-subtitle">
              Whether you're looking for work or looking to hire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView3 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="card hover:scale-105"
            >
              <div className="text-center space-y-4">
                <div className="bg-primary-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <Users className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">I'm a Worker</h3>
                <p className="text-neutral-600">
                  Find jobs that match your skills across cashew processing, construction, farming, 
                  electrical, plumbing, and more. Build your career with trusted local employers in Kasaragod.
                </p>
                <Link to="/register?type=worker" className="btn-primary inline-block">
                  Register as Worker
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView3 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="card hover:scale-105"
            >
              <div className="text-center space-y-4">
                <div className="bg-accent-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <Building2 className="w-12 h-12 text-accent-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">I'm an Employer</h3>
                <p className="text-neutral-600">
                  Post jobs, find qualified workers, and grow your business. 
                  Access a trusted pool of skilled local workers from across Kasaragod district.
                </p>
                <Link to="/register?type=employer" className="btn-accent inline-block">
                  Register as Employer
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={ref4} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView4 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">What Our Clients Say</h2>
            <p className="section-subtitle">
              Real stories from workers and employers using our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "AgroSkillConnect helped me find steady work at a cashew factory in Kanhangad. The registration was simple and I got hired within a week. This platform truly understands our local needs!",
                name: "Rajan K.",
                role: "Cashew Factory Worker, Kanhangad",
                initial: "RK"
              },
              {
                quote: "As a construction mason from Kasaragod town, I was struggling to find regular work. This platform connected me with multiple employers and now I never run out of projects!",
                name: "Beena P.",
                role: "Mason, Kasaragod Town",
                initial: "BP"
              },
              {
                quote: "I found skilled coconut climbers and farm workers from Nileshwar through AgroSkillConnect. The workers are verified and reliable. Best hiring platform for Kasaragod businesses!",
                name: "Muhammed Riyas",
                role: "Farm Owner, Nileshwar",
                initial: "MR"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView4 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-500 text-accent-500" />
                  ))}
                </div>
                <p className="text-neutral-600 mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">{testimonial.initial}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">{testimonial.name}</h4>
                    <p className="text-sm text-neutral-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold text-neutral-900">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-neutral-600">
              Join hundreds of workers and employers connecting across Kasaragod district
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-primary flex items-center space-x-2">
                <span>Get Started Now</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary">
                Already Have Account?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AgroSkillConnect</h3>
              <p className="text-neutral-400">
                Connecting skilled workers with local opportunities in Kasaragod
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-neutral-400">
                <li>Email: agroskillconnect@gmail.com</li>
                <li>Phone: +91-467-2234567</li>
                <li>Location: Kasaragod, Kerala 671121</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2025 AgroSkillConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
