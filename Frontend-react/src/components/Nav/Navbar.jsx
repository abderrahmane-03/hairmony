
import { Link } from "react-router-dom";

// Example placeholders for your authentication logic
const isLoggedIn = true;       // or from context
const isCollector = false;     // or from context
const notifications = [
  // { title: '...', message: '...', date: new Date() },
];
const unreadNotifications = 0;
function logout() {
  console.log("Logging out...");
}

export default function NavBar() {
  return (
    <div className="p-4 w-full fixed z-50">
      {/* Navigation Bar */}
      <div className="p-2 text-gray-900 bg-white rounded-lg shadow-lg font-medium capitalize flex items-center justify-between">
        {/* Logo */}
        <span className="px-2 mr-2 border-r border-gray-800">
          <img
            src="/src/assets/Hairmony.png"
            alt="Hairmony Logo"
            className="w-12 h-12 -mt-1 inline mx-auto cursor-pointer"
          />
        </span>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          {/* If Logged In */}
          {isLoggedIn && (
            <>
              {/* Common Links */}
              <Link
                to="/"
                className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
              >
                <i className="fas fa-home mr-1" />
                Home
              </Link>

              {/* Regular User Links (NOT a collector) */}
              {!isCollector && (
                <>
                  <Link
                    to="/collection-list"
                    className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
                  >
                    <i className="fas fa-list mr-1" />
                    Mes Rendez-vous
                  </Link>
                  <Link
                    to="/convertpoints"
                    className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
                  >
                    <i className="fas fa-coins mr-1" />
                    Mes Points
                  </Link>
                </>
              )}

              {/* Collector Links */}
              {isCollector && (
                <Link
                  to="/collectorDashboard"
                  className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
                >
                  <i className="fas fa-tasks mr-1" />
                  Barbers
                </Link>
              )}
            </>
          )}

          {/* If NOT Logged In */}
          {!isLoggedIn && (
            <>
              <Link
                to="/login"
                className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
              >
                <i className="fas fa-sign-in-alt mr-1" />
                Login
              </Link>
              <Link
                to="/register"
                className="px-2 py-1 hover:bg-gray-200 hover:text-gray-700 text-sm rounded transition-colors"
              >
                <i className="fas fa-user-plus mr-1" />
                Register
              </Link>
            </>
          )}

          {/* Logged-in User Section */}
          {isLoggedIn && (
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative group">
                <button className="p-2 hover:bg-gray-200 rounded-full relative">
                  <i className="fas fa-bell" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 text-xs bg-red-500 text-white px-2 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown */}
                <div className="hidden group-hover:block absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Aucune nouvelle notification
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-gray-500">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.date.toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="p-2 hover:bg-gray-200 rounded-full">
                  <i className="fas fa-user" />
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Profil
                  </Link>
                  {isCollector && (
                    <Link
                      to="/collector-dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Tableau de bord
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
