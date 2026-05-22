import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Appointment, User, Doctor } from '@/types';
import { 
  getAppointments, updateAppointment, getUsers, getDoctors, 
  saveDoctor, updateDoctor, deleteDoctor 
} from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, BarChart3, FileText,
  Settings, LogOut, Menu, X, Bell, ChevronDown, TrendingUp, Clock, DollarSign,
  Search, Eye, Check, Trash2, Edit, Plus, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'doctors' | 'reports' | 'settings'>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Doctor form state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    workingHours: { start: '09:00', end: '17:00' },
    bio: '',
    experience: '',
    image: 'https://picsum.photos/seed/new-doctor/200/200',
  });

  const loadData = () => {
    const allAppts = getAppointments();
    setAppointments(allAppts.sort((a, b) => b.createdAt - a.createdAt));
    
    const allUsers = getUsers();
    setUsers(allUsers.filter(u => u.role === 'patient'));

    setDoctors(getDoctors());
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, navigate]);

  const handleStatusUpdate = (id: string, status: 'confirmed' | 'rejected') => {
    updateAppointment(id, { status });
    loadData();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoctor) {
      updateDoctor(editingDoctor.id, doctorForm);
    } else {
      saveDoctor({
        id: crypto.randomUUID(),
        ...doctorForm as Doctor,
      });
    }
    setIsDoctorModalOpen(false);
    setEditingDoctor(null);
    setDoctorForm({
      name: '',
      specialty: '',
      workingHours: { start: '09:00', end: '17:00' },
      bio: '',
      experience: '',
      image: `https://picsum.photos/seed/${Date.now()}/200/200`,
    });
    loadData();
  };

  const handleDeleteDoctor = (id: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      deleteDoctor(id);
      loadData();
    }
  };

  const openDoctorModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setDoctorForm(doctor);
    } else {
      setEditingDoctor(null);
      setDoctorForm({
        name: '',
        specialty: '',
        workingHours: { start: '09:00', end: '17:00' },
        bio: '',
        experience: '',
        image: `https://picsum.photos/seed/${Date.now()}/200/200`,
      });
    }
    setIsDoctorModalOpen(true);
  };

  // Stats
  const totalRevenue = appointments.filter(a => a.status === 'confirmed').length * 100;
  const stats = [
    { 
      label: 'Total Appointments', 
      value: appointments.length, 
      icon: Calendar, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      trend: '+12%'
    },
    { 
      label: 'Total Patients', 
      value: users.length, 
      icon: Users, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      trend: '+8%'
    },
    { 
      label: 'Active Doctors', 
      value: doctors.length, 
      icon: Stethoscope, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      trend: '+2'
    },
    { 
      label: 'Monthly Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      trend: '+18%'
    },
  ];

  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;

  const navigateTo = (tab: string) => {
    setActiveTab(tab as any);
    setIsSidebarOpen(false);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-600 p-2">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediCare</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden flex-1 max-w-md mx-8 md:flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-700" />
              {pendingAppointments > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                  <button
                    onClick={() => navigateTo('settings')}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-16 z-30 h-[calc(100vh-64px)] w-64 border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="space-y-2 p-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back! 👋</h2>
                  <p className="text-gray-600">Here is an overview of your healthcare system.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                              <span className="text-sm font-semibold text-green-600">{stat.trend}</span>
                            </div>
                          </div>
                          <div className={cn('rounded-full p-3', stat.bg)}>
                            <stat.icon className={cn('h-6 w-6', stat.color)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Weekly Appointments Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-around gap-2 p-4 border-t">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                          const height = Math.random() * 70 + 30;
                          return (
                            <div key={day} className="flex flex-col items-center gap-2 flex-1">
                              <div className={`w-full rounded-t bg-linear-to-t from-blue-600 to-blue-400 transition-all hover:opacity-80`}
                                style={{ height: `${height}px` }} />
                              <span className="text-xs text-gray-600">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Appointments by Specialty */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Appointments by Specialty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-64">
                        <svg viewBox="0 0 100 100" className="w-full h-full max-w-xs">
                          {/* Pie Chart - Simplified */}
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="20" strokeDasharray="75.4 251.2" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="20" strokeDasharray="75.4 251.2" transform="rotate(107 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="20" strokeDasharray="100.5 251.2" transform="rotate(214 50 50)" />
                        </svg>
                        <div className="absolute space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                            <span>Cardiology 30%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-600" />
                            <span>Neurology 30%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-600" />
                            <span>Pediatrics 40%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Appointments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Patient</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Doctor</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Date & Time</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {appointments.slice(0, 5).map((appt) => (
                            <tr key={appt.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-900 font-medium">{appt.patientName}</td>
                              <td className="px-4 py-3 text-gray-700">{doctors.find(d => d.id === appt.doctor)?.name}</td>
                              <td className="px-4 py-3 text-gray-700">{appt.date} {appt.time}</td>
                              <td className="px-4 py-3">
                                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium',
                                  appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  appt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                )}>
                                  {appt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
                    <p className="text-gray-600">Manage all appointments and their statuses</p>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Patient</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Doctor</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Date & Time</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {appointments.map((appt) => (
                          <tr key={appt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900 font-medium">{appt.patientName}</td>
                            <td className="px-6 py-4 text-gray-700">{doctors.find(d => d.id === appt.doctor)?.name}</td>
                            <td className="px-6 py-4 text-gray-700">{appt.date} at {appt.time}</td>
                            <td className="px-6 py-4">
                              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium',
                                appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {appt.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                                      className="rounded p-1.5 hover:bg-green-100 text-green-600"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                                      className="rounded p-1.5 hover:bg-red-100 text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
                  <p className="text-gray-600">View all registered patients in the system</p>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Email</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Phone</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-700">Appointments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map((patientUser) => {
                          const userApptCount = appointments.filter(
                            (a) => a.patientId === patientUser.id || a.email === patientUser.email
                          ).length;
                          return (
                            <tr key={patientUser.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900 font-medium">{patientUser.name}</td>
                              <td className="px-6 py-4 text-gray-700">{patientUser.email}</td>
                              <td className="px-6 py-4 text-gray-700">{patientUser.phone || 'N/A'}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {userApptCount}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === 'doctors' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Doctors</h2>
                    <p className="text-gray-600">Manage doctors and their specialties</p>
                  </div>
                  <Button
                    onClick={() => openDoctorModal()}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Doctor
                  </Button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {doctors.map((doctor) => (
                    <Card key={doctor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden bg-gray-200">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{doctor.specialty}</p>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{doctor.bio}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openDoctorModal(doctor)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                  <p className="text-gray-600">View system reports and analytics</p>
                </div>
                <Card className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Reports feature coming soon</p>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600">Manage system settings</p>
                </div>
                <Card className="p-8 text-center">
                  <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Settings coming soon</p>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Doctor Modal */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </CardTitle>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="rounded hover:bg-gray-100 p-1"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDoctor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={doctorForm.name || ''}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty
                  </label>
                  <Input
                    type="text"
                    value={doctorForm.specialty || ''}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, specialty: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (years)
                  </label>
                  <Input
                    type="text"
                    value={doctorForm.experience || ''}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, experience: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={doctorForm.bio || ''}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, bio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    {editingDoctor ? 'Update' : 'Add'} Doctor
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsDoctorModalOpen(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
