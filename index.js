/**
 * AgroSkillConnect – Enhanced Server with Admin Document Verification
 * Features: Admin approval workflow, AI document verification, email notifications
 */

import { createServer } from 'node:http';
import { createHmac, randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { MongoClient, ObjectId } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, '../../.env'), 'utf8');
  for (const line of env.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* .env optional */ }

const PORT   = Number(process.env.PORT) || 5000;
const SECRET = process.env.JWT_SECRET   || 'agroskill-secret-2024';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const ORIGINS = ['http://localhost:5173','http://localhost:3000','http://localhost:5174', process.env.CORS_ORIGIN].filter(Boolean);

// ─── Gmail / Email Config ──────────────────────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER || 'agroskillconnect@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'erysxalzokldqjud';

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

mailer.verify().then(() => console.log('📧 Gmail SMTP ready')).catch(e => console.warn('⚠️  Gmail SMTP error:', e.message));

// ─── File Upload Storage ────────────────────────────────────────────────────────
const UPLOAD_DIR = join(__dirname, '../uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── MongoDB Connection ─────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agroskill';
const mongoClient = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db();
    console.log('🍃 MongoDB connected:', MONGO_URI);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ─── OTP Store ─────────────────────────────────────────────────────────────────
const OtpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

function storeOTP(email, otp, type) {
  OtpStore.set(email.toLowerCase(), { otp, type, expiresAt: Date.now() + OTP_EXPIRY_MS, verified: false });
}

function checkOTP(email, otp, type) {
  const rec = OtpStore.get(email.toLowerCase());
  if (!rec) return { ok: false, msg: 'No OTP found. Please request a new one.' };
  if (rec.type !== type) return { ok: false, msg: 'Invalid OTP request type.' };
  if (Date.now() > rec.expiresAt) { OtpStore.delete(email.toLowerCase()); return { ok: false, msg: 'OTP expired. Please request a new one.' }; }
  if (rec.otp !== String(otp)) return { ok: false, msg: 'Incorrect OTP. Please try again.' };
  OtpStore.set(email.toLowerCase(), { ...rec, verified: true });
  return { ok: true };
}

function isVerified(email, type) {
  const rec = OtpStore.get(email.toLowerCase());
  return rec && rec.verified && rec.type === type && Date.now() <= rec.expiresAt;
}

async function sendOTPEmail(email, otp, type) {
  const isReset = type === 'reset';
  const subject = isReset ? '🔑 AgroSkillConnect – Password Reset OTP' : '✅ AgroSkillConnect – Email Verification OTP';
  const title   = isReset ? 'Reset Your Password' : 'Verify Your Email Address';
  const desc    = isReset
    ? 'You requested a password reset. Use the OTP below to set a new password.'
    : 'Welcome to AgroSkillConnect! Enter this OTP to verify your email and complete registration.';

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">🌾 AgroSkillConnect</div>
        <div style="color:#bbf7d0;font-size:13px;margin-top:4px">Global Worker Platform</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700">${title}</h2>
        <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6">${desc}</p>
        <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <div style="font-size:11px;font-weight:600;color:#16a34a;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Your OTP</div>
          <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#111827;font-family:'Courier New',monospace">${otp}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:8px">Valid for <strong>10 minutes</strong></div>
        </div>
        <div style="background:#fefce8;border-left:4px solid #eab308;padding:12px 16px;border-radius:6px;font-size:13px;color:#713f12">
          🔒 Never share this OTP with anyone. AgroSkillConnect will never ask for your OTP.
        </div>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · agroskillconnect@gmail.com</p>
        <p style="margin:4px 0 0;font-size:11px;color:#d1d5db">If you didn't request this, please ignore this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect" <${GMAIL_USER}>`,
    to: email,
    subject,
    html,
    text: `${title}\n\nYour OTP: ${otp}\n\nValid for 10 minutes. Never share this OTP with anyone.`,
  });
}

// ─── User Approval Email ────────────────────────────────────────────────────────
async function sendUserApprovalEmail(user, approved) {
  const subject = approved
    ? '🎉 Your AgroSkillConnect Account is Now Active!'
    : '❌ Account Verification Status – AgroSkillConnect';
  
  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,${approved?'#16a34a,#15803d':'#dc2626,#b91c1c'});padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
        <div style="color:${approved?'#bbf7d0':'#fecaca'};font-size:13px;margin-top:4px">Global Worker Platform</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 12px;font-size:22px;color:#111827">${approved ? '🎉 Account Activated!' : '⚠️ Account Not Approved'}</h2>
        <p style="color:#6b7280;font-size:15px;line-height:1.6">Hi <strong>${user.name}</strong>,</p>
        ${approved
          ? `<p style="color:#6b7280;font-size:15px;line-height:1.6">Great news! Your account documents have been verified and your account is now <span style="color:#16a34a;font-weight:700">active</span> on AgroSkillConnect.</p>
             <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:20px 0">
               <p style="margin:0;font-size:14px;color:#166534"><strong>Account Type:</strong> ${user.userType === 'employer' ? 'Employer - You can now post jobs!' : 'Worker - You can now apply to jobs!'}</p>
             </div>
             <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:20px 0">
               <p style="margin:0;font-size:14px;color:#1e40af">
                 ${user.userType === 'employer' 
                   ? '📝 Note: When you post a job, it will need admin approval before becoming publicly visible to workers.'
                   : '✅ You can now browse and apply to any jobs in Kasaragod! No restrictions based on your category or pincode.'
                 }
               </p>
             </div>`
          : `<p style="color:#6b7280;font-size:15px;line-height:1.6">Unfortunately, we could not verify your documents. Please ensure your documents are clear and the information matches, then contact support.</p>`
        }
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
    to: user.email,
    subject,
    html,
    text: `${subject}\n\nThis is an automated message.`,
  });
}

// ─── Job Approval Email ────────────────────────────────────────────────────────
// Returns a clean "City, State" display string for any job (demo or manual)
function displayLocation(job) {
  if (job.city) return [job.city, job.state].filter(Boolean).join(', ');
  if (job.location) return job.location.split(',')[0].trim();
  return 'Kasaragod';
}

