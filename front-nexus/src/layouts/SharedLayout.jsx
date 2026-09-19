// src/layouts/SharedLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const SharedLayout = ({ role, handleLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* -------------------- SIDEBAR -------------------- */}
      <Sidebar isOpen={isSidebarOpen} role={role} />

      {/* -------------------- MAIN AREA (Header + Content) -------------------- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header aligned next to sidebar */}
        <Header
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          className={`${
            isSidebarOpen ? "ml-[250px]" : "ml-[80px]"
          } w-[calc(100%-var(--sidebar-width))]`}
        />

        {/* Main content, below header */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SharedLayout;
