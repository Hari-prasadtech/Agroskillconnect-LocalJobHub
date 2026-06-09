import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, Users, Eye, TrendingUp, PlusCircle,
  User, FileText, BarChart3, Clock, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import axios from '../../utils/axios';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    jobsPosted: 0,
    activeJobs: 0,
    totalApplications: 0,
    hiresCompleted: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch jobs and applications in parallel
      const [jobsResponse, appsResponse] = await Promise.all([
        axios.get('/api/jobs/my'),
        axios.get('/api/applications/employer'),
      ]);
      const jobs = jobsResponse.data;
      const applications = appsResponse.data;
      
      setStats({
        jobsPosted: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalApplications: applications.length,
        hiresCompleted: applications.filter(a => a.status === 'accepted').length
      });
      
      setRecentJobs(jobs.slice(0, 3));
      setRecentApplications(applications.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard. Please check that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Jobs Posted', 
      value: stats.jobsPosted, 
      icon: Briefcase, 
      color: 'primary',
      link: '/employer/jobs'
    },
    { 
      label: 'Active Jobs', 
      value: stats.activeJobs, 
      icon: Eye, 
      color: 'green',
      link: '/employer/jobs'
    },
    { 
      label: 'Total Applications', 
      value: stats.totalApplications, 
      icon: FileText, 
      color: 'blue',
      link: '/employer/jobs'
    },
    { 
      label: 'Hires Completed', 
      value: stats.hiresCompleted, 
      icon: CheckCircle, 
      color: 'accent',
      link: '/employer/jobs'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-neutral-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center p-6">
          <div className="rounded-full bg-red-100 p-4">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-800">Failed to Load Dashboard</h2>
          <p className="text-neutral-500 text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 mb-8 text-white shadow-xl"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="text-white/90 text-lg">
                {stats.activeJobs > 0 
                  ? `You have ${stats.activeJobs} active job posting${stats.activeJobs > 1 ? 's' : ''} with ${stats.totalApplications} total application${stats.totalApplications !== 1 ? 's' : ''}` 
                  : 'Start posting jobs to find the perfect candidates'}
              </p>
            </div>
            <Link to="/employer/post-job">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5" />
                  <span>Post New Job</span>
                </div>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link to={stat.link} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recent Jobs Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Your Recent Job Postings</h2>
            <Link to="/employer/jobs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary-600 font-semibold hover:underline"
              >
                View All →
              </motion.button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentJobs.length > 0 ? (
              recentJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-neutral-900 mb-1">{job.title}</h3>
                      <p className="text-neutral-600 text-sm">{job.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      job.status === 'active' ? 'bg-green-100 text-green-700' :
                      job.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Applications</span>
                      <span className="font-semibold text-neutral-900">{job.applicantCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Posted</span>
                      <span className="font-semibold text-neutral-900">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Job Type</span>
                      <span className="font-semibold text-neutral-900">{job.jobType}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/employer/applications/${job._id}`} className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary-500 text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                      >
                        View Applications ({job.applicantCount || 0})
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-md">
                <Briefcase className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">No jobs posted yet</h3>
                <p className="text-neutral-500 mb-4">Post your first job to start receiving applications</p>
                <Link to="/employer/post-job">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Post Your First Job
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Recent Applications</h2>
            <Link to="/employer/jobs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary-600 font-semibold hover:underline"
              >
                View All →
              </motion.button>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {recentApplications.length > 0 ? (
              <div className="divide-y divide-neutral-200">
                {recentApplications.map((app, index) => (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="p-6 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/employer/applications/${app.job?._id}`)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-neutral-900 mb-1">
                          {app.applicant?.name || 'Applicant'}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-2">
                          Applied for: {app.job?.title || 'Job Position'}
                        </p>
                        <div className="flex items-center text-neutral-500 text-sm">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">No applications yet</h3>
                <p className="text-neutral-500 mb-4">Applications will appear here once candidates start applying</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