// Returns full address for detail rows in emails
function fullAddress(job) {
  if (job.address) return [job.address, job.city, job.state, job.pincode].filter(Boolean).join(', ');
  return job.location || 'Not specified';
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

function fmtTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function buildScheduleRows(job) {
  const rows = [];
  const row = (icon, label, val) => val
    ? `<tr><td style="padding:6px 10px 6px 0;font-size:13px;color:#6b7280;width:40%">${icon} ${label}</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827">${val}</td></tr>`
    : '';
  rows.push(row('📅','Joining Date', fmtDate(job.startDate)));
  rows.push(row('📆','Working Days', job.workDays));
  if (job.workHoursFrom && job.workHoursTo)
    rows.push(row('🕐','Work Hours', `${fmtTime(job.workHoursFrom)} – ${fmtTime(job.workHoursTo)}`));
  else if (job.workHoursFrom)
    rows.push(row('🕐','Work Hours', `From ${fmtTime(job.workHoursFrom)}`));
  if (job.shiftType)
    rows.push(row(job.shiftType==='night'?'🌙':job.shiftType==='rotational'?'🔁':'☀️','Shift', `${job.shiftType.charAt(0).toUpperCase()+job.shiftType.slice(1)} Shift`));
  rows.push(row('⏳','Duration', job.contractDuration));
  rows.push(row('☕','Break Time', job.breakTime));
  rows.push(row('💵','Overtime', job.overtimeInfo));
  if (job.seasonMonths?.length > 0)
    rows.push(row('🌱','Work Season', job.seasonMonths.join(', ')));
  if (job.eventStartDate || job.eventEndDate) {
    const eventRange = [fmtDate(job.eventStartDate), fmtDate(job.eventEndDate)].filter(Boolean).join(' – ');
    rows.push(row('🎪','Event Dates', eventRange));
  }
  const filtered = rows.filter(Boolean);
  if (!filtered.length) return '';
  return `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;padding:4px;margin-bottom:0">${filtered.join('')}</table>`;
}

async function sendJobApprovalEmail(employer, job, approved) {
  const subject = approved
    ? `✅ Your Job "${job.title}" is Now Live – AgroSkillConnect`
    : `❌ Job Post "${job.title}" Not Approved – AgroSkillConnect`;
  const scheduleRows = approved ? buildScheduleRows(job) : '';
  
  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
        <div style="color:#bbf7d0;font-size:13px;margin-top:4px">Global Worker Platform</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 12px;font-size:22px;color:#111827">${approved ? '🎉 Your Job is Live!' : '⚠️ Job Post Not Approved'}</h2>
        <p style="color:#6b7280;font-size:15px;line-height:1.6">Hi <strong>${employer.name}</strong>,</p>
        ${approved
          ? `<p style="color:#6b7280;font-size:15px;line-height:1.6">Your job post <strong>"${job.title}"</strong> in <strong>${displayLocation(job)}</strong> has been approved and is now <span style="color:#16a34a;font-weight:700">publicly visible</span> to workers on AgroSkillConnect.</p>
             <div style="background:#f0fdf4;border-radius:10px;padding:14px 16px;margin:16px 0">
               <table style="width:100%;border-collapse:collapse">
                 <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:40%">📍 Location</td><td style="font-size:13px;font-weight:600;color:#166534">${fullAddress(job)}</td></tr>
                 ${job.salary ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">💰 Salary</td><td style="font-size:13px;font-weight:600;color:#166534">${job.salary}</td></tr>` : ''}
                 ${job.vacancies ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">👷 Vacancies</td><td style="font-size:13px;font-weight:600;color:#166534">${job.vacancies} position${job.vacancies > 1 ? 's' : ''}</td></tr>` : ''}
                 ${job.jobType ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">📋 Job Type</td><td style="font-size:13px;font-weight:600;color:#166534">${job.jobType}</td></tr>` : ''}
                 ${job.deadline ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">⏰ Deadline</td><td style="font-size:13px;font-weight:600;color:#166534">${fmtDate(job.deadline)}</td></tr>` : ''}
               </table>
             </div>
             ${scheduleRows ? `<div style="margin:16px 0"><p style="font-weight:700;color:#374151;margin:0 0 10px">📋 Work Schedule:</p>${scheduleRows}</div>` : ''}
             <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:16px 0">
               <p style="margin:0;font-size:14px;color:#166534">Workers can now find and apply. Applications will be visible to you after admin approval.</p>
             </div>`
          : `<p style="color:#6b7280;font-size:15px;line-height:1.6">Unfortunately, your job post <strong>"${job.title}"</strong> was not approved. Please review our guidelines and resubmit.</p>`
        }
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
    to: employer.email,
    subject,
    html,
    text: `${subject}\n\nThis is an automated message.`,
  });
}

// ─── Application Approval Email (Admin → Worker & Employer) ───────────────────
async function sendApplicationApprovalEmail(worker, employer, job, approved) {
  const workerSubject = approved
    ? `✅ Application Approved – Employer Will Review Soon`
    : `❌ Application Not Approved – AgroSkillConnect`;
  
  const workerHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 12px;font-size:22px;color:#111827">${approved ? '✅ Application Approved' : '❌ Application Not Approved'}</h2>
        <p style="color:#6b7280;font-size:15px">Hi <strong>${worker.name}</strong>,</p>
        ${approved
          ? `<p style="color:#6b7280;font-size:15px;line-height:1.6">Your application for <strong>"${job.title}"</strong> has been approved by our admin and is now forwarded to the employer for review.</p>
             <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:20px 0">
               <p style="margin:0;font-size:14px;color:#166534">The employer will review your application and you'll be notified of their decision soon!</p>
             </div>`
          : `<p style="color:#6b7280;font-size:15px;line-height:1.6">Your application for <strong>"${job.title}"</strong> was not approved. You may apply to other jobs.</p>`
        }
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
    to: worker.email,
    subject: workerSubject,
    html: workerHtml,
    text: `${workerSubject}\n\nThis is an automated message.`,
  });

  // Notify employer when application is approved
  if (approved) {
    const empSubject = `🔔 New Applicant for "${job.title}" – Review Now`;
    const empHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 12px;font-size:22px;color:#111827">👷 New Worker Application</h2>
        <p style="color:#6b7280;font-size:15px">Hi <strong>${employer.name}</strong>,</p>
        <p style="color:#6b7280;font-size:15px;line-height:1.6"><strong>${worker.name}</strong> has applied for <strong>"${job.title}"</strong>. Their application has been verified and approved by our admin.</p>
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 6px;font-size:14px;color:#166534"><strong>Applicant:</strong> ${worker.name}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#166534"><strong>Experience:</strong> ${worker.experience || 'Not specified'}</p>
          <p style="margin:0;font-size:14px;color:#166534"><strong>Skills:</strong> ${(worker.skills || []).join(', ') || 'Not specified'}</p>
        </div>
        <p style="color:#6b7280;font-size:14px">Log in to AgroSkillConnect to review and Accept/Reject this application.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;

    await mailer.sendMail({
      from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
      to: employer.email,
      subject: empSubject,
      html: empHtml,
      text: `${empSubject}\n\nThis is an automated message.`,
    });
  }
}

// ─── Worker Selection Email (Employer → Worker) ────────────────────────────────
async function sendEmployerDecisionEmail(worker, job, accepted, employer) {
  const subject = accepted
    ? `🎉 Congratulations! You've Been Selected for "${job.title}"`
    : `Application Update for "${job.title}" – AgroSkillConnect`;
  const scheduleBlock = accepted ? buildScheduleRows(job) : '';
  const employerContact = employer?.phone || null;
  const employerName = employer?.name || job.company || 'The Employer';

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,${accepted?'#16a34a,#15803d':'#dc2626,#b91c1c'});padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 12px;font-size:24px;color:#111827">${accepted ? '🎉 You Got the Job!' : 'Application Status Update'}</h2>
        <p style="color:#6b7280;font-size:15px">Hi <strong>${worker.name}</strong>,</p>

        ${accepted ? `
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <div style="font-size:40px;margin-bottom:8px">🎊</div>
          <p style="margin:0;font-size:16px;font-weight:700;color:#166534">Congratulations! You have been selected!</p>
          <p style="margin:8px 0 0;font-size:14px;color:#15803d">The employer has accepted your application for <strong>"${job.title}"</strong>.</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:4px 0;font-size:13px;color:#6b7280">📍 Location</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827">${fullAddress(job)}</td></tr>
          ${job.salary ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">💰 Salary</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827">${job.salary}</td></tr>` : ''}
        </table>

        ${scheduleBlock ? `
        <div style="margin-bottom:20px">
          <p style="font-size:15px;font-weight:700;color:#111827;margin:0 0 10px">📅 Your Work Schedule</p>
          <div style="background:#eff6ff;border-radius:10px;padding:16px">
            ${scheduleBlock}
          </div>
        </div>` : ''}

        ${employerContact ? `
        <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400e">📞 Employer Contact</p>
          <p style="margin:0 0 4px;font-size:14px;color:#78350f"><strong>${employerName}</strong></p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#92400e">${employerContact}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#a16207">Please contact the employer to confirm joining details.</p>
        </div>` : `
        <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#92400e">📞 The employer will contact you soon with joining details!</p>
        </div>`}

        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px">
          <p style="margin:0;font-size:14px;color:#166534">🌟 Best of luck in your new role!</p>
        </div>
        ` : `
        <p style="color:#6b7280;font-size:15px;line-height:1.6">The employer has decided not to proceed with your application for <strong>"${job.title}"</strong> at this time.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#991b1b">Don't be discouraged – there are many more opportunities on AgroSkillConnect!</p>
        </div>
        `}
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
    to: worker.email,
    subject,
    html,
    text: accepted
      ? `Congratulations! You have been selected for "${job.title}". The employer will contact you soon.`
      : `The employer did not proceed with your application for "${job.title}".`,
  });
}

// ─── Job Filled Notification Email ─────────────────────────────────────────
async function sendJobFilledNotificationEmail(worker, job) {
  const subject = `📌 Job Filled: "${job.title}" – AgroSkillConnect`;
  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#3b82f6,#1e40af);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
        <div style="color:#bfdbfe;font-size:13px;margin-top:4px">Global Worker Platform</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700">📌 Job Position Filled</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6">Hi <strong>${worker.name}</strong>,</p>
        <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#1e40af"><strong>The job position for "${job.title}" has been filled</strong> by the employer and is no longer available.</p>
        </div>
        <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:20px 0">Don't worry! There are many more opportunities waiting for you on AgroSkillConnect. Visit our <strong>Find Jobs</strong> section to explore other positions that match your skills.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280"><strong>💡 Quick Tip:</strong> Keep your profile updated and enable notifications to be first when new jobs are posted in your category!</p>
        </div>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · Global Worker Platform</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect" <${GMAIL_USER}>`,
    to: worker.email,
    subject,
    html,
    text: `Job Filled: The position for "${job.title}" has been filled. Check other available jobs on AgroSkillConnect!`
  });
}

// ─── Job Removed/Deactivated Notification Email ──────────────────────────────
async function sendJobRemovedEmail(worker, job, reason = 'deleted') {
  const isDeleted = reason === 'deleted';
  const subject = isDeleted
    ? `📢 Job Removed: "${job.title}" – AgroSkillConnect`
    : `⚠️ Job Deactivated: "${job.title}" – AgroSkillConnect`;

  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fdf4ff;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf4ff;padding:40px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fff">🌾 AgroSkillConnect</div>
        <div style="color:#fecaca;font-size:13px;margin-top:4px">Global Worker Platform</div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700">${isDeleted ? '📢 Job Has Been Removed' : '⚠️ Job Has Been Deactivated'}</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6">Hi <strong>${worker.name}</strong>,</p>
        <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#991b1b">
            The job <strong>"${job.title}"</strong> that you applied for has been 
            <strong>${isDeleted ? 'removed' : 'deactivated'}</strong> by the administrator and is no longer available.
          </p>
        </div>
        <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:20px 0">
          We understand this may be disappointing. There are many more opportunities available — browse the <strong>Find Jobs</strong> section to discover new positions that match your skills.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#6b7280"><strong>💡 Tip:</strong> Keep your profile updated to get matched with the best opportunities in your area!</p>
        </div>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · This is an automated message</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await mailer.sendMail({
    from: `"AgroSkillConnect No-Reply" <${GMAIL_USER}>`,
    to: worker.email,
    subject,
    html,
    text: `${subject}\n\nHi ${worker.name},\n\nThe job "${job.title}" you applied for has been ${isDeleted ? 'removed' : 'deactivated'} by the administrator.\n\nPlease visit AgroSkillConnect to find other available jobs.\n\n– AgroSkillConnect Team`,
  });
}

// ─── Built-in AI Job Description Generator (No API Key Needed) ───────────────
function generateJobDescriptionAI(jobData) {
  const { title, category, skills, jobType, experience, vacancies, salary, isHomeBased, homeJobType, homeRooms } = jobData;

  const skillsList = skills && skills.length > 0 ? skills.slice(0, 6).join(', ') : null;
  const vacancyText = vacancies && parseInt(vacancies) > 1 ? `${vacancies} positions` : 'this position';
  const salaryText = salary ? `Compensation: ${salary}.` : '';
  const expText = experience && experience !== 'Any' ? `Candidates should have ${experience} of relevant experience.` : '';
  const typeText = jobType ? `This is a ${jobType.toLowerCase()} role.` : '';

  let lines;

  if (isHomeBased) {
    const workType = homeJobType || title;
    const sizeText = homeRooms ? ` The house is approximately ${homeRooms}.` : '';
    lines = [
      `We are looking for a reliable and experienced ${workType} for home-based work in Kasaragod.`,
      `The work will be carried out at a private residence.${sizeText}`,
      typeText,
      skillsList
        ? `Key skills expected: ${skillsList}.`
        : `The candidate should be experienced in ${workType.toLowerCase()} and related household tasks.`,
      expText,
      salaryText,
      'The candidate must be trustworthy, punctual, and able to maintain a clean and safe environment.',
      'Interested candidates who are available to join soon are encouraged to apply.',
    ];
  } else {
    const categoryText = category ? `Category: ${category.replace(/_/g, ' ')}.` : '';
    lines = [
      `We are hiring a ${title} to join our team in Kasaragod.`,
      typeText,
      categoryText,
      skillsList
        ? `The ideal candidate should be skilled in: ${skillsList}.`
        : `The candidate should have relevant experience in ${title.toLowerCase()} work.`,
      expText,
      `We are looking to fill ${vacancyText}.`,
      salaryText,
      'Accommodation and food may be provided for outstation candidates.',
      'Candidates who are hardworking, reliable, and available to start soon are encouraged to apply.',
    ];
  }

  return lines.filter(Boolean).join(' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) return v.split(',').map(s=>s.trim()).filter(Boolean);
  return [];
}

// ─── MongoDB-backed Collection ────────────────────────────────────────────────
function newId() { return randomBytes(12).toString('hex'); }

function buildMongoQuery(q = {}) {
  // Convert string IDs in $in arrays to allow matching
  const out = {};
  for (const [k, v] of Object.entries(q)) {
    if (k === '$or') {
      out.$or = v.map(buildMongoQuery);
    } else if (v && typeof v === 'object' && '$in' in v) {
      out[k] = { $in: v.$in.map(i => i instanceof RegExp ? i : String(i)) };
    } else if (v instanceof RegExp) {
      out[k] = v;
    } else if (typeof v === 'boolean' || typeof v === 'number') {
      // ✅ FIX: Never stringify booleans or numbers — MongoDB stores them natively.
      // Stringifying true→"true" caused all boolean queries (adminApproved, isActive,
      // accountApproved) to silently return zero results.
      out[k] = v;
    } else if (v !== null && v !== undefined) {
      out[k] = String(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

class Collection {
  constructor(name) { this.name = name; }
  col() { return db.collection(this.name); }

  async create(d) {
    const r = { _id: newId(), ...d };
    // Stringify _id references for consistency
    await this.col().insertOne(r);
    return { ...r };
  }
  async findById(id) {
    if (!id) return null;
    const d = await this.col().findOne({ _id: String(id) });
    return d ? { ...d } : null;
  }
  async findOne(q) {
    const d = await this.col().findOne(buildMongoQuery(q));
    return d ? { ...d } : null;
  }
  async find(q = {}) {
    const docs = await this.col().find(buildMongoQuery(q)).toArray();
    return docs.map(d => ({ ...d }));
  }
  async update(id, d) {
    const { _id, ...rest } = d;
    const result = await this.col().findOneAndUpdate(
      { _id: String(id) },
      { $set: rest },
      { returnDocument: 'after' }
    );
    // MongoDB driver v6+ returns the document directly (not wrapped in { value: ... })
    return result ? { ...result } : null;
  }
  async remove(id) {
    const d = await this.col().findOne({ _id: String(id) });
    if (!d) return null;
    await this.col().deleteOne({ _id: String(id) });
    return { ...d };
  }
  async deleteMany(q = {}) {
    return await this.col().deleteMany(buildMongoQuery(q));
  }
  async count(q = {}) {
    return await this.col().countDocuments(buildMongoQuery(q));
  }
}

const Users        = new Collection('users');
const Jobs         = new Collection('jobs');
const Applications = new Collection('applications');
const Notifications= new Collection('notifications');
const LoginFailures= new Collection('login_failures');

// ─── Document Validators ──────────────────────────────────────────────────────
const DOCUMENT_VALIDATORS = {
  aadhar: (num) => /^\d{12}$/.test(num.replace(/\s/g, '')),
  pan: (num) => /^[A-Z0-9]{10}$/.test(num.replace(/\s/g, '').toUpperCase()),
  driverlicense: (num) => /^[A-Z0-9]{13}$/i.test(num.replace(/\s/g, '')),
  voterid: (num) => /^[A-Z0-9]{10}$/i.test(num.replace(/\s/g, '').toUpperCase()),
  passport: (num) => /^[A-Z0-9]{8}$/i.test(num.replace(/\s/g, ''))
};

const KASARAGOD_PINCODES_SET = new Set(['671121','671124','671316','670004','670005','670006','671318','671321','671322','671311','670011','670012','670013','670014','670015','671531','670017','670018','670019','671541','670021','670022','671543','670024','670025','670026','670027','670028','670029','670030','670031','670032','670033','670034','670035']);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
function hashPwd(p) { const s=randomBytes(16).toString('hex'); return `${s}:${pbkdf2Sync(p,s,100000,64,'sha512').toString('hex')}`; }
function checkPwd(p,h) { const [s,k]=h.split(':'); return pbkdf2Sync(p,s,100000,64,'sha512').toString('hex')===k; }
function signToken(id) {
  const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const exp=Math.floor(Date.now()/1000)+30*86400;
  const p=Buffer.from(JSON.stringify({id,exp})).toString('base64url');
  const s=createHmac('sha256',SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}
function verifyToken(tok) {
  try {
    const [h,p,s]=tok.split('.');
    if (createHmac('sha256',SECRET).update(`${h}.${p}`).digest('base64url')!==s) return null;
    const d=JSON.parse(Buffer.from(p,'base64url').toString());
    return d.exp>Date.now()/1000?d:null;
  } catch { return null; }
}
async function getUser(req) {
  const a=req.headers.authorization;
  if (!a?.startsWith('Bearer ')) return null;
  const d=verifyToken(a.split(' ')[1]);
  if (!d) return null;
  const u=await Users.findById(d.id);
  if (!u || !u.isActive) return null; // Deactivated users are immediately locked out
  const {password,...safe}=u; return safe;
}

// ─── AI Document Verification ─────────────────────────────────────────────────
async function verifyDocumentWithAI(documentType, documentNumber, base64Image) {
  // Local rule-based verification (works without any external API)
  function localVerification(docType, docNumber) {
    const type = (docType || '').toLowerCase();
    const num = (docNumber || '').replace(/[\s-]/g, '');
    let score = 0;
    let reason = '';

    if (type.includes('aadhar') || type.includes('aadhaar')) {
      const is12Digits = /^\d{12}$/.test(num);
      const noAllSame = !/^(\d){11}$/.test(num);
      const validStart = !['0','1'].includes(num[0] || '');
      if (is12Digits) score += 40;
      if (noAllSame) score += 30;
      if (validStart) score += 30;
      reason = is12Digits && noAllSame && validStart
        ? 'Aadhar number format is valid (12 digits, valid range)'
        : 'Aadhar number format invalid: must be 12 digits, not start with 0/1, no repeating digits';
    } else if (type.includes('pan')) {
      const validPAN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(num.toUpperCase());
      score = validPAN ? 95 : 10;
      reason = validPAN ? 'PAN number format is valid (AAAAA9999A pattern)' : 'PAN format invalid: must be AAAAA9999A (5 letters, 4 digits, 1 letter)';
    } else if (type.includes('voter') || type.includes('voterid')) {
      const validVoter = /^[A-Z]{3}[0-9]{7}$/.test(num.toUpperCase());
      score = validVoter ? 90 : 20;
      reason = validVoter ? 'Voter ID format is valid' : 'Voter ID format invalid: must be 3 letters + 7 digits';
    } else if (type.includes('driving') || type.includes('license') || type.includes('dl')) {
      const validDL = /^[A-Z]{2}[0-9]{2}[0-9]{7}$/.test(num.toUpperCase());
      score = validDL ? 85 : 20;
      reason = validDL ? 'Driving License format is valid' : 'DL format: state code (2 letters) + year (2 digits) + 7 digits';
    } else if (type.includes('passport')) {
      const validPass = /^[A-Z][0-9]{7}$/.test(num.toUpperCase());
      score = validPass ? 90 : 20;
      reason = validPass ? 'Passport format is valid' : 'Passport format invalid: must be 1 letter + 7 digits';
    } else {
      score = 0;
      reason = 'Unrecognized document type. Accepted: Aadhar, PAN, Voter ID, Driving License, Passport';
    }

    const hasImage = base64Image && base64Image.length > 200;
    if (hasImage) score = Math.min(100, score + 5);

    return {
      verified: score >= 70,
      confidence: score,
      reason: (score >= 70 ? '✓ ' : '✗ ') + reason,
      timestamp: new Date().toISOString()
    };
  }

  if (!ANTHROPIC_KEY) {
    console.log('ℹ️  No Anthropic API key – using local rule-based verification');
    return localVerification(documentType, documentNumber);
  }

  try {
    const prompt = `You are a strict document verification AI for an employment platform in India. You must analyze the provided image carefully.

Document Type Claimed: ${documentType}
Document Number Submitted: ${documentNumber}

STEP 1 - IS THIS A DOCUMENT?
First, determine: Is the image actually a photo/scan of an official government identity document (Aadhar card, PAN card, Voter ID, Driving License, Passport, etc.)? 
- If the image is a selfie, a photo of a person, a random image, a blank image, a screenshot of something else, or clearly NOT a government document, set isDocument: false.

STEP 2 - EXTRACT THE NUMBER (only if it IS a document)
If it is a document, extract the exact document number visible in the image.

STEP 3 - COMPARE NUMBERS
Compare the extracted number with the submitted number: ${documentNumber}
- Ignore spaces and dashes when comparing
- If numbers match (even with minor formatting differences), set matches: true

Respond ONLY with a JSON object:
{
  "isDocument": true/false,
  "documentTypeVisible": "what type of document you see, or 'not a document'",
  "extractedNumber": "the number visible in image, or null if not a document",
  "matches": true/false,
  "confidence": 0-100,
  "reason": "clear explanation of what you found and decision"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image', 
              source: { 
                type: 'base64', 
                media_type: base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
                data: base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
              } 
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return localVerification(documentType, documentNumber);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    
    if (!text) {
      console.error('Empty response from AI');
      return { verified: false, confidence: 0, reason: 'No response from AI. Please try manual verification.' };
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response not in JSON format:', text);
      return { verified: false, confidence: 0, reason: 'AI parsing error. Please try manual verification.' };
    }

    const result = JSON.parse(jsonMatch[0]);

    // Check if image is not a document at all
    if (result.isDocument === false) {
      return {
        verified: false,
        confidence: 0,
        isDocument: false,
        extractedNumber: null,
        reason: `❌ Image is not a valid document. Detected: "${result.documentTypeVisible || 'not a government document'}". Please upload a clear photo/scan of your ${documentType}.`,
        timestamp: new Date().toISOString()
      };
    }

    // Check if number doesn't match
    if (result.isDocument === true && result.matches === false) {
      return {
        verified: false,
        confidence: result.confidence || 0,
        isDocument: true,
        extractedNumber: result.extractedNumber || '',
        reason: `❌ Document number mismatch. Number found in image: "${result.extractedNumber}" does not match submitted number: "${documentNumber}". ${result.reason || ''}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      verified: result.matches === true && result.confidence >= 70,
      confidence: result.confidence || 0,
      isDocument: true,
      extractedNumber: result.extractedNumber || '',
      reason: result.reason || 'AI verification completed',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI verification error:', error);
    return { 
      verified: false, 
      confidence: 0, 
      reason: `Verification error: ${error.message}. Manual verification required.` 
    };
  }
}

// ─── AI Security Feature 1: Fraud Risk Scoring ────────────────────────────────
// Analyzes user registration data for suspicious patterns, no external API needed
async function calculateFraudRiskScore(user) {
  let riskScore = 0;
  const flags = [];

  // Check for suspicious email patterns
  const email = (user.email || '').toLowerCase();
  const suspiciousEmailPatterns = [/\d{6,}@/, /test@/, /fake@/, /temp@/, /disposable/];
  if (suspiciousEmailPatterns.some(p => p.test(email))) {
    riskScore += 25;
    flags.push('Suspicious email pattern detected');
  }

  // Check document number format validity
  const docType = (user.documentType || '').toLowerCase();
  const docNum = (user.documentNumber || '').replace(/[\s-]/g, '');
  let docValid = false;
  if (docType.includes('aadhar') || docType.includes('aadhaar')) {
    docValid = /^\d{12}$/.test(docNum) && !['0','1'].includes(docNum[0]) && !/^(\d)\1{11}$/.test(docNum);
  } else if (docType.includes('pan')) {
    docValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(docNum.toUpperCase());
  } else if (docType.includes('voter')) {
    docValid = /^[A-Z]{3}[0-9]{7}$/.test(docNum.toUpperCase());
  } else if (docType.includes('driving') || docType.includes('dl')) {
    docValid = /^[A-Z]{2}[0-9]{9}$/.test(docNum.toUpperCase());
  } else if (docType.includes('passport')) {
    docValid = /^[A-Z][0-9]{7}$/.test(docNum.toUpperCase());
  }
  if (!docValid && docNum) {
    riskScore += 30;
    flags.push('Document number does not match expected format for document type');
  }

  // Check for missing document image
  if (!user.documentImage) {
    riskScore += 20;
    flags.push('No document image uploaded');
  }

  // Check for unusually short name
  const name = (user.name || '').trim();
  if (name.length < 3 || name.split(' ').length < 2) {
    riskScore += 10;
    flags.push('Name appears incomplete or too short');
  }

  // Check if phone number is valid Indian mobile
  const phone = (user.phone || '').replace(/[^\d]/g, '');
  if (phone && (phone.length < 10 || !/^[6-9]/.test(phone.slice(-10)))) {
    riskScore += 15;
    flags.push('Phone number does not appear to be a valid Indian mobile number');
  }

  // Check duplicate document numbers across all users
  if (docNum && docNum.length > 5) {
    const allUsers = await Users.find({});
    const duplicates = allUsers.filter(u =>
      u._id !== user._id &&
      u.documentNumber &&
      u.documentNumber.replace(/[\s-]/g, '') === docNum
    );
    if (duplicates.length > 0) {
      riskScore += 50;
      flags.push(`Document number already used by ${duplicates.length} other account(s) — possible identity fraud`);
    }
  }

  riskScore = Math.min(100, riskScore);
  const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

  return {
    riskScore,
    riskLevel,
    flags,
    recommendation: riskLevel === 'HIGH'
      ? 'Manual review strongly recommended before approval'
      : riskLevel === 'MEDIUM'
      ? 'Review flagged items before approval'
      : 'No significant risk factors detected',
    analyzedAt: new Date().toISOString()
  };
}

// ─── AI Security Feature 2: Suspicious Activity Detector ─────────────────────
// Monitors login/registration patterns for anomalies, no external API needed
async function detectSuspiciousActivity() {
  const allUsers = await Users.find({});
  const allApps = await Applications.find({});
  const now = new Date();
  const alerts = [];

  // Detect users with same document number (identity fraud)
  const docGroups = {};
  allUsers.forEach(u => {
    const num = (u.documentNumber || '').replace(/[\s-]/g, '');
    if (num && num.length > 5) {
      if (!docGroups[num]) docGroups[num] = [];
      docGroups[num].push(u);
    }
  });
  Object.entries(docGroups).forEach(([num, users]) => {
    if (users.length > 1) {
      alerts.push({
        type: 'IDENTITY_FRAUD',
        severity: 'HIGH',
        message: `Document number ${num.slice(0,4)}****${num.slice(-2)} is shared by ${users.length} accounts`,
        users: users.map(u => ({ id: u._id, name: u.name, email: u.email })),
        detectedAt: now.toISOString()
      });
    }
  });

  // Detect bulk applications from single account (spam)
  const appsByUser = {};
  allApps.forEach(a => {
    const id = typeof a.applicant === 'object' ? a.applicant?._id : a.applicant;
    if (id) {
      if (!appsByUser[id]) appsByUser[id] = [];
      appsByUser[id].push(a);
    }
  });
  for (const [userId, apps] of Object.entries(appsByUser)) {
    if (apps.length >= 10) {
      const user = await Users.findById(userId);
      alerts.push({
        type: 'SPAM_APPLICATIONS',
        severity: 'MEDIUM',
        message: `User has submitted ${apps.length} applications — possible spam behavior`,
        users: user ? [{ id: user._id, name: user.name, email: user.email }] : [],
        detectedAt: now.toISOString()
      });
    }
  }

  // Detect unverified accounts that are still active long after registration
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  allUsers.forEach(u => {
    if (!u.accountApproved && u.isActive && u.createdAt && new Date(u.createdAt) < thirtyDaysAgo) {
      alerts.push({
        type: 'STALE_UNVERIFIED',
        severity: 'LOW',
        message: `Account active but unverified for over 30 days`,
        users: [{ id: u._id, name: u.name, email: u.email }],
        detectedAt: now.toISOString()
      });
    }
  });

  return {
    totalAlerts: alerts.length,
    highSeverity: alerts.filter(a => a.severity === 'HIGH').length,
    mediumSeverity: alerts.filter(a => a.severity === 'MEDIUM').length,
    lowSeverity: alerts.filter(a => a.severity === 'LOW').length,
    alerts,
    scannedAt: now.toISOString()
  };
}

// ─── Populate Helpers ─────────────────────────────────────────────────────────
async function withEmployer(job) {
  if (!job) return null;
  const e=await Users.findById(job.employer);
  return {...job,employer:e?{_id:e._id,name:e.name,email:e.email,phone:e.phone,companyName:e.companyName,organizationName:e.organizationName,documentApproved:e.documentApproved||false,accountApproved:e.accountApproved||false,about:e.about||null,location:e.location||null,city:e.city||null,state:e.state||null,pincode:e.pincode||null,employerType:e.employerType||null,createdAt:e.createdAt}:job.employer};
}

async function withJobInfo(app) {
  const j=await Jobs.findById(app.job);
  if(!j) return {...app,job:app.job};
  const e=await Users.findById(j.employer);
  const employerName=e?.companyName||e?.organizationName||e?.name||'';
  const companyDisplay=j.company||employerName;
  return {...app,job:{_id:j._id,title:j.title,company:companyDisplay,employerName:employerName,location:j.location,city:j.city,state:j.state,address:j.address,pincode:j.pincode,salary:j.salary,workersNeeded:j.workersNeeded,startDate:j.startDate,workDays:j.workDays,workHoursFrom:j.workHoursFrom,workHoursTo:j.workHoursTo,contractDuration:j.contractDuration,shiftType:j.shiftType,seasonMonths:j.seasonMonths,eventStartDate:j.eventStartDate,eventEndDate:j.eventEndDate,breakTime:j.breakTime,overtimeInfo:j.overtimeInfo,dailyWages:j.dailyWages}};
}

async function withApplicantInfo(app) {
  const [j,a]=await Promise.all([await Jobs.findById(app.job),await Users.findById(app.applicant)]);
  return {...app,
    job:j?{_id:j._id,title:j.title,company:j.company,location:j.location,city:j.city,state:j.state,pincode:j.pincode,address:j.address}:app.job,
    applicant:a?{_id:a._id,name:a.name,email:a.email,phone:a.phone,location:a.location,city:a.city,state:a.state,address:a.address,pincode:a.pincode,gender:a.gender,skills:a.skills,experience:a.experience,workCategory:a.workCategory,about:a.about,languages:a.languages,availability:a.availability}:app.applicant};
}

async function withWorkerProfile(workerId) {
  const w = await Users.findById(workerId);
  if (!w) return null;
  const { password, documentImage, ...safe } = w;
  return safe;
}

async function withEmployerProfile(employerId) {
  const e = await Users.findById(employerId);
  if (!e) return null;
  const { password, documentImage, ...safe } = e;
  return safe;
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────
function setCORS(req, res) {
  const o=req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin',(o&&ORIGINS.includes(o))?o:(ORIGINS[0]||'*'));
  res.setHeader('Access-Control-Allow-Credentials','true');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

function body(req) {
  return new Promise(res => {
    let s=''; req.on('data',c=>s+=c);
    req.on('end',()=>{ try{res(JSON.parse(s||'{}'));}catch{res({});} });
    req.on('error',()=>res({}));
  });
}

function send(res,d,status=200) { res.writeHead(status,{'Content-Type':'application/json'}); res.end(JSON.stringify(d)); }

function parseQS(url) {
  const q={},idx=url.indexOf('?'); if(idx<0)return q;
  for(const part of url.slice(idx+1).split('&')){const[k,v]=part.split('=');if(k)q[decodeURIComponent(k)]=decodeURIComponent(v||'');}
  return q;
}

function param(pattern,path) {
  const keys=[];
  const re=new RegExp('^'+pattern.replace(/:([^/]+)/g,(_,k)=>{keys.push(k);return '([^/]+)';})+  '$');
  const m=path.match(re); if(!m)return null;
  const p={}; keys.forEach((k,i)=>p[k]=m[i+1]); return p;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🗑️  Clearing existing users, jobs & applications...');
  await Users.deleteMany({});
  await Jobs.deleteMany({});
  await Applications.deleteMany({});
  await Notifications.deleteMany({});
  console.log('✅ Database cleared. Seeding fresh data...');
  const now = Date.now();
  const ago = d => new Date(now - d*86400000).toISOString();
  const fwd = d => new Date(now + d*86400000).toISOString();

  // ── Admin ──────────────────────────────────────────────────────────────────
  await Users.create({
    name: 'Admin User',
    email: 'admin@agroskill.com',
    password: hashPwd('admin123'),
    userType: 'admin',
    isActive: true,
    profileCompleted: true,
    accountApproved: true,
    phone: '+91-9000000001',
    pincode: '671121',
    city: 'Kasaragod',
    state: 'Kerala',
    address: 'Admin Office, Kasaragod Town',
    createdAt: ago(90)
  });

  // ── Workers ────────────────────────────────────────────────────────────────
  // Password for all workers: worker@123
  const workers = [
    // Electrical workers
    { name: 'Arun Vijayan',        email: 'arun.elec@worker.com',     phone: '+91-9847100101', pincode: '671311', skills: ['Electrical Wiring','Switchboard Installation','Fan & Light Fitting','MCB Wiring'], experience: '5 years',  workCategory: 'electrical', documentType: 'aadhar', documentNumber: '234500100012', location: 'Kanhangad' },
    { name: 'Rajan Pillai',        email: 'rajan.elec@worker.com',    phone: '+91-9747100202', pincode: '671531', skills: ['Panel Installation','Electrical Maintenance','Inverter Work','Cable Laying'], experience: '8 years',  workCategory: 'electrical', documentType: 'aadhar', documentNumber: '345600200023', location: 'Manjeshwar' },
    { name: 'Sujith Nair',         email: 'sujith.elec@worker.com',   phone: '+91-9645100303', pincode: '671121', skills: ['House Wiring','Industrial Wiring','UPS Installation','Electrical Repairs'], experience: '6 years',  workCategory: 'electrical', documentType: 'pan',    documentNumber: 'ARUPN1001C',   location: 'Kasaragod Town' },

    // AC Technician workers (workCategory: 'electrical')
    { name: 'Noufal KP',           email: 'noufal.ac@worker.com',     phone: '+91-9544100404', pincode: '671311', skills: ['AC Installation','AC Repair','AC Service','Refrigeration','Copper Pipe Work'], experience: '7 years',  workCategory: 'electrical', documentType: 'aadhar', documentNumber: '456700300034', location: 'Kanhangad' },
    { name: 'Vishnu Das',          email: 'vishnu.ac@worker.com',     phone: '+91-9443100505', pincode: '671124', skills: ['Split AC Repair','Window AC Service','HVAC Maintenance','Gas Charging'], experience: '4 years',  workCategory: 'electrical', documentType: 'aadhar', documentNumber: '567800400045', location: 'Kasaragod Town' },

    // Plumbing workers
    { name: 'Binil Shetty',        email: 'binil.plumb@worker.com',   phone: '+91-9342100606', pincode: '671121', skills: ['Pipe Fitting','Leak Repair','Bathroom Fitting','Drain Cleaning'], experience: '6 years',  workCategory: 'plumbing',   documentType: 'aadhar', documentNumber: '678900500056', location: 'Kasaragod Town' },
    { name: 'Jobin Thomas',        email: 'jobin.plumb@worker.com',   phone: '+91-9241100707', pincode: '671311', skills: ['PVC Pipe Work','Water Tank Installation','Kitchen Plumbing','Sewage Repair'], experience: '9 years',  workCategory: 'plumbing',   documentType: 'aadhar', documentNumber: '789000600067', location: 'Kanhangad' },
    { name: 'Shyam Prasad',        email: 'shyam.plumb@worker.com',   phone: '+91-9140100808', pincode: '671317', skills: ['Plumbing Design','Pump Installation','Solar Water Heater','Gas Fitting'], experience: '11 years', workCategory: 'plumbing',   documentType: 'pan',    documentNumber: 'SHYPP5001D',   location: 'Nileshwar' },

    // Construction workers
    { name: 'Bineesh Kumar',       email: 'bineesh.con@worker.com',   phone: '+91-9039100909', pincode: '671121', skills: ['Masonry','Bricklaying','Plastering','Concreting'], experience: '10 years', workCategory: 'construction', documentType: 'aadhar', documentNumber: '890100700078', location: 'Kasaragod Town' },
    { name: 'Sarath Mohan',        email: 'sarath.con@worker.com',    phone: '+91-8938101010', pincode: '671316', skills: ['Carpentry','Door & Window Fitting','Furniture Making','Shuttering'], experience: '7 years',  workCategory: 'construction', documentType: 'aadhar', documentNumber: '901200800089', location: 'Kanhangad' },
    { name: 'Dileep Babu',         email: 'dileep.con@worker.com',    phone: '+91-8837101111', pincode: '671531', skills: ['Tiling','Waterproofing','Flooring','Granite Work'], experience: '5 years',  workCategory: 'construction', documentType: 'aadhar', documentNumber: '012300900090', location: 'Manjeshwar' },
    { name: 'Sreeraj MK',          email: 'sreeraj.con@worker.com',   phone: '+91-8736101212', pincode: '671321', skills: ['Painting','Wall Putty','Spray Painting','Texture Finishing'], experience: '4 years',  workCategory: 'construction', documentType: 'aadhar', documentNumber: '123401000001', location: 'Uppala' },

    // Farming workers
    { name: 'Rameshan Nair',       email: 'rameshan.farm@worker.com', phone: '+91-8635101313', pincode: '671317', skills: ['Crop Cultivation','Harvesting','Irrigation Management','Coconut Climbing'], experience: '15 years', workCategory: 'farming',    documentType: 'aadhar', documentNumber: '234501100013', location: 'Nileshwar' },
    { name: 'Sasi Kumar',          email: 'sasi.farm@worker.com',     phone: '+91-8534101414', pincode: '671321', skills: ['Paddy Farming','Vegetable Farming','Land Preparation','Pest Control'], experience: '12 years', workCategory: 'farming',    documentType: 'aadhar', documentNumber: '345601200024', location: 'Uppala' },
    { name: 'Prakashan V',         email: 'prakashan.farm@worker.com',phone: '+91-8433101515', pincode: '671311', skills: ['Organic Farming','Drip Irrigation Setup','Poultry Management','Arecanut Farming'], experience: '8 years',  workCategory: 'farming',    documentType: 'aadhar', documentNumber: '456701300035', location: 'Kanhangad' },

    // Catering workers (workCategory: 'event_management')
    { name: 'Suma Devi',           email: 'suma.cater@worker.com',    phone: '+91-8332101616', pincode: '671531', skills: ['Catering','Cooking','Food Preparation','Food Safety & Hygiene'], experience: '6 years',  workCategory: 'event_management', documentType: 'aadhar', documentNumber: '567801400046', location: 'Manjeshwar' },
    { name: 'Rekha Menon',         email: 'rekha.cater@worker.com',   phone: '+91-8231101717', pincode: '671121', skills: ['Event Catering','Snack Preparation','Tea & Coffee Service','Kitchen Management'], experience: '4 years',  workCategory: 'event_management', documentType: 'aadhar', documentNumber: '678901500057', location: 'Kasaragod Town' },

    // Salesman workers (workCategory: 'local_workers')
    { name: 'Ajas KM',             email: 'ajas.sales@worker.com',    phone: '+91-8130101818', pincode: '671121', skills: ['Sales','Customer Handling','Product Demonstration','Target Achievement'], experience: '3 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '789001600068', location: 'Kasaragod Town' },
    { name: 'Nidhin Raj',          email: 'nidhin.sales@worker.com',  phone: '+91-8029101919', pincode: '671316', skills: ['Retail Sales','Cold Calling','Door-to-Door Sales','Billing & Invoicing'], experience: '2 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '890101700079', location: 'Kanhangad' },
  ];

  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    await Users.create({
      ...w,
      password: hashPwd('worker@123'),
      userType: 'worker',
      isActive: true,
      profileCompleted: true,
      accountApproved: true,
      documentApproved: true,
      isVisible: true,
      city: w.location || 'Kasaragod',
      state: 'Kerala',
      address: `${w.location}, Kasaragod District, Kerala`,
      languages: ['Malayalam', 'English'],
      about: `Experienced ${w.workCategory} professional with ${w.experience} of hands-on work in Kasaragod region.`,
      availability: i % 3 === 0 ? 'Immediate' : i % 3 === 1 ? 'In 1 week' : 'Flexible',
      createdAt: ago(60 - i * 2)
    });
  }

  // ── Employers ──────────────────────────────────────────────────────────────
  // Each employer posts jobs strictly under their category.
  // Password for all employers: employer@123
  const employers = [
    // empIds[0] – Electrical
    {
      name: 'Sreenivas Menon',
      email: 'sreenivas@kiraelectricals.com',
      phone: '+91-9847200101',
      companyName: 'Kira Electricals Kasaragod',
      organizationName: 'Kira Electricals',
      category: 'electrical',
      pincode: '671311',
      location: 'Kanhangad',
      documentType: 'pan',
      documentNumber: 'SRNNM1001E',
      aadharNumber: '100200300400',
      isGroupHiringEmployer: true,
    },
    // empIds[1] – Electrical (AC focused)
    {
      name: 'Anwar Hussain',
      email: 'anwar@coolzoneac.com',
      phone: '+91-9747200202',
      companyName: 'CoolZone AC Services',
      organizationName: 'CoolZone AC Services',
      category: 'electrical',
      pincode: '671124',
      location: 'Kasaragod Town',
      documentType: 'pan',
      documentNumber: 'ANWRH2002F',
      aadharNumber: '200300400500',
      isGroupHiringEmployer: true,
    },
    // empIds[2] – Construction
    {
      name: 'Mujeeb Rahman',
      email: 'mujeeb@northernbuilders.com',
      phone: '+91-9645200303',
      companyName: 'Northern Kerala Builders',
      organizationName: 'Northern Kerala Builders',
      category: 'construction',
      pincode: '671121',
      location: 'Kasaragod Town',
      documentType: 'pan',
      documentNumber: 'MUJBR3003G',
      aadharNumber: '300400500600',
      isGroupHiringEmployer: true,
    },
    // empIds[3] – Construction
    {
      name: 'Suresh Babu',
      email: 'suresh@bekalconstruct.com',
      phone: '+91-9544200404',
      companyName: 'Bekal Construction Works',
      organizationName: 'Bekal Construction',
      category: 'construction',
      pincode: '671316',
      location: 'Kanhangad',
      documentType: 'pan',
      documentNumber: 'SRSHB4004H',
      aadharNumber: '400500600700',
      isGroupHiringEmployer: false,
    },
    // empIds[4] – Plumbing
    {
      name: 'Reji Varghese',
      email: 'reji@kasaragodplumbing.com',
      phone: '+91-9443200505',
      companyName: 'Kasaragod Plumbing Solutions',
      organizationName: 'Kasaragod Plumbing',
      category: 'plumbing',
      pincode: '671121',
      location: 'Kasaragod Town',
      documentType: 'pan',
      documentNumber: 'RJIVG5005I',
      aadharNumber: '500600700800',
      isGroupHiringEmployer: false,
    },
    // empIds[5] – Farming
    {
      name: 'Abdul Latheef',
      email: 'abdul@greenvalleyfarms.com',
      phone: '+91-9342200606',
      companyName: 'Green Valley Agro Farms',
      organizationName: 'Green Valley Farms',
      category: 'farming',
      pincode: '671317',
      location: 'Nileshwar',
      documentType: 'pan',
      documentNumber: 'ABDLL6006J',
      aadharNumber: '600700800900',
      isGroupHiringEmployer: true,
    },
    // empIds[6] – Events (Catering)
    {
      name: 'Bindu Rajesh',
      email: 'bindu@spicecoastcatering.com',
      phone: '+91-9241200707',
      companyName: 'Spice Coast Catering Services',
      organizationName: 'Spice Coast Catering',
      category: 'event_management',
      pincode: '671531',
      location: 'Manjeshwar',
      documentType: 'pan',
      documentNumber: 'BNDUR7007K',
      aadharNumber: '700800901000',
      isGroupHiringEmployer: true,
    },
    // empIds[7] – Local Workers (Sales & General)
    {
      name: 'Ramesh Pai',
      email: 'ramesh@coastalsales.com',
      phone: '+91-9140200808',
      companyName: 'Coastal Sales & Marketing',
      organizationName: 'Coastal Sales',
      category: 'local_workers',
      pincode: '671321',
      location: 'Uppala',
      documentType: 'pan',
      documentNumber: 'RMSHP8008L',
      aadharNumber: '800901001100',
      isGroupHiringEmployer: false,
    },
    // empIds[8] – Farming
    {
      name: 'Krishnan Kutty',
      email: 'krishnan@malabaragroworks.com',
      phone: '+91-9039200909',
      companyName: 'Malabar Agro Works',
      organizationName: 'Malabar Agro Works',
      category: 'farming',
      pincode: '671321',
      location: 'Uppala',
      documentType: 'pan',
      documentNumber: 'KRSHK9009M',
      aadharNumber: '901001101200',
      isGroupHiringEmployer: true,
    },
    // empIds[9] – Electrical (Maintenance)
    {
      name: 'Joice Mathew',
      email: 'joice@nileshwarelectro.com',
      phone: '+91-8938201010',
      companyName: 'Nileshwar Electro Works',
      organizationName: 'Nileshwar Electro',
      category: 'electrical',
      pincode: '671317',
      location: 'Nileshwar',
      documentType: 'pan',
      documentNumber: 'JCMTW1010N',
      aadharNumber: '001101201300',
      isGroupHiringEmployer: false,
    },
  ];

  const empIds = await Promise.all(employers.map(async (e, i) => {
    const created = await Users.create({
      ...e,
      password: hashPwd('employer@123'),
      userType: 'employer',
      isActive: true,
      profileCompleted: true,
      accountApproved: true,
      documentApproved: true,
      city: e.location,
      state: 'Kerala',
      address: `${e.location}, Kasaragod District, Kerala`,
      about: `${e.companyName} – a trusted employer based in ${e.location}, Kasaragod.`,
      createdAt: ago(80 - i * 3)
    });
    return created._id;
  }));

  // ── Jobs ───────────────────────────────────────────────────────────────────
  // RULE: Each job's workCategory MUST exactly match the employer's category.
  // empIds[0] = Kira Electricals (electrical)
  // empIds[1] = CoolZone AC Services (electrical)
  // empIds[2] = Northern Kerala Builders (construction)
  // empIds[3] = Bekal Construction Works (construction)
  // empIds[4] = Kasaragod Plumbing Solutions (plumbing)
  // empIds[5] = Green Valley Agro Farms (farming)
  // empIds[6] = Spice Coast Catering (event_management)
  // empIds[7] = Coastal Sales & Marketing (local_workers → salesman goes to other)
  // empIds[8] = Malabar Agro Works (farming)
  // empIds[9] = Nileshwar Electro Works (electrical)
  //
  // SALARY RULES:
  //   electrical / AC / plumbing  → dailyWages only
  //   construction / painting     → dailyWages only
  //   catering / farming / loading-delivery → dailyWages + salary (monthly)
  //   salesman                    → salary only

  // ── ELECTRICAL JOBS ──────────────────────────────────────────────────────────
  await Jobs.create({
    employer: empIds[0],
    title: 'Electrical House Wiring Technician',
    company: 'Kira Electricals Kasaragod',
    location: 'Kanhangad',
    workCategory: 'electrical',
    jobType: 'full-time',
    workersNeeded: 4,
    vacancies: 4,
    dailyWages: '₹800 – ₹1,200/day',
    description: 'We are looking for skilled electrical house wiring technicians for residential and commercial wiring projects across Kasaragod district. Work involves switchboard installation, MCB panel fitting, fan and light wiring, and earthing. Candidates must have prior experience in house wiring and basic electrical safety.',
    skills: ['Electrical Wiring', 'Switchboard Installation', 'Fan & Light Fitting', 'MCB Wiring', 'Earthing Work'],
    pincode: '671311',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(7),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '6 months',
    createdAt: ago(3),
    postedAt: ago(3)
  });

  await Jobs.create({
    employer: empIds[0],
    title: 'Electrical Maintenance Worker',
    company: 'Kira Electricals Kasaragod',
    location: 'Kanhangad',
    workCategory: 'electrical',
    jobType: 'full-time',
    workersNeeded: 2,
    vacancies: 2,
    dailyWages: '₹700 – ₹1,000/day',
    description: 'Electrical maintenance worker needed for ongoing industrial and residential maintenance contracts in Kanhangad and surrounding areas. Duties include fault detection, cable laying, inverter servicing, and panel maintenance. Immediate joiners preferred.',
    skills: ['Electrical Maintenance', 'Cable Laying', 'Fault Detection', 'Inverter Work', 'Panel Maintenance'],
    pincode: '671311',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(5),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '1 year',
    createdAt: ago(5),
    postedAt: ago(5)
  });

  // ── AC TECHNICIAN JOBS ────────────────────────────────────────────────────────
  await Jobs.create({
    employer: empIds[1],
    title: 'AC Technician – Installation & Service',
    company: 'CoolZone AC Services',
    location: 'Kasaragod Town',
    workCategory: 'electrical',
    jobType: 'full-time',
    workersNeeded: 3,
    vacancies: 3,
    dailyWages: '₹900 – ₹1,400/day',
    description: 'Experienced AC technicians required for split AC installation, gas charging, and servicing across Kasaragod district. Candidates must have knowledge of refrigeration, copper pipe flaring, and electrical wiring of AC units. Service vehicle provided for field visits.',
    skills: ['AC Installation', 'AC Repair', 'Gas Charging', 'Refrigeration', 'Copper Pipe Work'],
    pincode: '671124',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(4),
    workDays: 'Monday to Saturday',
    workHoursFrom: '09:00',
    workHoursTo: '18:00',
    contractDuration: '1 year',
    createdAt: ago(2),
    postedAt: ago(2)
  });

  await Jobs.create({
    employer: empIds[1],
    title: 'AC Repair & HVAC Maintenance Technician',
    company: 'CoolZone AC Services',
    location: 'Kasaragod Town',
    workCategory: 'electrical',
    jobType: 'full-time',
    workersNeeded: 2,
    vacancies: 2,
    dailyWages: '₹800 – ₹1,200/day',
    description: 'AC repair and HVAC maintenance technicians needed for commercial service contracts with offices, hotels and showrooms in Kasaragod. Work includes preventive maintenance, AC service, fault diagnosis and gas refilling. Two-wheeler mandatory.',
    skills: ['AC Service', 'HVAC Maintenance', 'Fault Diagnosis', 'Gas Refilling', 'Electrical Knowledge'],
    pincode: '671124',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(10),
    workDays: 'Monday to Saturday',
    workHoursFrom: '09:00',
    workHoursTo: '18:00',
    contractDuration: '6 months',
    createdAt: ago(6),
    postedAt: ago(6)
  });

  await Jobs.create({
    employer: empIds[9],
    title: 'Electrician – House Wiring & Panel Work',
    company: 'Nileshwar Electro Works',
    location: 'Nileshwar',
    workCategory: 'electrical',
    jobType: 'full-time',
    workersNeeded: 3,
    vacancies: 3,
    dailyWages: '₹750 – ₹1,100/day',
    description: 'Electricians required for new residential construction wiring in Nileshwar and Manjeshwar areas. Experience in house wiring, ELCB installation, fan and light fitting, and switchboard wiring is essential.',
    skills: ['House Wiring', 'ELCB Installation', 'Switchboard Work', 'Fan & Light Fitting', 'UPS Installation'],
    pincode: '671317',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(6),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '8 months',
    createdAt: ago(4),
    postedAt: ago(4)
  });

  // ── CONSTRUCTION JOBS (group hiring, dailyWages only) ─────────────────────────
  await Jobs.create({
    employer: empIds[2],
    title: 'Construction Site Mason',
    company: 'Northern Kerala Builders',
    location: 'Kasaragod Town',
    workCategory: 'construction',
    jobType: 'full-time',
    workersNeeded: 8,
    vacancies: 8,
    dailyWages: '₹700 – ₹1,000/day',
    description: 'Experienced masons and bricklayers needed for a large residential apartment construction project in Kasaragod Town. Work includes bricklaying, plastering, concreting, and column construction. Group applications welcome. PPE and safety equipment will be provided on site.',
    skills: ['Masonry', 'Bricklaying', 'Plastering', 'Concreting', 'Column Construction'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 8,
    startDate: fwd(10),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '1 year',
    createdAt: ago(1),
    postedAt: ago(1)
  });

  await Jobs.create({
    employer: empIds[2],
    title: 'Building Construction Worker – General Labour',
    company: 'Northern Kerala Builders',
    location: 'Kasaragod Town',
    workCategory: 'construction',
    jobType: 'full-time',
    workersNeeded: 12,
    vacancies: 12,
    dailyWages: '₹600 – ₹850/day',
    description: 'General construction labourers required for foundation and structure work at our ongoing apartment project in Kasaragod Town. Duties include concrete mixing, material carrying, shuttering support, and digging. Meals provided on site. Group hiring encouraged.',
    skills: ['Concrete Mixing', 'Shuttering', 'Material Handling', 'Site Work', 'Bar Bending'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 12,
    startDate: fwd(8),
    workDays: 'Monday to Saturday',
    workHoursFrom: '07:30',
    workHoursTo: '17:30',
    contractDuration: '1 year',
    createdAt: ago(3),
    postedAt: ago(3)
  });

  await Jobs.create({
    employer: empIds[3],
    title: 'Tiling & Flooring Specialist',
    company: 'Bekal Construction Works',
    location: 'Kanhangad',
    workCategory: 'construction',
    jobType: 'full-time',
    workersNeeded: 5,
    vacancies: 5,
    dailyWages: '₹750 – ₹1,050/day',
    description: 'Skilled tiling and flooring workers needed for villa and commercial construction projects in Kanhangad. Work includes vitrified tile laying, granite fixing, waterproofing, and surface levelling. Experience in luxury bathroom finishing is an added advantage.',
    skills: ['Tiling', 'Flooring', 'Granite Work', 'Waterproofing', 'Surface Levelling'],
    pincode: '671316',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 5,
    startDate: fwd(5),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '6 months',
    createdAt: ago(3),
    postedAt: ago(3)
  });

  await Jobs.create({
    employer: empIds[3],
    title: 'Painting & Wall Finishing Worker',
    company: 'Bekal Construction Works',
    location: 'Kanhangad',
    workCategory: 'construction',
    jobType: 'contract',
    workersNeeded: 4,
    vacancies: 4,
    dailyWages: '₹650 – ₹950/day',
    description: 'Painters and wall finishing experts required for renovation and new construction projects in Kanhangad and Bekal area. Work involves interior and exterior painting, wall putty application, spray painting, and texture finishing. Accommodation can be arranged for outstation candidates.',
    skills: ['Painting', 'Wall Putty', 'Spray Painting', 'Texture Finishing', 'Surface Preparation'],
    pincode: '671316',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 4,
    startDate: fwd(3),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '16:00',
    contractDuration: '3 months',
    createdAt: ago(2),
    postedAt: ago(2)
  });

  // ── PLUMBING JOBS (dailyWages only) ──────────────────────────────────────────
  await Jobs.create({
    employer: empIds[4],
    title: 'Plumber – Residential Installation',
    company: 'Kasaragod Plumbing Solutions',
    location: 'Kasaragod Town',
    workCategory: 'plumbing',
    jobType: 'full-time',
    workersNeeded: 3,
    vacancies: 3,
    dailyWages: '₹750 – ₹1,100/day',
    description: 'Experienced plumbers required for new residential projects across Kasaragod. Work includes bathroom fixture installation, water supply pipe laying, overhead tank connections, PVC and CPVC pipe fitting, and leak repairs. Immediate joiners preferred.',
    skills: ['Pipe Fitting', 'Bathroom Fitting', 'Water Tank Installation', 'Leak Repair', 'PVC Pipe Work'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(7),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '1 year',
    createdAt: ago(4),
    postedAt: ago(4)
  });

  await Jobs.create({
    employer: empIds[4],
    title: 'Senior Plumber – Commercial & Industrial',
    company: 'Kasaragod Plumbing Solutions',
    location: 'Kasaragod Town',
    workCategory: 'plumbing',
    jobType: 'full-time',
    workersNeeded: 2,
    vacancies: 2,
    dailyWages: '₹950 – ₹1,400/day',
    description: 'Senior plumber with experience in commercial plumbing projects, solar water heater systems, pump installation, and sewage line design. Must be capable of reading basic plumbing drawings and handling multi-floor water supply systems.',
    skills: ['Plumbing Design', 'Pump Installation', 'Solar Water Heater', 'Sewage Repair', 'Gas Fitting'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(10),
    workDays: 'Monday to Friday',
    workHoursFrom: '09:00',
    workHoursTo: '18:00',
    contractDuration: '1 year',
    createdAt: ago(6),
    postedAt: ago(6)
  });

  await Jobs.create({
    employer: empIds[4],
    title: 'Drain & Sewage Plumber',
    company: 'Kasaragod Plumbing Solutions',
    location: 'Kasaragod Town',
    workCategory: 'plumbing',
    jobType: 'full-time',
    workersNeeded: 2,
    vacancies: 2,
    dailyWages: '₹650 – ₹900/day',
    description: 'Drain and sewage plumbers needed for residential and commercial drain cleaning, sewage line repair, and drainage fitting work. Experience with jetting machines and drainage line excavation is a plus.',
    skills: ['Drain Cleaning', 'Sewage Repair', 'Drainage Fitting', 'Pipe Excavation', 'Water Supply'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(5),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '6 months',
    createdAt: ago(2),
    postedAt: ago(2)
  });

  // ── FARMING JOBS (dailyWages + salary, group hiring for coconut farm) ─────────
  await Jobs.create({
    employer: empIds[5],
    title: 'Farm Worker – Paddy & Vegetable Cultivation',
    company: 'Green Valley Agro Farms',
    location: 'Nileshwar',
    workCategory: 'farming',
    jobType: 'seasonal',
    workersNeeded: 10,
    vacancies: 10,
    dailyWages: '₹450 – ₹650/day',
    salary: '₹12,000 – ₹17,000/month',
    description: 'Farm workers needed for paddy cultivation, vegetable farming, and general field work at our Nileshwar farmlands. Work includes seed sowing, irrigation, weeding, and harvesting. Accommodation provided for outstation workers. Group hiring available.',
    skills: ['Paddy Cultivation', 'Vegetable Farming', 'Harvesting', 'Irrigation Management', 'Land Preparation'],
    pincode: '671317',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 10,
    startDate: fwd(5),
    workDays: 'Monday to Saturday',
    workHoursFrom: '07:00',
    workHoursTo: '14:00',
    contractDuration: '4 months',
    createdAt: ago(2),
    postedAt: ago(2)
  });

  await Jobs.create({
    employer: empIds[5],
    title: 'Organic Farm Supervisor',
    company: 'Green Valley Agro Farms',
    location: 'Nileshwar',
    workCategory: 'farming',
    jobType: 'full-time',
    workersNeeded: 1,
    vacancies: 1,
    dailyWages: '₹900 – ₹1,200/day',
    salary: '₹22,000 – ₹28,000/month',
    description: 'Experienced organic farming supervisor required to oversee crop cycles, drip irrigation, pest control and day-to-day farm operations at our certified organic farm in Nileshwar. Candidates with knowledge of soil testing and organic certification process preferred.',
    skills: ['Organic Farming', 'Irrigation Management', 'Pest Control', 'Soil Testing', 'Farm Management'],
    pincode: '671317',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(14),
    workDays: 'Monday to Saturday',
    workHoursFrom: '07:00',
    workHoursTo: '16:00',
    contractDuration: '1 year',
    createdAt: ago(7),
    postedAt: ago(7)
  });

  await Jobs.create({
    employer: empIds[8],
    title: 'Coconut & Arecanut Farm Worker',
    company: 'Malabar Agro Works',
    location: 'Uppala',
    workCategory: 'farming',
    jobType: 'full-time',
    workersNeeded: 8,
    vacancies: 8,
    dailyWages: '₹500 – ₹750/day',
    salary: '₹13,000 – ₹18,000/month',
    description: 'Farm workers required for coconut climbing, arecanut harvesting, drip irrigation maintenance and general agricultural labour at our Uppala farms. Workers experienced in coconut and arecanut plantation preferred. Group apply available.',
    skills: ['Coconut Climbing', 'Harvesting', 'Drip Irrigation Setup', 'Agricultural Labour', 'Crop Cultivation'],
    pincode: '671321',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 8,
    startDate: fwd(3),
    workDays: 'Monday to Saturday',
    workHoursFrom: '07:30',
    workHoursTo: '16:00',
    contractDuration: '6 months',
    createdAt: ago(1),
    postedAt: ago(1)
  });

  await Jobs.create({
    employer: empIds[8],
    title: 'Poultry & Livestock Farm Worker',
    company: 'Malabar Agro Works',
    location: 'Uppala',
    workCategory: 'farming',
    jobType: 'full-time',
    workersNeeded: 3,
    vacancies: 3,
    dailyWages: '₹400 – ₹600/day',
    salary: '₹11,000 – ₹15,000/month',
    description: 'Poultry and livestock farm workers needed for day-to-day feeding, cleaning, health monitoring, and record keeping at our Uppala farm. Accommodation and meals provided. Prior experience in poultry or cattle management is preferred.',
    skills: ['Poultry Management', 'Livestock Care', 'Farm Hygiene', 'Animal Feeding', 'Record Keeping'],
    pincode: '671321',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(6),
    workDays: 'All days (rotating shifts)',
    workHoursFrom: '06:00',
    workHoursTo: '14:00',
    contractDuration: '1 year',
    createdAt: ago(4),
    postedAt: ago(4)
  });

  // ── CATERING JOBS (group hiring, dailyWages + salary) ─────────────────────────
  await Jobs.create({
    employer: empIds[6],
    title: 'Catering Cook – Wedding & Event Functions',
    company: 'Spice Coast Catering Services',
    location: 'Manjeshwar',
    workCategory: 'event_management',
    jobType: 'part-time',
    workersNeeded: 6,
    vacancies: 6,
    dailyWages: '₹550 – ₹800/day',
    salary: '₹12,000 – ₹18,000/month',
    description: 'Experienced cooks required for wedding, birthday, and corporate event catering across Kasaragod district. Must be skilled in Kerala sadya, biriyani, and multi-cuisine cooking. Events mainly on weekends and holidays. Uniform and meals provided. Group applications welcome.',
    skills: ['Catering', 'Cooking', 'Kerala Cuisine', 'Food Safety & Hygiene', 'Food Preparation'],
    pincode: '671531',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 6,
    startDate: fwd(2),
    workDays: 'Weekends + Event Days',
    workHoursFrom: '05:30',
    workHoursTo: '22:00',
    contractDuration: '6 months',
    createdAt: ago(1),
    postedAt: ago(1)
  });

  await Jobs.create({
    employer: empIds[6],
    title: 'Catering Helper & Kitchen Assistant',
    company: 'Spice Coast Catering Services',
    location: 'Manjeshwar',
    workCategory: 'event_management',
    jobType: 'full-time',
    workersNeeded: 5,
    vacancies: 5,
    dailyWages: '₹380 – ₹550/day',
    salary: '₹9,000 – ₹13,000/month',
    description: 'Catering helpers and kitchen assistants needed for our growing catering operations in Kasaragod. Work includes food serving, vessel cleaning, kitchen setup and breakdown, tea and coffee service. No prior experience needed; training provided.',
    skills: ['Food Serving', 'Kitchen Management', 'Tea & Coffee Service', 'Cleaning', 'Event Setup'],
    pincode: '671531',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 5,
    startDate: fwd(5),
    workDays: 'All days (event-based)',
    workHoursFrom: '07:00',
    workHoursTo: '20:00',
    contractDuration: '1 year',
    createdAt: ago(3),
    postedAt: ago(3)
  });

  // ── SALESMAN JOBS (category: other, salary only) ───────────────────────────────
  await Jobs.create({
    employer: empIds[7],
    title: 'Salesman – Building Materials & Hardware',
    company: 'Coastal Sales & Marketing',
    location: 'Uppala',
    workCategory: 'other',
    jobType: 'full-time',
    workersNeeded: 4,
    vacancies: 4,
    salary: '₹12,000 – ₹18,000/month + Incentives',
    description: 'Field salesmen required to visit retail shops, construction sites, and contractors to promote and sell building materials, hardware, and sanitary products. Target-based monthly incentives available. Two-wheeler with valid licence is mandatory. Fuel allowance provided.',
    skills: ['Sales', 'Customer Handling', 'Product Demonstration', 'Target Achievement', 'Field Sales'],
    pincode: '671321',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(4),
    workDays: 'Monday to Saturday',
    workHoursFrom: '09:00',
    workHoursTo: '18:00',
    contractDuration: '1 year',
    createdAt: ago(2),
    postedAt: ago(2)
  });

  await Jobs.create({
    employer: empIds[7],
    title: 'Retail Sales Executive',
    company: 'Coastal Sales & Marketing',
    location: 'Kasaragod Town',
    workCategory: 'other',
    jobType: 'full-time',
    workersNeeded: 3,
    vacancies: 3,
    salary: '₹10,000 – ₹15,000/month',
    description: 'Retail sales executives needed for our showroom and retail counters in Kasaragod Town. Duties include attending walk-in customers, product billing, stock management, and maintaining daily sales records. Good communication skills in Malayalam required.',
    skills: ['Retail Sales', 'Customer Service', 'Billing & Invoicing', 'Stock Management', 'Communication'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: false,
    groupHiring: false,
    startDate: fwd(7),
    workDays: 'Monday to Saturday',
    workHoursFrom: '09:30',
    workHoursTo: '18:30',
    contractDuration: '1 year',
    createdAt: ago(4),
    postedAt: ago(4)
  });

  // ── LOADING & DELIVERY (group hiring, dailyWages + salary) ────────────────────
  await Jobs.create({
    employer: empIds[7],
    title: 'General Helper – Loading & Delivery',
    company: 'Coastal Sales & Marketing',
    location: 'Kasaragod Town',
    workCategory: 'local_workers',
    jobType: 'full-time',
    workersNeeded: 5,
    vacancies: 5,
    dailyWages: '₹420 – ₹620/day',
    salary: '₹9,000 – ₹12,000/month',
    description: 'General helpers required for loading, unloading, and delivery of goods from our warehouse and retail outlets across Kasaragod. Duties include packing, labelling, and making local deliveries. No experience required. Immediate joiners preferred. Group hiring available.',
    skills: ['Loading & Unloading', 'Delivery', 'Packing', 'Warehouse Work', 'Material Handling'],
    pincode: '671121',
    status: 'active',
    adminApproved: true,
    allowGroupApply: true,
    groupHiring: true,
    maxGroupSize: 5,
    startDate: fwd(3),
    workDays: 'Monday to Saturday',
    workHoursFrom: '08:00',
    workHoursTo: '17:00',
    contractDuration: '6 months',
    createdAt: ago(1),
    postedAt: ago(1)
  });


    console.log('✅ Fresh seed data created successfully!');
  console.log('   Categories seeded: electrical (AC Technician + Wiring), construction, plumbing, farming, event_management (catering), local_workers (salesman + delivery)');
  console.log('   Worker login: <email> / worker@123');
  console.log('   Employer login: <email> / employer@123');
  console.log('   Admin login: admin@agroskill.com / admin123');
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  setCORS(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url.split('?')[0];
  const method = req.method;

  try {
    // ─── Auth Routes ───────────────────────────────────────────────────────
    // ─── Deactivation Guard ──────────────────────────────────────────────────
    // Runs before every protected route. If a valid token belongs to a
    // deactivated user, return a clear message instead of a generic error.
    const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/auth/send-otp', '/api/auth/verify-otp', '/api/auth/reset-password'];
    if (!PUBLIC_ROUTES.some(r => url.startsWith(r))) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (decoded) {
          const tokenUser = await Users.findById(decoded.id);
          if (tokenUser && !tokenUser.isActive) {
            return send(res, { error: 'Your account has been deactivated. Please contact the admin for assistance.', deactivated: true }, 403);
          }
        }
      }
    }

    if (url === '/api/auth/send-otp' && method === 'POST') {
      const { email, type } = await body(req);
      if (!email || !type) return send(res, { error: 'Email and type required' }, 400);

      // For password reset, verify the account exists before sending OTP
      if (type === 'reset') {
        const existingUser = await Users.findOne({ email: email.toLowerCase() });
        if (!existingUser) {
          return send(res, { error: 'No account found with this email address.' }, 404);
        }
      }

      const otp = genOTP();
      storeOTP(email, otp, type);
      
      try {
        await sendOTPEmail(email, otp, type);
        return send(res, { message: 'OTP sent successfully to your email' });
      } catch (error) {
        console.error('Email send error:', error);
        OtpStore.delete(email.toLowerCase());
        return send(res, { error: 'Failed to send OTP email. Please try again.' }, 500);
      }
    }

    if (url === '/api/auth/verify-otp' && method === 'POST') {
      const { email, otp, type } = await body(req);
      const result = checkOTP(email, otp, type);
      if (result.ok) {
        return send(res, { message: 'OTP verified successfully' });
      } else {
        return send(res, { error: result.msg }, 400);
      }
    }

    if (url === '/api/auth/register' && method === 'POST') {
      try {
        const data = await body(req);
        const { email, password, name, userType, roles: incomingRoles, phone, documentType, documentNumber, documentImage } = data;

        if (!email || !password || !name || !userType) {
          return send(res, { error: 'Missing required fields' }, 400);
        }

        if (!isVerified(email, 'register')) {
          return send(res, { error: 'Email not verified' }, 400);
        }

        if (await Users.findOne({ email: email.toLowerCase() })) {
          return send(res, { error: 'Email already registered' }, 400);
        }

        // Validate document if provided
        if (documentType && documentNumber) {
          const validator = DOCUMENT_VALIDATORS[documentType.toLowerCase()];
          if (validator && !validator(documentNumber)) {
            return send(res, { error: `Invalid ${documentType} number format` }, 400);
          }
        }

        // Handle multiple roles - support both incoming roles array and single userType
        let rolesArray = [userType];
        if (incomingRoles && Array.isArray(incomingRoles) && incomingRoles.length > 0) {
          // Filter and deduplicate roles
          rolesArray = [...new Set(incomingRoles.filter(r => ['worker', 'employer', 'admin'].includes(r)))];
        }
        
        // Ensure primary userType is in roles array
        if (!rolesArray.includes(userType)) {
          rolesArray.unshift(userType);
        }

        // Create user with all provided data
        const user = await Users.create({
          ...data,
          documentType: data.documentType ? data.documentType.toLowerCase() : null,
          email: email.toLowerCase(),
          password: hashPwd(password),
          userType: userType,
          roles: rolesArray,
          isActive: true,
          profileCompleted: !!phone,
          accountApproved: false,
          documentApproved: false,
          documentImage: documentImage || null,
          createdAt: new Date().toISOString()
        });

        if (!user || !user._id) {
          return send(res, { error: 'Failed to create user account' }, 500);
        }

        OtpStore.delete(email.toLowerCase());
        const token = signToken(user._id);
        const { password: _, ...safeUser } = user;
        
        return send(res, { user: safeUser, token, success: true, userRoles: rolesArray });
      } catch (regError) {
        console.error('Registration error:', regError);
        return send(res, { error: 'Registration failed: ' + regError.message }, 500);
      }
    }

    if (url === '/api/auth/fix-dual-role' && method === 'POST') {
      try {
        const data = await body(req);
        const { email, fixRole } = data;

        if (!email) {
          return send(res, { error: 'Email is required' }, 400);
        }

        const user = await Users.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          return send(res, { error: 'User not found' }, 404);
        }

        const currentRoles = user.roles && Array.isArray(user.roles) ? user.roles : [user.userType];
        
        let newRoles = [];
        if (fixRole === 'both') {
          newRoles = ['worker', 'employer'];
        } else if (fixRole === 'worker' && !currentRoles.includes('worker')) {
          newRoles = [...currentRoles, 'worker'];
        } else if (fixRole === 'employer' && !currentRoles.includes('employer')) {
          newRoles = [...currentRoles, 'employer'];
        } else {
          return send(res, { error: 'Role already exists or invalid' }, 400);
        }

        const updated = await Users.update(user._id, {
          roles: [...new Set(newRoles)]
        });

        if (!updated) {
          return send(res, { error: 'Failed to update roles' }, 500);
        }

        const { password: _, ...safeUser } = updated;
        return send(res, { 
          user: safeUser, 
          success: true, 
          message: 'Roles updated successfully',
          oldRoles: currentRoles,
          newRoles: updated.roles
        });

      } catch (err) {
        console.error('Fix dual role error:', err);
        return send(res, { error: 'Failed to fix roles: ' + err.message }, 500);
      }
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const { email, password } = await body(req);
      const user = await Users.findOne({ email: email.toLowerCase() });

      if (!user || !checkPwd(password, user.password)) {
        await LoginFailures.create({ email, timestamp: new Date().toISOString(), reason: 'Invalid credentials' });
        return send(res, { error: 'Invalid email or password' }, 401);
      }

      if (!user.isActive) {
        return send(res, { error: 'Account is inactive. Please contact admin.' }, 403);
      }

      const token = signToken(user._id);
      const { password: _, ...safeUser } = user;
      
      // CRITICAL: Handle roles properly - ensure it's an array
      const userRoles = user.roles && Array.isArray(user.roles) && user.roles.length > 0 
        ? user.roles 
        : [user.userType];
      
      console.log('🔐 LOGIN DEBUG:', {
        email: email,
        userRoles: userRoles,
        userType: user.userType,
        rolesCount: userRoles.length,
        showPopup: userRoles.length > 1
      });
      
      return send(res, { 
        user: safeUser, 
        token, 
        userRoles: userRoles,
        rolesCount: userRoles.length
      });
    }

    // Add a second role to an existing account
    if (url === '/api/auth/add-role' && method === 'POST') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const data = await body(req);
      const newRole = data.userType;

      if (!newRole || !['worker', 'employer'].includes(newRole)) {
        return send(res, { error: 'Invalid role' }, 400);
      }

      const currentRoles = user.roles && user.roles.length > 0 ? user.roles : [user.userType];
      if (currentRoles.includes(newRole)) {
        return send(res, { error: 'You already have this role' }, 400);
      }

      const updatedRoles = [...currentRoles, newRole];
      // IMPORTANT: Destructure out userType so we never overwrite the primary role in DB.
      // Previously { ...data } included userType: secondRole which flipped the stored userType,
      // causing the employer dashboard (or worker dashboard) to return 403 after dual-role signup.
      const { userType: _roleIgnored, ...additionalProfileData } = data;
      const updated = await Users.update(user._id, { ...additionalProfileData, roles: updatedRoles });
      const { password: _, ...safeUser } = updated;
      return send(res, { user: safeUser, userRoles: updatedRoles });
    }

    if (url === '/api/auth/me' && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);
      const { password, ...safeUser } = user;
      return send(res, { user: safeUser });
    }

    if (url === '/api/auth/reset-password' && method === 'POST') {
      const { email, otp, newPassword } = await body(req);
      
      if (!email || !otp || !newPassword) {
        return send(res, { error: 'Missing email, OTP, or password' }, 400);
      }

      if (!isVerified(email, 'reset')) {
        return send(res, { error: 'OTP not verified or expired. Please verify OTP again.' }, 400);
      }

      const user = await Users.findOne({ email: email.toLowerCase() });
      if (!user) return send(res, { error: 'User not found' }, 404);

      const hashedPassword = hashPwd(newPassword);
      const updated = await Users.update(user._id, { password: hashedPassword });
      
      if (!updated) {
        return send(res, { error: 'Failed to update password. Please try again.' }, 500);
      }

      OtpStore.delete(email.toLowerCase());
      return send(res, { message: 'Password reset successful' });
    }

    // ─── User Profile Routes ───────────────────────────────────────────────
    if (url === '/api/user/profile' && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);
      return send(res, user);
    }

    if (url === '/api/user/profile' && method === 'PUT') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const updates = await body(req);
      delete updates.password;
      delete updates.email;
      delete updates.userType;
      delete updates._id;

      const updated = await Users.update(user._id, { ...updates, profileCompleted: true });
      const { password: _, ...safeUser } = updated;
      
      return send(res, safeUser);
    }

    // Get worker/employer profile for viewing
    if (param('/api/user/profile/:userId', url) && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const { userId } = param('/api/user/profile/:userId', url);
      const targetUser = await Users.findById(userId);
      
      if (!targetUser) return send(res, { error: 'User not found' }, 404);

      // Remove sensitive data
      const { password, documentImage, documentNumber, ...safeProfile } = targetUser;
      return send(res, safeProfile);
    }

    // ─── Jobs Routes ───────────────────────────────────────────────────────
    if (url === '/api/jobs' && method === 'GET') {
      const user = await getUser(req);
      const query = parseQS(req.url);

      // Workers see only admin-approved active jobs
      if (!user || user.userType === 'worker') {
        const jobs = (await Promise.all((await Jobs.find({ status: 'active', adminApproved: true })).map(withEmployer)))
          
          .sort((a, b) => new Date(b.postedAt || b.createdAt) - new Date(a.postedAt || a.createdAt));
        return send(res, jobs);
      }

      // Employers see their own jobs
      if (user.userType === 'employer') {
        const jobs = (await Jobs.find({ employer: user._id }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return send(res, jobs);
      }

      // Admins see all jobs
      if (user.userType === 'admin') {
        const jobs = (await Promise.all((await Jobs.find({})).map(withEmployer)))
          ;
        return send(res, jobs);
      }

      return send(res, []);
    }

    // My jobs for employers
    if (url === '/api/jobs/my' && method === 'GET') {
      const user = await getUser(req);
      if (!user || (user.userType !== 'employer' && !(user.roles && user.roles.includes('employer')))) {
        return send(res, { error: 'Only employers can access this' }, 403);
      }
      const jobs = (await Jobs.find({ employer: user._id }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return send(res, jobs);
    }

    // Recommended jobs for workers — STRICT category-only matching
    if (url === '/api/jobs/recommended' && method === 'GET') {
      const user = await getUser(req);
      const allActive = (await Promise.all((await Jobs.find({ status: 'active', adminApproved: true })).map(withEmployer)))
        .sort((a, b) => new Date(b.postedAt || b.createdAt) - new Date(a.postedAt || a.createdAt));

      if (user && user.workCategory) {
        const workerCategory = user.workCategory.toLowerCase().trim();

        const matched = allActive.filter(job =>
          (job.workCategory || '').toLowerCase().trim() === workerCategory
        );

        // Return only category-matched jobs
        return send(res, matched);
      }

      // No workCategory — return all active jobs
      return send(res, allActive);
    }

    if (url === '/api/jobs' && method === 'POST') {
      const user = await getUser(req);
      if (!user || (user.userType !== 'employer' && !(user.roles && user.roles.includes('employer')))) {
        return send(res, { error: 'Only employers can post jobs' }, 403);
      }

      if (!user.accountApproved) {
        return send(res, { error: 'Your account must be approved by admin before posting jobs' }, 403);
      }

      const jobData = await body(req);

      // ✅ FIX: Accept either `category` or `workCategory` from the frontend.
      // The seed/filter system uses `workCategory`; the form may send `category`.
      // Normalise both so queries like Jobs.find({ workCategory: '...' }) always hit.
      if (!jobData.workCategory && jobData.category) jobData.workCategory = jobData.category;
      if (!jobData.category && jobData.workCategory) jobData.category = jobData.workCategory;
      
      // Validate required fields
      if (!jobData.title || !jobData.category || !jobData.pincode || !jobData.address || !jobData.description) {
        return send(res, { error: 'Missing required fields: title, category, pincode, address, description' }, 400);
      }

      if (!jobData.skills || !Array.isArray(jobData.skills) || jobData.skills.length === 0) {
        return send(res, { error: 'At least one skill is required' }, 400);
      }

      if (!jobData.vacancies || parseInt(jobData.vacancies) < 1) {
        return send(res, { error: 'Vacancies must be at least 1' }, 400);
      }

      const job = await Jobs.create({
        ...jobData,
        vacancies: parseInt(jobData.vacancies),
        workersNeeded: parseInt(jobData.vacancies), // alias used in email templates
        maxApplications: jobData.maxApplications ? parseInt(jobData.maxApplications) : null,
        employer: user._id,
        status: 'pending', // Requires admin approval before going live
        adminApproved: false, // Admin must approve before job is visible to workers
        location: [jobData.address, jobData.city, jobData.state, jobData.pincode].filter(Boolean).join(', '),
        createdAt: new Date().toISOString(),
        postedAt: new Date().toISOString(),
        groupHiring: jobData.groupHiring || false,
        groupHiringDetails: jobData.groupHiringDetails || '',
        isHomeBased: jobData.isHomeBased || false,
        homeJobType: jobData.homeJobType || '',
        homeRooms: jobData.homeRooms || '',
        startDate: jobData.startDate || null,
        deadline: jobData.deadline || null,
      });

      return send(res, await withEmployer(job));
    }

    if (param('/api/jobs/:jobId', url) && method === 'GET') {
      const { jobId } = param('/api/jobs/:jobId', url);
      const job = await Jobs.findById(jobId);
      
      if (!job) return send(res, { error: 'Job not found' }, 404);

      const user = await getUser(req);
      
      // Workers can see any active job
      if (!user || user.userType === 'worker') {
        if (job.status !== 'active') {
          return send(res, { error: 'Job not found' }, 404);
        }
      }

      return send(res, await withEmployer(job));
    }

    if (param('/api/jobs/:jobId', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const { jobId } = param('/api/jobs/:jobId', url);
      const job = await Jobs.findById(jobId);
      
      if (!job) return send(res, { error: 'Job not found' }, 404);
      if (job.employer !== user._id && user.userType !== 'admin') {
        return send(res, { error: 'Not authorized' }, 403);
      }

      const updates = await body(req);
      delete updates._id;
      delete updates.employer;

      const updated = await Jobs.update(jobId, updates);
      return send(res, await withEmployer(updated));
    }

    if (param('/api/jobs/:jobId', url) && method === 'DELETE') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const { jobId } = param('/api/jobs/:jobId', url);
      const job = await Jobs.findById(jobId);
      
      if (!job) return send(res, { error: 'Job not found' }, 404);
      if (job.employer !== user._id && user.userType !== 'admin') {
        return send(res, { error: 'Not authorized' }, 403);
      }

      await Jobs.remove(jobId);
      return send(res, { message: 'Job deleted successfully' });
    }

    // ─── Applications Routes ───────────────────────────────────────────────
    if (url === '/api/applications' && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      if (user.userType === 'worker') {
        const apps = (await Promise.all((await Applications.find({ applicant: user._id })).map(withJobInfo)))
          
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        return send(res, apps);
      }

      if (user.userType === 'employer') {
        const myJobs = (await Jobs.find({ employer: user._id })).map(j => j._id);
        const apps = (await Promise.all((await Applications.find({ job: { $in: myJobs } })).map(withApplicantInfo)))
          
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        return send(res, apps);
      }

      if (user.userType === 'admin') {
        const apps = (await Promise.all((await Applications.find({})).map(withApplicantInfo)));
        return send(res, apps);
      }

      return send(res, []);
    }

    // Employer applications (alias for /api/applications for employers)
    if (url === '/api/applications/employer' && method === 'GET') {
      const user = await getUser(req);
      if (!user || (user.userType !== 'employer' && !(user.roles && user.roles.includes('employer')))) {
        return send(res, { error: 'Only employers can access this' }, 403);
      }

      const myJobs = (await Jobs.find({ employer: user._id })).map(j => j._id);
      const apps = (await Promise.all((await Applications.find({ job: { $in: myJobs }, adminApproved: true })).map(withApplicantInfo)))
        
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      return send(res, apps);
    }

    // My applications (alias for /api/applications for workers)
    if (url === '/api/applications/my' && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const isWorker = user.userType === 'worker' || (Array.isArray(user.roles) && user.roles.includes('worker'));
      if (isWorker) {
        const apps = (await Promise.all((await Applications.find({ applicant: user._id })).map(withJobInfo)))
          
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        return send(res, apps);
      }

      return send(res, []);
    }

    if (url === '/api/applications' && method === 'POST') {
      const user = await getUser(req);
      if (!user || (user.userType !== 'worker' && !(user.roles && user.roles.includes('worker')))) {
        return send(res, { error: 'Only workers can apply' }, 403);
      }

      const body_data = await body(req);
      const { jobId, coverLetter, isGroupApplication, groupSize } = body_data;
      const job = await Jobs.findById(jobId);

      if (!job) return send(res, { error: 'Job not found' }, 404);
      if (!job.adminApproved || job.status !== 'active') {
        return send(res, { error: 'This job is not accepting applications' }, 400);
      }

      // Check if already applied
      const existing = await Applications.findOne({ job: jobId, applicant: user._id });
      if (existing) {
        return send(res, { error: 'You have already applied to this job' }, 400);
      }

      // Check maxApplications limit
      if (job.maxApplications) {
        const currentCount = await Applications.count({ job: jobId });
        if (currentCount >= parseInt(job.maxApplications)) {
          return send(res, { error: 'This job is no longer accepting applications' }, 400);
        }
      }

      // Application reaches employer only if worker's account has been approved by admin.
      // Group-apply members are plain text entries — visibility still tied to the applicant's account.
      const workerAccountApproved = user.accountApproved === true;
      const shouldAutoApprove = workerAccountApproved;
      const application = await Applications.create({
        job: jobId,
        applicant: user._id,
        coverLetter: coverLetter || '',
        status: 'pending',
        adminApproved: shouldAutoApprove,
        adminApproval: shouldAutoApprove ? 'approved' : 'pending_account',
        employerStatus: 'pending',
        isGroupApplication: isGroupApplication || false,
        groupSize: groupSize || 1,
        groupMembers: body_data.groupMembers || [],
        appliedAt: new Date().toISOString()
      });

      const result = await withJobInfo(application);

      // Auto-close job if maxApplications limit just reached
      if (job.maxApplications) {
        const newCount = await Applications.count({ job: jobId });
        if (newCount >= parseInt(job.maxApplications)) {
          await Jobs.update(jobId, { status: 'closed' });
          console.log(`🔒 Job "${job.title}" auto-closed: maxApplications (${job.maxApplications}) reached`);
        }
      }

      return send(res, result);
    }

    if (param('/api/applications/:appId', url) && method === 'GET') {
      const user = await getUser(req);
      if (!user) return send(res, { error: 'Unauthorized' }, 401);

      const { appId } = param('/api/applications/:appId', url);
      const app = await Applications.findById(appId);

      if (!app) return send(res, { error: 'Application not found' }, 404);

      // Check permissions
      const job = await Jobs.findById(app.job);
      if (app.applicant !== user._id && job.employer !== user._id && user.userType !== 'admin') {
        return send(res, { error: 'Not authorized' }, 403);
      }

      return send(res, await withApplicantInfo(app));
    }

    // Employer accepts/rejects application
    if (param('/api/applications/:appId/decision', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user || (user.userType !== 'employer' && !(user.roles && user.roles.includes('employer')))) {
        return send(res, { error: 'Only employers can make decisions' }, 403);
      }

      const { appId } = param('/api/applications/:appId/decision', url);
      const { decision } = await body(req);

      const app = await Applications.findById(appId);
      if (!app) return send(res, { error: 'Application not found' }, 404);

      const job = await Jobs.findById(app.job);
      if (job.employer !== user._id) {
        return send(res, { error: 'Not authorized' }, 403);
      }

      const accepted = decision === 'accepted';
      const updated = await Applications.update(appId, {
        employerStatus: accepted ? 'accepted' : 'rejected',
        employerDecidedAt: new Date().toISOString()
      });

      // Send email to worker
      const worker = await Users.findById(app.applicant);
      const employer = await Users.findById(user._id);
      if (worker) {
        await sendEmployerDecisionEmail(worker, job, accepted, employer);
      }

      // Check if vacancies are filled (auto-delete job if all positions filled)
      if (accepted) {
        const jobApplications = await Applications.find({ job: app.job });
        const acceptedCount = jobApplications.filter(a => a.employerStatus === 'accepted').length;
        
        if (acceptedCount >= job.vacancies) {
          // Vacancies filled! Delete the job and notify all applicants
          await Jobs.remove(app.job);
          
          // Notify all applicants (both accepted and rejected) that job is filled
          // ✅ FIX: .map() with async/await returns Promises — wrap in Promise.all
          const allApplicants = (await Promise.all(jobApplications.map(a => Users.findById(a.applicant)))).filter(Boolean);
          for (const applicant of allApplicants) {
            try {
              await sendJobFilledNotificationEmail(applicant, job);
            } catch (e) {
              console.error('⚠️ Failed to notify applicant:', e.message);
            }
          }
          
          console.log(`✅ Job "${job.title}" auto-deleted - ${acceptedCount} positions filled`);
        }
      }

      return send(res, await withApplicantInfo(updated));
    }

    // ─── Admin Routes ──────────────────────────────────────────────────────
    if (url === '/api/admin/users' && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const users = (await Users.find({ userType: { $in: ['worker', 'employer'] } }))
        .map(u => {
          const { password, ...safe } = u;
          return safe;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return send(res, users);
    }

    if (url === '/api/admin/jobs' && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const jobs = (await Promise.all((await Jobs.find({})).map(withEmployer)))
          ;
      return send(res, jobs);
    }

    if (url === '/api/admin/applications' && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const apps = (await Promise.all((await Applications.find({})).map(withApplicantInfo)));
      return send(res, apps);
    }

    // Admin approves/rejects user account
    if (param('/api/admin/users/:userId/approve', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { userId } = param('/api/admin/users/:userId/approve', url);
      const { approved } = await body(req);

      const targetUser = await Users.findById(userId);
      if (!targetUser) return send(res, { error: 'User not found' }, 404);

      const updated = await Users.update(userId, {
        accountApproved: approved,
        documentApproved: approved,
        approvedAt: new Date().toISOString(),
        approvedBy: user._id
      });

      // If approving a worker, also approve all their pending (account-held) applications
      if (approved && targetUser.userType === 'worker') {
        const pendingApps = await Applications.find({ applicant: userId, adminApproval: 'pending_account' });
        for (const app of pendingApps) {
          await Applications.update(app._id, {
            adminApproved: true,
            adminApproval: 'approved',
            adminApprovedAt: new Date().toISOString()
          });
        }
      }

      // Send email notification
      await sendUserApprovalEmail(updated, approved);

      const { password, ...safe } = updated;
      return send(res, safe);
    }

    // Admin AI document verification
    if (param('/api/admin/users/:userId/verify-document', url) && method === 'POST') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { userId } = param('/api/admin/users/:userId/verify-document', url);
      const targetUser = await Users.findById(userId);
      
      if (!targetUser) return send(res, { error: 'User not found' }, 404);
      if (!targetUser.documentImage) {
        return send(res, { error: 'No document image uploaded' }, 400);
      }

      const result = await verifyDocumentWithAI(
        targetUser.documentType,
        targetUser.documentNumber,
        targetUser.documentImage
      );

      return send(res, {
        ...result,
        documentImage: targetUser.documentImage,
        documentType: targetUser.documentType,
        documentNumber: targetUser.documentNumber,
        extractedNumber: result.extractedNumber || null,
        userName: targetUser.name,
        userEmail: targetUser.email,
        userPhone: targetUser.phone,
        userType: targetUser.userType,
        pincode: targetUser.pincode,
        address: targetUser.address,
      });
    }

    // Admin approves/rejects job
    if (param('/api/admin/jobs/:jobId/approve', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { jobId } = param('/api/admin/jobs/:jobId/approve', url);
      const { approved } = await body(req);

      const job = await Jobs.findById(jobId);
      if (!job) return send(res, { error: 'Job not found' }, 404);

      const updated = await Jobs.update(jobId, {
        adminApproved: approved,
        status: approved ? 'active' : 'rejected',
        postedAt: approved ? new Date().toISOString() : job.postedAt
      });

      // Send email to employer
      const employer = await Users.findById(job.employer);
      if (employer) {
        await sendJobApprovalEmail(employer, updated, approved);
      }

      // If deactivated (approved = false), notify all applicants
      if (!approved) {
        const jobApps = await Applications.find({ job: jobId });
        for (const app of jobApps) {
          try {
            const applicant = await Users.findById(app.applicant);
            if (applicant && GMAIL_USER) {
              await sendJobRemovedEmail(applicant, job, 'deactivated');
            }
          } catch (e) {
            console.error('⚠️ Failed to notify applicant about job deactivation:', e.message);
          }
        }
      }

      return send(res, await withEmployer(updated));
    }

    // Admin deletes job
    if (param('/api/admin/jobs/:jobId', url) && method === 'DELETE') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { jobId } = param('/api/admin/jobs/:jobId', url);
      const job = await Jobs.findById(jobId);
      if (!job) return send(res, { error: 'Job not found' }, 404);

      // Notify applicants before deleting
      const jobApps = await Applications.find({ job: jobId });
      for (const app of jobApps) {
        try {
          const applicant = await Users.findById(app.applicant);
          if (applicant && GMAIL_USER) {
            await sendJobRemovedEmail(applicant, job, 'deleted');
          }
        } catch (e) {
          console.error('⚠️ Failed to notify applicant about job deletion:', e.message);
        }
        await Applications.remove(app._id);
      }

      await Jobs.remove(jobId);
      return send(res, { success: true, message: 'Job deleted successfully' });
    }

    // Admin updates user (deactivate/activate)
    if (param('/api/admin/users/:userId', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { userId } = param('/api/admin/users/:userId', url);
      const updates = await body(req);

      const targetUser = await Users.findById(userId);
      if (!targetUser) return send(res, { error: 'User not found' }, 404);

      // Remove sensitive fields
      delete updates.password;
      delete updates.email;
      delete updates.userType;
      delete updates._id;

      const updated = await Users.update(userId, updates);
      const { password, ...safe } = updated;
      return send(res, safe);
    }

    // Admin deletes user
    if (param('/api/admin/users/:userId', url) && method === 'DELETE') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { userId } = param('/api/admin/users/:userId', url);
      const targetUser = await Users.findById(userId);
      
      if (!targetUser) return send(res, { error: 'User not found' }, 404);

      // Delete user's applications
      const userApps = await Applications.find({ applicant: userId });
      await Promise.all(userApps.map(app => Applications.remove(app._id)));

      // Delete user's jobs (if employer)
      if (targetUser.userType === 'employer') {
        const userJobs = await Jobs.find({ employer: userId });
        for (const job of userJobs) {
          const jobApps = await Applications.find({ job: job._id });
          await Promise.all(jobApps.map(app => Applications.remove(app._id)));
          await Jobs.remove(job._id);
        }
      }

      const deleted = await Users.remove(userId);
      const { password, ...safe } = deleted;
      return send(res, { success: true, message: 'User deleted successfully', user: safe });
    }

    // Get user document image
    if (param('/api/admin/users/:userId/document-image', url) && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { userId } = param('/api/admin/users/:userId/document-image', url);
      const targetUser = await Users.findById(userId);
      
      if (!targetUser) return send(res, { error: 'User not found' }, 404);
      if (!targetUser.documentImage) {
        return send(res, { error: 'No document image available' }, 404);
      }

      return send(res, { 
        documentImage: targetUser.documentImage,
        documentType: targetUser.documentType,
        documentNumber: targetUser.documentNumber,
        userName: targetUser.name,
        userEmail: targetUser.email
      });
    }

    // AI Security: Get fraud risk score for a user
    if (param('/api/admin/users/:userId/fraud-risk', url) && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }
      const { userId } = param('/api/admin/users/:userId/fraud-risk', url);
      const targetUser = await Users.findById(userId);
      if (!targetUser) return send(res, { error: 'User not found' }, 404);
      const result = await calculateFraudRiskScore(targetUser);
      return send(res, result);
    }

    // AI Security: Detect suspicious activity across all users
    if (url === '/api/admin/security/scan' && method === 'GET') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }
      const result = await detectSuspiciousActivity();
      return send(res, result);
    }

    // Admin approves/rejects application
    if (param('/api/admin/applications/:appId/approve', url) && method === 'PUT') {
      const user = await getUser(req);
      if (!user || user.userType !== 'admin') {
        return send(res, { error: 'Admin access required' }, 403);
      }

      const { appId } = param('/api/admin/applications/:appId/approve', url);
      const { approved } = await body(req);

      const app = await Applications.findById(appId);
      if (!app) return send(res, { error: 'Application not found' }, 404);

      const updated = await Applications.update(appId, {
        adminApproved: approved,
        adminApprovedAt: new Date().toISOString()
      });

      // Send emails
      const worker = await Users.findById(app.applicant);
      const job = await Jobs.findById(app.job);
      const employer = await Users.findById(job.employer);

      if (worker && employer && job) {
        await sendApplicationApprovalEmail(worker, employer, job, approved);
      }

      return send(res, await withApplicantInfo(updated));
    }

    // Get employer profile (for workers viewing employer info)
    if (param('/api/employers/:employerId', url) && method === 'GET') {
      const { employerId } = param('/api/employers/:employerId', url);
      const employer = await Users.findById(employerId);
      
      if (!employer || employer.userType !== 'employer') {
        return send(res, { error: 'Employer not found' }, 404);
      }

      // Return employer info without sensitive data
      const { password, documentImage, documentNumber, documentType, ...safeEmployer } = employer;
      return send(res, safeEmployer);
    }

    // ─── AI Generate (rule-based, no API key needed) ───────────────────────
    if (url === '/api/ai/generate' && method === 'POST') {
      const payload = await body(req);
      const { type, data } = payload || {};

      // ── Skill Suggestions based on workCategory ──────────────────────────
      if (type === 'skillSuggestions') {
        const categorySkillsMap = {
          construction: {
            label: 'Construction',
            core: ['Masonry', 'Bricklaying', 'Plastering', 'Concreting', 'Shuttering'],
            intermediate: ['Carpentry', 'Tiling', 'Waterproofing', 'Scaffolding', 'Steel Fixing'],
            advanced: ['Blueprint Reading', 'Site Supervision', 'Quality Control', 'Safety Management', 'Cost Estimation'],
            tips: 'Construction workers with masonry + carpentry combination are highly sought after in Kasaragod.',
          },
          plumbing: {
            label: 'Plumbing',
            core: ['Pipe Fitting', 'Leak Repair', 'Drain Cleaning', 'Bathroom Fitting', 'Kitchen Plumbing'],
            intermediate: ['Water Tank Installation', 'Sewage System Repair', 'PVC Pipe Work', 'CPVC Pipe Work', 'Pump Installation'],
            advanced: ['Plumbing Design', 'Water Treatment', 'Fire Sprinkler Systems', 'Gas Pipe Fitting', 'Solar Water Heater Installation'],
            tips: 'Plumbers who can also handle basic electrical work for water heaters are in high demand.',
          },
          electrical: {
            label: 'Electrical',
            core: ['Electrical Wiring', 'Switch Board Installation', 'Fan Installation', 'Light Fitting', 'MCB/ELCB Wiring'],
            intermediate: ['Panel Installation', 'AC Installation', 'AC Repair', 'Inverter/UPS Work', 'CCTV Installation'],
            advanced: ['Industrial Wiring', 'Transformer Maintenance', 'Solar Panel Installation', 'Automation Systems', 'HT/LT Line Work'],
            tips: 'Electricians with AC repair certification earn 30-40% more in Kasaragod.',
          },
          farming: {
            label: 'Farming & Agriculture',
            core: ['Crop Cultivation', 'Harvesting', 'Land Preparation', 'Irrigation Management', 'Coconut Climbing'],
            intermediate: ['Cashew Processing', 'Pest Control', 'Organic Farming', 'Drip Irrigation Setup', 'Poultry Management'],
            advanced: ['Farm Management', 'Greenhouse Operations', 'Crop Disease Identification', 'Agricultural Equipment Operation', 'Quality Control & Packaging'],
            tips: 'Coconut climbing + cashew processing is a powerful combination for Kasaragod region farmers.',
          },
          local_workers: {
            label: 'Local Workers',
            core: ['Housekeeping', 'Cooking', 'Cleaning', 'Beedi Rolling', 'Tailoring'],
            intermediate: ['Delivery', 'Food Preparation', 'Child Care', 'Elder Care', 'Sales Assistance'],
            advanced: ['Customer Service', 'Inventory Management', 'Food Safety & Hygiene', 'Retail Operations', 'Basic Accounting'],
            tips: 'Local workers with delivery + sales skills have the most job opportunities in Kasaragod.',
          },
          event_management: {
            label: 'Event Management',
            core: ['Event Setup', 'Decoration', 'Guest Coordination', 'Stage Setup', 'Crowd Management'],
            intermediate: ['Catering', 'Catering Coordination', 'Audio/Visual Setup', 'Photography Assistance', 'Event Planning'],
            advanced: ['Event Budgeting', 'Corporate Event Management', 'Wedding Planning', 'Logistics Coordination', 'Client Communication'],
            tips: 'Event workers with catering + decoration skills find consistent work throughout the year.',
          },
          labourers: {
            label: 'General Labour',
            core: ['Loading & Unloading', 'Material Handling', 'General Cleaning', 'Digging', 'Carrying Heavy Loads'],
            intermediate: ['Warehouse Operations', 'Packing & Labelling', 'Helper Work (Construction)', 'Agricultural Labour', 'Road Work'],
            advanced: ['Forklift Operation', 'Inventory Counting', 'Team Leadership', 'Safety Compliance', 'Basic Equipment Use'],
            tips: 'Labourers who learn a specialised skill like masonry or plumbing assistance can double their earnings.',
          },
          other: {
            label: 'General',
            core: ['Communication Skills', 'Time Management', 'Teamwork', 'Physical Fitness', 'Problem Solving'],
            intermediate: ['Basic Computer Skills', 'Record Keeping', 'Customer Service', 'Report Writing', 'Tool Handling'],
            advanced: ['Leadership', 'Training Others', 'Planning & Organisation', 'Quality Assurance', 'Safety Awareness'],
            tips: 'Adding a specific trade skill to your profile increases job matches significantly.',
          },
        };

        const workCategory = (data && data.workCategory) || 'other';
        const existingSkills = (data && Array.isArray(data.skills) ? data.skills : []).map(s => s.toLowerCase());
        const catData = categorySkillsMap[workCategory] || categorySkillsMap['other'];

        const filterNew = skills => skills.filter(s => !existingSkills.includes(s.toLowerCase()));

        const result = `🎯 **AI Skill Recommendations for ${catData.label}**

**Core Skills** (Essential for getting hired):
${filterNew(catData.core).length > 0 ? filterNew(catData.core).map(s => `• ${s}`).join('\n') : '✅ You already have the core skills!'}

**Intermediate Skills** (Boost your earning potential):
${filterNew(catData.intermediate).map(s => `• ${s}`).join('\n')}

**Advanced Skills** (Stand out from competition):
${filterNew(catData.advanced).map(s => `• ${s}`).join('\n')}

💡 **Pro Tip**: ${catData.tips}

${existingSkills.length > 0 ? `\n✨ Great start! You have ${existingSkills.length} skill(s) already listed. Adding 2-3 more from above will significantly improve your job matches.` : '\n🚀 Start by adding 3-5 Core Skills to your profile to get noticed by employers.'}`;

        return send(res, { result });
      }

      // ── Career Advice ────────────────────────────────────────────────────
      if (type === 'careerAdvice') {
        const result = `Based on your profile, here are some career tips:\n• Keep your skills list updated\n• Apply to jobs that match your category\n• Maintain a professional profile photo\n• Respond quickly to employer messages`;
        return send(res, { result });
      }

      return send(res, { result: 'AI service is available. Please specify a valid type.' });
    }

    // ─── AI Job Description Generation ─────────────────────────────────────
    if (url === '/api/ai/generate-description' && method === 'POST') {
      const payload = await body(req);
      const { title, category, skills, jobType, experience, vacancies, salary, isHomeBased, homeJobType, homeRooms } = payload || {};

      if (!title) {
        return send(res, { error: 'Job title is required to generate a description' }, 400);
      }

      try {
        const description = generateJobDescriptionAI({
          title, category, skills, jobType, experience, vacancies, salary, isHomeBased, homeJobType, homeRooms
        });

        if (description) {
          return send(res, { description });
        } else {
          return send(res, { error: 'Could not generate description. Please write manually.', description: null }, 400);
        }
      } catch (error) {
        console.error('❌ Description generation error:', error.message);
        return send(res, { error: 'Error generating description', description: null }, 500);
      }
    }


    // ─── Contact Form ──────────────────────────────────────────────────────
    if (url === '/api/contact' && method === 'POST') {
      const { name, email, phone, subject, message } = await body(req);

      if (!name || !email || !message) {
        return send(res, { error: 'Name, email, and message are required.' }, 400);
      }

      const emailSubject = subject || 'New Contact Message - AgroSkillConnect';
      const safeMsg = message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const phoneRow = phone
        ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb"><span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Phone</span><br><span style="font-size:15px;color:#111827">${phone}</span></td></tr>`
        : '';

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:28px 40px;text-align:center"><div style="font-size:26px;font-weight:800;color:#fff">AgroSkillConnect</div><div style="color:#bbf7d0;font-size:13px;margin-top:4px">New Contact Form Message</div></td></tr><tr><td style="padding:36px 40px"><h2 style="margin:0 0 20px;font-size:20px;color:#111827;font-weight:700">${emailSubject}</h2><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb"><span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase">From</span><br><span style="font-size:16px;color:#111827;font-weight:600">${name}</span></td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb"><span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase">Email</span><br><a href="mailto:${email}" style="font-size:15px;color:#16a34a;text-decoration:none">${email}</a></td></tr>${phoneRow}<tr><td style="padding:16px 0 0"><span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase">Message</span><br><p style="font-size:15px;color:#374151;line-height:1.7;margin:8px 0 0;white-space:pre-wrap">${safeMsg}</p></td></tr></table></td></tr><tr><td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">AgroSkillConnect · Kasaragod, Kerala · agroskillconnect@gmail.com</p></td></tr></table></td></tr></table></body></html>`;

      const primaryEmails = [GMAIL_USER];
      const secondaryEmail = process.env.AGRPSKILL_EMAIL || 'agrpskill@agroskill.com';
      if (secondaryEmail && secondaryEmail !== GMAIL_USER) {
        primaryEmails.push(secondaryEmail);
      }

      try {
        // Send to both email addresses
        for (const toEmail of primaryEmails) {
          await mailer.sendMail({
            from: `"AgroSkillConnect Contact" <${GMAIL_USER}>`,
            to: toEmail,
            replyTo: email,
            subject: `[Contact] ${emailSubject}`,
            html,
            text: `New contact message from ${name} (${email})${phone ? ', ' + phone : ''}:\n\n${message}`,
          });
        }
        return send(res, { success: true, message: 'Message sent successfully.' });
      } catch (err) {
        console.error('Contact email error:', err.message);
        return send(res, { error: 'Failed to send message. Please try again or email us directly.' }, 500);
      }
    }

    // ─── 404 ───────────────────────────────────────────────────────────────
    return send(res, { error: 'Not found' }, 404);

  } catch (error) {
    console.error('Server error:', error);
    return send(res, { error: 'Internal server error', details: error.message }, 500);
  }
});

// ─── Initialize Demo Jobs ──────────────────────────────────────────────────
async function initializeDemoJobs() {
  // Check if jobs already exist
  if ((await Jobs.find({})).length > 0) {
    return; // Jobs already initialized
  }

  // Create demo employers if needed
  let demoEmployer = (await Users.find({ userType: 'employer' }))[0];

  if (!demoEmployer) {
    demoEmployer = await Users.create({
      userType: 'employer',
      name: 'Kasaragod Builders Co.',
      email: 'builders@kasaragod.com',
      password: 'hashed',
      phone: '+91-9876543210',
      location: 'Kasaragod, Kerala',
      pincode: '671121',
      companyName: 'Kasaragod Builders Co.',
      companyDescription: 'Leading construction company in Kasaragod handling residential and commercial projects.',
      accountApproved: true,
      documentApproved: true
    });
  }

  // Create additional demo employers for different categories
  const employerData = [
    { name: 'Spark Electric Works', email: 'spark@kasaragod.com', companyName: 'Spark Electric Works', industry: 'Electrical', pincode: '671121' },
    { name: 'AquaFix Plumbing Services', email: 'aquafix@kasaragod.com', companyName: 'AquaFix Plumbing Services', industry: 'Plumbing', pincode: '671313' },
    { name: 'CoolBreeze AC Services', email: 'coolbreeze@kasaragod.com', companyName: 'CoolBreeze AC Services', industry: 'AC & Cooling', pincode: '671121' },
    { name: 'Nair Coconut Farm', email: 'naircoco@kasaragod.com', companyName: 'Nair Coconut Farm', industry: 'Farming', pincode: '671348' },
    { name: 'Grand Kerala Caterers', email: 'grandcatering@kasaragod.com', companyName: 'Grand Kerala Caterers', industry: 'Catering', pincode: '671121' },
    { name: 'Malabar Logistics Hub', email: 'malabarlogistics@kasaragod.com', companyName: 'Malabar Logistics Hub', industry: 'Logistics', pincode: '671121' },
    { name: 'Kasaragod Hardware & Tiles', email: 'hardware@kasaragod.com', companyName: 'Kasaragod Hardware & Tiles', industry: 'Sales', pincode: '671121' },
  ];

  const employerMap = { construction: demoEmployer._id };
  for (const ed of employerData) {
    let emp = await Users.findOne({ email: ed.email });
    if (!emp) {
      emp = await Users.create({
        userType: 'employer', password: 'hashed', phone: '+91-9876500000',
        location: 'Kasaragod, Kerala', accountApproved: true, documentApproved: true,
        ...ed
      });
    }
    employerMap[ed.industry.toLowerCase().replace(/[^a-z]/g, '_')] = emp._id;
  }

  // Demo Jobs Data — categories use existing app values:
  // electrical, plumbing, farming, construction, event_management, local_workers, other
  const demoJobs = [
    // ── ELECTRICAL (includes AC Technician) ──────────────────────────
    {
      title: 'House Wiring Electrician',
      category: 'electrical',
      description: 'Residential house wiring work including switchboard installation, cable laying, and DB panel fitting. Work hours: 8:00 AM – 5:00 PM. PPE provided. Payment daily on completion.',
      requirements: 'Valid electrician licence, experience with residential wiring, safety awareness',
      salary: '₹700–₹900/day',
      jobType: 'Daily Wages',
      vacancies: 3,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      employer: employerMap['electrical'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Solar Rooftop Installation Electrician',
      category: 'electrical',
      description: 'Solar panel installation on rooftops for residential and commercial clients. Work involves panel mounting, wiring, inverter setup, and earthing. Hours: 8 AM – 5 PM. Safety harness provided.',
      requirements: 'Solar wiring experience, comfortable working at height, inverter knowledge',
      salary: '₹900–₹1,200/day',
      jobType: 'Daily Wages',
      vacancies: 4,
      location: 'Nileshwaram, Kasaragod',
      pincode: '671314',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      employer: employerMap['electrical'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── PLUMBING ─────────────────────────────────────────────────────
    {
      title: 'Residential Plumber',
      category: 'plumbing',
      description: 'New residential plumbing work — water supply lines, drainage fitting, bathroom fixture installation, and overhead tank connections. Work timing: 8:00 AM to 5:00 PM. All pipe materials supplied.',
      requirements: 'Plumbing experience, pipe fitting knowledge, drainage work',
      salary: '₹650–₹850/day',
      jobType: 'Daily Wages',
      vacancies: 2,
      location: 'Cheruvathur, Kasaragod',
      pincode: '671313',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      employer: employerMap['plumbing'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Apartment Complex Plumber',
      category: 'plumbing',
      description: 'Multi-floor apartment plumbing work including hot and cold water lines, PVC drainage stacks, sanitary fixture installation, and RCC slab pipe embedment. Work hours: 8 AM to 5 PM.',
      requirements: 'Multi-floor plumbing experience, hot & cold line knowledge, drainage stacks',
      salary: '₹750–₹950/day',
      jobType: 'Daily Wages',
      vacancies: 3,
      location: 'Kanjangad, Kasaragod',
      pincode: '671322',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      employer: employerMap['plumbing'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── SALESMAN ─────────────────────────────────────────────────────
    {
      title: 'Field Sales Executive – Building Materials',
      category: 'other',
      description: 'Visit retail shops and construction sites to sell tiles, sanitary ware, and building materials. Target-based incentives. Work timings: Monday to Saturday, 9 AM – 6 PM. Two-wheeler required (fuel allowance provided).',
      requirements: 'Sales experience, two-wheeler licence, good communication skills',
      salary: '₹14,000–₹20,000/month + Incentives',
      jobType: 'Full-time',
      vacancies: 3,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      employer: employerMap['sales'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Retail Sales Associate – Electronics',
      category: 'other',
      description: 'Counter sales in an electronics showroom — assist customers in choosing products, billing, and after-sales service follow-up. Timing: 9:30 AM – 8:00 PM, Sunday holiday. Training provided for freshers.',
      requirements: 'Good communication, basic product knowledge, customer service skills',
      salary: '₹12,000–₹18,000/month',
      jobType: 'Full-time',
      vacancies: 2,
      location: 'Kanhangad, Kasaragod',
      pincode: '671315',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      employer: employerMap['sales'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── AC TECHNICIAN ────────────────────────────────────────────────
    {
      title: 'AC Installation & Service Technician',
      category: 'electrical',
      description: 'Split AC installation, gas charging, service and repairs for residential and small commercial units. Work timings: 9 AM – 6 PM. Must have own basic tools. Transport allowance paid.',
      requirements: 'AC installation experience, refrigerant handling, gas charging knowledge',
      salary: '₹800–₹1,100/day',
      jobType: 'Daily Wages',
      vacancies: 3,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      employer: employerMap['ac___cooling'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Commercial HVAC Technician',
      category: 'electrical',
      description: 'Installation and AMC servicing of centralized AC systems, VRF units, and cassette ACs for commercial buildings. Work hours: 8:30 AM to 5:30 PM. Must have experience in ductwork and HVAC wiring.',
      requirements: 'HVAC experience, VRF systems knowledge, ductwork installation',
      salary: '₹1,000–₹1,400/day',
      jobType: 'Daily Wages',
      vacancies: 2,
      location: 'Kanhangad, Kasaragod',
      pincode: '671315',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      employer: employerMap['ac___cooling'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── FARMING ──────────────────────────────────────────────────────
    {
      title: 'Coconut Plantation Farm Workers',
      category: 'farming',
      description: 'Seasonal farm labour for coconut and arecanut plantation — weeding, irrigation maintenance, harvesting, and coconut tree climbing. Work timing: 7:30 AM to 1:00 PM. Lunch provided. Group hiring open — bring your team.',
      requirements: 'Farming experience, physical fitness, willingness for outdoor work',
      salary: '₹500–₹650/day',
      jobType: 'Daily Wages',
      vacancies: 8,
      location: 'Hosdurg, Kasaragod',
      pincode: '671348',
      allowGroupApply: true,
      maxGroupSize: 8,
      startDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      employer: employerMap['farming'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Paddy Field Workers – Transplanting Season',
      category: 'farming',
      description: 'Paddy transplanting, weeding, and maintenance work for the upcoming Kharif season. Group workers welcome. Work hours: 7:00 AM to 12:30 PM. Meals provided. Daily payment. Female workers also welcome.',
      requirements: 'Field work experience, physical fitness, paddy farming knowledge helpful',
      salary: '₹550–₹700/day',
      jobType: 'Daily Wages',
      vacancies: 10,
      location: 'Kumbla, Kasaragod',
      pincode: '671321',
      allowGroupApply: true,
      maxGroupSize: 10,
      startDate: new Date(Date.now() + 6 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      employer: employerMap['farming'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── CATERING ─────────────────────────────────────────────────────
    {
      title: 'Wedding Catering Helper',
      category: 'event_management',
      description: 'Event catering assistance for wedding functions — food serving, dish washing, vessel cleaning, setup and breakdown. Work timing varies: typically 6 AM to 3 PM or 12 PM to 10 PM based on event. Food and uniform provided.',
      requirements: 'Catering or kitchen experience, willingness to work flexible hours, physical stamina',
      salary: '₹600–₹800/day',
      jobType: 'Daily Wages',
      vacancies: 6,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      employer: employerMap['catering'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Outside Catering – Event Cook',
      category: 'event_management',
      description: 'Cook required for outside catering events — weddings, birthday parties, office events. Must be skilled in Kerala-style biriyani, sadya, and non-veg preparations. Events mostly on weekends. Transport arranged.',
      requirements: 'Kerala cuisine expertise, biriyani and sadya preparation, event cooking experience',
      salary: '₹700–₹1,000/day',
      jobType: 'Daily Wages',
      vacancies: 4,
      location: 'Kanhangad, Kasaragod',
      pincode: '671315',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      employer: employerMap['catering'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── CONSTRUCTION ─────────────────────────────────────────────────
    {
      title: 'Mason / Bricklayer – Residential Project',
      category: 'construction',
      description: 'Experienced masons needed for a 3-storey residential building. Work includes brick laying, plastering, and column construction. Work hours: 8 AM – 5 PM. PPE provided. Group hiring welcomed for this project.',
      requirements: 'Masonry experience, plastering skills, physical fitness, safety awareness',
      salary: '₹700–₹900/day',
      jobType: 'Daily Wages',
      vacancies: 6,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: true,
      maxGroupSize: 6,
      startDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      employer: demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Construction Site Labour – Foundation Work',
      category: 'construction',
      description: 'General construction labour for foundation and structure work — digging, concrete mixing, material carrying, and shuttering support. Group applications encouraged. Work hours: 7:30 AM – 5:30 PM. Site meals available.',
      requirements: 'Physical fitness, construction site experience, safety compliance',
      salary: '₹600–₹750/day',
      jobType: 'Daily Wages',
      vacancies: 12,
      location: 'Kanjangad, Kasaragod',
      pincode: '671322',
      allowGroupApply: true,
      maxGroupSize: 12,
      startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      employer: demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Steel Fixer / Bar Bender',
      category: 'construction',
      description: 'Steel fixing and bar bending work for multi-storey commercial building. Involves cutting, bending and tying rebars for columns, beams and slabs. Work timing: 8 AM – 5 PM. Safety equipment and PPE provided.',
      requirements: 'Steel fixing and bar bending experience, rebar tying skills',
      salary: '₹800–₹1,050/day',
      jobType: 'Daily Wages',
      vacancies: 5,
      location: 'Kanhangad, Kasaragod',
      pincode: '671124',
      allowGroupApply: true,
      maxGroupSize: 5,
      startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 22 * 86400000).toISOString(),
      employer: demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    // ── LABOURERS ────────────────────────────────────────────────────
    {
      title: 'Warehouse Loading / Unloading Labour',
      category: 'local_workers',
      description: 'Loading and unloading of goods in a logistics warehouse. Work involves handling bags, boxes, and pallets. Shift timings: 7 AM – 3 PM and 3 PM – 11 PM. Physical fitness required. Daily payment.',
      requirements: 'Physical fitness, punctuality, ability to handle heavy loads',
      salary: '₹500–₹650/day',
      jobType: 'Daily Wages',
      vacancies: 8,
      location: 'Kasaragod',
      pincode: '671121',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      employer: employerMap['logistics'] || demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
    {
      title: 'Road Work / Municipal Labour',
      category: 'local_workers',
      description: 'General labour for road laying, footpath construction, and gutter work under municipal project. Work hours: 7:30 AM – 4:30 PM, 6 days a week. Tools and PPE provided. Daily wages paid on site.',
      requirements: 'Physical fitness, manual labour experience, outdoor work readiness',
      salary: '₹550–₹680/day',
      jobType: 'Daily Wages',
      vacancies: 10,
      location: 'Nileshwaram, Kasaragod',
      pincode: '671314',
      allowGroupApply: false,
      startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 16 * 86400000).toISOString(),
      employer: demoEmployer._id,
      adminApproved: true,
      status: 'active'
    },
  ];

  // Create all demo jobs
  for (const job of demoJobs) {
    await Jobs.create({
      ...job,
      postedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  console.log(`✅ Created ${demoJobs.length} demo jobs for testing`);
}

// Initialize demo jobs when server starts
async function startServer() {
  await connectDB();

  // ── Deadline & Max-Applications Auto-Close (runs every hour) ────────────
  async function autoCloseExpiredJobs() {
    try {
      const now = new Date();
      const activeJobs = await Jobs.find({ status: 'active', adminApproved: true });
      for (const job of activeJobs) {
        let shouldClose = false;
        let reason = '';

        // Auto-delete if deadline has passed
        if (job.deadline && new Date(job.deadline) < now) {
          shouldClose = true;
          reason = 'deadline';
        }

        // Auto-close if maxApplications limit reached (personal setting)
        if (!shouldClose && job.maxApplications) {
          const appCount = await Applications.count({ job: job._id });
          if (appCount >= parseInt(job.maxApplications)) {
            shouldClose = true;
            reason = 'max_applications';
          }
        }

        if (shouldClose) {
          // Notify all applicants
          const jobApps = await Applications.find({ job: job._id });
          for (const app of jobApps) {
            try {
              const applicant = await Users.findById(app.applicant);
              if (applicant && GMAIL_USER) {
                await sendJobRemovedEmail(applicant, job, reason === 'deadline' ? 'deleted' : 'deactivated');
              }
            } catch (e) { console.error('⚠️ Notify error:', e.message); }
            await Applications.remove(app._id);
          }
          await Jobs.remove(job._id);
          console.log(`🗑️  Auto-removed job "${job.title}" (reason: ${reason})`);
        }
      }
    } catch (e) { console.error('Auto-close error:', e.message); }
  }

  // Run immediately then every hour
  setTimeout(autoCloseExpiredJobs, 5000);
  setInterval(autoCloseExpiredJobs, 60 * 60 * 1000);

  // Always re-seed to ensure fresh job/user data is loaded
  console.log('🌱 Running seed (clears old data and loads fresh seed)...');
  await seed();

  await initializeDemoJobs();
  server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🌾 AgroSkillConnect Server - Enhanced with Admin Verification  ║
║                                                                   ║
║   🚀 Server running on: http://localhost:${PORT}                  ║
║   📧 Email notifications: ${GMAIL_USER ? '✓ Enabled' : '✗ Disabled'}                               ║
║   🤖 AI verification: ${ANTHROPIC_KEY ? '✓ Enabled' : '✗ Disabled'}                                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

🔑 Demo Credentials
─────────────────────────────────────────────────────────────────
  Role       Email                              Password
─────────────────────────────────────────────────────────────────
  Admin      admin@agroskill.com                admin123
  Employer   sreenivas@kiraelectricals.com      employer@123
  Employer   anwar@coolzoneac.com               employer@123
  Employer   mujeeb@northernbuilders.com        employer@123
  Employer   suresh@bekalconstruct.com          employer@123
  Employer   reji@kasaragodplumbing.com         employer@123
  Employer   abdul@greenvalleyfarms.com         employer@123
  Employer   bindu@spicecoastcatering.com       employer@123
  Employer   ramesh@coastalsales.com            employer@123
  Employer   krishnan@malabaragroworks.com      employer@123
  Employer   joice@nileshwarelectro.com         employer@123
  Worker     arun.elec@worker.com               worker@123
  Worker     noufal.ac@worker.com               worker@123
  Worker     binil.plumb@worker.com             worker@123
  Worker     bineesh.con@worker.com             worker@123
  Worker     rameshan.farm@worker.com           worker@123
  Worker     suma.cater@worker.com              worker@123
  Worker     ajas.sales@worker.com              worker@123
─────────────────────────────────────────────────────────────────
  `);
  });
}

startServer();