"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotifications } from "../../contexts/NotificationContext"

export default function NavBar() {
  const { isAuthenticated, role, logout } = useAuth()
  const { notifications, markAsRead, loading } = useNotifications()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const menuRef = useRef(null)
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)
  const navigate = useNavigate()

  // Check if the user is a barber
  const isBarber = role === "BARBER"

  // Calculate unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // When user clicks a notification
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    // e.g., navigate somewhere or do something
  }

  // Logout
  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav
      ref={menuRef}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
               fixed w-full z-50 shadow-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo + Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 group">
              <img
                src="/src/assets/logo.png"
                alt="Hairmony Logo"
                className="h-10 w-10 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-6">
              <div className="flex space-x-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive("/")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Home
                </Link>

                {/* Show Upload and Live options only for clients */}
                {!isBarber && (
                  <>
                    <Link
                      to="/upload"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive("/upload")
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload
                      </span>
                    </Link>

                    <Link
                      to="/live"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive("/live")
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Live
                      </span>
                    </Link>

                    <Link
                      to="/pay"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive("/pay")
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Offers
                      </span>
                    </Link>
                  </>
                )}

                {/* Show reservation options for both clients and barbers */}
                {!isBarber ? (
                  <Link
                    to="/reservation"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive("/reservation")
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    Book Appointment
                  </Link>
                ) : null}

                {/* MyReservations for both clients and barbers */}
                <Link
                  to="/Myreservations"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive("/Myreservations")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {isBarber ? "My Appointments" : "My Reservations"}
                </Link>

               
              </div>
            </div>
          </div>

          {/* Right Section: Notifications & Profile OR Login/Register */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen)
                        setIsProfileOpen(false)
                      }}
                    >
                      <svg
                        className="h-6 w-6 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11
                           a6 6 0 00-5-5.916V4a1 1 0 00-2 0v1.084
                           A6 6 0 006 11v3c0 .374-.146.735-.405 1.005L4 17h5m6 0v1
                           a3 3 0 01-6 0v-1m6 0H9"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isNotificationsOpen && (
                      <div
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 
                                    rounded-xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                          <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {loading ? (
                            <div className="px-4 py-6 text-sm text-gray-500 text-center">
                              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                              <p className="mt-2">Loading...</p>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-gray-500 text-center">
                              <svg
                                className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                              </svg>
                              No new notifications
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 
                                       cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors ${
                                         !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                       }`}
                              >
                                <div className="flex items-start">
                                  <div
                                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${!notification.read ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11a6 6 0 00-5-5.916V4a1 1 0 00-2 0v1.084A6 6 0 006 11v3c0 .374-.146.735-.405 1.005L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9"
                                      />
                                    </svg>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen)
                        setIsNotificationsOpen(false)
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.121 17.804A4 4 0 018 16h8
                           a4 4 0 012.879 1.804M12 12a4 4 0 100-8 4 4 0 000 8z"
                          />
                        </svg>
                      </div>
                    </button>
                    {isProfileOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 
                                    rounded-xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">User Name</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">user@example.com</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 
                                   dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profile
                          </Link>
                          <Link
                            to="/Myreservations"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 
                                     dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {isBarber ? "My Appointments" : "My Reservations"}
                          </Link>
                        </div>
                        <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 
                                   dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // If not authenticated, show Login / Register
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/")
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Home
            </Link>

            {/* Show Upload and Live options only for clients */}
            {!isBarber && (
              <>
                <Link
                  to="/upload"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/upload")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload
                  </span>
                </Link>

                <Link
                  to="/live"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/live")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Live
                  </span>
                </Link>

                <Link
                  to="/pay"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/pay")
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    Offers
                  </span>
                </Link>
              </>
            )}

            {/* Show reservation options for both clients and barbers */}
            {!isBarber ? (
              <Link
                to="/reservation"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/reservation")
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Book Appointment
              </Link>
            ) : null}

            {/* MyReservations for both clients and barbers */}
            <Link
              to="/Myreservations"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/Myreservations")
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {isBarber ? "My Appointments" : "My Reservations"}
            </Link>

           

            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                           dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                           dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile profile section */}
          {isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A4 4 0 018 16h8a4 4 0 012.879 1.804M12 12a4 4 0 100-8 4 4 0 000 8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">User Name</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">user@example.com</div>
                </div>
                <button
                  className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  onClick={handleLogout}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

