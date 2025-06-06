import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, BookOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../stores/authStore';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalApplications: 0,
    draftApplications: 0,
    submittedApplications: 0,
    underReviewApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalPrograms: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch applications stats
        let appStats = { totalApplications: 0 };
        if (user.role === 'admin') {
          const { data } = await axios.get('/api/applications/statistics?academicYear=2025-26');
          appStats = data.statusStats || {};
        } else {
          const { data } = await axios.get('/api/applications?limit=1000');
          // Count applications by status
          const statusCounts = data.docs.reduce((acc, app) => {
            acc.totalApplications = (acc.totalApplications || 0) + 1;
            acc[`${app.status}Applications`] = (acc[`${app.status}Applications`] || 0) + 1;
            return acc;
          }, {});
          appStats = statusCounts;
        }
        
        // Fetch programs count (admin only)
        let programsCount = 0;
        if (user.role === 'admin') {
          const { data } = await axios.get('/api/programs');
          programsCount = data.length;
        }
        
        // Fetch users count (admin only)
        let usersCount = 0;
        if (user.role === 'admin') {
          const { data } = await axios.get('/api/users');
          usersCount = data.length;
        }
        
        // Fetch recent applications
        const { data: recentApps } = await axios.get('/api/applications?sortField=dateCreated&sortOrder=desc&limit=5');
        
        setStats({
          totalApplications: appStats.totalApplications || 0,
          draftApplications: appStats.draftApplications || 0,
          submittedApplications: appStats.submittedApplications || 0,
          underReviewApplications: appStats.underReviewApplications || 0,
          approvedApplications: appStats.approvedApplications || 0,
          rejectedApplications: appStats.rejectedApplications || 0,
          totalPrograms: programsCount,
          totalUsers: usersCount,
        });
        
        setRecentApplications(recentApps.docs || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user.role]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-800">{error}</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Applications
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.totalApplications}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/applications"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all applications
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Approved Applications
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.approvedApplications}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/applications?status=approved"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    View approved applications
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Review
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.submittedApplications + stats.underReviewApplications}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/applications?status=submitted"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    View pending applications
                  </Link>
                </div>
              </div>
            </div>
            
            {user.role === 'admin' && (
              <>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Programs
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalPrograms}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link
                        to="/programs"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Manage programs
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Users
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalUsers}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link
                        to="/users"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Manage users
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Recent applications */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
              <p className="mt-1 text-sm text-gray-500">
                Latest activity in the application system
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <li key={app._id}>
                    <Link
                      to={`/applications/${app._id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {app.applicationNumber} - {app.studentName}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              app.status === 'approved' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {app.status.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Program: {app.programId?.programName}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              {new Date(app.dateCreated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-4 py-5 text-center text-sm text-gray-500">
                  No applications found
                </li>
              )}
            </ul>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <Link
                  to="/applications"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  View all applications
                </Link>
              </div>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {user.role === 'student' && (
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/applications/new" className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">New Application</p>
                        <p className="text-sm text-gray-500 truncate">Create a new application</p>
                      </Link>
                    </div>
                  </div>
                )}
                
                {(user.role === 'admin' || user.role === 'program_admin') && (
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/applications?status=submitted" className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">Pending Applications</p>
                        <p className="text-sm text-gray-500 truncate">Review submitted applications</p>
                      </Link>
                    </div>
                  </div>
                )}
                
                {user.role === 'admin' && (
                  <>
                    <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to="/programs/new" className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="text-sm font-medium text-gray-900">New Program</p>
                          <p className="text-sm text-gray-500 truncate">Create a new program</p>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to="/users/new" className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="text-sm font-medium text-gray-900">New User</p>
                          <p className="text-sm text-gray-500 truncate">Create a new user account</p>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/profile" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Profile</p>
                      <p className="text-sm text-gray-500 truncate">Update your profile</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;