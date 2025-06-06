import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import useUserStore from '../stores/userStore';
import useProgramStore from '../stores/programStore';

const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, loading, error, fetchUsers, createUser, updateUser } = useUserStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    isActive: true,
    programId: ''
  });

  useEffect(() => {
    fetchPrograms();
    
    if (id) {
      const user = users.find(u => u._id === id);
      if (user) {
        setFormData({
          ...user,
          password: '' // Don't show existing password
        });
      } else {
        fetchUsers();
      }
    }
  }, [id, users]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (id) {
        // Only include password if it was changed
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await updateUser(id, updateData);
      } else {
        await createUser(formData);
      }
      navigate('/users');
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/users')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit User' : 'New User'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password {id && '(leave blank to keep current password)'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                {...(!id && { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="student">Student</option>
                <option value="program_admin">Program Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {formData.role === 'program_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Program
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.programName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            {id ? 'Update' : 'Create'} User
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;