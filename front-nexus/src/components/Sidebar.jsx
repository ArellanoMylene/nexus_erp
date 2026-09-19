// src/components/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Menu from "./SidebarMenu";
import { GraduationCap, Circle, ChevronDown } from "lucide-react";

function Sidebar({ isOpen }) {
  const role = localStorage.getItem("role") || "Admin";
  const menuList = Menu[role] || [];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <aside
      className={`h-screen bg-white shadow-xl overflow-y-auto
                  ${isOpen ? "w-[250px]" : "w-[80px]"} 
                  transition-all duration-300 ease-in-out flex-shrink-0`}
    >
      <nav className="p-3">
        {/* Sidebar Logo */}
        <span
          className={`flex items-center justify-center border-b space-x-2 text-lg font-semibold text-blue-600 mb-4 transition-all duration-300`}
        >
          <GraduationCap size={40} />
          <span
            className={`text-sm transition-all duration-300 ${
              isOpen ? "inline" : "hidden"
            }`}
          >
            Nexus
          </span>
        </span>

        {/* Sidebar Links */}
        <ul className="space-y-1 mt-5">
          {menuList.map((item, index) => {
            const IconComponent = item.icons || Circle;

            return (
              <li key={index}>
                {item.submenu ? (
                  <>
                    {/* Parent Menu Button */}
                    <button
                      onClick={() =>
                        setOpenIndex(openIndex === index ? null : index)
                      }
                      className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 text-gray-700 hover:bg-gray-100`}
                    >
                      <span className={`${isOpen ? "mr-3" : "mx-auto"}`}>
                        <IconComponent size={18} />
                      </span>

                      <span
                        className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-sm ${
                          isOpen
                            ? "w-auto max-w-full opacity-100"
                            : "w-0 max-w-0 opacity-0"
                        }`}
                      >
                        {item.title}
                      </span>

                      {/* Chevron */}
                      {isOpen && (
                        <ChevronDown
                          size={16}
                          className={`ml-auto transition-transform duration-300 ${
                            openIndex === index ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu Items */}
                    {openIndex === index && (
                      <ul className="ml-6 mt-1 space-y-1 border-l pl-3">
                        {item.submenu.map((sub, i) => {
                          const SubIcon = sub.icons || Circle;

                          return (
                            <li key={i}>
                              <NavLink
                                to={sub.link}
                                className={({ isActive }) =>
                                  `flex items-center px-2 py-1 rounded-md text-sm ${
                                    isActive
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-600 hover:bg-gray-200"
                                  }`
                                }
                              >
                                <SubIcon size={14} className="mr-2" />
                                {sub.label}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  // Regular link without submenu
                  <NavLink
                    to={item.path || "#"}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg transition-colors duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                    end={item.path === "/dashboard"}
                  >
                    <span
                      className={`flex-shrink-0 ${isOpen ? "mr-3" : "mx-auto"}`}
                    >
                      <IconComponent size={18} />
                    </span>

                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-sm ${
                        isOpen
                          ? "w-auto max-w-full opacity-100"
                          : "w-0 max-w-0 opacity-0"
                      }`}
                    >
                      {item.title}
                    </span>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
