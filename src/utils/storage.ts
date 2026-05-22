import { Appointment, User, Doctor, DEFAULT_DOCTORS } from '../types';

const STORAGE_KEY = 'mediblink_appointments';
const USERS_KEY = 'mediblink_users';
const DOCTORS_KEY = 'mediblink_doctors';
const CURRENT_USER_KEY = 'mediblink_current_user';

// --- Doctors ---

export const getDoctors = (): Doctor[] => {
  if (typeof window === 'undefined') return DEFAULT_DOCTORS;
  const data = localStorage.getItem(DOCTORS_KEY);
  if (!data) {
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(DEFAULT_DOCTORS));
    return DEFAULT_DOCTORS;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_DOCTORS;
  } catch (e) {
    return DEFAULT_DOCTORS;
  }
};

export const saveDoctor = (doctor: Doctor): void => {
  const doctors = getDoctors();
  doctors.push(doctor);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
};

export const updateDoctor = (id: string, updatedData: Partial<Doctor>): void => {
  const doctors = getDoctors();
  const index = doctors.findIndex((d) => d.id === id);
  if (index !== -1) {
    doctors[index] = { ...doctors[index], ...updatedData };
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
  }
};

export const deleteDoctor = (id: string): void => {
  const doctors = getDoctors();
  const filtered = doctors.filter((d) => d.id !== id);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(filtered));
};

// --- Users ---

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  if (users.some((u) => u.email === user.email)) {
    throw new Error('User with this email already exists.');
  }
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const updateUser = (id: string, updatedData: Partial<User>): void => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedData };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Also update current user if it's the one being edited
    const currentUserData = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      if (currentUser.id === id) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...currentUser, ...updatedData }));
      }
    }
  }
};

export const resetPassword = (email: string, newPassword: string): void => {
  if (email === 'admin@example.com') {
    throw new Error('Cannot reset password for the demo admin account.');
  }
  const users = getUsers();
  const index = users.findIndex((u) => u.email === email);
  if (index !== -1) {
    users[index] = { ...users[index], password: newPassword };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } else {
    throw new Error('User not found with this email address.');
  }
};

export const authenticateUser = (email: string, password: string): User | null => {
  // Hardcoded admin for demo
  if (email === 'admin@example.com' && password === 'admin123') {
    return {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    };
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  return user ? { ...user, password: '' } : null; // Remove password from returned object
};

// --- Appointments ---

export const getAppointments = (): Appointment[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveAppointment = (appointment: Appointment): void => {
  const appointments = getAppointments();
  // Check for double booking
  const isBooked = appointments.some(
    (appt) =>
      appt.doctor === appointment.doctor &&
      appt.date === appointment.date &&
      appt.time === appointment.time &&
      appt.status !== 'cancelled' &&
      appt.status !== 'rejected'
  );

  if (isBooked) {
    throw new Error('This time slot is already booked.');
  }

  appointments.push(appointment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

export const updateAppointment = (id: string, updatedData: Partial<Appointment>): void => {
  const appointments = getAppointments();
  const index = appointments.findIndex((appt) => appt.id === id);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...updatedData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }
};

export const deleteAppointment = (id: string): void => {
  const appointments = getAppointments();
  const filtered = appointments.filter((appt) => appt.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getAvailableSlots = (doctorId: string, date: string): string[] => {
  // This is a simplified logic. In a real app, we'd look up the doctor's specific hours.
  // Assuming 10 AM to 5 PM (17:00) for now as per requirements, or using the doctor constant.
  
  const startHour = 10;
  const endHour = 17;
  const interval = 30; // minutes

  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  // Filter out booked slots
  const appointments = getAppointments();
  const bookedSlots = appointments
    .filter(
      (appt) =>
        appt.doctor === doctorId &&
        appt.date === date &&
        appt.status !== 'cancelled' &&
        appt.status !== 'rejected'
    )
    .map((appt) => appt.time);

  return slots.filter((slot) => !bookedSlots.includes(slot));
};
