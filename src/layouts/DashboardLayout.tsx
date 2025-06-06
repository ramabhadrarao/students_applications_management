// File: src/layouts/DashboardLayout.tsx
// Purpose: Enhanced layout with notifications and new navigation items

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  Bell, 
  User, 
  FileText,
  Upload,
  Settings,
  Award,
  Users,
  BookOpen
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, getUnreadCount, notifications, fetchNotifications } = useNotificationStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    if (user) {
      getUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        getUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    if (!notificationsOpen) {
      fetchNotifications({ limit: 5 }); // Fetch recent notifications
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FileText,
      show: true
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: FileText,
      show: true
    },
    {
      name: 'My Files',
      href: '/files',
      icon: Upload,
      show: true
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      show: true,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      name: 'Programs',
      href: '/programs',
      icon: BookOpen,
      show: user?.role === 'admin'
    },
    {
      name: 'Certificate Types',
      href: '/certificate-types',
      icon: Award,
      show: user?.role === 'admin'
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      show: user?.role === 'admin'
    }
  ].filter(item => item.show);

  const SidebarContent = () => (
    <>
      <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex-shrink-0 flex items-center px-4">
          <h1 className="text-white text-xl font-bold">Student Application Portal</h1>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-blue-100 hover:bg-blue-700'
                }`
              }
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
        <div className="flex-shrink-0 group block w-full">
          <div className="flex items-center">
            <div>
              <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center text-white">
                {user?.email[0].toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs font-medium text-blue-200 group-hover:text-white capitalize">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
        <div className="flex-shrink-0 w-14"></div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-800">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-4">
                {/* Notifications dropdown */}
                <div className="relative">
                  <button
                    className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleNotificationClick}
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                        <NavLink
                          to="/notifications"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View All
                        </NavLink>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div key={notification._id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                              <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'success' ? 'bg-green-400' :
                                  notification.type === 'warning' ? 'bg-yellow-400' :
                                  notification.type === 'danger' ? 'bg-red-400' :
                                  'bg-blue-400'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.dateCreated).toLocaleDateString()}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white">
                      {user?.email[0].toUpperCase()}
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                  {profileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
                      </div>
                      <NavLink
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="inline h-4 w-4 mr-2" />
                        Your Profile
                      </NavLink>
                      <NavLink
                        to="/files"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Upload className="inline h-4 w-4 mr-2" />
                        My Files
                      </NavLink>
                      {user?.role === 'admin' && (
                        <NavLink
                          to="/certificate-types"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="inline h-4 w-4 mr-2" />
                          Settings
                        </NavLink>
                      )}
                      <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                        onClick={handleLogout}
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;