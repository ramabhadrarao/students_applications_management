// File: src/pages/ProgramsPage.tsx (Enhanced)
// Purpose: Programs management with certificate requirements

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, Settings, Award, FileText } from 'lucide-react';
import useProgramStore from '../stores/programStore';

const ProgramsPage = () => {
  const { programs, loading, error, fetchPrograms, deleteProgram } = useProgramStore();
  const [filters, setFilters] = useState({
    programType: '',
    isActive: 'true'
  });

  useEffect(() => {
    fetchPrograms(filters);
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === 'all' ? '' : value
    }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProgram(id);
      } catch (err) {
        console.error('Failed to delete program:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Programs Management</h1>
        <Link
          to="/programs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Programs</dt>
                  <dd className="text-lg font-medium text-gray-900">{programs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">UG Programs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {programs.filter(p => p.programType === 'UG').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">PG Programs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {programs.filter(p => p.programType === 'PG').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Seats</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {programs.reduce((sum, p) => sum + p.totalSeats, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Type</label>
            <select
              name="programType"
              value={filters.programType}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="">All</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="Search programs..."
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Programs List */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-800">{error}</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {programs.map((program) => (
              <li key={program._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {program.programName}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Code: {program.programCode} | Type: {program.programType} | Department: {program.department}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            program.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <Award className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Duration: {program.durationYears} years
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Total Seats: {program.totalSeats}
                          </div>
                          {program.applicationStartDate && program.applicationEndDate && (
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              Applications: {new Date(program.applicationStartDate).toLocaleDateString()} - {new Date(program.applicationEndDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <div className="flex space-x-2">
                        <Link
                          to={`/programs/${program._id}/certificates`}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Manage Certificate Requirements"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Certificates
                        </Link>
                        <Link
                          to={`/programs/${program._id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </div>
                      <button
                        onClick={() => handleDelete(program._id, program.programName)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Program Description */}
                  {program.description && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                    </div>
                  )}
                  
                  {/* Eligibility & Fees Quick View */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {program.eligibilityCriteria && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Eligibility</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{program.eligibilityCriteria}</p>
                      </div>
                    )}
                    {program.feesStructure && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Fees Structure</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{program.feesStructure}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {programs.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No programs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new program.
              </p>
              <div className="mt-6">
                <Link
                  to="/programs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Program
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;