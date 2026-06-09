import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Briefcase, AlertCircle, Eye, EyeOff, 
  Phone, MapPin, Users, ChevronRight, ChevronLeft,
  CheckCircle2, Shield, FileText, Upload, Loader, X,
  Wrench, Home, Utensils, Hammer, Leaf, HardHat, RefreshCw,
  AlertTriangle, Check, Info, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';
import { isValidKasaragodPincode, KASARAGOD_STATE, KASARAGOD_DISTRICT, KASARAGOD_PINCODES } from '../data/kasaragodPincodes';
import { validateDocumentNumber, formatDocumentNumber, getDocumentValidator } from '../utils/validation';
import Navbar from '../components/Navbar';

const onlyLetters = (value) => value.replace(/[^a-zA-Z\s]/g, '');
const onlyNumbers = (value) => value.replace(/[^0-9]/g, '');

const WORK_CATEGORIES = [
  { value: 'construction', label: '🏗️ Construction', icon: HardHat },
  { value: 'farming', label: '🌾 Farming', icon: Leaf },
  { value: 'plumbing', label: '🔧 Plumbing', icon: Wrench },
  { value: 'electrical', label: '⚡ Electrical', icon: Hammer },
  { value: 'local_workers', label: '🏘️ Local Workers', icon: Home },
  { value: 'event_management', label: '🎪 Events', icon: Users },
  { value: 'other', label: '⭐ Other', icon: Briefcase },
];

// Password strength checker
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  let strength = 'weak';
  let color = 'red';
  
  if (score >= 4) { strength = 'strong'; color = 'green'; }
  else if (score >= 3) { strength = 'medium'; color = 'yellow'; }
  
  return { checks, strength, color, score };
};

