import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, User, Wheat, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const Navbar = ({ compact = false }) => {
  const { user, logout, isWorker, isEmployer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = useMemo(() => {
    if (isWorker) return '/worker/dashboard';
    if (isEmployer) return '/employer/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/';
  }, [isWorker, isEmployer, isAdmin]);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo + Brand Name - Left */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-500 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              {/* Logo container */}
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-2.5 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Wheat className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                AgroSkillConnect
              </span>
              <span className="text-[10px] text-neutral-500 font-medium -mt-1">Kasaragod's Skill Connect</span>
            </div>
          </Link>

          {/* Navigation Links - Middle */}
          <div className="hidden lg:flex items-center space-x-8">
            {user ? (
              <>
                <Link 
                  to={getDashboardLink} 
                  className="nav-link"
                >
                  Dashboard
                </Link>
                {isWorker && (
                  <>
                    <Link to="/worker/jobs" className="nav-link">
                      Find Jobs
                    </Link>
                    <Link to="/worker/applications" className="nav-link">
                      My Applications
                    </Link>
                    <Link to="/worker/profile" className="nav-link">
                      My Profile
                    </Link>
                  </>
                )}
                {isEmployer && (
                  <>
                    <Link to="/employer/post-job" className="nav-link">
                      Post Job
                    </Link>
                    <Link to="/employer/jobs" className="nav-link">
                      My Jobs
                    </Link>
                    <Link to="/employer/profile" className="nav-link">
                      My Profile
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to="/admin/users" className="nav-link">
                      Users
                    </Link>
                    <Link to="/admin/jobs" className="nav-link">
                      Jobs
                    </Link>
                    <Link to="/admin/applications" className="nav-link">
                      Applications
                    </Link>
                  </>
                )}

              </>
            ) : (
              <>
                <Link to="/" className="nav-link">
                  Home
                </Link>
                <Link to="/about" className="nav-link">
                  About
                </Link>
                <Link to="/services#services-details" className="nav-link">
                  Services
                </Link>
                <Link to="/contact" className="nav-link">
                  Contact
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons - Right */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-50">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center">
                    {user?.profileImage
                      ? <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <User className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-800 text-sm">{user.name || 'User'}</span>
                    <span className="text-xs text-neutral-600 capitalize">{user.userType}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-all duration-300 hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 rounded-lg border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-50 transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-neutral-700" />
            ) : (
              <Menu className="w-6 h-6 text-neutral-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            {user ? (
              <>
                <Link 
                  to={getDashboardLink} 
                  className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {isWorker && (
                  <>
                    <Link to="/worker/jobs" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Find Jobs
                    </Link>
                    <Link to="/worker/applications" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      My Applications
                    </Link>
                    <Link to="/worker/profile" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      My Profile
                    </Link>
                  </>
                )}
                {isEmployer && (
                  <>
                    <Link to="/employer/post-job" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Post Job
                    </Link>
                    <Link to="/employer/jobs" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      My Jobs
                    </Link>
                    <Link to="/employer/profile" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                      My Profile
                    </Link>
                  </>
                )}



                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full mt-2 py-3 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-all">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/about" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <Link to="/services#services-details" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Services
                </Link>
                <Link to="/contact" className="block py-3 px-4 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                <div className="pt-2 space-y-2">
                  <Link to="/login" className="block w-full py-3 px-4 rounded-lg border-2 border-primary-500 text-primary-600 font-semibold text-center hover:bg-primary-50 transition-all" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="block w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-center hover:from-primary-600 hover:to-primary-700 transition-all" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-link {
          position: relative;
          padding: 0.5rem 0;
          font-weight: 500;
          color: #404040;
          transition: color 0.3s ease;
        }
        .nav-link:hover {
          color: #1abb7d;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, #1abb7d, #16a267);
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
