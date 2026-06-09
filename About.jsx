import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Target, Eye, Award, Users, Briefcase, Globe, 
  TrendingUp, Heart, Shield, Zap 
} from 'lucide-react';
import Navbar from '../components/Navbar';

const About = () => {
  const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.1 });

  const values = [
    {
      icon: Heart,
      title: 'Worker-Centric',
      desc: 'We prioritize the needs and welfare of Kasaragod workers, ensuring fair opportunities and transparent processes.'
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      desc: 'Building a secure platform where local workers and employers can connect with confidence and peace of mind.'
    },
    {
      icon: Globe,
      title: 'Local Focus',
      desc: 'Connecting talent across Kasaragod district, from Kanhangad to Manjeshwar, strengthening our local economy.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      desc: 'Leveraging technology to match the right talent with the right opportunities in our district.'
    }
  ];

  const stats = [
    { value: '2.5k+', label: 'Active Workers', icon: Users },
    { value: '500+', label: 'Job Postings', icon: Briefcase },
    { value: '150+', label: 'Local Businesses', icon: Globe },
    { value: '95%', label: 'Success Rate', icon: TrendingUp }
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Founder', initial: 'SJ' },
    { name: 'Michael Chen', role: 'CTO', initial: 'MC' },
    { name: 'Emily Rodriguez', role: 'Head of Operations', initial: 'ER' },
    { name: 'David Kim', role: 'Head of Product', initial: 'DK' }
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
              Kasaragod's Job Platform,{' '}
              <span className="text-gradient">Connecting Local Talent</span>
            </h1>
            <p className="text-xl text-neutral-600">
              AgroSkillConnect is Kasaragod district's dedicated platform bridging the gap between 
              skilled workers and local employers. From Kanhangad to Manjeshwar, we believe every skilled 
              worker in our community deserves access to quality employment opportunities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section ref={ref1} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView1 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-4xl font-bold text-neutral-900">Our Mission</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                To democratize access to employment opportunities for skilled workers 
                across Kasaragod district in agriculture, cashew processing, beedi manufacturing, 
                construction, electrical, plumbing, and other essential trades. We strive to create 
                a transparent, efficient, and fair marketplace that benefits both workers and local employers.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed">
                By focusing on Kasaragod's unique economic landscape - from cashew industries in Kanhangad 
                to beedi manufacturing in Kasaragod town, from coconut farming to construction - we ensure 
                that every worker can find local opportunities that match their skills and experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView1 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-accent-100 rounded-full w-20 h-20 flex items-center justify-center mb-6">
                <Eye className="w-10 h-10 text-accent-600" />
              </div>
              <h2 className="text-4xl font-bold text-neutral-900">Our Vision</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                To become Kasaragod district's leading platform for connecting skilled workers 
                with meaningful employment opportunities, transforming lives across our 
                local communities from Uppala to Manjeshwar.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed">
                We envision a future where every locality in Kasaragod - whether it's Kanhangad, 
                Nileshwar, or Kasaragod town - has equal access to opportunities, where skilled 
                workers earn fair wages in safe conditions, and where local employers can easily 
                find qualified talent to grow their businesses and strengthen our district's economy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Our Impact</h2>
            <p className="section-subtitle">
              Making a difference in the lives of workers and employers across Kasaragod district
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-full p-6 shadow-lg">
                    <stat.icon className="w-10 h-10 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-5xl font-bold text-primary-600 mb-2">{stat.value}</h3>
                <p className="text-neutral-700 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section ref={ref2} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Our Core Values</h2>
            <p className="section-subtitle">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card text-center hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-primary-100 rounded-full p-4">
                    <value.icon className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-neutral-600">{value.desc}</p>
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
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-4xl font-bold text-neutral-900">
              Join Our Mission
            </h2>
            <p className="text-lg text-neutral-600">
              Be part of a platform that's changing lives and creating opportunities across Kasaragod district
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/register" className="btn-primary">
                Get Started Today
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

export default About;
