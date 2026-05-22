import * as React from 'react';
import { Doctor } from '@/types';
import { X, Clock, Award, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  hideBookButton?: boolean;
}

export default function DoctorProfileModal({
  doctor,
  isOpen,
  onClose,
  hideBookButton = false,
}: DoctorProfileModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !doctor) return null;

  const handleBook = () => {
    onClose();
    navigate(`/dashboard?tab=book&doctor=${doctor.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={onClose}
            className="rounded-full bg-white/80 p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-32 bg-indigo-600"></div>
        
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4 flex justify-center">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{doctor.name}</h2>
            <p className="text-sm font-medium text-indigo-600">{doctor.specialty}</p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p>{doctor.bio}</p>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Award className="h-4 w-4 shrink-0 text-gray-400" />
              <p>Experience: <span className="font-medium text-gray-900">{doctor.experience}</span></p>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              <p>
                Working Hours: <span className="font-medium text-gray-900">{doctor.workingHours.start} - {doctor.workingHours.end}</span>
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Close
            </Button>
            {!hideBookButton && (
              <Button onClick={handleBook} className="flex-1">
                Book Appointment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
