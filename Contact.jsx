import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from '../utils/axios';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    try {
      const res = await axios.post('/api/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject || 'New Message - AgroSkillConnect Kasaragod',
        message: formData.message,
      });
      if (res.data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitStatus('error');
    }
    setLoading(false);
    setTimeout(() => setSubmitStatus(null), 6000);
  };

  const contactInfo = [
    { icon: Mail, title: 'Email Us', details: 'agroskillconnect@gmail.com', link: 'mailto:agroskillconnect@gmail.com', desc: 'Send us an email anytime' },
    { icon: Phone, title: 'Call Us', details: '+91-467-2234567', link: 'tel:+914672234567', desc: 'Mon-Sat from 9am to 6pm' },
    { icon: MapPin, title: 'Visit Us', details: 'Kasaragod Town, Kerala', link: '#', desc: 'Kasaragod District, Kerala 671121' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="gradient-bg pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">Get In <span className="text-gradient">Touch</span></h1>
            <p className="text-xl text-neutral-600">Have questions about jobs in Kasaragod? Reach out to us — we're here to help connect you with the right opportunities.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {contactInfo.map((info, index) => (
              <motion.a key={index} href={info.link} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="card hover:scale-105 text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary-100 rounded-full p-4"><info.icon className="w-8 h-8 text-primary-600" /></div>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{info.title}</h3>
                <p className="text-primary-600 font-medium mb-1">{info.details}</p>
                <p className="text-sm text-neutral-500">{info.desc}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Send Us a Message</h2>

              {submitStatus === 'success' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Message Sent Successfully!</h4>
                    <p className="text-sm text-green-700">Your message has been delivered to agroskillconnect@gmail.com. We'll get back to you soon!</p>
                  </div>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Failed to Send</h4>
                    <p className="text-sm text-red-700">Something went wrong. Please try again or email us directly at agroskillconnect@gmail.com</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-neutral-700 font-medium mb-2">Your Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" placeholder="Your full name" autoComplete="name" />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-2">Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="yourname@example.com" autoComplete="email" />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-2">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" autoComplete="tel" />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-2">Subject *</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="input-field" placeholder="How can we help?" autoComplete="off" />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-2">Message *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" className="input-field resize-none" placeholder="Tell us more about what you need..."></textarea>
                  <p className="text-xs text-neutral-400 mt-2">💬 Share any issues, troubles, or concerns you'd like us to know about...</p>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50">
                  {loading
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div><span>Sending...</span></>
                    : <><Send className="w-5 h-5" /><span>Send Message</span></>
                  }
                </button>
                <p className="text-xs text-neutral-400 text-center">Your message will be sent directly to agroskillconnect@gmail.com</p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
