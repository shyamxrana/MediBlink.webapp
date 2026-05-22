import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Appointment, Doctor, User as UserType } from '@/types';
import { getAppointments, updateAppointment, getDoctors, updateUser, saveAppointment, getAvailableSlots } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar, Clock, User, MoreHorizontal, Plus, Filter, Search, ChevronDown, FileText, CreditCard, X, Activity, CheckCircle2, LayoutDashboard, Upload, Settings, User as UserIcon, Loader2, Info, Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import DoctorProfileModal from '@/components/DoctorProfileModal';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, isAfter, isBefore, addHours, startOfDay } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SettingsTab from '@/components/SettingsTab';

export default function PatientDashboard() {
  const { user, updateSession } = useAuth();
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get('doctor');
  const tabFromUrl = searchParams.get('tab');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'appointments' | 'book' | 'reports' | 'profile' | 'settings'>(
    (tabFromUrl as any) || (doctorIdFromUrl ? 'book' : 'appointments')
  );
  
  // Booking State
  const [bookingFormData, setBookingFormData] = useState({
    patientName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    doctor: doctorIdFromUrl || '',
    date: '',
    time: '',
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  // Profile Modal State
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<Doctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  // Handle click outside for doctor dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update booking form data if user loads late or changes
  useEffect(() => {
    if (user) {
      setBookingFormData(prev => ({
        ...prev,
        patientName: user.name,
        email: user.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  // Update doctor if URL parameter changes
  useEffect(() => {
    if (doctorIdFromUrl) {
      setBookingFormData(prev => ({ ...prev, doctor: doctorIdFromUrl }));
      setActiveSidebarTab('book');
    }
  }, [doctorIdFromUrl]);

  // Update active tab if URL parameter changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveSidebarTab(tabFromUrl as any);
    }
  }, [tabFromUrl]);

  // Update slots when doctor or date changes
  useEffect(() => {
    if (bookingFormData.doctor && bookingFormData.date) {
      const slots = getAvailableSlots(bookingFormData.doctor, bookingFormData.date);
      setAvailableSlots(slots);
      // Reset time if it's no longer available
      if (bookingFormData.time && !slots.includes(bookingFormData.time)) {
        setBookingFormData((prev) => ({ ...prev, time: '' }));
      }
    } else {
      setAvailableSlots([]);
    }
  }, [bookingFormData.doctor, bookingFormData.date]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    
    if (!bookingFormData.doctor) {
      setBookingError('Please select a doctor.');
      return;
    }
    
    setBookingLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      saveAppointment({
        id: crypto.randomUUID(),
        patientId: user?.id, // Link to user
        ...bookingFormData,
        status: 'pending',
        createdAt: Date.now(),
      });
      setBookingSuccess(true);
      loadAppointments(); // Refresh appointments list
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingReset = () => {
    setBookingSuccess(false);
    setBookingFormData({
      patientName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      doctor: '',
      date: '',
      time: '',
    });
  };

  // Confirmation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [appointmentToRemind, setAppointmentToRemind] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState('1_day');
  const [reminderType, setReminderType] = useState<'email' | 'sms' | 'both'>('email');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    emergencyContact: user?.emergencyContact || '',
    medicalHistory: user?.medicalHistory || ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || '',
        medicalHistory: user.medicalHistory || ''
      }));
    }
  }, [user]);

  const loadAppointments = () => {
    if (!user) return;
    const all = getAppointments();
    
    let displayedAppointments = all;
    
    // If user is NOT admin, filter by their ID/email
    if (user.role !== 'admin') {
      displayedAppointments = all.filter(
        appt => appt.patientId === user.id || appt.email === user.email
      );
    }
    
    // Sort by date and time
    displayedAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setAppointments(displayedAppointments);
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
    const handleStorageChange = () => loadAppointments();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const initiateCancel = (id: string) => {
    setAppointmentToCancel(id);
    setCancelReason('');
    setIsModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (appointmentToCancel) {
      updateAppointment(appointmentToCancel, { 
        status: 'cancelled',
        notes: cancelReason ? `Cancellation Reason: ${cancelReason}` : undefined
      });
      loadAppointments();
      setAppointmentToCancel(null);
      setCancelReason('');
      setIsModalOpen(false);
    }
  };

  const initiateReminder = (id: string, currentReminderTime?: string, currentReminderType?: 'email' | 'sms' | 'both') => {
    setAppointmentToRemind(id);
    if (currentReminderTime) setReminderTime(currentReminderTime);
    if (currentReminderType) setReminderType(currentReminderType);
    setIsReminderModalOpen(true);
  };

  const handleConfirmReminder = () => {
    if (appointmentToRemind) {
      updateAppointment(appointmentToRemind, {
        reminderTime,
        reminderType
      });
      loadAppointments();
      setAppointmentToRemind(null);
      setIsReminderModalOpen(false);
    }
  };

  const now = new Date();

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appt => {
    const apptDate = new Date(`${appt.date}T${appt.time}`);
    
    if (activeTab === 'upcoming') {
      return isAfter(apptDate, startOfDay(now));
    } else {
      return isBefore(apptDate, startOfDay(now));
    }
  });

  // Calculate stats
  const upcomingCount = appointments.filter(appt => isAfter(new Date(`${appt.date}T${appt.time}`), startOfDay(now)) && appt.status !== 'cancelled' && appt.status !== 'rejected').length;
  const pastCount = appointments.filter(appt => isBefore(new Date(`${appt.date}T${appt.time}`), startOfDay(now)) && appt.status === 'confirmed').length;
  const totalCount = appointments.length;

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, appt) => {
    const date = appt.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'rejected':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const renderAppointments = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Visits</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Visits</p>
              <p className="text-2xl font-bold text-gray-900">{pastCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              'border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'upcoming'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={cn(
              'border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'past'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Past
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2">
           <Button variant="outline" size="sm" className="h-9 text-gray-500">
             <Filter className="mr-2 h-4 w-4" />
             Filter
           </Button>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden grid-cols-12 gap-4 px-4 text-xs font-medium uppercase tracking-wider text-gray-500 lg:grid">
        <div className="col-span-3">Time</div>
        <div className="col-span-2">Booking ID</div>
        <div className="col-span-2">Event Type</div>
        <div className="col-span-2">Doctor</div>
        <div className="col-span-2">Patient</div>
        <div className="col-span-1 text-right">Status</div>
      </div>

      {/* Appointments List */}
      <div className="space-y-8">
        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming appointments." 
                : "No past appointments found."}
            </p>
            {activeTab === 'upcoming' && (
              <div className="mt-6">
                <Button variant="outline" onClick={() => setActiveSidebarTab('book')}>
                  Book your first appointment
                </Button>
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedAppointments).map(([date, dateAppts]: [string, Appointment[]]) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center justify-between rounded-lg bg-indigo-50/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold text-gray-900">
                    {format(parseISO(date), 'dd-MMM-yyyy')}
                  </span>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  {dateAppts.length} Appointment{dateAppts.length !== 1 && 's'}
                </span>
              </div>

              {/* Appointment Rows */}
              <div className="space-y-2">
                {dateAppts.map((appt) => {
                  const doctor = getDoctors().find((d) => d.id === appt.doctor);
                  const startTime = parseISO(`${appt.date}T${appt.time}`);
                  const endTime = addHours(startTime, 1); // Assume 1 hour duration
                  const bookingId = `ZY-${appt.id.substring(0, 5).toUpperCase()}`;

                  return (
                    <div
                      key={appt.id}
                      className="group relative flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:py-3"
                    >
                      {/* Time */}
                      <div className="col-span-3 flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {format(startTime, 'hh:mm a')} - {format(endTime, 'hh:mm a')}
                        </span>
                      </div>

                      {/* Booking ID (Mobile: Hidden or secondary) */}
                      <div className="col-span-2 hidden text-sm font-medium text-gray-900 lg:block">
                        {bookingId}
                      </div>

                      {/* Event Type (Specialty) */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 lg:flex">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                          <span className="block font-medium text-gray-900 lg:hidden">Specialty</span>
                          <span className="text-gray-600">{doctor?.specialty || 'General'}</span>
                        </div>
                      </div>

                      {/* Doctor */}
                      <div className="col-span-2 flex items-center gap-3">
                        <img
                          src={doctor?.image || `https://ui-avatars.com/api/?name=${doctor?.name}`}
                          alt={doctor?.name}
                          className="h-8 w-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-sm">
                          <span className="block font-medium text-gray-900 lg:hidden">Doctor</span>
                          <span className="font-medium text-gray-900">{doctor?.name}</span>
                        </div>
                      </div>

                      {/* Patient */}
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                          <span className="block font-medium text-gray-900 lg:hidden">Patient</span>
                          <span className="text-gray-600">{appt.patientName}</span>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="col-span-1 flex items-center justify-between lg:justify-end">
                        <div className={cn(
                          "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          getStatusColor(appt.status)
                        )}>
                          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </div>
                        
                        {/* Actions (Only for upcoming) */}
                        {activeTab === 'upcoming' && appt.status !== 'cancelled' && appt.status !== 'rejected' && (
                          <div className="ml-4 flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border-indigo-200"
                               onClick={() => initiateReminder(appt.id, appt.reminderTime, appt.reminderType)}
                               title="Set Reminder"
                             >
                               <Bell className="h-4 w-4 mr-1" />
                               {appt.reminderTime ? 'Edit Reminder' : 'Remind Me'}
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                               onClick={() => initiateCancel(appt.id)}
                               title="Cancel Appointment"
                             >
                               Cancel
                             </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, description: string) => (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
      <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      alert(`File "${e.target.files[0].name}" selected for upload.`);
      // In a real app, you would upload the file to a server here
    }
  };

  const renderReports = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
        <Upload className="h-8 w-8 text-indigo-600" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">Upload Medical Report</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        Upload your lab results, imaging, or other medical documents to securely share them with your healthcare providers.
      </p>
      <div className="mt-8">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <Button onClick={handleUploadClick} className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="mr-2 h-5 w-5" />
          Select File to Upload
        </Button>
      </div>
    </div>
  );

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    if (!user) return;

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError('Passwords do not match');
      return;
    }

    try {
      const updatedData: Partial<UserType> = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        emergencyContact: profileForm.emergencyContact,
        medicalHistory: profileForm.medicalHistory,
      };

      if (profileForm.password) {
        updatedData.password = profileForm.password;
      }

      updateUser(user.id, updatedData);
      updateSession({ ...user, ...updatedData } as UserType);
      
      setBookingFormData(prev => ({
        ...prev,
        patientName: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      }));

      setProfileSuccess(true);
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError('Failed to update profile');
    }
  };

  const renderProfile = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
          {profileError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{profileError}</h3>
                </div>
              </div>
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Profile updated successfully!</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                Emergency Contact
              </label>
              <div className="mt-1">
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="text"
                  placeholder="Name and Phone Number"
                  value={profileForm.emergencyContact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                Medical History Summary
              </label>
              <div className="mt-1">
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  rows={4}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Briefly describe any pre-existing conditions, allergies, or past surgeries..."
                  value={profileForm.medicalHistory}
                  onChange={(e) => setProfileForm({ ...profileForm, medicalHistory: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <p className="text-sm text-gray-500 mb-4">Leave blank if you don't want to change your password.</p>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-5 flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderBooking = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Book an Appointment</h2>
        <p className="mt-1 text-sm text-gray-500">Schedule a new visit with one of our specialists.</p>
      </div>
      
      <div className="p-6 sm:p-8">
        {bookingSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-green-50 p-8 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Appointment Requested!</h3>
            <p className="text-green-700 mb-6 max-w-md mx-auto">
              Your appointment request has been submitted successfully. We will review it and send you a confirmation email shortly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => setActiveSidebarTab('appointments')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View My Appointments
              </Button>
              <Button 
                variant="outline"
                onClick={handleBookingReset}
                className="border-green-200 text-green-700 hover:bg-green-100"
              >
                Book Another
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-8 max-w-3xl">
            {bookingError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{bookingError}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              {/* Patient Details Section */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Patient Information</h3>
              </div>

              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="patientName"
                  required
                  value={bookingFormData.patientName}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, patientName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={bookingFormData.email}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={bookingFormData.phone}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full"
                />
              </div>

              {/* Appointment Details Section */}
              <div className="sm:col-span-2 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Appointment Details</h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor
                </label>
                <div className="flex gap-2">
                  <div className="relative w-full" ref={doctorDropdownRef}>
                    <div 
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer",
                        !bookingFormData.doctor && "text-gray-500"
                      )}
                      onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                    >
                      <span className="truncate">
                        {bookingFormData.doctor 
                          ? (() => {
                              const doc = getDoctors().find(d => d.id === bookingFormData.doctor);
                              return doc ? `Dr. ${doc.name} - ${doc.specialty}` : 'Select a doctor...';
                            })()
                          : 'Choose a specialist...'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                    </div>
                    
                    {isDoctorDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Search by name or specialty..."
                              value={doctorSearchQuery}
                              onChange={(e) => setDoctorSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        </div>
                        <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
                          {getDoctors()
                            .filter(doc => 
                              doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) || 
                              doc.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase())
                            )
                            .map((doc) => (
                              <li
                                key={doc.id}
                                className={cn(
                                  "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-50",
                                  bookingFormData.doctor === doc.id ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                                )}
                                onClick={() => {
                                  setBookingFormData({ ...bookingFormData, doctor: doc.id });
                                  setIsDoctorDropdownOpen(false);
                                  setDoctorSearchQuery('');
                                }}
                              >
                                <div className="flex items-center">
                                  <img src={doc.image || `https://ui-avatars.com/api/?name=${doc.name}`} alt="" className="h-6 w-6 flex-shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
                                  <span className="ml-3 block truncate font-medium">
                                    Dr. {doc.name}
                                  </span>
                                  <span className="ml-2 truncate text-gray-500">
                                    {doc.specialty}
                                  </span>
                                </div>
                                {bookingFormData.doctor === doc.id && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </span>
                                )}
                              </li>
                            ))}
                            {getDoctors().filter(doc => doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) || doc.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase())).length === 0 && (
                              <li className="py-3 px-3 text-sm text-gray-500 text-center">No doctors found.</li>
                            )}
                        </ul>
                      </div>
                    )}
                  </div>
                  {bookingFormData.doctor && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="shrink-0"
                      onClick={() => {
                        const doc = getDoctors().find(d => d.id === bookingFormData.doctor);
                        if (doc) {
                          setSelectedDoctorProfile(doc);
                          setIsProfileOpen(true);
                        }
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <Input
                  id="date"
                  type="date"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={bookingFormData.date}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <Select
                  id="time"
                  required
                  value={bookingFormData.time}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, time: e.target.value })}
                  disabled={!bookingFormData.date || !bookingFormData.doctor}
                  className="w-full"
                >
                  <option value="">
                    {!bookingFormData.doctor 
                      ? 'Select a doctor first' 
                      : !bookingFormData.date 
                        ? 'Select a date first' 
                        : availableSlots.length === 0 
                          ? 'No slots available' 
                          : 'Choose a time...'}
                  </option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {/* Doctor Profile Modal */}
      {selectedDoctorProfile && (
        <DoctorProfileModal
          doctor={selectedDoctorProfile}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-12">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-6 px-2">
            <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'appointments', label: 'My appointments', icon: LayoutDashboard },
              { id: 'book', label: 'Book an appointment', icon: Plus },
              { id: 'reports', label: 'Upload Report', icon: Upload },
              { id: 'profile', label: 'Profile', icon: UserIcon },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const isActive = activeSidebarTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id as any)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "text-indigo-600" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarTabIndicator"
                      className="absolute inset-0 rounded-md bg-indigo-50"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="relative z-10 h-5 w-5" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSidebarTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {activeSidebarTab === 'appointments' && 'My Appointments'}
                  {activeSidebarTab === 'book' && 'Book an Appointment'}
                  {activeSidebarTab === 'reports' && 'Upload Report'}
                  {activeSidebarTab === 'profile' && 'Profile'}
                  {activeSidebarTab === 'settings' && 'Settings'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {activeSidebarTab === 'appointments' && 'Manage your appointments and medical history.'}
                  {activeSidebarTab === 'book' && 'Schedule a new visit with one of our specialists.'}
                  {activeSidebarTab === 'reports' && 'Upload and view your medical reports.'}
                  {activeSidebarTab === 'profile' && 'Manage your personal information.'}
                  {activeSidebarTab === 'settings' && 'Manage your account settings and preferences.'}
                </p>
              </div>
              {activeSidebarTab === 'appointments' && (
                <Button 
                  onClick={() => setActiveSidebarTab('book')}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
              )}
            </div>

            {activeSidebarTab === 'appointments' && renderAppointments()}
            {activeSidebarTab === 'book' && renderBooking()}
            {activeSidebarTab === 'reports' && renderReports()}
            {activeSidebarTab === 'profile' && renderProfile()}
            {activeSidebarTab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>

        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmCancel}
          title="Cancel Appointment"
          description="Are you sure you want to cancel this appointment? This action cannot be undone."
          confirmText="Yes, Cancel"
          variant="danger"
        >
          <div className="mt-4">
            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancelReason"
              name="cancelReason"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Please let us know why you are cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          onConfirm={handleConfirmReminder}
          title="Set Appointment Reminder"
          description="Choose when and how you want to be reminded about this appointment."
          confirmText="Save Reminder"
          variant="primary"
        >
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                Remind me
              </label>
              <Select
                id="reminderTime"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              >
                <option value="1_hour">1 hour before</option>
                <option value="2_hours">2 hours before</option>
                <option value="1_day">1 day before</option>
                <option value="2_days">2 days before</option>
              </Select>
            </div>
            <div>
              <label htmlFor="reminderType" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Method
              </label>
              <Select
                id="reminderType"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as 'email' | 'sms' | 'both')}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="both">Email & SMS</option>
              </Select>
            </div>
          </div>
        </ConfirmationModal>
      </div>
    </div>
  );
}
