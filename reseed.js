/**
 * reseed.js – Clears the database and loads fresh seed data.
 * Run from the server folder:
 *
 *   npm run seed
 *
 * This wipes all users, jobs, applications and notifications,
 * then inserts the full fresh seed defined below.
 */

import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFileSync }            from 'node:fs';
import { resolve, dirname }        from 'node:path';
import { fileURLToPath }           from 'node:url';
import { MongoClient }             from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if present
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agroskill';

// ── Helpers ────────────────────────────────────────────────────────────────────
let _idCounter = 0;
function newId() {
  return `${Date.now().toString(36)}${(++_idCounter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
function hashPwd(p) {
  const s = randomBytes(16).toString('hex');
  return `${s}:${pbkdf2Sync(p, s, 100000, 64, 'sha512').toString('hex')}`;
}

// ── Lightweight Collection wrapper ────────────────────────────────────────────
class Col {
  constructor(db, name) { this.c = db.collection(name); }
  async insert(d)    { const r = { _id: newId(), ...d }; await this.c.insertOne(r); return r; }
  async clear()      { await this.c.deleteMany({}); }
}

// ── Main seed ─────────────────────────────────────────────────────────────────
async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db  = client.db();
    const Users        = new Col(db, 'users');
    const Jobs         = new Col(db, 'jobs');
    const Applications = new Col(db, 'applications');
    const Notifications= new Col(db, 'notifications');

    // ── Wipe existing data ───────────────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await Users.clear();
    await Jobs.clear();
    await Applications.clear();
    await Notifications.clear();
    console.log('✅ Database cleared.\n🌱 Inserting fresh seed data...\n');

    const now = Date.now();
    const ago = d => new Date(now - d * 86400000).toISOString();
    const fwd = d => new Date(now + d * 86400000);

    // ── Admin ────────────────────────────────────────────────────────────────
    await Users.insert({
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

    // ── Workers ──────────────────────────────────────────────────────────────
    // Password: worker@123
    const workerRows = [
      // Electrical
      { name: 'Arun Vijayan',        email: 'arun.elec@worker.com',     phone: '+91-9847100101', pincode: '671311', skills: ['Electrical Wiring','Switchboard Installation','Fan & Light Fitting','MCB Wiring'], experience: '5 years',  workCategory: 'electrical',    documentType: 'aadhar', documentNumber: '234500100012', location: 'Kanhangad' },
      { name: 'Rajan Pillai',        email: 'rajan.elec@worker.com',    phone: '+91-9747100202', pincode: '671531', skills: ['Panel Installation','Electrical Maintenance','Inverter Work','Cable Laying'], experience: '8 years',  workCategory: 'electrical',    documentType: 'aadhar', documentNumber: '345600200023', location: 'Manjeshwar' },
      { name: 'Sujith Nair',         email: 'sujith.elec@worker.com',   phone: '+91-9645100303', pincode: '671121', skills: ['House Wiring','Industrial Wiring','UPS Installation','Electrical Repairs'], experience: '6 years',  workCategory: 'electrical',    documentType: 'pan',    documentNumber: 'ARUPN1001C',   location: 'Kasaragod Town' },
      // AC Technician
      { name: 'Noufal KP',           email: 'noufal.ac@worker.com',     phone: '+91-9544100404', pincode: '671311', skills: ['AC Installation','AC Repair','AC Service','Refrigeration','Copper Pipe Work'], experience: '7 years',  workCategory: 'electrical',    documentType: 'aadhar', documentNumber: '456700300034', location: 'Kanhangad' },
      { name: 'Vishnu Das',          email: 'vishnu.ac@worker.com',     phone: '+91-9443100505', pincode: '671124', skills: ['Split AC Repair','Window AC Service','HVAC Maintenance','Gas Charging'], experience: '4 years',  workCategory: 'electrical',    documentType: 'aadhar', documentNumber: '567800400045', location: 'Kasaragod Town' },
      // Plumbing
      { name: 'Binil Shetty',        email: 'binil.plumb@worker.com',   phone: '+91-9342100606', pincode: '671121', skills: ['Pipe Fitting','Leak Repair','Bathroom Fitting','Drain Cleaning'], experience: '6 years',  workCategory: 'plumbing',      documentType: 'aadhar', documentNumber: '678900500056', location: 'Kasaragod Town' },
      { name: 'Jobin Thomas',        email: 'jobin.plumb@worker.com',   phone: '+91-9241100707', pincode: '671311', skills: ['PVC Pipe Work','Water Tank Installation','Kitchen Plumbing','Sewage Repair'], experience: '9 years',  workCategory: 'plumbing',      documentType: 'aadhar', documentNumber: '789000600067', location: 'Kanhangad' },
      { name: 'Shyam Prasad',        email: 'shyam.plumb@worker.com',   phone: '+91-9140100808', pincode: '671317', skills: ['Plumbing Design','Pump Installation','Solar Water Heater','Gas Fitting'], experience: '11 years', workCategory: 'plumbing',      documentType: 'pan',    documentNumber: 'SHYPP5001D',   location: 'Nileshwar' },
      // Construction
      { name: 'Bineesh Kumar',       email: 'bineesh.con@worker.com',   phone: '+91-9039100909', pincode: '671121', skills: ['Masonry','Bricklaying','Plastering','Concreting'], experience: '10 years', workCategory: 'construction',  documentType: 'aadhar', documentNumber: '890100700078', location: 'Kasaragod Town' },
      { name: 'Sarath Mohan',        email: 'sarath.con@worker.com',    phone: '+91-8938101010', pincode: '671316', skills: ['Carpentry','Door & Window Fitting','Furniture Making','Shuttering'], experience: '7 years',  workCategory: 'construction',  documentType: 'aadhar', documentNumber: '901200800089', location: 'Kanhangad' },
      { name: 'Dileep Babu',         email: 'dileep.con@worker.com',    phone: '+91-8837101111', pincode: '671531', skills: ['Tiling','Waterproofing','Flooring','Granite Work'], experience: '5 years',  workCategory: 'construction',  documentType: 'aadhar', documentNumber: '012300900090', location: 'Manjeshwar' },
      { name: 'Sreeraj MK',          email: 'sreeraj.con@worker.com',   phone: '+91-8736101212', pincode: '671321', skills: ['Painting','Wall Putty','Spray Painting','Texture Finishing'], experience: '4 years',  workCategory: 'construction',  documentType: 'aadhar', documentNumber: '123401000001', location: 'Uppala' },
      // Farming
      { name: 'Rameshan Nair',       email: 'rameshan.farm@worker.com', phone: '+91-8635101313', pincode: '671317', skills: ['Crop Cultivation','Harvesting','Irrigation Management','Coconut Climbing'], experience: '15 years', workCategory: 'farming',       documentType: 'aadhar', documentNumber: '234501100013', location: 'Nileshwar' },
      { name: 'Sasi Kumar',          email: 'sasi.farm@worker.com',     phone: '+91-8534101414', pincode: '671321', skills: ['Paddy Farming','Vegetable Farming','Land Preparation','Pest Control'], experience: '12 years', workCategory: 'farming',       documentType: 'aadhar', documentNumber: '345601200024', location: 'Uppala' },
      { name: 'Prakashan V',         email: 'prakashan.farm@worker.com',phone: '+91-8433101515', pincode: '671311', skills: ['Organic Farming','Drip Irrigation Setup','Poultry Management','Arecanut Farming'], experience: '8 years',  workCategory: 'farming',       documentType: 'aadhar', documentNumber: '456701300035', location: 'Kanhangad' },
      // Catering
      { name: 'Suma Devi',           email: 'suma.cater@worker.com',    phone: '+91-8332101616', pincode: '671531', skills: ['Catering','Cooking','Food Preparation','Food Safety & Hygiene'], experience: '6 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '567801400046', location: 'Manjeshwar' },
      { name: 'Rekha Menon',         email: 'rekha.cater@worker.com',   phone: '+91-8231101717', pincode: '671121', skills: ['Event Catering','Snack Preparation','Tea & Coffee Service','Kitchen Management'], experience: '4 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '678901500057', location: 'Kasaragod Town' },
      // Salesman
      { name: 'Ajas KM',             email: 'ajas.sales@worker.com',    phone: '+91-8130101818', pincode: '671121', skills: ['Sales','Customer Handling','Product Demonstration','Target Achievement'], experience: '3 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '789001600068', location: 'Kasaragod Town' },
      { name: 'Nidhin Raj',          email: 'nidhin.sales@worker.com',  phone: '+91-8029101919', pincode: '671316', skills: ['Retail Sales','Cold Calling','Door-to-Door Sales','Billing & Invoicing'], experience: '2 years',  workCategory: 'local_workers', documentType: 'aadhar', documentNumber: '890101700079', location: 'Kanhangad' },
    ];

    for (let i = 0; i < workerRows.length; i++) {
      const w = workerRows[i];
      await Users.insert({
        ...w,
        password: hashPwd('worker@123'),
        userType: 'worker',
        isActive: true,
        profileCompleted: true,
        accountApproved: true,
        documentApproved: true,
        isVisible: true,
        city: w.location,
        state: 'Kerala',
        address: `${w.location}, Kasaragod District, Kerala`,
        languages: ['Malayalam', 'English'],
        about: `Experienced ${w.workCategory} professional with ${w.experience} of hands-on work in Kasaragod region.`,
        availability: i % 3 === 0 ? 'Immediate' : i % 3 === 1 ? 'In 1 week' : 'Flexible',
        createdAt: ago(60 - i * 2)
      });
    }

    // ── Employers ────────────────────────────────────────────────────────────
    // Password: employer@123 (all employers now have email addresses)
    const employerRows = [
      { name: 'Sreenivas Menon',  email: 'sreenivas@kiraelectricals.com',  phone: '+91-9847200101', companyName: 'Kira Electricals Kasaragod',   organizationName: 'Kira Electricals',      category: 'electrical',    pincode: '671311', location: 'Kanhangad',      documentType: 'pan', documentNumber: 'SRNNM1001E', aadharNumber: '100200300400', isGroupHiringEmployer: true  },
      { name: 'Anwar Hussain',    email: 'anwar@coolzoneac.com',            phone: '+91-9747200202', companyName: 'CoolZone AC Services',         organizationName: 'CoolZone AC Services',  category: 'electrical',    pincode: '671124', location: 'Kasaragod Town', documentType: 'pan', documentNumber: 'ANWRH2002F', aadharNumber: '200300400500', isGroupHiringEmployer: true  },
      { name: 'Mujeeb Rahman',    email: 'mujeeb@northernbuilders.com',     phone: '+91-9645200303', companyName: 'Northern Kerala Builders',     organizationName: 'Northern Kerala Builders', category: 'construction', pincode: '671121', location: 'Kasaragod Town', documentType: 'pan', documentNumber: 'MUJBR3003G', aadharNumber: '300400500600', isGroupHiringEmployer: true  },
      { name: 'Suresh Babu',      email: 'suresh@bekalconstruct.com',       phone: '+91-9544200404', companyName: 'Bekal Construction Works',     organizationName: 'Bekal Construction',    category: 'construction',  pincode: '671316', location: 'Kanhangad',      documentType: 'pan', documentNumber: 'SRSHB4004H', aadharNumber: '400500600700', isGroupHiringEmployer: false },
      { name: 'Reji Varghese',    email: 'reji@kasaragodplumbing.com',      phone: '+91-9443200505', companyName: 'Kasaragod Plumbing Solutions', organizationName: 'Kasaragod Plumbing',    category: 'plumbing',      pincode: '671121', location: 'Kasaragod Town', documentType: 'pan', documentNumber: 'RJIVG5005I', aadharNumber: '500600700800', isGroupHiringEmployer: false },
      { name: 'Abdul Latheef',    email: 'abdul@greenvalleyfarms.com',      phone: '+91-9342200606', companyName: 'Green Valley Agro Farms',      organizationName: 'Green Valley Farms',    category: 'farming',       pincode: '671317', location: 'Nileshwar',      documentType: 'pan', documentNumber: 'ABDLL6006J', aadharNumber: '600700800900', isGroupHiringEmployer: true  },
      { name: 'Bindu Rajesh',     email: 'bindu@spicecoastcatering.com',    phone: '+91-9241200707', companyName: 'Spice Coast Catering Services',organizationName: 'Spice Coast Catering',  category: 'event_works',   pincode: '671531', location: 'Manjeshwar',     documentType: 'pan', documentNumber: 'BNDUR7007K', aadharNumber: '700800901000', isGroupHiringEmployer: true  },
      { name: 'Ramesh Pai',       email: 'ramesh@coastalsales.com',         phone: '+91-9140200808', companyName: 'Coastal Sales & Marketing',    organizationName: 'Coastal Sales',         category: 'other',         pincode: '671321', location: 'Uppala',         documentType: 'pan', documentNumber: 'RMSHP8008L', aadharNumber: '800901001100', isGroupHiringEmployer: false },
      { name: 'Krishnan Kutty',   email: 'krishnan@malabaragroworks.com',   phone: '+91-9039200909', companyName: 'Malabar Agro Works',           organizationName: 'Malabar Agro Works',    category: 'farming',       pincode: '671321', location: 'Uppala',         documentType: 'pan', documentNumber: 'KRSHK9009M', aadharNumber: '901001101200', isGroupHiringEmployer: true  },
      { name: 'Joice Mathew',     email: 'joice@nileshwarelectro.com',      phone: '+91-8938201010', companyName: 'Nileshwar Electro Works',      organizationName: 'Nileshwar Electro',     category: 'electrical',    pincode: '671317', location: 'Nileshwar',      documentType: 'pan', documentNumber: 'JCMTW1010N', aadharNumber: '001101201300', isGroupHiringEmployer: false },
    ];

    const empIds = [];
    for (let i = 0; i < employerRows.length; i++) {
      const e = employerRows[i];
      const created = await Users.insert({
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
      empIds.push(created._id);
    }

    // ── Jobs ─────────────────────────────────────────────────────────────────
    const jobsData = [
      // ── ELECTRICAL (daily wages for workers) ──
      { employer: empIds[0], title: 'Electrical House Wiring Technician',       company: 'Kira Electricals Kasaragod',   location: 'Kanhangad',       workCategory: 'electrical',    jobType: 'full-time',  workersNeeded: 4, vacancyNumber: 4, dailyWages: '₹700 – ₹900/day', description: 'Skilled electrical house wiring technicians needed for residential and commercial projects across Kasaragod district. Work involves switchboard installation, MCB panel fitting, fan and light wiring, and earthing. Location: Kanhangad. Pincode: 671311. Start Date: ' + fwd(7).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline for applications: ' + fwd(20).toLocaleDateString('en-IN') + '. Immediate joining available for qualified candidates.',                                                                                          skills: ['Electrical Wiring','Switchboard Installation','Fan & Light Fitting','MCB Wiring','Earthing Work'],  pincode: '671311', maxGroupSize: 4, allowGroupApply: true,  startDate: fwd(7),  deadline: fwd(20), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '6 months',  createdAt: ago(3), postedAt: ago(3) },
      { employer: empIds[0], title: 'Electrical Maintenance Worker',             company: 'Kira Electricals Kasaragod',   location: 'Kanhangad',       workCategory: 'electrical',    jobType: 'full-time',  workersNeeded: 2, vacancyNumber: 2, dailyWages: '₹600 – ₹750/day', description: 'Electrical maintenance worker for ongoing industrial and residential maintenance contracts in Kanhangad. Duties include fault detection, cable laying, inverter servicing, and panel maintenance. Location: Kanhangad. Pincode: 671311. Start Date: ' + fwd(5).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(18).toLocaleDateString('en-IN') + '.',                                                                                                                    skills: ['Electrical Maintenance','Cable Laying','Fault Detection','Inverter Work','Panel Maintenance'],      pincode: '671311',                  allowGroupApply: true,  startDate: fwd(5),  deadline: fwd(18), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '1 year',    createdAt: ago(5), postedAt: ago(5) },
      // ── AC TECHNICIAN (daily wages) ──
      { employer: empIds[1], title: 'AC Technician – Installation & Service',   company: 'CoolZone AC Services',         location: 'Kasaragod Town',  workCategory: 'electrical',    jobType: 'full-time',  workersNeeded: 3, vacancyNumber: 3, dailyWages: '₹800 – ₹1,000/day', description: 'Experienced AC technicians required for split AC installation, gas charging, and servicing across Kasaragod. Must have knowledge of refrigeration, copper pipe flaring, and electrical wiring of AC units. Service vehicle provided. Location: Kasaragod Town. Pincode: 671124. Start Date: ' + fwd(4).toLocaleDateString('en-IN') + '. Timing: 09:00 to 18:00. Deadline: ' + fwd(17).toLocaleDateString('en-IN') + '. Immediate joining preferred.',                                                                             skills: ['AC Installation','AC Repair','Gas Charging','Refrigeration','Copper Pipe Work'],                    pincode: '671124', maxGroupSize: 3, allowGroupApply: true,  startDate: fwd(4),  deadline: fwd(17), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '09:00', workHoursTo: '18:00', contractDuration: '1 year',    createdAt: ago(2), postedAt: ago(2) },
      { employer: empIds[1], title: 'AC Repair & HVAC Maintenance Technician',  company: 'CoolZone AC Services',         location: 'Kasaragod Town',  workCategory: 'electrical',    jobType: 'full-time',  workersNeeded: 2, vacancyNumber: 2, dailyWages: '₹700 – ₹900/day', description: 'AC repair and HVAC maintenance technicians needed for commercial service contracts with offices, hotels and showrooms in Kasaragod. Work includes preventive maintenance, AC service, fault diagnosis and gas refilling. Location: Kasaragod Town. Pincode: 671124. Start Date: ' + fwd(10).toLocaleDateString('en-IN') + '. Timing: 09:00 to 18:00. Deadline: ' + fwd(25).toLocaleDateString('en-IN') + '.',                                                                                          skills: ['AC Service','HVAC Maintenance','Fault Diagnosis','Gas Refilling','Electrical Knowledge'],            pincode: '671124',                  allowGroupApply: false, startDate: fwd(10), deadline: fwd(25), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '09:00', workHoursTo: '18:00', contractDuration: '6 months',  createdAt: ago(6), postedAt: ago(6) },
      { employer: empIds[9], title: 'Electrician – House Wiring & Panel Work',  company: 'Nileshwar Electro Works',      location: 'Nileshwar',       workCategory: 'electrical',    jobType: 'full-time',  workersNeeded: 3, vacancyNumber: 3, dailyWages: '₹650 – ₹850/day', description: 'Electricians required for new residential construction wiring in Nileshwar and Manjeshwar. Experience in house wiring, ELCB installation, fan and light fitting, and switchboard wiring is essential. Location: Nileshwar. Pincode: 671317. Start Date: ' + fwd(6).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(19).toLocaleDateString('en-IN') + '.',                                                                                                                skills: ['House Wiring','ELCB Installation','Switchboard Work','Fan & Light Fitting','UPS Installation'],     pincode: '671317',                  allowGroupApply: true,  startDate: fwd(6),  deadline: fwd(19), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '8 months',  createdAt: ago(4), postedAt: ago(4) },
      // ── CONSTRUCTION (daily wages) ──
      { employer: empIds[2], title: 'Construction Site Mason',                  company: 'Northern Kerala Builders',     location: 'Kasaragod Town',  workCategory: 'construction',  jobType: 'full-time',  workersNeeded: 8, vacancyNumber: 8, dailyWages: '₹650 – ₹850/day', description: 'Experienced masons and bricklayers needed for a large residential apartment construction project in Kasaragod Town. Work includes bricklaying, plastering, concreting, and column construction. Group applications welcome. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(10).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(25).toLocaleDateString('en-IN') + '.',                                                                                  skills: ['Masonry','Bricklaying','Plastering','Concreting','Column Construction'],                             pincode: '671121', maxGroupSize: 6, allowGroupApply: true,  startDate: fwd(10), deadline: fwd(25), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '1 year',    createdAt: ago(1), postedAt: ago(1) },
      { employer: empIds[2], title: 'Building Construction Worker – General',   company: 'Northern Kerala Builders',     location: 'Kasaragod Town',  workCategory: 'construction',  jobType: 'full-time',  workersNeeded:12, vacancyNumber:12, dailyWages: '₹550 – ₹700/day', description: 'General construction labourers required for foundation and structure work. Duties include concrete mixing, material carrying, shuttering support, and digging. Meals provided on site. Group hiring encouraged. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(8).toLocaleDateString('en-IN') + '. Timing: 07:30 to 17:30. Deadline: ' + fwd(22).toLocaleDateString('en-IN') + '. Immediate joining available.',                                                                                                    skills: ['Concrete Mixing','Shuttering','Material Handling','Site Work','Bar Bending'],                       pincode: '671121', maxGroupSize: 8, allowGroupApply: true,  startDate: fwd(8),  deadline: fwd(22), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '07:30', workHoursTo: '17:30', contractDuration: '1 year',    createdAt: ago(3), postedAt: ago(3) },
      { employer: empIds[3], title: 'Tiling & Flooring Specialist',             company: 'Bekal Construction Works',     location: 'Kanhangad',       workCategory: 'construction',  jobType: 'full-time',  workersNeeded: 5, vacancyNumber: 5, dailyWages: '₹700 – ₹900/day', description: 'Skilled tiling and flooring workers needed for villa and commercial construction projects in Kanhangad. Work includes vitrified tile laying, granite fixing, waterproofing, and surface levelling. Location: Kanhangad. Pincode: 671316. Start Date: ' + fwd(5).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(18).toLocaleDateString('en-IN') + '.',                                                                                                           skills: ['Tiling','Flooring','Granite Work','Waterproofing','Surface Levelling'],                             pincode: '671316', maxGroupSize: 5, allowGroupApply: true,  startDate: fwd(5),  deadline: fwd(18), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '6 months',  createdAt: ago(3), postedAt: ago(3) },
      { employer: empIds[3], title: 'Painting & Wall Finishing Worker',         company: 'Bekal Construction Works',     location: 'Kanhangad',       workCategory: 'construction',  jobType: 'contract',   workersNeeded: 4, vacancyNumber: 4, dailyWages: '₹600 – ₹800/day', description: 'Painters and wall finishing experts required for renovation and new construction in Kanhangad. Work involves interior and exterior painting, wall putty, spray painting, and texture finishing. Location: Kanhangad. Pincode: 671316. Start Date: ' + fwd(3).toLocaleDateString('en-IN') + '. Timing: 08:00 to 16:00. Deadline: ' + fwd(16).toLocaleDateString('en-IN') + '. Immediate joining preferred.',                                                                                                                    skills: ['Painting','Wall Putty','Spray Painting','Texture Finishing','Surface Preparation'],                 pincode: '671316', maxGroupSize: 4, allowGroupApply: true,  startDate: fwd(3),  deadline: fwd(16), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '16:00', contractDuration: '3 months',  createdAt: ago(2), postedAt: ago(2) },
      // ── PLUMBING (daily wages) ──
      { employer: empIds[4], title: 'Plumber – Residential Installation',       company: 'Kasaragod Plumbing Solutions', location: 'Kasaragod Town',  workCategory: 'plumbing',      jobType: 'full-time',  workersNeeded: 3, vacancyNumber: 3, dailyWages: '₹650 – ₹850/day', description: 'Experienced plumbers required for new residential projects across Kasaragod. Work includes bathroom fixture installation, water supply pipe laying, overhead tank connections, and leak repairs. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(7).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(21).toLocaleDateString('en-IN') + '.',                                                                                                                 skills: ['Pipe Fitting','Bathroom Fitting','Water Tank Installation','Leak Repair','PVC Pipe Work'],          pincode: '671121',                  allowGroupApply: true,  startDate: fwd(7),  deadline: fwd(21), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '1 year',    createdAt: ago(4), postedAt: ago(4) },
      { employer: empIds[4], title: 'Senior Plumber – Commercial & Industrial', company: 'Kasaragod Plumbing Solutions', location: 'Kasaragod Town',  workCategory: 'plumbing',      jobType: 'full-time',  workersNeeded: 2, vacancyNumber: 2, dailyWages: '₹800 – ₹1,100/day', description: 'Senior plumber with experience in commercial plumbing, solar water heater systems, pump installation, and sewage line design. Must handle multi-floor water supply systems. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(10).toLocaleDateString('en-IN') + '. Timing: 09:00 to 18:00. Deadline: ' + fwd(24).toLocaleDateString('en-IN') + '.',                                                                                                                              skills: ['Plumbing Design','Pump Installation','Solar Water Heater','Sewage Repair','Gas Fitting'],           pincode: '671121',                  allowGroupApply: false, startDate: fwd(10), deadline: fwd(24), immediate: false, workDays: 'Monday to Friday',   workHoursFrom: '09:00', workHoursTo: '18:00', contractDuration: '1 year',    createdAt: ago(6), postedAt: ago(6) },
      { employer: empIds[4], title: 'Drain & Sewage Plumber',                   company: 'Kasaragod Plumbing Solutions', location: 'Kasaragod Town',  workCategory: 'plumbing',      jobType: 'full-time',  workersNeeded: 2, vacancyNumber: 2, dailyWages: '₹550 – ₹750/day', description: 'Drain and sewage plumbers needed for residential and commercial drain cleaning, sewage line repair, and drainage fitting work across Kasaragod. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(5).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(19).toLocaleDateString('en-IN') + '. Immediate joining available.',                                                                                                                                                        skills: ['Drain Cleaning','Sewage Repair','Drainage Fitting','Pipe Excavation','Water Supply'],               pincode: '671121',                  allowGroupApply: true,  startDate: fwd(5),  deadline: fwd(19), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '6 months',  createdAt: ago(2), postedAt: ago(2) },
      // ── FARMING (daily wages) ──
      { employer: empIds[5], title: 'Farm Worker – Paddy & Vegetable',          company: 'Green Valley Agro Farms',      location: 'Nileshwar',       workCategory: 'farming',       jobType: 'seasonal',   workersNeeded:10, vacancyNumber:10, dailyWages: '₹500 – ₹650/day', description: 'Farm workers needed for paddy cultivation, vegetable farming, and general field work at our Nileshwar farmlands. Accommodation provided for outstation workers. Group hiring available. Location: Nileshwar. Pincode: 671317. Start Date: ' + fwd(5).toLocaleDateString('en-IN') + '. Timing: 07:00 to 14:00. Deadline: ' + fwd(18).toLocaleDateString('en-IN') + '. Immediate joining available.',                                                                                                               skills: ['Paddy Cultivation','Vegetable Farming','Harvesting','Irrigation Management','Land Preparation'],    pincode: '671317', maxGroupSize: 8, allowGroupApply: true,  startDate: fwd(5),  deadline: fwd(18), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '07:00', workHoursTo: '14:00', contractDuration: '4 months',  createdAt: ago(2), postedAt: ago(2) },
      { employer: empIds[5], title: 'Organic Farm Supervisor',                  company: 'Green Valley Agro Farms',      location: 'Nileshwar',       workCategory: 'farming',       jobType: 'full-time',  workersNeeded: 1, vacancyNumber: 1, salary: '₹22,000 – ₹28,000/month', description: 'Experienced organic farming supervisor to oversee crop cycles, drip irrigation, pest control and farm operations. Candidates with soil testing and organic certification knowledge preferred. Location: Nileshwar. Pincode: 671317. Start Date: ' + fwd(14).toLocaleDateString('en-IN') + '. Timing: 07:00 to 16:00. Deadline: ' + fwd(30).toLocaleDateString('en-IN') + '.',                                                                                                             skills: ['Organic Farming','Irrigation Management','Pest Control','Soil Testing','Farm Management'],          pincode: '671317',                  allowGroupApply: false, startDate: fwd(14), deadline: fwd(30), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '07:00', workHoursTo: '16:00', contractDuration: '1 year',    createdAt: ago(7), postedAt: ago(7) },
      { employer: empIds[8], title: 'Coconut & Arecanut Farm Worker',           company: 'Malabar Agro Works',           location: 'Uppala',          workCategory: 'farming',       jobType: 'full-time',  workersNeeded: 8, vacancyNumber: 8, dailyWages: '₹550 – ₹700/day', description: 'Farm workers required for coconut climbing, arecanut harvesting, drip irrigation maintenance and general agricultural labour at our Uppala farms. Location: Uppala. Pincode: 671321. Start Date: ' + fwd(3).toLocaleDateString('en-IN') + '. Timing: 07:30 to 16:00. Deadline: ' + fwd(16).toLocaleDateString('en-IN') + '. Immediate joining preferred.',                                                                                                                                                       skills: ['Coconut Climbing','Harvesting','Drip Irrigation Setup','Agricultural Labour','Crop Cultivation'],   pincode: '671321', maxGroupSize: 6, allowGroupApply: true,  startDate: fwd(3),  deadline: fwd(16), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '07:30', workHoursTo: '16:00', contractDuration: '6 months',  createdAt: ago(1), postedAt: ago(1) },
      { employer: empIds[8], title: 'Poultry & Livestock Farm Worker',          company: 'Malabar Agro Works',           location: 'Uppala',          workCategory: 'farming',       jobType: 'full-time',  workersNeeded: 3, vacancyNumber: 3, dailyWages: '₹450 – ₹600/day', description: 'Poultry and livestock farm workers needed for day-to-day feeding, cleaning, health monitoring at our Uppala farm. Accommodation and meals provided. Location: Uppala. Pincode: 671321. Start Date: ' + fwd(6).toLocaleDateString('en-IN') + '. Timing: 06:00 to 14:00. Deadline: ' + fwd(20).toLocaleDateString('en-IN') + '.',                                                                                                                                                  skills: ['Poultry Management','Livestock Care','Farm Hygiene','Animal Feeding','Record Keeping'],              pincode: '671321', maxGroupSize: 3, allowGroupApply: true,  startDate: fwd(6),  deadline: fwd(20), immediate: false, workDays: 'All days (rotating)', workHoursFrom: '06:00', workHoursTo: '14:00', contractDuration: '1 year',    createdAt: ago(4), postedAt: ago(4) },
      // ── EVENT WORKS (CATERING - daily wages) ──
      { employer: empIds[6], title: 'Catering Cook – Wedding & Event Functions',company: 'Spice Coast Catering Services',location: 'Manjeshwar',      workCategory: 'event_works',   jobType: 'part-time',  workersNeeded: 6, vacancyNumber: 6, dailyWages: '₹500 – ₹700/day', description: 'Experienced cooks required for wedding, birthday, and corporate event catering across Kasaragod. Must be skilled in Kerala sadya, biriyani, and multi-cuisine cooking. Location: Manjeshwar. Pincode: 671531. Start Date: ' + fwd(2).toLocaleDateString('en-IN') + '. Timing: 05:30 to 22:00 (Event-based). Deadline: ' + fwd(15).toLocaleDateString('en-IN') + '. Immediate joining available.',                                                                                                                            skills: ['Catering','Cooking','Kerala Cuisine','Food Safety & Hygiene','Food Preparation'],                   pincode: '671531', maxGroupSize: 6, allowGroupApply: true,  startDate: fwd(2),  deadline: fwd(15), immediate: true,  workDays: 'Weekends + Events',  workHoursFrom: '05:30', workHoursTo: '22:00', contractDuration: '6 months',  createdAt: ago(1), postedAt: ago(1) },
      { employer: empIds[6], title: 'Catering Helper & Kitchen Assistant',      company: 'Spice Coast Catering Services',location: 'Manjeshwar',      workCategory: 'event_works',   jobType: 'full-time',  workersNeeded: 5, vacancyNumber: 5, dailyWages: '₹400 – ₹550/day', description: 'Catering helpers and kitchen assistants needed for our catering operations. Work includes food serving, vessel cleaning, kitchen setup and breakdown. No prior experience needed; training provided. Location: Manjeshwar. Pincode: 671531. Start Date: ' + fwd(5).toLocaleDateString('en-IN') + '. Timing: 07:00 to 20:00 (Event-based). Deadline: ' + fwd(18).toLocaleDateString('en-IN') + '.',                                                                                          skills: ['Food Serving','Kitchen Management','Tea & Coffee Service','Cleaning','Event Setup'],                 pincode: '671531', maxGroupSize: 5, allowGroupApply: true,  startDate: fwd(5),  deadline: fwd(18), immediate: false, workDays: 'All days (event)',    workHoursFrom: '07:00', workHoursTo: '20:00', contractDuration: '1 year',    createdAt: ago(3), postedAt: ago(3) },
      // ── OTHER (SALESMAN - with salary) ──
      { employer: empIds[7], title: 'Salesman – Building Materials & Hardware', company: 'Coastal Sales & Marketing',    location: 'Uppala',          workCategory: 'other',         jobType: 'full-time',  workersNeeded: 4, vacancyNumber: 4, salary: '₹12,000 – ₹18,000/month + Incentives', description: 'Field salesmen required to visit retail shops, construction sites and contractors to promote building materials and hardware. Two-wheeler with licence mandatory. Fuel allowance provided. Location: Uppala. Pincode: 671321. Start Date: ' + fwd(4).toLocaleDateString('en-IN') + '. Timing: 09:00 to 18:00. Deadline: ' + fwd(18).toLocaleDateString('en-IN') + '.',                                                                                                  skills: ['Sales','Customer Handling','Product Demonstration','Target Achievement','Field Sales'],              pincode: '671321',                  allowGroupApply: false, startDate: fwd(4),  deadline: fwd(18), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '09:00', workHoursTo: '18:00', contractDuration: '1 year',    createdAt: ago(2), postedAt: ago(2) },
      { employer: empIds[7], title: 'Retail Sales Executive',                   company: 'Coastal Sales & Marketing',    location: 'Kasaragod Town',  workCategory: 'other',         jobType: 'full-time',  workersNeeded: 3, vacancyNumber: 3, salary: '₹10,000 – ₹15,000/month', description: 'Retail sales executives needed for our showroom in Kasaragod Town. Duties include attending customers, product billing, stock management, and daily sales records. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(7).toLocaleDateString('en-IN') + '. Timing: 09:30 to 18:30. Deadline: ' + fwd(21).toLocaleDateString('en-IN') + '.',                                                                                                                             skills: ['Retail Sales','Customer Service','Billing & Invoicing','Stock Management','Communication'],         pincode: '671121',                  allowGroupApply: false, startDate: fwd(7),  deadline: fwd(21), immediate: false, workDays: 'Monday to Saturday', workHoursFrom: '09:30', workHoursTo: '18:30', contractDuration: '1 year',    createdAt: ago(4), postedAt: ago(4) },
      { employer: empIds[7], title: 'General Local Helper – Loading & Delivery',company: 'Coastal Sales & Marketing',    location: 'Kasaragod Town',  workCategory: 'local_workers', jobType: 'full-time',  workersNeeded: 5, vacancyNumber: 5, dailyWages: '₹400 – ₹550/day', description: 'General helpers required for loading, unloading, and delivery of goods from our warehouse and retail outlets across Kasaragod. No experience required. Immediate joiners preferred. Location: Kasaragod Town. Pincode: 671121. Start Date: ' + fwd(3).toLocaleDateString('en-IN') + '. Timing: 08:00 to 17:00. Deadline: ' + fwd(10).toLocaleDateString('en-IN') + '. Immediate joining available.',                                                                                                      skills: ['Loading & Unloading','Delivery','Packing','Warehouse Work','Material Handling'],                    pincode: '671121', maxGroupSize: 5, allowGroupApply: true,  startDate: fwd(3),  deadline: fwd(10), immediate: true,  workDays: 'Monday to Saturday', workHoursFrom: '08:00', workHoursTo: '17:00', contractDuration: '6 months',  createdAt: ago(1), postedAt: ago(1) },
    ];

    for (const j of jobsData) {
      await Jobs.insert({ ...j, status: 'active', adminApproved: true });
    }

    console.log('\n✅ Seed complete!');
    console.log(`   👷 Workers  : ${workerRows.length}  (password: worker@123)`);
    console.log(`   🏢 Employers: ${employerRows.length}  (password: employer@123, all with email)`);
    console.log(`   💼 Jobs     : ${jobsData.length}`);
    console.log(`   🔑 Admin    : admin@agroskill.com / admin123`);
    console.log('\n   Job categories seeded:');
    console.log('   ⚡ Electrical  → Electrical Wiring + AC Technician jobs (daily wages)');
    console.log('   🏗️  Construction → Mason, Labour, Tiling, Painting (daily wages)');
    console.log('   🔧 Plumbing    → Residential, Commercial, Drain (daily wages)');
    console.log('   🌾 Farming     → Paddy, Organic, Coconut, Poultry (daily wages + supervisor salary)');
    console.log('   🎉 Event Works → Catering Cook, Catering Helper (daily wages)');
    console.log('   🔹 Other       → Salesman roles (monthly salary)');
    console.log('   🏘️  Local Workers → General Helper (daily wages)\n');
    console.log('   📋 Enhanced job details: pincode, location, deadline, start date, timing,');
    console.log('      vacancy number, immediate availability, daily wages/salary\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
