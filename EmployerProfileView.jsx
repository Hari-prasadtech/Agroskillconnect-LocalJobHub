import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Calendar, X, BadgeCheck, Info } from 'lucide-react';

const EmployerProfileView = ({ employer, isOpen, onClose }) => {
  if (!isOpen || !employer) return null;

  const isVerified = !!(employer.documentApproved || employer.accountApproved);
  const companyName = employer.companyName || employer.organizationName;
  const locationParts = [employer.city, employer.state, employer.pincode].filter(Boolean);
  const location = locationParts.length ? locationParts.join(', ') : (employer.location || null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-500 to-accent-600 p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building2 className="text-primary-600" size={30} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white leading-tight">{employer.name}</h2>
                    {isVerified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-400/30 border border-blue-300/50 rounded-full text-xs text-white font-semibold">
                        <BadgeCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                  {companyName && (
                    <p className="text-white/80 text-sm mt-0.5 truncate">{companyName}</p>
                  )}
                  {location && (
                    <p className="flex items-center gap-1 text-white/70 text-xs mt-1">
                      <MapPin size={11} /> {location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">

              {/* Verification status banner */}
              {isVerified ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <BadgeCheck size={20} className="text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Verified Employer</p>
                    <p className="text-xs text-blue-600">Identity &amp; documents verified by AgroSkillConnect</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <Info size={18} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">Verification pending</p>
                </div>
              )}

              {/* About */}
              {employer.about && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-700 mb-2">About</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                    {employer.about}
                  </p>
                </div>
              )}

              {/* Contact */}
              <div>
                <h3 className="text-sm font-bold text-neutral-700 mb-2">Contact Information</h3>
                <div className="space-y-2">
                  {employer.phone && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <Phone size={15} className="text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-neutral-700">{employer.phone}</span>
                    </div>
                  )}
                  {employer.email && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <Mail size={15} className="text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-neutral-700">{employer.email}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <MapPin size={15} className="text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-neutral-700">{location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Employer Type */}
              {employer.employerType && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-700 mb-2">Employer Type</h3>
                  <span className="inline-block px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-100">
                    {employer.employerType}
                  </span>
                </div>
              )}

              {/* Member Since */}
              {employer.createdAt && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                  <Calendar size={12} />
                  Member since {new Date(employer.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmployerProfileView;
