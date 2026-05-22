import { useState, useEffect } from 'react';
import { Doctor } from '@/types';
import { getDoctors } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Clock, Stethoscope, Award, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import DoctorProfileModal from '@/components/DoctorProfileModal';
import { Input } from '@/components/ui/Input';

export default function DoctorListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    setDoctors(getDoctors());
  }, []);

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Our Specialists</h1>
          <p className="mt-2 text-gray-600">Find the right doctor for your needs.</p>
        </div>
        <div className="relative w-full md:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Search by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-center">
          <Stethoscope className="mb-4 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <div 
              key={doctor.id} 
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {doctor.specialty}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">{doctor.name}</h3>
                
                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span>{doctor.experience} Experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span>{doctor.workingHours.start} - {doctor.workingHours.end}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setIsProfileOpen(true);
                    }}
                  >
                    View Profile
                  </Button>
                  <Link to={`/dashboard?tab=book&doctor=${doctor.id}`} className="flex-1">
                    <Button className="w-full">Book Now</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
