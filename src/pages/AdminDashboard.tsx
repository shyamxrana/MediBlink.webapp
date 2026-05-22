import React, { useState, useEffect } from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { Appointment, User, Doctor } from '@/types';
import { getAppointments, updateAppointment, getUsers, getDoctors, saveDoctor, updateDoctor, deleteDoctor } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { Check, X, Filter, Eye, Users, Calendar, Stethoscope, Plus, Trash2, Edit, Activity, Clock, Search } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import DoctorProfileModal from '@/components/DoctorProfileModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'doctors'>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [confirmApptId, setConfirmApptId] = useState<string | null>(null);
  
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

  // Doctor Schedule State
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>(startOfDay(new Date()));

  // Doctor Profile State
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<Doctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const loadData = () => {
    const allAppts = getAppointments();
    setAppointments(allAppts.sort((a, b) => b.createdAt - a.createdAt));
    
    const allUsers = getUsers();
    setUsers(allUsers.filter(u => u.role === 'patient'));

    setDoctors(getDoctors());
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStatusUpdate = (id: string, status: 'confirmed' | 'rejected') => {
    updateAppointment(id, { status });
    loadData();
    if (selectedAppt?.id === id) {
      setSelectedAppt((prev: Appointment | null) => (prev ? { ...prev, status } : null));
    }
  };

  const handleSaveDoctor = (e: FormEvent) => {
    e.preventDefault();
    if (editingDoctor) {
      updateDoctor(editingDoctor.id, doctorForm);
    } else {
      const newDoctor: Doctor = {
        id: crypto.randomUUID(),
        name: (doctorForm.name || 'New Doctor') as string,
        specialty: (doctorForm.specialty || 'General') as string,
        workingHours: doctorForm.workingHours || { start: '09:00', end: '17:00' },
        bio: (doctorForm.bio || '') as string,
        experience: (doctorForm.experience || '') as string,
        image: (doctorForm.image || 'https://picsum.photos/seed/new-doctor/200/200') as string,
      };
      saveDoctor(newDoctor);
    }
    setIsDoctorModalOpen(false);
    setEditingDoctor(null);
    setDoctorForm({
      name: '',
      specialty: '',
      workingHours: { start: '09:00', end: '17:00' },
      bio: '',
      experience: '',
      image: 'https://picsum.photos/seed/new-doctor/200/200',
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

  const filteredAppointments = appointments.filter((appt: Appointment) => {
    const statusMatch = filter === 'all' || appt.status === filter;
    let dateMatch = true;
    if (dateRange.start) {
      dateMatch = dateMatch && appt.date >= dateRange.start;
    }
    if (dateRange.end) {
      dateMatch = dateMatch && appt.date <= dateRange.end;
    }
    
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const doctor = doctors.find((d: Doctor) => d.id === appt.doctor);
      const doctorName = doctor ? doctor.name.toLowerCase() : '';
      const patientName = appt.patientName.toLowerCase();
      searchMatch = patientName.includes(query) || doctorName.includes(query);
    }
    
    return statusMatch && dateMatch && searchMatch && appt.patientId;
  });

  const filteredPatients = users.filter((user: User) => {
    if (!patientSearchQuery.trim()) return true;
    const query = patientSearchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Generate slots for schedule view
  const generateSlots = (doctor: Doctor, date: Date) => {
    const slots = [];
    const startHour = parseInt(doctor.workingHours.start.split(':')[0]);
    const endHour = parseInt(doctor.workingHours.end.split(':')[0]);
    
    for (let i = startHour; i < endHour; i++) {
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      const dateString = format(date, 'yyyy-MM-dd');
      
      const appt = appointments.find((a: Appointment) => 
        a.doctor === doctor.id && 
        a.date === dateString && 
        a.time === timeString &&
        a.status !== 'cancelled' &&
        a.status !== 'rejected'
      );
      
      slots.push({
        time: timeString,
        appointment: appt
      });
    }
    return slots;
  };

  // Stats
  const stats = [
    { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Requests', value: appointments.filter((a: Appointment) => a.status === 'pending').length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Total Patients', value: users.length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Doctors', value: doctors.length, icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Admin Dashboard
        </h1>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          ].map((tab) => (
              <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center p-6">
                <div className={cn("rounded-full p-3 mr-4", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="col-span-full lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appt: Appointment) => (
                    <div key={appt.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full", 
                          appt.status === 'confirmed' ? 'bg-green-500' : 
                          appt.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appt.patientName} booked with {doctors.find((d: Doctor) => d.id === appt.doctor)?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(appt.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", getStatusColor(appt.status))}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search patient or doctor..."
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-auto h-9"
                />
                <span className="text-gray-500 text-sm">to</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-auto h-9"
                />
                {(dateRange.start || dateRange.end) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="text-gray-500 hover:text-gray-700 h-9 px-2"
                    title="Clear Dates"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Patient Details</th>
                    <th className="px-6 py-3 font-medium">Doctor</th>
                    <th className="px-6 py-3 font-medium">Date & Time</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt: Appointment) => {
                      const doctor = doctors.find((d: Doctor) => d.id === appt.doctor);
                      return (
                        <tr key={appt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <div className="font-semibold">{appt.patientName}</div>
                            <div className="text-xs text-gray-500">{appt.email}</div>
                            <div className="text-xs text-gray-500">{appt.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{doctor?.name}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {appt.date} at {appt.time}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                getStatusColor(appt.status)
                              )}
                            >
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <div className="group relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAppt(appt)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                  View Details
                                </span>
                              </div>
                              {appt.status === 'pending' && (
                                <>
                                  <div className="group relative">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => setConfirmApptId(appt.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                      Accept
                                    </span>
                                  </div>
                                  <div className="group relative">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                      Reject
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'patients' && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search patient by name or email..."
                className="pl-9"
                value={patientSearchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Appointments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No registered patients found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((user: User) => {
                    const userApptCount = appointments.filter(
                      (a: Appointment) => a.patientId === user.id || a.email === user.email
                    ).length;
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{user.role}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {userApptCount} bookings
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'doctors' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openDoctorModal()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor: Doctor) => (
              <Card key={doctor.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                      <p className="text-sm text-indigo-600">{doctor.specialty}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedDoctorProfile(doctor);
                          setIsProfileOpen(true);
                        }}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setScheduleDoctor(doctor)}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
                        title="View Schedule"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openDoctorModal(doctor)}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
                        title="Edit Doctor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDoctor(doctor.id)}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        title="Delete Doctor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                      <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{doctor.workingHours.start} - {doctor.workingHours.end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>{doctor.experience} Experience</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Doctor Schedule Modal */}
      {scheduleDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Schedule: {scheduleDoctor.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Working Hours: {scheduleDoctor.workingHours.start} - {scheduleDoctor.workingHours.end}
                </p>
              </div>
              <button
                onClick={() => setScheduleDoctor(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-hidden flex-1 min-h-100">
              {/* Date Selector (Next 7 days) */}
              <div className="w-48 border-r border-gray-100 pr-4 flex flex-col gap-2 overflow-y-auto">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = addDays(startOfDay(new Date()), i);
                  const isSelected = isSameDay(date, scheduleDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setScheduleDate(date)}
                      className={cn(
                        "flex flex-col items-start rounded-lg p-3 text-left transition-colors",
                        isSelected 
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" 
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <span className="text-xs font-medium uppercase text-gray-500">
                        {format(date, 'EEE')}
                      </span>
                      <span className={cn("text-sm font-bold", isSelected ? "text-indigo-700" : "text-gray-900")}>
                        {format(date, 'MMM d')}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Time Slots */}
              <div className="flex-1 overflow-y-auto pl-2 pr-2">
                <h4 className="mb-4 font-semibold text-gray-900">
                  {format(scheduleDate, 'EEEE, MMMM d, yyyy')}
                </h4>
                <div className="space-y-3">
                  {generateSlots(scheduleDoctor, scheduleDate).map((slot, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-4",
                        slot.appointment 
                          ? "border-indigo-100 bg-indigo-50/50" 
                          : "border-gray-100 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                          {slot.time.split(':')[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {slot.time}
                          </p>
                          {slot.appointment ? (
                            <p className="text-sm text-indigo-600 font-medium">
                              Booked: {slot.appointment.patientName}
                            </p>
                          ) : (
                            <p className="text-sm text-green-600 font-medium">
                              Available
                            </p>
                          )}
                        </div>
                      </div>
                      {slot.appointment && (
                        <span className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          getStatusColor(slot.appointment.status)
                        )}>
                          {slot.appointment.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
              <button
                onClick={() => setSelectedAppt(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient Name</p>
                  <p className="text-gray-900">{selectedAppt.patientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getStatusColor(selectedAppt.status)
                    )}
                  >
                    {selectedAppt.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{selectedAppt.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{selectedAppt.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Doctor</p>
                  <p className="text-gray-900">
                    {doctors.find((d) => d.id === selectedAppt.doctor)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date & Time</p>
                  <p className="text-gray-900">
                    {selectedAppt.date} at {selectedAppt.time}
                  </p>
                </div>
              </div>

              {selectedAppt.status === 'pending' && (
                <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setConfirmApptId(selectedAppt.id);
                      setSelectedAppt(null);
                    }}
                  >
                    Accept Appointment
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      handleStatusUpdate(selectedAppt.id, 'rejected');
                      setSelectedAppt(null);
                    }}
                  >
                    Reject Appointment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Edit/Add Modal */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h3>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSaveDoctor} className="space-y-4">
              <Input
                label="Name"
                value={doctorForm.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({...doctorForm, name: e.target.value})}
                required
              />
              <Input
                label="Specialty"
                value={doctorForm.specialty}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({...doctorForm, specialty: e.target.value})}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={doctorForm.workingHours?.start}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({
                    ...doctorForm, 
                    workingHours: { ...doctorForm.workingHours!, start: e.target.value }
                  })}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  value={doctorForm.workingHours?.end}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({
                    ...doctorForm, 
                    workingHours: { ...doctorForm.workingHours!, end: e.target.value }
                  })}
                  required
                />
              </div>
              <Input
                label="Experience (e.g. 10+ Years)"
                value={doctorForm.experience}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({...doctorForm, experience: e.target.value})}
                required
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  value={doctorForm.bio}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDoctorForm({...doctorForm, bio: e.target.value})}
                  required
                />
              </div>
              <Input
                label="Image URL"
                value={doctorForm.image}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDoctorForm({...doctorForm, image: e.target.value})}
                required
              />
              
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDoctorModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Doctor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Doctor Profile Modal */}
      {selectedDoctorProfile && (
        <DoctorProfileModal
          doctor={selectedDoctorProfile}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          hideBookButton={true}
        />
      )}

      {/* Confirmation Modal */}
      {confirmApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Appointment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to confirm this appointment?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setConfirmApptId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleStatusUpdate(confirmApptId, 'confirmed');
                  setConfirmApptId(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
