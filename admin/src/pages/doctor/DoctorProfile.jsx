// DoctorProfile.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Stethoscope, 
  Building, 
  Calendar, 
  Edit2,
  Save,
  X,
  Shield,
  Award,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    department: '',
    phone: ''
  });

  const token = localStorage.getItem('token');

  // Fetch doctor profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/doctors/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfile(data.data);
      setFormData({
        specialization: data.data?.specialization || '',
        department: data.data?.department || '',
        phone: data.data?.userId?.phone || ''
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/doctors/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Stats for the dashboard
  const stats = [
    { label: 'Total Appointments', value: '156', icon: Calendar, color: 'bg-blue-500' },
    { label: 'Years Experience', value: '8', icon: Clock, color: 'bg-green-500' },
    { label: 'Patients Treated', value: '1.2k', icon: User, color: 'bg-purple-500' },
    { label: 'Success Rate', value: '98%', icon: Award, color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your professional information and settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.color} rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{profile?.userId?.name || 'Doctor'}</h2>
                      <p className="text-blue-100 mt-1">Medical Professional</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    {editing ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel Edit
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-6">
                {editing ? (
                  <div className="space-y-6">
                    {/* Specialization */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Stethoscope className="w-4 h-4" />
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g., Cardiologist, Neurologist"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4" />
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g., Cardiology, Emergency"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            specialization: profile?.specialization || '',
                            department: profile?.department || '',
                            phone: profile?.userId?.phone || ''
                          });
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateProfile}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{profile?.userId?.email || 'Not set'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{profile?.userId?.phone || 'Not set'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Role</p>
                            <p className="font-medium">Doctor</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Professional Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Specialization</p>
                            <p className="font-medium text-blue-700">
                              {profile?.specialization || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Building className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Department</p>
                            <p className="font-medium text-blue-700">
                              {profile?.department || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Award className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Doctor ID</p>
                            <p className="font-medium text-blue-700">
                              {profile?.doctorId || 'Not assigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {!editing && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Availability</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 5:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weekends</span>
                        <span className="font-medium">Emergency Only</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Contact Preferences</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Email notifications: Enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">SMS alerts: Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Calendar className="w-5 h-5" />
                  <span>View Today's Schedule</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <Stethoscope className="w-5 h-5" />
                  <span>Start New Consultation</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>Emergency Contacts</span>
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Profile Completion</span>
                    <span className="text-sm font-medium text-blue-600">85%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Account Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">License Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Profile Under Review</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Appointment completed</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Prescription created</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profile updated</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons at Bottom */}
        {!editing && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Download Profile PDF
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              Share Profile
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              Request Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;