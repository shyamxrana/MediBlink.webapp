import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Calendar, ShieldCheck, Star, ArrowRight, Activity, Stethoscope, HeartPulse, Sparkles, Clock, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/utils/cn';

export default function HomePage() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
  };

  return (
    <div ref={containerRef} className="flex flex-col bg-[#f5f5f4] min-h-screen -mt-8 pt-8 overflow-hidden font-sans">
      
      {/* Hero Section - Split Layout */}
      <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="max-w-3xl z-10"
          >
            <motion.div variants={slideUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-900">Accepting New Patients</span>
            </motion.div>
            
            <motion.h1 variants={slideUp} className="text-[12vw] leading-[0.85] lg:text-[100px] font-semibold tracking-tighter text-[#0a0a0a] mb-8">
              Health. <br/>
              <span className="text-slate-400 italic font-serif">Reimagined.</span>
            </motion.h1>
            
            <motion.p variants={slideUp} className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-light">
              Experience healthcare without the wait. Connect with world-class specialists, manage your records, and book appointments instantly.
            </motion.p>
            
            <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard?tab=book">
                <Button size="lg" className="w-full sm:w-auto h-16 px-8 text-lg bg-[#0a0a0a] hover:bg-slate-800 text-white rounded-full transition-all group">
                  Book Appointment 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-8 text-lg border-slate-300 text-slate-900 hover:bg-white rounded-full transition-all">
                    Create Account
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Right Side - Dynamic Visuals */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className="relative h-[600px] hidden lg:block"
          >
            {/* Main Image */}
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=1200&auto=format&fit=crop" 
                alt="Modern Healthcare" 
                className="object-cover w-full h-full opacity-90"
              />
            </div>

            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 -left-12 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-[240px]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Next Available</p>
                  <p className="text-xs text-slate-500">Today, 2:30 PM</p>
                </div>
              </div>
              <Button size="sm" className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl">
                Secure Slot
              </Button>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 -right-12 bg-[#0a0a0a] text-white p-6 rounded-3xl shadow-2xl max-w-[260px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <img key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a]" src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                  ))}
                </div>
                <div className="flex text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-bold text-white">4.9/5</span>
                </div>
              </div>
              <p className="text-sm text-slate-300">From 10,000+ patient reviews</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="w-full bg-[#0a0a0a] text-white py-6 overflow-hidden flex whitespace-nowrap border-y border-white/10">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 items-center text-xl font-medium tracking-widest uppercase"
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16 items-center">
              <span>24/7 Support</span>
              <span className="text-slate-600">•</span>
              <span>Top Doctors</span>
              <span className="text-slate-600">•</span>
              <span>Secure Records</span>
              <span className="text-slate-600">•</span>
              <span>Instant Booking</span>
              <span className="text-slate-600">•</span>
              <span>Telehealth</span>
              <span className="text-slate-600">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#0a0a0a] mb-6">
            Everything you need. <br/>
            <span className="text-slate-400 font-serif italic">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
          {/* Large Feature */}
          <motion.div 
            whileHover={{ scale: 0.98 }}
            className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden group"
          >
            <div className="relative z-10 max-w-md">
              <div className="h-14 w-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Smart Scheduling</h3>
              <p className="text-lg text-slate-600">Our AI-powered scheduling system finds the perfect time slot for you, minimizing wait times and maximizing convenience.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-indigo-50 to-transparent rounded-tl-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
          </motion.div>

          {/* Small Feature 1 */}
          <motion.div 
            whileHover={{ scale: 0.98 }}
            className="bg-[#0a0a0a] rounded-[2.5rem] p-10 text-white relative overflow-hidden group"
          >
            <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Video className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Telehealth</h3>
            <p className="text-slate-400">Consult with top specialists from the comfort of your home via HD video.</p>
          </motion.div>

          {/* Small Feature 2 */}
          <motion.div 
            whileHover={{ scale: 0.98 }}
            className="bg-emerald-50 rounded-[2.5rem] p-10 relative overflow-hidden group border border-emerald-100"
          >
            <div className="h-14 w-14 bg-emerald-200/50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="h-7 w-7 text-emerald-700" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-950 mb-3">Bank-grade Security</h3>
            <p className="text-emerald-800/80">Your medical records are encrypted and stored with the highest security standards.</p>
          </motion.div>

          {/* Medium Feature */}
          <motion.div 
            whileHover={{ scale: 0.98 }}
            className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col justify-end group"
          >
            <div className="absolute top-10 right-10">
              <div className="h-14 w-14 bg-fuchsia-100 rounded-2xl flex items-center justify-center">
                <Activity className="h-7 w-7 text-fuchsia-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Comprehensive Care</h3>
            <p className="text-lg text-slate-600 max-w-lg">From routine checkups to specialized treatments, our network covers all your healthcare needs under one roof.</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Brutalist Typography */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 divide-x divide-slate-100">
            {[
              { label: 'Active Doctors', value: '500+' },
              { label: 'Happy Patients', value: '50k+' },
              { label: 'Appointments', value: '100k+' },
              { label: 'Years Experience', value: '15+' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-6 flex flex-col justify-center"
              >
                <p className="text-5xl md:text-7xl font-bold tracking-tighter text-[#0a0a0a] mb-2">
                  {stat.value}
                </p>
                <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 lg:py-32 bg-[#f5f5f4]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#0a0a0a] mb-6">
              Simple process. <br/>
              <span className="text-slate-400 font-serif italic">Seamless care.</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              { step: '01', title: 'Find your specialist', desc: 'Browse our curated network of top-rated medical professionals by specialty or location.' },
              { step: '02', title: 'Book instantly', desc: 'Select a time that works for you. No phone calls, no waiting on hold.' },
              { step: '03', title: 'Get treated', desc: 'Receive world-class care in person or via secure, high-definition video consult.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 80 }}
                className="relative"
              >
                <div className="text-7xl md:text-8xl font-bold text-slate-200 mb-6 font-serif tracking-tighter">{item.step}</div>
                <h3 className="text-2xl font-bold text-[#0a0a0a] mb-4">{item.title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed max-w-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Specialists */}
      <section className="py-24 lg:py-32 bg-white rounded-t-[3rem] border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#0a0a0a]">
              World-class <br/>
              <span className="text-slate-400 font-serif italic">specialists.</span>
            </h2>
            <Link to="/doctors">
              <Button variant="outline" className="rounded-full h-12 px-6 text-base border-slate-300">
                View all doctors
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Dr. Sarah Chen', spec: 'Cardiologist', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=500&auto=format&fit=crop' },
              { name: 'Dr. Marcus Johnson', spec: 'Neurologist', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop' },
              { name: 'Dr. Emily Rodriguez', spec: 'Pediatrician', img: 'https://images.unsplash.com/photo-1594824432258-f7a11c35090b?q=80&w=500&auto=format&fit=crop' },
              { name: 'Dr. James Wilson', spec: 'Orthopedics', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=500&auto=format&fit=crop' }
            ].map((doc, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-6 bg-slate-100 relative">
                  <img src={doc.img} alt={doc.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full">
                      Book Session
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{doc.name}</h3>
                <p className="text-slate-500 font-medium">{doc.spec}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#f5f5f4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#0a0a0a] rounded-[3rem] p-16 md:p-24 text-center text-white relative overflow-hidden"
          >
            {/* Abstract shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter mb-8">
                Ready to start?
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
                Join thousands of patients who have already simplified their healthcare journey.
              </p>
              
              <Link to="/dashboard?tab=book">
                <Button size="lg" className="bg-white text-[#0a0a0a] hover:bg-slate-200 h-16 px-10 text-lg rounded-full transition-all font-medium">
                  Book Your First Appointment
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
