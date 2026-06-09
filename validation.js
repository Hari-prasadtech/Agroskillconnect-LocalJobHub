// Document & Pincode Validation Utilities

export const DOCUMENT_TYPES = {
  aadhar: {
    label: 'Aadhar Card',
    pattern: /^\d{12}$/,
    format: 'XXXX XXXX XXXX',
    hint: '12-digit number (e.g., 1234 5678 9012)',
    placeholder: 'Enter 12-digit Aadhar number',
    validate: (num) => /^\d{12}$/.test(num.replace(/\s/g, ''))
  },
  pan: {
    label: 'PAN Card',
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
    format: 'AAAAA9999A',
    hint: '10 characters (5 letters, 4 digits, 1 letter) - e.g., ABCDE1234F',
    placeholder: 'Enter PAN number (e.g., ABCDE1234F)',
    validate: (num) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(num.replace(/\s/g, '').toUpperCase())
  },
  driverlicense: {
    label: 'Driving License',
    pattern: /^[A-Z]{2}\d{2}[A-Z]{0,2}\d{7}$/i,
    format: 'AA99AA0000000 or AA990000000',
    hint: 'Format: State (2 letters) + Year (2 digits) + Optional (2 letters) + 7 digits (e.g., KL01AB0123456 or KL010123456)',
    placeholder: 'Enter Driving License number',
    validate: (num) => {
      const clean = num.replace(/\s/g, '').toUpperCase();
      return /^[A-Z]{2}\d{2}[A-Z]{0,2}\d{7}$/.test(clean) && (clean.length === 13 || clean.length === 11);
    }
  },
  passport: {
    label: 'Passport',
    pattern: /^[A-Z]{1}\d{7}$/i,
    format: 'A0000000',
    hint: '1 letter + 7 digits (e.g., A1234567)',
    placeholder: 'Enter Passport number (e.g., A1234567)',
    validate: (num) => /^[A-Z]{1}\d{7}$/i.test(num.replace(/\s/g, '').toUpperCase())
  },
  voterId: {
    label: 'Voter ID',
    pattern: /^[A-Z]{3}\d{7}$/i,
    format: 'AAA0000000',
    hint: '3 letters + 7 digits (e.g., ABC1234567)',
    placeholder: 'Enter Voter ID (e.g., ABC1234567)',
    validate: (num) => /^[A-Z]{3}\d{7}$/i.test(num.replace(/\s/g, '').toUpperCase())
  }
};

export const validateDocumentNumber = (type, number) => {
  if (!number || !type) return false;
  const validator = DOCUMENT_TYPES[type];
  if (!validator) return false;
  return validator.validate(number);
};

export const getDocumentValidator = (type) => {
  return DOCUMENT_TYPES[type] || null;
};

export const formatDocumentNumber = (type, value) => {
  const cleanValue = value.replace(/\s/g, '');
  
  if (type === 'aadhar') {
    return cleanValue.replace(/\D/g, '').slice(0, 12);
  }
  if (type === 'driverlicense') {
    return cleanValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);
  }
  if (type === 'pan') {
    return cleanValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  }
  if (type === 'passport') {
    return cleanValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }
  if (type === 'voterId') {
    return cleanValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  }
  return value;
};

// Phone validation
export const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13;
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
};

// Skill validation
export const validateSkills = (skillsArray) => {
  return Array.isArray(skillsArray) && skillsArray.length > 0 && skillsArray.every(s => typeof s === 'string' && s.length > 0);
};

// Salary range validation
export const validateSalary = (salary) => {
  return salary && typeof salary === 'string' && salary.length > 0;
};

// Address validation
export const validateAddress = (address) => {
  return address && address.trim().length >= 5;
};

// Get document type options for select
export const getDocumentTypeOptions = () => {
  return Object.entries(DOCUMENT_TYPES).map(([key, value]) => ({
    value: key,
    label: value.label
  }));
};

// Validation error messages
export const getValidationError = (field, value) => {
  const errors = {
    name: () => !validateName(value) ? 'Name must contain only letters (min 2 characters)' : null,
    email: () => !validateEmail(value) ? 'Please enter a valid email address' : null,
    phone: () => !validatePhone(value) ? 'Phone must be 10-13 digits' : null,
    password: () => !validatePassword(value) ? 'Password must be at least 6 characters' : null,
    confirmPassword: () => value ? null : 'Please confirm your password',
    address: () => !validateAddress(value) ? 'Address must be at least 5 characters' : null,
    skills: () => !validateSkills(value) ? 'Please select at least one skill' : null,
    salary: () => !validateSalary(value) ? 'Please enter salary information' : null,
  };
  
  return errors[field] ? errors[field]() : null;
};
