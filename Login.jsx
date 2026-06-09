import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, Sparkles, Briefcase, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const RoleSelectionModal = ({ isOpen, onClose, onSelectRole, roles }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 p-6 relative overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Select Your Role</h3>
                <p className="text-white/90 text-sm">Choose how you want to sign in</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Role Options */}
          <div className="p-6 space-y-4">
            {roles.includes('worker') && (
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectRole('worker')}
                className="w-full flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-lg font-bold text-neutral-900 mb-1">Worker</h4>
                  <p className="text-sm text-neutral-600">Browse and apply for jobs</p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-500 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            )}

            {roles.includes('employer') && (
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectRole('employer')}
                className="w-full flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:border-green-300 transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-lg font-bold text-neutral-900 mb-1">Employer</h4>
                  <p className="text-sm text-neutral-600">Post jobs and hire workers</p>
                </div>
                <ArrowRight className="w-6 h-6 text-green-500 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const { login, finalizeLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setError(e.detail?.message || 'Your account has been deactivated. Please contact the admin.');
    };
    window.addEventListener('auth:deactivated', handler);
    return () => window.removeEventListener('auth:deactivated', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Triple-check: rolesCount from server, userRoles array, and full user.roles
      const hasMultipleRoles =
        result.rolesCount > 1 ||
        result.userRoles?.length > 1 ||
        result.user?.roles?.length > 1;

      if (hasMultipleRoles) {
        const roles = result.userRoles?.length > 1
          ? result.userRoles
          : result.user?.roles?.length > 1
          ? result.user.roles
          : ['worker', 'employer'];
        setAvailableRoles(roles);
        setPendingLoginData(result);
        setShowRoleModal(true);
        setLoading(false);
      } else {
        setLoading(false);
        navigateToRole(result.user.userType);
      }
    } else {
      setError(result.error || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleRoleSelection = (selectedRole) => {
    finalizeLogin(pendingLoginData.user, selectedRole);
    setShowRoleModal(false);
    navigateToRole(selectedRole);
  };

  const navigateToRole = (role) => {
    const route = role === 'worker' 
      ? '/worker/dashboard' 
      : role === 'employer' 
      ? '/employer/dashboard' 
      : '/admin/dashboard';
    navigate(route, { replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setLoading(false);
        }}
        onSelectRole={handleRoleSelection}
        roles={availableRoles}
      />
      
      <section className="gradient-bg pt-20 pb-20 min-h-screen flex items-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 overflow-hidden"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-accent-400/20 to-primary-400/20 rounded-full blur-3xl"
          />
        </motion.div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Welcome Message */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden md:block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-12 h-12 text-primary-500" />
                  </motion.div>
                  <h1 className="text-5xl font-bold text-neutral-900">
                    Welcome <span className="text-gradient">Back</span>
                  </h1>
                </div>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  Sign in to continue your journey with AgroSkillConnect
                </p>
                <div className="space-y-4">
                  {[
                    { icon: "🔨", text: "Connect with skilled workers across all trades" },
                    { icon: "💼", text: "Find the perfect job opportunities near you" },
                    { icon: "🚀", text: "Grow your business with the right workforce" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-lg p-4 hover:bg-white/70 transition-all duration-300"
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-neutral-700 font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 p-8 relative overflow-hidden">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  />
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
                    <p className="text-white/90">Enter your credentials to access your account</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start space-x-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-neutral-700 font-semibold mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary-500" />
                        Email Address
                      </label>
                      <motion.div 
                        whileFocus={{ scale: 1.01 }}
                        className="relative group"
                      >
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-300" />
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})} 
                          required 
                          className="input-field pl-12 text-lg transition-all duration-300" 
                          placeholder="your@email.com" 
                        />
                      </motion.div>
                    </motion.div>

                    {/* Password Field */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="block text-neutral-700 font-semibold mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary-500" />
                        Password
                      </label>
                      <motion.div 
                        whileFocus={{ scale: 1.01 }}
                        className="relative group"
                      >
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-300" />
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})} 
                          required 
                          className="input-field pl-12 pr-12 text-lg transition-all duration-300" 
                          placeholder="••••••••" 
                        />
                        <motion.button 
                          type="button" 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </motion.div>
                    </motion.div>

                    {/* Remember Me & Forgot Password */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-between"
                    >
                      <label className="flex items-center cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all" 
                        />
                        <span className="ml-2 text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">Remember me</span>
                      </label>
                      <Link 
                          to="/forgot-password"
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button 
                      type="submit" 
                      disabled={loading}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(22, 162, 103, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full btn-primary disabled:opacity-50 relative overflow-hidden group text-lg py-4"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  {/* Sign Up Link */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-8 text-center pt-6 border-t border-neutral-200"
                  >
                    <p className="text-neutral-600">
                      Don't have an account? {' '}
                      <Link 
                        to="/register" 
                        className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all"
                      >
                        Sign up here
                      </Link>
                    </p>
                  </motion.div>

                  {/* Decorative Element */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mt-6 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full opacity-20"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
