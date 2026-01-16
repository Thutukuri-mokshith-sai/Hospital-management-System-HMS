import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Shield,
  Bell,
  Save,
  Edit,
  X,
  Check,
  RefreshCw,
  Download,
  Key,
  AlertCircle,
  Heart,
  UserCircle,
  LogOut,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const PatientProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({
    profile: true,
    notifications: true,
    emergency: true
  });
  const [profile, setProfile] = useState({
    personal: null,
    emergency: null,
    notifications: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    address: '',
    bloodGroup: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [emergencyData, setEmergencyData] = useState({
    contactName: '',
    relationship: '',
    phone: '',
    notes: ''
  });

  // Set up axios interceptor
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
  }, [navigate]);

  // Fetch all profile data
  const fetchProfileData = async () => {
    try {
      setError('');
      setLoading({ profile: true, notifications: true, emergency: true });

      // Fetch profile
      const profileRes = await axios.get(`${API_BASE_URL}/patients/me`);
      if (profileRes.data.success) {
        const patientData = profileRes.data.data;
        setProfile(prev => ({ ...prev, personal: patientData }));
        setFormData({
          age: patientData.age || '',
          gender: patientData.gender || '',
          address: patientData.address || '',
          bloodGroup: patientData.bloodGroup || '',
          phone: patientData.userId?.phone || ''
        });
      }

      // Fetch emergency contact
      const emergencyRes = await axios.get(`${API_BASE_URL}/patients/emergency-contact`);
      if (emergencyRes.data.success) {
        setProfile(prev => ({ ...prev, emergency: emergencyRes.data.data }));
        // Parse emergency contact from careNotes
        const emergencyNote = emergencyRes.data.data?.[0];
        if (emergencyNote) {
          const content = emergencyNote.content;
          const match = content.match(/Emergency Contact: (.+?) \((.+?)\) - (.+?)\.(.+)?/);
          if (match) {
            setEmergencyData({
              contactName: match[1],
              relationship: match[2],
              phone: match[3],
              notes: match[4] || ''
            });
          }
        }
      }

      // Fetch notifications
      const notificationsRes = await axios.get(`${API_BASE_URL}/patients/notifications`);
      if (notificationsRes.data.success) {
        setProfile(prev => ({ ...prev, notifications: notificationsRes.data.data }));
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile data');
    } finally {
      setLoading({ profile: false, notifications: false, emergency: false });
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const updates = {
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        ...(formData.phone && { phone: formData.phone })
      };

      const response = await axios.put(`${API_BASE_URL}/patients/me`, updates);
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setProfile(prev => ({ ...prev, personal: response.data.data }));
        setIsEditing(false);
        fetchProfileData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/patients/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setSuccess('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleEmergencyUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const response = await axios.put(`${API_BASE_URL}/patients/emergency-contact`, emergencyData);
      if (response.data.success) {
        setSuccess('Emergency contact updated successfully');
        setShowEmergencyModal(false);
        fetchProfileData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update emergency contact');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'MEDICATION_REMINDER':
        return <Heart className="w-5 h-5 text-emerald-600" />;
      case 'LAB_RESULT':
        return <AlertCircle className="w-5 h-5 text-purple-600" />;
      case 'BILL_REMINDER':
        return <Bell className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading profile information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-900">Profile & Settings</h1>
            <p className="text-emerald-600 mt-2">Manage your account, preferences, and security settings</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchProfileData}
              className="p-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-emerald-600" />
                Personal Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">{profile.personal?.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-800">{profile.personal?.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-800">{profile.personal?.userId?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-800">{profile.personal?.dateOfBirth ? formatDate(profile.personal.dateOfBirth) : 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium text-gray-800">{profile.personal?.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800">{profile.personal?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium text-gray-800">{profile.personal?.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">{profile.personal?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                Emergency Contact
              </h2>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {profile.emergency?.length > 0 ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>

            {profile.emergency?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium text-gray-800">{emergencyData.contactName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium text-gray-800">{emergencyData.relationship || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-800">{emergencyData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Additional Notes</p>
                    <p className="font-medium text-gray-800">{emergencyData.notes || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No emergency contact set</p>
                <p className="text-sm text-gray-500 mt-1">Add an emergency contact for safety purposes</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Settings & Notifications */}
        <div className="space-y-6">
          {/* Security Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-blue-600" />
              Security Settings
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Password</p>
                      <p className="text-sm text-gray-600">Change your account password</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Data Export</p>
                      <p className="text-sm text-gray-600">Download your medical records</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Export feature coming soon')}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Logout</p>
                      <p className="text-sm text-gray-600">Sign out from all devices</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-600" />
                Recent Notifications
              </h2>
              <span className="text-sm text-gray-500">
                {profile.notifications.length} unread
              </span>
            </div>

            {loading.notifications ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : profile.notifications.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {profile.notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition-colors ${
                      getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{notification.title}</p>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{notification.message}</p>
                        {notification.data && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <button className="text-xs text-emerald-600 hover:text-emerald-700">
                              View details →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No notifications</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Account Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Member Since</span>
                <span className="font-medium">
                  {profile.personal?.createdAt 
                    ? new Date(profile.personal.createdAt).getFullYear()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Account Status</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Updated</span>
                <span className="font-medium">
                  {profile.personal?.updatedAt 
                    ? formatDate(profile.personal.updatedAt)
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm opacity-90">
                <Shield className="w-4 h-4 inline mr-1" />
                Your data is securely encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {profile.emergency?.length > 0 ? 'Update Emergency Contact' : 'Add Emergency Contact'}
              </h3>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEmergencyUpdate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={emergencyData.contactName}
                    onChange={(e) => setEmergencyData({ ...emergencyData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select
                    value={emergencyData.relationship}
                    onChange={(e) => setEmergencyData({ ...emergencyData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={emergencyData.phone}
                    onChange={(e) => setEmergencyData({ ...emergencyData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                  <textarea
                    value={emergencyData.notes}
                    onChange={(e) => setEmergencyData({ ...emergencyData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Any special instructions or notes..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  {profile.emergency?.length > 0 ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;