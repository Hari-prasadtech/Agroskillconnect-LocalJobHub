import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Tractor, Construction, Zap, Droplet, HardHat, Users,
  Search, FileCheck, Briefcase, TrendingUp, Shield, Globe,
  CheckCircle, Star, Award, Target
} from 'lucide-react';
import Navbar from '../components/Navbar';

const Services = () => {
  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 });

  const workerServices = [
    {
      icon: Search,
      title: 'Job Search & Matching',
      desc: 'AI-powered job matching that connects you with opportunities matching your skills, experience, and location preferences.'
    },
    {
      icon: FileCheck,
      title: 'Profile Verification',
      desc: 'Build trust with employers through our verification system for skills, certifications, and work experience.'
    },
    {
      icon: Briefcase,
      title: 'Portfolio Building',
      desc: 'Showcase your work, skills, and achievements with a professional digital portfolio that attracts employers.'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      desc: 'Access training resources, skill development courses, and career advancement opportunities.'
    }
  ];

  const employerServices = [
    {
      icon: Users,
      title: 'Talent Pool Access',
      desc: 'Access a trusted database of verified skilled workers from across Kasaragod district in agriculture, cashew, beedi, and construction.'
    },
    {
      icon: Shield,
      title: 'Secure Hiring',
      desc: 'Hire with confidence using our verification system, background checks, and secure payment processing.'
    },
    {
      icon: Globe,
      title: 'Kasaragod-Wide Reach',
      desc: 'Post jobs and find workers across all taluks of Kasaragod — from Kanhangad to Manjeshwar, Uppala to Nileshwar.'
    },
    {
      icon: Target,
      title: 'Smart Matching',
      desc: 'AI-powered candidate matching ensures you find workers who perfectly fit your job requirements.'
    }
  ];

  const benefits = [
    'Free registration for workers',
    'Verified employer profiles',
    'Mobile app access',
    'Local Kasaragod opportunities'
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-bg pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-xl text-neutral-600">
              Comprehensive solutions for skilled workers and employers across Kasaragod district. 
              Connecting local talent in cashew processing, farming, construction, electrical, beedi work, and more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services for Workers */}
      <section id="services-details" ref={ref1} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">For Workers</h2>
            <p className="section-subtitle">
              Everything you need to find work and grow your career
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workerServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                  <service.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 text-center">
                  {service.title}
                </h3>
                <p className="text-neutral-600 text-sm text-center">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services for Employers */}
      <section ref={ref2} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">For Employers</h2>
            <p className="section-subtitle">
              Find and hire the perfect talent for your business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {employerServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-accent-100 hover:border-accent-300"
              >
                <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                  <service.icon className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 text-center">
                  {service.title}
                </h3>
                <p className="text-neutral-600 text-sm text-center">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">Platform Benefits</h2>
            <p className="section-subtitle">
              Why choose AgroSkillConnect
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-primary-100 rounded-full p-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-neutral-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-neutral-900">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-neutral-600">
              Join workers and employers connecting across Kasaragod district
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href="/register" className="btn-primary flex items-center space-x-2">
                <span>Register Now</span>
              </a>
              <a href="/contact" className="btn-secondary">
                Contact Us
              </a>
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
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
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

export default Services;