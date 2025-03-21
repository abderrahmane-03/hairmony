// src/App.jsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import NavBar from "./components/Nav/Navbar";
import LoginForm from "./components/Authentication/Login";
import RegisterForm from "./components/Authentication/Register";

// Example FaceDetection components (adjust paths as needed)
import UploadImage from "./components/FaceDetection/FaceDetection";
import LiveFaceShape from "./components/FaceDetection/LiveFaceShape";

// Example Reservation page
import ReservationPage from "./components/Reservation/ReservationPage";
import ReservationsPage from "./components/Reservation/ReservationDashboard";

// If you have a PrivateRoute
import PrivateRoute from "./Security/ProtectRoute";

// Import your context providers
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationContext";
import PaymentOffers from "./components/Payment/PaymentOffers";
import PaymentSucsess from "./components/Payment/PaymentSuccess";
import PaymentCancel from "./components/Payment/PaymentCancel";

import {Calendar, Camera,MapPin, Phone, Mail  } from 'lucide-react';

function Home() {
  // Fix for the missing state variable
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  const testimonials = [
    {
      name: "John Smith",
      text: "The face shape analysis helped me find the perfect hairstyle. Best Hairmony experience ever!",
      role: "Regular Customer"
    },
    {
      name: "Michael Chen",
      text: "I've been coming here for years. The barbers are skilled and the technology they use is impressive.",
      role: "Loyal Client"
    },
    {
      name: "David Wilson",
      text: "The AI face detection feature recommended a style I never would have tried. Now it's my signature look!",
      role: "New Customer"
    }
  ];

  return (
  <div className="flex min-h-screen flex-col">
  {/* Header */}

  <main className="flex-1">
    {/* Hero Section */}
    <section className="pt-16 relative flex h-[670px] md:h-[790px] xl:h-[770px] flex-grow overflow-hidden bg-black pl-8 md:pl-24">
      {/* Logo */}
      <Link href="/">
        <div className="flex absolute top-28 left-22 z-20">
          <h1 className="text-2xl font-bold text-white">Hairmony</h1>
          {/* Logo image */}
          <img 
            src="/src/assets/logo.png" 
            alt="Hairmony Logo" 
            className="h-12 w-12 ml-2"
          />
        </div>
      </Link>
      
      <div className="flex w-full items-center">
        {/* Left content */}
        <div className="z-20 flex flex-col justify-center gap-5 w-full lg:w-1/2">
          <div className="relative flex items-center">
            <div className="w-16 border border-gray-400"></div>
            <h2 className="mx-4 text-xs font-semibold uppercase text-gray-400">
              A premium hair salon for men in Warsaw
            </h2>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white">Hairmony</h1>
          <h2 className="text-lg text-gray-400 max-w-md">
            We are experts in cutting. We work quickly, carefully, and elegantly.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
              to="/live"
              className="max-w-fit rounded-full border border-blue-700 bg-red-700 px-6 py-3 text-sm font-semibold uppercase text-white transition-all hover:bg-red-700 flex items-center gap-2"
            >
              <Camera size={18} />
              Try Face Detection
            </Link>
            <Link
              to="/reservation"
              className="max-w-fit rounded-full border border-red-700 px-6 py-3 text-sm font-semibold uppercase text-white transition-all hover:bg-red-700 flex items-center gap-2"
            >
              <Calendar size={18} />
              Book Appointment
            </Link>
          </div>
        </div>
        
        {/* Right hero image */}
        <div className="hidden lg:block lg:w-1/2 h-full relative">
          <div className="w-full h-full bg-gradient-to-r from-black to-transparent absolute z-10"></div>
          <img 
            src="/src/assets/HomeFace.jpeg" 
            alt="Hairmony Hero" 
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
      
      {/* Mobile background image overlay */}
      <div className="absolute inset-0 lg:hidden bg-black bg-opacity-70 z-0">
        <img 
          src="/src/assets/HomeFace.jpeg" 
          alt="Hairmony Mobile Hero" 
          className="ml-14 w-full h-full object-cover opacity-50"
        />
      </div>
    </section>

    {/* Features Section with Images */}
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Our Expertise</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Combining traditional barbering techniques with modern AI technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-56 relative overflow-hidden">
              <img 
                src="/src/assets/precision.jpeg" 
                alt="Precision Cuts" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x224/374151/FFFFFF?text=Precision+Cuts";
                }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Precision Cuts</h3>
              <p className="text-gray-400">
                Our expert barbers deliver precision haircuts tailored to your face shape and style preferences.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-56 relative overflow-hidden">
              <img 
                src="/src/assets/ai.jpeg" 
                alt="AI Face Analysis" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x224/374151/FFFFFF?text=AI+Face+Analysis";
                }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">AI Face Analysis</h3>
              <p className="text-gray-400">
                Our advanced technology analyzes your face shape to recommend the perfect hairstyle.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-56 relative overflow-hidden">
              <img 
                src="/src/assets/atmospher.jpeg" 
                alt="Premium Experience" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x224/374151/FFFFFF?text=Premium+Experience";
                }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Premium Experience</h3>
              <p className="text-gray-400">
                Enjoy a relaxing atmosphere with premium products and exceptional service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-16 bg-gradient-to-r from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">What Our Clients Say</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Hear from customers who have experienced our AI-powered barbering services
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-opacity duration-500 ${
                  activeTestimonial === index ? "opacity-100" : "opacity-0 absolute inset-0"
                }`}
              >
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
                  <svg className="h-10 w-10 text-red-700 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-xl mb-6 text-white">{testimonial.text}</p>
                  <div className="flex items-center">
                    {/* Testimonial image */}
                    <img 
                      src={`/src/assets/testimonial${index + 1}.jpeg`}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/48/EF4444/FFFFFF?text=${testimonial.name.charAt(0)}`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`h-3 w-3 rounded-full transition-colors ${
                  activeTestimonial === index ? "bg-red-700" : "bg-white/30"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Services Section */}
    <section
      id="services"
      className="flex w-full flex-col gap-11 bg-gray-900 bg-cover bg-center bg-no-repeat px-8 py-20 md:px-24 md:py-24 xl:py-32 relative"
    >
      {/* Services background image */}
      <div className="absolute inset-0 z-0 opacity-20">
        <img 
          src="/src/assets/services-bg.jpeg" 
          alt="Services Background" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/1920x1080/1F2937/FFFFFF?text=Services+Background";
          }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col gap-5">
        <div className="relative flex items-center">
          <div className="w-16 border border-gray-500"></div>
          <h2 className="mx-4 text-xs font-semibold uppercase text-gray-500">
            Come to the best barbers in your city
          </h2>
        </div>
        <h3 className="text-left text-4xl font-bold text-white">Services and Prices</h3>
      </div>
      
      <div className="relative z-10 flex flex-col bg-gradient-to-b from-slate-900 xl:flex-row">
        <ul className="flex flex-col gap-5 px-10 pb-5 pt-8 text-gray-400 xl:w-[50%]">
          <li className="flex justify-between gap-5">
            <h4>Mens Haircut</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $25</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Beard Trim</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $18</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Mustache Trim</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $12</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Straight Razor Shave</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $18</p>
          </li>
        </ul>
        <ul className="flex flex-col gap-5 px-10 pb-8 text-gray-400 xl:w-[50%] xl:py-8">
          <li className="flex justify-between gap-5">
            <h4>Single Length Cut</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $12</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Clipper Cut</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $18</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Boys Cut (under 12)</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $20</p>
          </li>
          <li className="flex justify-between gap-5">
            <h4>Hair Repigmentation</h4>
            <div className="flex-grow border-b border-gray-500"></div>
            <p>from $25</p>
          </li>
        </ul>
      </div>
      <Link
        href="/reservation"
        className="relative z-10 max-w-fit place-self-center rounded-full border border-red-700 px-10 py-3 text-xs font-semibold uppercase text-white transition-all hover:bg-red-700"
      >
        Book Online
      </Link>
    </section>

    {/* Contact Section */}
    <section id="contact" className="flex flex-col bg-gray-900 xl:flex-row">
      <div className="flex w-full flex-col gap-10 px-8 py-20 md:px-24 md:py-24 xl:w-[50%] xl:py-32">
        <h2 className="text-center text-4xl font-bold text-white sm:text-left">Contact</h2>
        <ul className="flex flex-col gap-5">
          <li className="flex items-center gap-4">
            <MapPin className="h-6 w-6 text-red-700" />
            <p className="text-lg text-[#9DA4BD]">20 Prosta St, Warsaw, 00-001</p>
          </li>
          <li className="flex items-center gap-4">
            <Phone className="h-6 w-6 text-red-700" />
            <Link
              href="tel:+48111111111"
              className="text-lg text-[#9DA4BD] hover:text-red-700 transition-colors"
            >
              +48 111 111 111
            </Link>
          </li>
          <li className="flex items-center gap-4">
            <Mail className="h-6 w-6 text-red-700" />
            <Link
              href="mailto:info@Hairmony.pl"
              className="text-lg text-[#9DA4BD] hover:text-red-700 transition-colors"
            >
              info@Hairmony.pl
            </Link>
          </li>
        </ul>
        <div className="flex flex-col gap-5">
          <div className="relative flex items-center">
            <div className="w-16 border-t border-white"></div>
            <h3 className="mx-4 text-xs font-semibold uppercase text-white">Opening Hours</h3>
          </div>
          <p className="text-lg text-[#9DA4BD]">Daily from 9:00 AM to 10:00 PM</p>
        </div>
      </div>
      
      {/* Contact section image */}
      <div className="w-full xl:w-[50%]">
        <img 
          src="/src/assets/interior.jpeg" 
          alt="Salon Interior" 
          className="w-96 h-96 m-20 object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/800x600/1F2937/FFFFFF?text=Salon+Interior";
          }}
        />
      </div>
    </section>
    
    {/* Team Section */}
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Meet Our Team</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our skilled barbers combine years of experience with modern techniques
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Team Member 1 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-80 overflow-hidden">
              <img 
                src="/src/assets/John Smith.jpeg" 
                alt="John Smith" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x500/374151/FFFFFF?text=John+Smith";
                }}
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-1">John Smith</h3>
              <p className="text-red-700 mb-4">Master Barber</p>
              <p className="text-gray-400 text-sm">
                With over 10 years of experience, John specializes in classic cuts and beard styling.
              </p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-80 overflow-hidden">
              <img 
                src="/src/assets/Michael Chen.jpeg" 
                alt="Michael Chen" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x500/374151/FFFFFF?text=Michael+Chen";
                }}
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-1">Michael Chen</h3>
              <p className="text-red-700 mb-4">Style Expert</p>
              <p className="text-gray-400 text-sm">
                Michael is our modern styles specialist with expertise in trending haircuts.
              </p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="h-80 overflow-hidden">
              <img 
                src="/src/assets/David Wilson.jpeg" 
                alt="David Wilson" 
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x500/374151/FFFFFF?text=David+Wilson";
                }}
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-1">David Wilson</h3>
              <p className="text-red-700 mb-4">Beard Specialist</p>
              <p className="text-gray-400 text-sm">
                David is our beard grooming expert with a passion for perfect facial hair.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  {/* Footer */}
  <footer className="flex justify-between items-center bg-gray-900 px-8 py-6 border-t border-gray-800">
    <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Hairmony. All rights reserved.</p>
    <div className="flex items-center gap-6">
      <Link href="https://www.instagram.com" className="text-gray-400 hover:text-red-700 transition-colors">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </Link>
      <Link href="https://www.twitter.com" className="text-gray-400 hover:text-red-700 transition-colors">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
        </svg>
      </Link>
    </div>
  </footer>
</div>
)
}
  
export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
            
            
            {/* Example private route for reservatin */}
            <Route element={<PrivateRoute />}>
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/Myreservations" element={<ReservationsPage />} />
            <Route path="/live" element={<LiveFaceShape />} />
            <Route path="/upload" element={<UploadImage />} />
            <Route path="/pay" element={<PaymentOffers />} />
            <Route path="/PaymentSuccess" element={<PaymentSucsess />} />
            <Route path="/PaymentCancel" element={<PaymentCancel />} />
            </Route>
          </Routes>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}
