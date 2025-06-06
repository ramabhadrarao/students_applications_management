// File: src/pages/ApplicationsPage.tsx
// Purpose: Enhanced applications management with filtering, editing, and role-based features

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit2, 
  Eye, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  BookOpen,
  Send,
  MoreVertical,
  Download,
  Upload,
  ArrowUpDown,
  Settings,
  RefreshCw
} from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
import useAuthStore from '../stores/authStore';
import useProgramStore from '../stores/programStore';

const ApplicationsPage = () => {
  const { user } = useAuthStore();
  const { 
    applications, 
    pagination, 
    loading, 
    error, 
    fetchApplications,
    submitApplication 
  } = useApplicationStore();
  
  const { programs, fetchPrograms } = useProgramStore();

  const [filters, setFilters] = useState({
    status: '',
    programId: '',
    academicYear: '2025-26',
    page: 1,
    limit: 10,
    sortField: 'dateCreated',
    sortOrder: 'desc',
    search: ''
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications(filters);
    if (user?.role === 'admin' || user?.role === 'program_admin') {
      fetchPrograms();
    }
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleSelectApplication = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app._id));
    }
  };

  const handleSubmitApplication = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await submitApplication(applicationId);
      // Refresh the list
      fetchApplications(filters);
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_review': return <Clock className="h-5 w-5 text-purple-500" />;
      case 'submitted': return <Send className="h-5 w-5 text-blue-500" />;
      case 'draft': return <FileText className="h-5 w-5 text-gray-500" />;
      case 'frozen': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'frozen': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = (application: any) => {
    return user?.role === 'student' && 
           application.userId === user._id && 
           ['draft', 'rejected'].includes(application.status);
  };

  const canSubmit = (application: any) => {
    return user?.role === 'student' && 
           application.userId === user._id && 
           application.status === 'draft';
  };

  const getQuickStats = () => {
    const stats = {
      total: applications.length,
      draft: applications.filter(app => app.status === 'draft').length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      underReview: applications.filter(app => app.status === 'under_review').length
    };
    return stats;
  };

  const stats = getQuickStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user?.role === 'student' 
              ? 'Manage your applications and track their progress'
              : 'Review and manage student applications'
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchApplications(filters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          {user?.role === 'student' && (
            <Link
              to="/applications/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{pagination.total || stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-400 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Send className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Submitted</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.submitted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Review</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.underReview}</dd>
                </dl>
              </div>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search applications..."
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>

            {(user?.role === 'admin' || user?.role === 'program_admin') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Program</label>
                <select
                  name="programId"
                  value={filters.programId}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Programs</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.programName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sort by:</span>
              <button
                onClick={() => handleSort('dateCreated')}
                className={`text-sm px-3 py-1 rounded-md border ${
                  filters.sortField === 'dateCreated' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Date Created {filters.sortField === 'dateCreated' && (
                  <ArrowUpDown className="inline h-3 w-3 ml-1" />
                )}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={`text-sm px-3 py-1 rounded-md border ${
                  filters.sortField === 'status' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Status {filters.sortField === 'status' && (
                  <ArrowUpDown className="inline h-3 w-3 ml-1" />
                )}
              </button>
              <button
                onClick={() => handleSort('studentName')}
                className={`text-sm px-3 py-1 rounded-md border ${
                  filters.sortField === 'studentName' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Student Name {filters.sortField === 'studentName' && (
                  <ArrowUpDown className="inline h-3 w-3 ml-1" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Show:</span>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (user?.role === 'admin' || user?.role === 'program_admin') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedApplications.length} application(s) selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setSelectedApplications([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
              {/* Add bulk actions here for admin/program_admin */}
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading applications</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => fetchApplications(filters)}
                  className="bg-red-100 px-2 py-1 text-sm text-red-800 rounded hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {Object.values(filters).some(v => v && v !== '2025-26') ? 'No applications match your filters' : 'No applications found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'student' 
              ? 'Get started by creating your first application.'
              : 'No applications have been submitted yet.'
            }
          </p>
          {user?.role === 'student' && !Object.values(filters).some(v => v && v !== '2025-26') && (
            <div className="mt-6">
              <Link
                to="/applications/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Application
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Table Header with Selection */}
          {(user?.role === 'admin' || user?.role === 'program_admin') && (
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === applications.length && applications.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application ({applications.length})
                </span>
              </div>
            </div>
          )}

          {/* Applications List */}
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Selection checkbox for admin/program_admin */}
                      {(user?.role === 'admin' || user?.role === 'program_admin') && (
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application._id)}
                          onChange={() => handleSelectApplication(application._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(application.status)}
                      </div>
                      
                      {/* Application Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              to={`/applications/${application._id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {application.applicationNumber}
                            </Link>
                            <p className="text-sm text-gray-900 font-medium">
                              {application.studentName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex sm:space-x-6">
                            <div className="flex items-center text-sm text-gray-500">
                              <BookOpen className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              Program: {typeof application.programId === 'object' 
                                ? application.programId?.programName 
                                : application.programId || 'N/A'}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {application.submittedAt 
                                ? `Submitted: ${new Date(application.submittedAt).toLocaleDateString()}`
                                : `Created: ${new Date(application.dateCreated).toLocaleDateString()}`
                              }
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              Academic Year: {application.academicYear}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* View Button */}
                      <Link
                        to={`/applications/${application._id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                      
                      {/* Edit Button - Only for students on draft/rejected applications */}
                      {canEdit(application) && (
                        <Link
                          to={`/applications/${application._id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      )}
                      
                      {/* Submit Button - Only for students on draft applications */}
                      {canSubmit(application) && (
                        <button
                          onClick={() => handleSubmitApplication(application._id)}
                          disabled={actionLoading === application._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === application._id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          Submit
                        </button>
                      )}
                      
                      {/* Documents Button */}
                      <Link
                        to={`/applications/${application._id}/documents`}
                        className="inline-flex items-center px-3 py-1 border border-purple-300 shadow-sm text-xs leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Documents
                      </Link>
                    </div>
                  </div>
                  
                  {/* Additional Info for rejected applications */}
                  {application.status === 'rejected' && application.approvalComments && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {application.approvalComments}
                      </p>
                    </div>
                  )}
                  
                  {/* Additional Info for approved applications */}
                  {application.status === 'approved' && application.approvalComments && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-800">
                        <strong>Approval Comments:</strong> {application.approvalComments}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;