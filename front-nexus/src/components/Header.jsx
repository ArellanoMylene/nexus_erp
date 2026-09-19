// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, Settings, LogOut, ChevronDown } from "lucide-react";

const Header = ({ toggleSidebar, sidebarWidth, onLogout }) => {
  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const userName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : "User";
  const userRole = localStorage.getItem("role") || "";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // Handle countdown effect
  useEffect(() => {
    let timer;
    if (isLoggingOut && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isLoggingOut && countdown === 0) {
      onLogout(); // call logout after countdown
    }
    return () => clearTimeout(timer);
  }, [isLoggingOut, countdown, onLogout]);

  // Open the yes/no confirmation instead of logging out immediately
  const requestLogout = () => {
    setIsDropdownOpen(false);
    setIsConfirmingLogout(true);
  };

  const cancelLogout = () => {
    setIsConfirmingLogout(false);
  };

  const confirmLogout = () => {
    setIsConfirmingLogout(false);
    setCountdown(5);
    setIsLoggingOut(true);
  };

  return (
    <header
      className="flex justify-between items-center h-16 bg-white shadow-md px-4 transition-all duration-300"
      style={{ width: `calc(100% - ${sidebarWidth}px)` }}
    >
      {/* Left Section */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-4 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle Sidebar Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <button
          className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none hidden sm:block"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <button
          className="p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none hidden sm:block"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>

        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 text-gray-700 focus:outline-none hover:text-gray-900 transition duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              {userName[0]}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {userName}
            </span>
            <ChevronDown
              size={16}
              className={`ml-1 transition-transform duration-200 hidden sm:block ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="py-1">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition duration-150"
                  onClick={requestLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yes/No confirmation modal */}
      {isConfirmingLogout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4 w-72">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-150"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-150"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="loader border-4 border-amber-500 border-t-transparent border-solid rounded-full w-12 h-12 animate-spin"></div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Logging out in {countdown} second{countdown !== 1 ? "s" : ""}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loader animation styles */}
      <style>{`
        .loader {
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

export default Header;