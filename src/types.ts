export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string; // In a real app, never store plain text passwords!
  role: 'patient' | 'admin';
  emergencyContact?: string;
  medicalHistory?: string;
}

export interface Appointment {
  id: string;
  patientId?: string; // Link appointment to user
  patientName: string;
  email: string;
  phone: string;
  doctor: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:mm format
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  createdAt: number;
  notes?: string;
  reminderTime?: string;
  reminderType?: 'email' | 'sms' | 'both';
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  bio: string;
  experience: string;
  image: string;
}

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'dr-smith',
    name: 'Dr. Sarah Smith',
    specialty: 'Cardiologist',
    workingHours: { start: '10:00', end: '17:00' },
    bio: 'Dr. Smith has over 15 years of experience in treating complex heart conditions. She is dedicated to providing personalized care to her patients.',
    experience: '15+ Years',
    image: 'https://picsum.photos/seed/dr-smith/200/200',
  },
  {
    id: 'dr-jones',
    name: 'Dr. Michael Jones',
    specialty: 'Dermatologist',
    workingHours: { start: '10:00', end: '17:00' },
    bio: 'Dr. Jones specializes in both medical and cosmetic dermatology. He is known for his gentle approach and effective treatments.',
    experience: '10+ Years',
    image: 'https://picsum.photos/seed/dr-jones/200/200',
  },
  {
    id: 'dr-williams',
    name: 'Dr. Emily Williams',
    specialty: 'Pediatrician',
    workingHours: { start: '09:00', end: '16:00' },
    bio: 'Dr. Williams loves working with children and helping them stay healthy. She focuses on preventive care and developmental milestones.',
    experience: '8+ Years',
    image: 'https://picsum.photos/seed/dr-williams/200/200',
  },
  {
    id: 'dr-davis',
    name: 'Dr. Robert Davis',
    specialty: 'Neurologist',
    workingHours: { start: '08:00', end: '15:00' },
    bio: 'Dr. Davis is an expert in treating disorders of the nervous system, including migraines, epilepsy, and Parkinson\'s disease.',
    experience: '20+ Years',
    image: 'https://picsum.photos/seed/dr-davis/200/200',
  },
  {
    id: 'dr-miller',
    name: 'Dr. Jessica Miller',
    specialty: 'Orthopedic Surgeon',
    workingHours: { start: '11:00', end: '18:00' },
    bio: 'Dr. Miller specializes in sports injuries and joint replacements. She is committed to helping patients regain mobility and live pain-free.',
    experience: '12+ Years',
    image: 'https://picsum.photos/seed/dr-miller/200/200',
  },
  {
    id: 'dr-wilson',
    name: 'Dr. David Wilson',
    specialty: 'Ophthalmologist',
    workingHours: { start: '09:00', end: '17:00' },
    bio: 'Dr. Wilson provides comprehensive eye care, from routine exams to advanced surgical procedures like LASIK and cataract surgery.',
    experience: '18+ Years',
    image: 'https://picsum.photos/seed/dr-wilson/200/200',
  },
  {
    id: 'dr-moore',
    name: 'Dr. Linda Moore',
    specialty: 'Psychiatrist',
    workingHours: { start: '10:00', end: '16:00' },
    bio: 'Dr. Moore offers compassionate care for mental health conditions. She specializes in anxiety, depression, and stress management.',
    experience: '14+ Years',
    image: 'https://picsum.photos/seed/dr-moore/200/200',
  },
  {
    id: 'dr-taylor',
    name: 'Dr. James Taylor',
    specialty: 'Gastroenterologist',
    workingHours: { start: '08:30', end: '15:30' },
    bio: 'Dr. Taylor focuses on digestive health and treats conditions such as IBS, acid reflux, and liver diseases.',
    experience: '16+ Years',
    image: 'https://picsum.photos/seed/dr-taylor/200/200',
  }
];
