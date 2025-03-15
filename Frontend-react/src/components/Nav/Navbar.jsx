// src/components/Nav/Navbar.jsx
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import from your contexts
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";

export default function NavBar() {
  const { isAuthenticated, role, logout } = useAuth();
  const { notifications, markAsRead, loading } = useNotifications();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Check if the user is a barber
  const isBarber = role === "BARBER";

  // Calculate unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // When user clicks a notification
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // e.g., navigate somewhere or do something
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      ref={menuRef}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
                 fixed w-full z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo + Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img
                src="/src/assets/logo.png"
                alt="Hairmony Logo"
                className="h-10 w-10 transition-transform hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-6">
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                             dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Home
                </Link>
                <Link
                  to="/reservation"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                             dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Reservation
                </Link>

                {/* If logged in and NOT barber */}
                {isAuthenticated && !isBarber && (
                  <>
                    <Link
                      to="/collection-list"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                                 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      My Reservations
                    </Link>
                    <Link
                      to="/convertpoints"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                                 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      My Points
                    </Link>
                  </>
                )}

                {/* If logged in and barber */}
                {isAuthenticated && isBarber && (
                  <Link
                    to="/dashboardbarber"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                               dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Barber Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Example Search Bar */}
          <div className="hidden md:block relative w-96">
            <input
              type="text"
              placeholder="Search hairstyles or barbers..."
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                         border border-transparent focus:border-indigo-500 
                         focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30 transition-all"
            />
            <button className="absolute right-2 top-2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Right Section: Notifications & Profile OR Login/Register */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsProfileOpen(false);
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
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 
                                      rounded-lg shadow-xl z-50">
                        {loading ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                                         cursor-pointer border-b last:border-b-0 ${
                                           !notification.read
                                             ? "bg-blue-50 dark:bg-blue-900/20"
                                             : ""
                                         }`}
                            >
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                        setIsNotificationsOpen(false);
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
                          d="M5.121 17.804A4 4 0 018 16h8
                             a4 4 0 012.879 1.804M12 12a4 4 0 100-8 4 4 0 000 8z"
                        />
                      </svg>
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                                      rounded-md shadow-lg py-1 z-50">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 
                                     dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Profile
                        </Link>
                        {isBarber && (
                          <Link
                            to="/dashboardbarber"
                            className="block px-4 py-2 text-sm text-gray-700 
                                       dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Barber Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 
                                     dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // If not authenticated, show Login / Register
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                               dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                               dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 
                         hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                         dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Home
            </Link>
            <Link
              to="/reservation"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                         dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Reservation
            </Link>

            {isAuthenticated && !isBarber && (
              <>
                <Link
                  to="/collection-list"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                             dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  My Reservations
                </Link>
                <Link
                  to="/convertpoints"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                             dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  My Points
                </Link>
              </>
            )}

            {isAuthenticated && isBarber && (
              <Link
                to="/dashboardbarber"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 
                           dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Barber Dashboard
              </Link>
            )}

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
        </div>
      )}
    </nav>
  );
}