// Terms & Conditions Dialog Component
const TermsDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[80vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Terms & Conditions</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-neutral-700">
          <div>
            <h4 className="font-bold text-lg mb-2">1. Geographic Scope</h4>
            <p className="text-sm leading-relaxed">
              AgroSkillConnect services are exclusively available for residents and businesses within 
              <strong> Kasaragod District, Kerala, India</strong>. By registering, you confirm that your 
              primary location and operations are within Kasaragod district boundaries.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">2. Eligibility</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>You must be at least 18 years of age to register</li>
              <li>You must provide a valid Kasaragod district pincode (671xxx series)</li>
              <li>You must have legal authorization to work or hire in India</li>
              <li>Workers must possess valid government-issued identification</li>
              <li>Employers must represent legitimate businesses or hiring entities</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">3. Account Verification</h4>
            <p className="text-sm leading-relaxed">
              All accounts undergo administrative verification. You must upload valid government-issued 
              identification (Aadhar, PAN, Voter ID, Driving License, or Passport). Accounts will remain 
              inactive until verified by our admin team. False information may result in permanent account suspension.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">4. User Responsibilities</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Provide accurate and truthful information</li>
              <li>Maintain confidentiality of your account credentials</li>
              <li>Update your profile information when circumstances change</li>
              <li>Comply with all applicable labor laws and regulations</li>
              <li>Treat all platform users with respect and professionalism</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">5. Prohibited Activities</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Posting fraudulent job listings or applications</li>
              <li>Harassing, threatening, or discriminating against users</li>
              <li>Sharing false or misleading information</li>
              <li>Using the platform for illegal activities</li>
              <li>Creating multiple accounts or impersonating others</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">6. Platform Role</h4>
            <p className="text-sm leading-relaxed">
              AgroSkillConnect serves as a connection platform only. We do not employ workers, do not hire 
              on behalf of employers, and are not responsible for employment agreements, wages, working 
              conditions, or disputes between users. All employment relationships are directly between 
              workers and employers.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">7. Termination</h4>
            <p className="text-sm leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, provide 
              false information, or engage in prohibited activities. You may close your account at any time 
              through your profile settings.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">8. Changes to Terms</h4>
            <p className="text-sm leading-relaxed">
              We may update these terms periodically. Continued use of the platform after changes constitutes 
              acceptance of updated terms.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                By clicking "Complete Registration," you acknowledge that you have read, understood, and 
                agree to these Terms & Conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Privacy Policy Dialog Component
const PrivacyDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[80vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Privacy Policy</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-neutral-700">
          <div>
            <h4 className="font-bold text-lg mb-2">1. Information We Collect</h4>
            <p className="text-sm mb-2">We collect the following information during registration:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Personal Information:</strong> Name, email, phone number</li>
              <li><strong>Location Data:</strong> Pincode, city, state (limited to Kasaragod district)</li>
              <li><strong>Professional Information:</strong> Skills, experience, work category, availability</li>
              <li><strong>Identification Documents:</strong> Government-issued ID for verification</li>
              <li><strong>Business Information:</strong> Company name and details (for employers)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">2. How We Use Your Information</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>To create and manage your account</li>
              <li>To verify your identity and location within Kasaragod district</li>
              <li>To connect workers with employers for job opportunities</li>
              <li>To communicate important updates about your account and applications</li>
              <li>To improve our services and user experience</li>
              <li>To ensure platform safety and prevent fraud</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">3. Information Sharing</h4>
            <p className="text-sm leading-relaxed mb-2">
              We respect your privacy and limit information sharing:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>With Other Users:</strong> Workers' profiles (name, skills, experience) are visible 
              to employers. Employers' company information is visible to workers when viewing job postings.</li>
              <li><strong>Your Contact Information:</strong> Email and phone number are only shared after 
              mutual consent (e.g., when you apply for a job or an employer expresses interest)</li>
              <li><strong>Documents:</strong> ID documents are only accessible to admin verification staff 
              and are never shared with other users</li>
              <li><strong>With Third Parties:</strong> We do not sell or rent your personal information to 
              third parties</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">4. Data Security</h4>
            <p className="text-sm leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure password storage with encryption</li>
              <li>Limited admin access to sensitive documents</li>
              <li>Regular security audits and updates</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">5. Your Rights</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Access:</strong> You can view and update your profile information anytime</li>
              <li><strong>Correction:</strong> You can correct inaccurate information through your profile</li>
              <li><strong>Deletion:</strong> You can request account deletion by contacting support</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data</li>
              <li><strong>Withdraw Consent:</strong> You can opt-out of marketing communications</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">6. Geographic Data Limitation</h4>
            <p className="text-sm leading-relaxed">
              <strong className="text-primary-600">Important:</strong> Your data is specifically collected 
              and processed for the purpose of connecting job opportunities within Kasaragod district only. 
              By registering, you confirm that you are located in or conducting business primarily in 
              Kasaragod district, Kerala.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">7. Data Retention</h4>
            <p className="text-sm leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide 
              services. ID verification documents are retained for administrative and legal compliance 
              purposes. After account deletion, we may retain certain information for legal obligations.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">8. Children's Privacy</h4>
            <p className="text-sm leading-relaxed">
              Our services are not intended for individuals under 18 years of age. We do not knowingly 
              collect information from minors.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">9. Updates to Privacy Policy</h4>
            <p className="text-sm leading-relaxed">
              We may update this privacy policy periodically. We will notify users of significant changes 
              via email or platform notification.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-2">10. Contact Us</h4>
            <p className="text-sm leading-relaxed">
              For privacy concerns or questions about your data, please contact us through the platform's 
              contact page or support email.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                We are committed to protecting your privacy and ensuring your data is handled responsibly 
                within the Kasaragod community.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'worker';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    userType: defaultType, 
    phone: '', 
    pincode: '',
    city: 'Kasaragod',
    state: KASARAGOD_STATE,
    district: KASARAGOD_DISTRICT,
    address: '',
    workCategory: '',
    category: '',
    // Worker fields
    gender: '',
    skills: '',
    experience: '',
    availability: '',
    jobType: '',
    languages: '',
    wageExpectation: '',
    // Employer fields  
    companyName: '',
    employerType: 'company',
    companyAddress: '',
    workersNeeded: '',
    otherDetails: '',
    dualRole: false,
    // Document
    documentType: 'aadhar',
    documentNumber: '',
    documentFile: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  
  // Validation states
  const [phoneError, setPhoneError] = useState('');
  const [pincodeWarning, setPincodeWarning] = useState('');
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [docValidation, setDocValidation] = useState({ valid: false, message: '' });
  const [passwordStrength, setPasswordStrength] = useState(null);
  
  // AI suggestion states
  const [aiSkillSuggestions, setAiSkillSuggestions] = useState('');
  const [aiSkillLoading, setAiSkillLoading] = useState(false);
  const [showAiSkillPanel, setShowAiSkillPanel] = useState(false);

  // Dialog states
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const steps = [
    { num: 1, title: 'Basic Info', desc: 'Account details' },
    { num: 2, title: 'Profile Details', desc: 'Your information' },
    { num: 3, title: 'Verification', desc: 'Upload document' }
  ];

  // Phone validation - exactly 10 digits
  const handlePhoneChange = (e) => {
    const value = onlyNumbers(e.target.value);
    if (value.length <= 10) {
      setFormData({...formData, phone: value});
      if (value.length > 0 && value.length < 10) {
        setPhoneError('Phone number must be exactly 10 digits');
      } else if (value.length === 10) {
        setPhoneError('');
      } else {
        setPhoneError('');
      }
    }
  };

  // AI skill suggestions based on selected work category
  const getRegisterAISuggestions = async () => {
    if (!formData.workCategory) {
      setShowAiSkillPanel(true);
      setAiSkillSuggestions('⚠️ Please select a Work Category first to get AI skill suggestions.');
      return;
    }
    setAiSkillLoading(true);
    setShowAiSkillPanel(true);
    try {
      const existingSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      const res = await axios.post('/api/ai/generate', {
        type: 'skillSuggestions',
        data: { workCategory: formData.workCategory, skills: existingSkills, experience: formData.experience }
      });
      setAiSkillSuggestions(res.data.result);
    } catch {
      setAiSkillSuggestions('Unable to get AI suggestions. Please enter your skills manually.');
    } finally {
      setAiSkillLoading(false);
    }
  };

  // Pincode validation with Kasaragod check
  const handlePincodeChange = (e) => {
    const value = onlyNumbers(e.target.value);
    if (value.length <= 6) {
      setFormData({...formData, pincode: value});
      if (value.length >= 3) {
        const matches = KASARAGOD_PINCODES.filter(p => p.pincode.startsWith(value));
        const unique = Array.from(new Map(matches.map(p => [p.pincode + p.area, p])).values()).slice(0, 6);
        setPincodeSuggestions(unique);
        setShowPincodeSuggestions(unique.length > 0);
      } else {
        setPincodeSuggestions([]);
        setShowPincodeSuggestions(false);
      }
      if (value.length === 6) {
        if (!isValidKasaragodPincode(value)) {
          setPincodeWarning('⚠️ This pincode is outside Kasaragod district. Registration is limited to Kasaragod area only.');
        } else {
          setPincodeWarning('');
        }
        setShowPincodeSuggestions(false);
      } else {
        setPincodeWarning('');
      }
    }
  };

  const selectPincodeSuggestion = (pin) => {
    setFormData({...formData, pincode: pin.pincode});
    setPincodeWarning('');
    setShowPincodeSuggestions(false);
    setPincodeSuggestions([]);
  };

  // Document number validation
  const handleDocumentNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    const formatted = formatDocumentNumber(formData.documentType, value);
    setFormData({...formData, documentNumber: formatted});
    
    if (formatted) {
      const isValid = validateDocumentNumber(formData.documentType, formatted);
      const validator = getDocumentValidator(formData.documentType);
      
      if (isValid) {
        setDocValidation({ 
          valid: true, 
          message: `✅ Valid ${formData.documentType.toUpperCase()} format` 
        });
      } else {
        setDocValidation({ 
          valid: false, 
          message: `❌ Invalid format. Expected: ${validator?.format || 'N/A'} - ${validator?.hint || ''}` 
        });
      }
    } else {
      setDocValidation({ valid: false, message: '' });
    }
  };

  // Document type change handler
  const handleDocumentTypeChange = (e) => {
    setFormData({...formData, documentType: e.target.value, documentNumber: ''});
    setDocValidation({ valid: false, message: '' });
  };

  const validateStep = (step) => {
    setError('');
    
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
        setError('Please fill in all required fields');
        return false;
      }
      if (!otpVerified) {
        setError('Please verify your email with OTP');
        return false;
      }
      if (formData.phone.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      // Check password strength
      const strength = checkPasswordStrength(formData.password);
      if (strength.score < 3) {
        setError('Password is too weak. Please follow the password requirements for a stronger password.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.pincode || !formData.workCategory) {
        setError('Please fill in all required fields');
        return false;
      }
      if (formData.pincode.length !== 6) {
        setError('Please enter a valid 6-digit pincode');
        return false;
      }
      if (!isValidKasaragodPincode(formData.pincode)) {
        setError('Registration is only available for Kasaragod district pincodes. Please enter a valid Kasaragod pincode.');
        return false;
      }
      if (formData.userType === 'worker') {
        if (!formData.skills || !formData.experience || !formData.availability || !formData.jobType) {
          setError('Please fill in all worker details');
          return false;
        }
      }
    } else if (step === 3) {
      if (!formData.documentNumber) {
        setError('Please enter document number');
        return false;
      }
      if (!validateDocumentNumber(formData.documentType, formData.documentNumber)) {
        setError('Please enter a valid document number in the correct format');
        return false;
      }
      if (!formData.documentFile) {
        setError('Please upload your document');
        return false;
      }
      if (!agreedToTerms) {
        setError('Please agree to Terms & Conditions');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const sendOTP = async () => {
    if (!formData.email) { setError('Enter your email first'); return; }
    setOtpLoading(true); setError('');
    try {
      await axios.post('/api/auth/send-otp', { email: formData.email, type: 'register' });
      setOtpSent(true);
      setOtpTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setOtpLoading(false); }
  };

  const verifyOTP = async () => {
    if (!otp) { setError('Enter OTP'); return; }
    setOtpLoading(true); setError('');
    try {
      await axios.post('/api/auth/verify-otp', { email: formData.email, otp, type: 'register' });
      setOtpVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setOtpLoading(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, documentFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setDocumentPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Convert document file to base64 if present
      let documentImageBase64 = null;
      if (formData.documentFile) {
        documentImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.documentFile);
        });
      }

      // Prepare registration data with all required fields
      const registrationData = {
        // Basic info
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        userType: formData.userType,
        phone: formData.phone.startsWith('+91') ? formData.phone : `+91-${formData.phone}`,
        
        // Profile details
        pincode: formData.pincode,
        city: formData.city || 'Kasaragod',
        state: KASARAGOD_STATE,
        workCategory: formData.workCategory,
        gender: formData.gender || '',
        address: formData.address || '',
        
        // Document details
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        documentImage: documentImageBase64,
        
        // Worker-specific fields
        ...(formData.userType === 'worker' && {
          skills: Array.isArray(formData.skills) ? formData.skills : [formData.skills],
          experience: formData.experience,
          availability: formData.availability,
          jobType: formData.jobType,
          languages: formData.languages || ['Malayalam', 'English']
        }),
        
        // Employer-specific fields
        ...(formData.userType === 'employer' && {
          employerType: 'company',
          companyName: formData.companyName || formData.name.trim(),
          organizationName: formData.companyName || formData.name.trim(),
          companyAddress: formData.address,
        })
      };
      
      // If dual role is selected, add both roles to the registration
      if (formData.dualRole) {
        const secondRole = formData.userType === 'worker' ? 'employer' : 'worker';
        registrationData.roles = [formData.userType, secondRole];
        // Add second role specific data
        if (formData.userType === 'worker') {
          registrationData.workersNeeded = formData.dualWorkersNeeded;
        } else {
          registrationData.dualWorkCategory = formData.dualWorkCategory;
          registrationData.dualSkills = formData.dualSkills;
          registrationData.dualExperience = formData.dualExperience;
        }
      }
      
      const result = await register(registrationData);
      
      if (result.success && result.user) {
        const userType = result.user.userType || formData.userType;
        setTimeout(() => {
          navigate(`/${userType}/dashboard`, { replace: true });
        }, 500);
      } else {
        // Registration failed
        const errorMsg = result.error || 'Registration failed. Please try again.';
        console.error('Registration failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // If email not verified error, prompt user to verify
      if (errorMessage.toLowerCase().includes('email not verified') || errorMessage.toLowerCase().includes('otp')) {
        setError('Email verification expired or not completed. Please verify your email again.');
        setCurrentStep(1);
        setOtpVerified(false);
        setOtpSent(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">
                Create Your Account
              </h2>
              <p className="text-primary-100">
                Register as a {formData.userType === 'worker' ? 'Worker' : 'Employer'} to get started
              </p>
            </div>

            {/* User Type Selector */}
            <div className="px-8 pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'worker'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'worker' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <User className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">I'm a Worker</div>
                  <div className="text-xs text-neutral-500 mt-1">Looking for jobs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, userType: 'employer'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'employer' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Briefcase className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">I'm an Employer</div>
                  <div className="text-xs text-neutral-500 mt-1">Looking to hire</div>
                </button>
              </div>

              {/* Dual Role Option */}
              {formData.userType && (
                <div
                  className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.dualRole ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setFormData({ ...formData, dualRole: !formData.dualRole })}
                >
                  <input
                    type="checkbox"
                    checked={!!formData.dualRole}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 accent-primary-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-neutral-700">
                      I also want to register as {formData.userType === 'worker' ? 'an Employer' : 'a Worker'}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {formData.userType === 'worker'
                        ? 'You can post jobs and hire workers too'
                        : 'You can also apply to jobs as a worker'}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, idx) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        currentStep >= step.num 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {currentStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-neutral-700">{step.title}</div>
                        <div className="text-xs text-neutral-500">{step.desc}</div>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.num ? 'bg-primary-500' : 'bg-neutral-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {/* STEP 1: Basic Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Full Name */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: onlyLetters(e.target.value)})}
                          className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                          className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          placeholder="your.email@example.com"
                          disabled={otpVerified}
                        />
                        {otpVerified && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>

                    {/* OTP Verification */}
                    {!otpVerified && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900 mb-2">Email Verification Required</div>
                            {!otpSent ? (
                              <button
                                type="button"
                                onClick={sendOTP}
                                disabled={otpLoading || !formData.email}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 transition text-sm flex items-center gap-2"
                              >
                                {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                Send OTP
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={otp}
                                  onChange={(e) => setOtp(onlyNumbers(e.target.value))}
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={verifyOTP}
                                    disabled={otpLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-neutral-300 transition text-sm"
                                  >
                                    {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
                                  </button>
                                  {otpTimer > 0 ? (
                                    <span className="text-sm text-blue-700 py-2">Resend in {otpTimer}s</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={sendOTP}
                                      disabled={otpLoading}
                                      className="text-sm text-blue-600 hover:underline py-2"
                                    >
                                      Resend OTP
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition ${
                            phoneError ? 'border-red-300 focus:border-red-500' : 'border-neutral-200 focus:border-primary-500'
                          }`}
                          placeholder="Enter 10-digit phone number"
                          maxLength={10}
                        />
                      </div>
                      {phoneError && (
                        <div className="mt-1 text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {phoneError}
                        </div>
                      )}
                      <div className="mt-1 text-neutral-500 text-xs">
                        {formData.phone.length}/10 digits
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full pl-10 pr-12 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Password Requirements */}
                      {passwordStrength && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className={passwordStrength.checks.length ? 'text-green-600' : 'text-neutral-400'}>
                            {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                          </div>
                          <div className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-neutral-400'}>
                            {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter (A-Z)
                          </div>
                          <div className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-neutral-400'}>
                            {passwordStrength.checks.lowercase ? '✓' : '○'} One lowercase letter (a-z)
                          </div>
                          <div className={passwordStrength.checks.number ? 'text-green-600' : 'text-neutral-400'}>
                            {passwordStrength.checks.number ? '✓' : '○'} One number (0-9)
                          </div>
                          <div className={passwordStrength.checks.special ? 'text-green-600' : 'text-neutral-400'}>
                            {passwordStrength.checks.special ? '✓' : '○'} One special character (!@#$%^&*)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className="w-full pl-10 pr-12 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          placeholder="Re-enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="mt-1 text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Passwords do not match
                        </div>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <div className="mt-1 text-green-600 text-sm flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Passwords match
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Profile Details */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Pincode */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Pincode *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={handlePincodeChange}
                          onBlur={() => setTimeout(() => setShowPincodeSuggestions(false), 150)}
                          onFocus={() => pincodeSuggestions.length > 0 && setShowPincodeSuggestions(true)}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition ${
                            pincodeWarning ? 'border-orange-300 focus:border-orange-500' : 'border-neutral-200 focus:border-primary-500'
                          }`}
                          placeholder="Enter 6-digit pincode"
                          maxLength={6}
                          autoComplete="off"
                        />
                        {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                            {pincodeSuggestions.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={() => selectPincodeSuggestion(p)}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 flex items-center justify-between gap-2 border-b border-neutral-50 last:border-0"
                              >
                                <span className="text-sm font-medium text-neutral-900">{p.area}</span>
                                <span className="text-xs text-neutral-400">{p.pincode} · {p.taluk}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {pincodeWarning && (
                        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start gap-2 text-orange-800 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>{pincodeWarning}</div>
                          </div>
                        </div>
                      )}
                      <div className="mt-1 text-neutral-500 text-xs">
                        {formData.pincode.length}/6 digits - Must be a Kasaragod district pincode
                      </div>
                    </div>

                    {/* Address — only for workers; employers use company address */}
                    {formData.userType !== 'employer' && (
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Complete Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition resize-none"
                          placeholder="House number, street name, area, locality details..."
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                    )}

                    {/* Work Category */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Work Category *</label>
                      <select
                        value={formData.workCategory}
                        onChange={(e) => setFormData({...formData, workCategory: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                      >
                        <option value="">Select your work category</option>
                        {WORK_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Worker-specific fields */}
                    {formData.userType === 'worker' && (
                      <>
                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Skills *</label>
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              onClick={getRegisterAISuggestions}
                              disabled={aiSkillLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-primary-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-60"
                            >
                              {aiSkillLoading ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              {aiSkillLoading ? 'Loading...' : 'AI Suggest Skills'}
                            </button>
                            {showAiSkillPanel && (
                              <button type="button" onClick={() => setShowAiSkillPanel(false)} className="text-xs text-neutral-500 hover:text-neutral-700 px-2">Hide</button>
                            )}
                          </div>

                          {/* AI Suggestion Panel */}
                          {showAiSkillPanel && (
                            <div className="mb-3 p-4 bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-primary-600" />
                                <span className="text-sm font-semibold text-primary-800">AI Career Advisor</span>
                              </div>
                              {aiSkillLoading ? (
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                  <Loader size={14} className="animate-spin" /> Generating skill suggestions...
                                </div>
                              ) : (
                                <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                                  {aiSkillSuggestions}
                                </div>
                              )}
                              {!aiSkillLoading && aiSkillSuggestions && (
                                <p className="mt-2 text-xs text-primary-600">💡 Copy relevant skills into the field below</p>
                              )}
                            </div>
                          )}

                          <textarea
                            value={formData.skills}
                            onChange={(e) => setFormData({...formData, skills: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition resize-none"
                            placeholder="List your skills (e.g., Masonry, Plastering, Carpentry...)"
                            rows={3}
                          />
                          <p className="text-xs text-neutral-400 mt-1">Separate multiple skills with commas</p>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Experience *</label>
                          <select
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select experience level</option>
                            <option value="fresher">Fresher</option>
                            <option value="1-2">1-2 years</option>
                            <option value="2-5">2-5 years</option>
                            <option value="5-10">5-10 years</option>
                            <option value="10+">10+ years</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Availability *</label>
                          <select
                            value={formData.availability}
                            onChange={(e) => setFormData({...formData, availability: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select availability</option>
                            <option value="immediate">Immediate</option>
                            <option value="within_week">Within a week</option>
                            <option value="within_month">Within a month</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Preferred Job Type *</label>
                          <select
                            value={formData.jobType}
                            onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select job type</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="daily">Daily Wages</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Languages Known</label>
                          <input
                            type="text"
                            value={formData.languages}
                            onChange={(e) => setFormData({...formData, languages: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                            placeholder="e.g., Malayalam, English, Hindi"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Expected Wage/Salary</label>
                          <input
                            type="text"
                            value={formData.wageExpectation}
                            onChange={(e) => setFormData({...formData, wageExpectation: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                            placeholder="e.g., ₹500/day or ₹15,000/month"
                          />
                        </div>
                      </>
                    )}

                    {/* Employer-specific fields */}
                    {formData.userType === 'employer' && (
                      <>
                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Gender *</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Number of Workers Needed</label>
                          <select
                            value={formData.workersNeeded}
                            onChange={(e) => setFormData({...formData, workersNeeded: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                          >
                            <option value="">Select count</option>
                            <option value="1-5">1–5 workers</option>
                            <option value="5-10">5–10 workers</option>
                            <option value="10-20">10–20 workers</option>
                            <option value="20-50">20–50 workers</option>
                            <option value="50+">50+ workers</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-700 font-medium mb-2">Any Other Details (Optional)</label>
                          <textarea
                            value={formData.otherDetails}
                            onChange={(e) => setFormData({...formData, otherDetails: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition resize-none"
                            placeholder="Any additional information"
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    {/* Dual Role: extra fields for the second role */}
                    {formData.dualRole && (
                      <div className="mt-2 pt-4 border-t border-neutral-200 space-y-4">
                        <p className="text-sm font-semibold text-primary-700 flex items-center gap-2">
                          {formData.userType === 'worker' ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          {formData.userType === 'worker' ? 'Employer Details (Additional Role)' : 'Worker Details (Additional Role)'}
                        </p>

                        {/* If primary is worker → collect employer workers needed (gender already given above) */}
                        {formData.userType === 'worker' && (
                          <>
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2">Number of Workers You May Need</label>
                              <select
                                value={formData.dualWorkersNeeded || ''}
                                onChange={(e) => setFormData({...formData, dualWorkersNeeded: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                              >
                                <option value="">Select count</option>
                                <option value="1-5">1–5 workers</option>
                                <option value="5-10">5–10 workers</option>
                                <option value="10-20">10–20 workers</option>
                                <option value="20-50">20–50 workers</option>
                                <option value="50+">50+ workers</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* If primary is employer → collect worker skills + experience */}
                        {formData.userType === 'employer' && (
                          <>
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2">Your Work Category (as Worker) *</label>
                              <select
                                value={formData.dualWorkCategory || ''}
                                onChange={(e) => setFormData({...formData, dualWorkCategory: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                              >
                                <option value="">Select category</option>
                                <option value="construction">🏗️ Construction</option>
                                <option value="labourers">🔨 Labourers</option>
                                <option value="farming">🌾 Farming</option>
                                <option value="plumbing">🔧 Plumbing</option>
                                <option value="electrical">⚡ Electrical</option>
                                <option value="event_management">🎪 Event Management</option>
                                <option value="local_workers">🏘️ Local Workers</option>
                                <option value="other">⭐ Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2">Your Skills (as Worker)</label>
                              <input
                                type="text"
                                value={formData.dualSkills || ''}
                                onChange={(e) => setFormData({...formData, dualSkills: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                                placeholder="e.g. Masonry, Welding, Plumbing"
                              />
                            </div>
                            <div>
                              <label className="block text-neutral-700 font-medium mb-2">Experience Level (as Worker)</label>
                              <select
                                value={formData.dualExperience || ''}
                                onChange={(e) => setFormData({...formData, dualExperience: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                              >
                                <option value="">Select experience</option>
                                <option value="Fresher">Fresher</option>
                                <option value="1-2 years">1–2 years</option>
                                <option value="2-4 years">2–4 years</option>
                                <option value="5+ years">5+ years</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: Document Upload */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-blue-900">Document Verification Required</div>
                          <div className="text-sm text-blue-700 mt-1">
                            Upload any valid government ID for admin verification. Your account will be activated after approval.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document Type */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Document Type *</label>
                      <select
                        value={formData.documentType}
                        onChange={handleDocumentTypeChange}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 transition"
                      >
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="voterId">Voter ID</option>
                        <option value="driverlicense">Driving License</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>

                    {/* Document Number */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Document Number *</label>
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={handleDocumentNumberChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg transition ${
                          docValidation.message && !docValidation.valid 
                            ? 'border-red-300 focus:border-red-500' 
                            : docValidation.valid 
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-neutral-200 focus:border-primary-500'
                        }`}
                        placeholder={getDocumentValidator(formData.documentType)?.placeholder || "Enter document number"}
                      />
                      {docValidation.message && (
                        <div className={`mt-2 text-sm ${docValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {docValidation.message}
                        </div>
                      )}
                      <div className="mt-1 text-neutral-500 text-xs">
                        {getDocumentValidator(formData.documentType)?.hint || 'Enter your document number'}
                      </div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-neutral-700 font-medium mb-2">Upload Document *</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="documentUpload"
                        />
                        <label
                          htmlFor="documentUpload"
                          className="block w-full p-8 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 transition cursor-pointer text-center"
                        >
                          {documentPreview ? (
                            <div className="space-y-3">
                              {formData.documentFile?.type.startsWith('image/') ? (
                                <img src={documentPreview} alt="Preview" className="max-h-40 mx-auto rounded" />
                              ) : (
                                <FileText className="w-16 h-16 mx-auto text-primary-600" />
                              )}
                              <div className="text-sm font-medium text-neutral-700">{formData.documentFile?.name}</div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFormData(prev => ({ ...prev, documentFile: null }));
                                  setDocumentPreview(null);
                                }}
                                className="text-red-600 text-sm hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                              <div className="text-neutral-600 font-medium">Click to upload document</div>
                              <div className="text-xs text-neutral-400 mt-1">PNG, JPG or PDF (max 5MB)</div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 w-4 h-4"
                        id="termsCheckbox"
                      />
                      <label htmlFor="termsCheckbox" className="text-sm text-neutral-700">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsDialog(true)}
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          Terms & Conditions
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDialog(true)}
                          className="text-primary-600 hover:underline font-semibold"
                        >
                          Privacy Policy
                        </button>
                        . I understand my account will be activated after admin verification and I confirm that I am located in Kasaragod district.
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-neutral-300 transition flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Complete Registration
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="px-8 pb-8 text-center text-sm text-neutral-600">
              Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Terms & Privacy Dialogs */}
      <TermsDialog isOpen={showTermsDialog} onClose={() => setShowTermsDialog(false)} />
      <PrivacyDialog isOpen={showPrivacyDialog} onClose={() => setShowPrivacyDialog(false)} />
    </div>
  );
};

export default Register;
