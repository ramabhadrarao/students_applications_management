// src/pages/ApplicationsPage.tsx - FIXED VERSION WITH EDIT/DELETE

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
  AlertTriangle,    // ADDED - This was missing
  User,
  BookOpen,
  Send,
  MoreVertical,
  Download,
  Upload,
  ArrowUpDown,
  Settings,
  RefreshCw,
  GraduationCap,
  Award,
  Phone,
  Mail,
  MapPin,
  Star,
  Trash2,
  CheckSquare,
  Square
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
    submitApplication,
    deleteApplication,
    bulkUpdateApplications,
    bulkDeleteApplications,
    deleteLoading,
    bulkLoading,
    bulkDeleteLoading
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
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  
  // Bulk update form
  const [bulkUpdateData, setBulkUpdateData] = useState({
    status: '',
    academicYear: ''
  });

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
      page: 1
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
      fetchApplications(filters);
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Individual delete handler
  const handleDeleteApplication = async (applicationId: string) => {
    try {
      await deleteApplication(applicationId);
      setShowDeleteModal(null);
      fetchApplications(filters);
      setSelectedApplications([]);
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  // Bulk operations handlers
  const handleBulkUpdate = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      const updates = Object.entries(bulkUpdateData)
        .filter(([_, value]) => value && value.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(updates).length === 0) {
        alert('Please select at least one field to update.');
        return;
      }
      
      await bulkUpdateApplications({
        applicationIds: selectedApplications,
        updates
      });
      
      setShowBulkUpdateModal(false);
      setBulkUpdateData({ status: '', academicYear: '' });
      setSelectedApplications([]);
      fetchApplications(filters);
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      await bulkDeleteApplications(selectedApplications);
      setShowBulkDeleteModal(false);
      setSelectedApplications([]);
      fetchApplications(filters);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  // Permission checks
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

  const canDelete = (application: any) => {
    return (user?.role === 'admin') ||
           (user?.role === 'student' && 
            application.userId === user._id && 
            application.status === 'draft');
  };

  const canBulkEdit = user?.role === 'admin' || user?.role === 'program_admin';
  const canBulkDelete = user?.role === 'admin';

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

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
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
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </button>
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
        {[
          { label: 'Total', count: pagination.total || stats.total, color: 'bg-gray-500', icon: FileText },
          { label: 'Draft', count: stats.draft, color: 'bg-gray-400', icon: FileText },
          { label: 'Submitted', count: stats.submitted, color: 'bg-blue-500', icon: Send },
          { label: 'Review', count: stats.underReview, color: 'bg-purple-500', icon: Clock },
          { label: 'Approved', count: stats.approved, color: 'bg-green-500', icon: CheckCircle },
          { label: 'Rejected', count: stats.rejected, color: 'bg-red-500', icon: XCircle }
        ].map((stat) => (
          <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
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
        </div>
      )}

      {/* Bulk Actions Bar */}
      {applications.length > 0 && (canBulkEdit || canBulkDelete) && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedApplications.length === applications.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Select All ({applications.length})
              </button>
              
              {selectedApplications.length > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedApplications.length} selected
                </span>
              )}
            </div>
            
            {selectedApplications.length > 0 && (
              <div className="flex items-center space-x-3">
                {canBulkEdit && (
                  <button
                    onClick={() => setShowBulkUpdateModal(true)}
                    disabled={bulkLoading}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Bulk Edit
                  </button>
                )}
                
                {canBulkDelete && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    disabled={bulkDeleteLoading}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Bulk Delete
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedApplications([])}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications Display */}
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
        // Applications List
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application._id}>
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Selection checkbox */}
                      {(canBulkEdit || canBulkDelete) && (
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application._id)}
                          onChange={() => handleSelectApplication(application._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      
                      <div className="flex-shrink-0">
                        {getStatusIcon(application.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              to={`/applications/${application._id}`}
                              className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                            >
                              {application.studentName}
                            </Link>
                            <p className="text-sm text-gray-500">#{application.applicationNumber}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Application Information */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                            <span className="truncate">
                              {typeof application.programId === 'object' 
                                ? `${application.programId?.programName} (${application.programId?.programCode})`
                                : application.programId}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                            <span className="truncate">{application.email}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                            <span>{formatPhoneNumber(application.mobileNumber)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                            <span>Academic Year: {application.academicYear}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <span>
                              {application.submittedAt 
                                ? `Submitted: ${new Date(application.submittedAt).toLocaleDateString()}`
                                : `Created: ${new Date(application.dateCreated).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/applications/${application._id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                      
                      {canEdit(application) && (
                        <Link
                          to={`/applications/${application._id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      )}
                      
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
                      
                      <Link
                        to={`/applications/${application._id}/documents`}
                        className="inline-flex items-center px-3 py-1 border border-purple-300 shadow-sm text-xs leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Documents
                      </Link>

                      {canDelete(application) && (
                        <button
                          onClick={() => setShowDeleteModal(application._id)}
                          disabled={deleteLoading === application._id}
                          className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleteLoading === application._id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Status-specific Messages */}
                  {application.status === 'rejected' && application.approvalComments && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {application.approvalComments}
                      </p>
                    </div>
                  )}
                  
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this application? This action cannot be undone and all related data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDeleteApplication(showDeleteModal)}
                  disabled={deleteLoading === showDeleteModal}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteLoading === showDeleteModal ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Bulk Update Applications
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Updating {selectedApplications.length} applications. Leave fields empty to keep current values.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={bulkUpdateData.status}
                          onChange={(e) => setBulkUpdateData(prev => ({ ...prev, status: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Keep current status</option>
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="frozen">Frozen</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                        <select
                          value={bulkUpdateData.academicYear}
                          onChange={(e) => setBulkUpdateData(prev => ({ ...prev, academicYear: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Keep current year</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2026-27">2026-27</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {bulkLoading ? 'Updating...' : 'Update Applications'}
                </button>
                <button
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Applications
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong>{selectedApplications.length}</strong> applications? 
                        This action cannot be undone and all related data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {bulkDeleteLoading ? 'Deleting...' : 'Delete Applications'}
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;