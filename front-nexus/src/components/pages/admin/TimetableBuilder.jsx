import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Users,
  Search,
  Filter,
  Plus,
  X,
  Save,
  Edit2,
} from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TimetableBuilder = () => {
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState(null);
  const [filterCourse, setFilterCourse] = useState(null);
  const [filterYearLevel, setFilterYearLevel] = useState(null);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    course_id: null,
    year_level: null,
    section_id: "",
    schedule_day: "Monday",
    schedule_time_start: "",
    schedule_time_end: "",
    room: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  useEffect(() => {
    fetchSections();
    fetchPeriods();
    fetchCourses();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sections`);
      console.log("Sections data:", response.data);
      setSections(response.data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/academic-periods`,
      );
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/course/courses`,
      );
      console.log("Courses data:", response.data);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Filter sections by selected period, course, year level, and day
  const filteredSections = sections.filter((section) => {
    const matchesPeriod =
      !filterPeriod || section.period_id === filterPeriod.value;
    const matchesCourse =
      !filterCourse || section.course_id === filterCourse.value;
    const matchesYearLevel =
      !filterYearLevel || section.year_level === filterYearLevel.value;
    const matchesDay =
      !section.schedule_day || section.schedule_day === selectedDay;
    const matchesSearch =
      !searchQuery ||
      section.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.section_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.room?.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      matchesPeriod &&
      matchesCourse &&
      matchesYearLevel &&
      matchesDay &&
      matchesSearch &&
      section.schedule_time_start
    );
  });

  // Group sections by Course → Year Level → Section
  const groupedSections = filteredSections.reduce((acc, section) => {
    const courseKey = `${section.course_code} - ${section.course_title}`;
    const yearLevel = section.year_level || "N/A";

    if (!acc[courseKey]) {
      acc[courseKey] = {};
    }
    if (!acc[courseKey][yearLevel]) {
      acc[courseKey][yearLevel] = [];
    }
    acc[courseKey][yearLevel].push(section);
    return acc;
  }, {});

  // Group sections by time slot
  const getSectionsForTimeSlot = (timeSlot) => {
    return filteredSections.filter((section) => {
      if (!section.schedule_time_start) return false;
      const sectionStart = section.schedule_time_start.substring(0, 5);
      return sectionStart === timeSlot;
    });
  };

  const periodOptions = periods.map((period) => ({
    value: period.period_id,
    label: `${period.period_name} ${period.year}`,
  }));

  const courseOptions = courses.map((course) => ({
    value: course.id || course.course_id,
    label: `${course.code || "N/A"} - ${course.title || "N/A"}`,
  }));
  console.log("Course options:", courseOptions);

  const yearLevelOptions = [
    { value: 1, label: "1st Year" },
    { value: 2, label: "2nd Year" },
    { value: 3, label: "3rd Year" },
    { value: 4, label: "4th Year" },
    { value: 5, label: "5th Year" },
  ];

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        course_id: section.course_id || "",
        year_level: section.year_level || "",
        section_id: section.section_id,
        schedule_day: section.schedule_day || "Monday",
        schedule_time_start: section.schedule_time_start || "",
        schedule_time_end: section.schedule_time_end || "",
        room: section.room || "",
      });
    } else {
      setEditingSection(null);
      setFormData({
        course_id: null,
        year_level: null,
        section_id: "",
        schedule_day: "Monday",
        schedule_time_start: "",
        schedule_time_end: "",
        room: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setFormData({
      course_id: null,
      year_level: null,
      section_id: "",
      schedule_day: "Monday",
      schedule_time_start: "",
      schedule_time_end: "",
      room: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      if (!formData.section_id) {
        alert("Please select a section");
        return;
      }

      // Get the current section data
      const currentSection = sections.find(
        (s) => s.section_id === formData.section_id,
      );

      if (!currentSection) {
        alert("Section not found");
        return;
      }

      const updateData = {
        course_id: currentSection.course_id,
        period_id: currentSection.period_id,
        section_name: currentSection.section_name,
        max_capacity: currentSection.max_capacity,
        status: currentSection.status || "active",
        schedule_day: formData.schedule_day,
        schedule_time_start: formData.schedule_time_start,
        schedule_time_end: formData.schedule_time_end,
        room: formData.room,
      };

      console.log("Saving schedule with data:", updateData);

      const response = await axios.put(
        `${API_BASE}/api/sections/${formData.section_id}`,
        updateData,
      );

      console.log("Save response:", response);
      alert("Schedule saved successfully!");
      handleCloseModal();
      fetchSections();
    } catch (error) {
      console.error("Error saving schedule:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      alert(
        `Failed to save schedule: ${error.response?.data?.error || error.message}`,
      );
    }
  };

  return (
    <div className=" p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600" />
            Timetable Builder
          </h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Schedule
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total Classes ({selectedDay})
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {filteredSections.length}
                </p>
              </div>
              <BookOpen
                className="text-indigo-600"
                size={28}
              />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Active Time Slots
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {
                    timeSlots.filter(
                      (t) => getSectionsForTimeSlot(t).length > 0,
                    ).length
                  }
                </p>
              </div>
              <Clock className="text-green-600" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {filteredSections.reduce(
                    (sum, s) => sum + s.current_enrolled,
                    0,
                  )}
                </p>
              </div>
              <Users
                className="text-purple-600"
                size={28}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input - LEFT */}
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search classes, rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
            </div>

            {/* Filters - RIGHT */}
            <div className="flex items-center gap-2">
              <div className="w-52">
                <Select
                  options={courseOptions}
                  value={filterCourse}
                  onChange={setFilterCourse}
                  placeholder="Filter by Course"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="w-36">
                <Select
                  options={yearLevelOptions}
                  value={filterYearLevel}
                  onChange={setFilterYearLevel}
                  placeholder="Year Level"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="w-48">
                <Select
                  options={periodOptions}
                  value={filterPeriod}
                  onChange={setFilterPeriod}
                  placeholder="Period"
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 flex-wrap bg-white p-3 rounded-md border border-slate-200">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-600 mr-2">
              <Filter size={14} />
              Select Day:
            </span>
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all text-sm ${
                  selectedDay === day
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Grid - Grouped by Course → Year → Section */}
        <div className="bg-white rounded-md shadow-sm p-4 border border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
            <Calendar
              className="text-indigo-600"
              size={24}
            />
            <h3 className="text-lg font-bold text-slate-900">
              {selectedDay} Schedule
            </h3>
            <span className="ml-auto text-xs text-slate-500">
              {filteredSections.length}{" "}
              {filteredSections.length === 1 ? "class" : "classes"}
            </span>
          </div>

          <div className="space-y-4">
            {Object.keys(groupedSections).length > 0 ? (
              Object.entries(groupedSections)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([courseKey, yearLevels]) => (
                  <div
                    key={courseKey}
                    className="border border-slate-200 rounded-md overflow-hidden"
                  >
                    {/* Course Header */}
                    <div className="bg-indigo-100 px-4 py-2.5 border-b border-slate-200">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <BookOpen
                          size={16}
                          className="text-indigo-600"
                        />
                        {courseKey}
                      </h4>
                    </div>

                    {/* Year Levels */}
                    <div className="divide-y divide-slate-200">
                      {Object.entries(yearLevels)
                        .sort(([a], [b]) => {
                          if (a === "N/A") return 1;
                          if (b === "N/A") return -1;
                          return parseInt(a) - parseInt(b);
                        })
                        .map(([yearLevel, sections]) => (
                          <div
                            key={yearLevel}
                            className="bg-white"
                          >
                            {/* Year Level Header */}
                            <div className="bg-slate-50 px-4 py-2">
                              <span className="text-xs font-semibold text-slate-700">
                                Year{" "}
                                {yearLevel === "N/A"
                                  ? "Level Not Set"
                                  : yearLevel}
                              </span>
                            </div>

                            {/* Sections Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                              {sections
                                .sort((a, b) =>
                                  a.section_name.localeCompare(b.section_name),
                                )
                                .map((section, index) => {
                                  const colors = [
                                    "border-l-indigo-500 bg-indigo-50",
                                    "border-l-green-500 bg-green-50",
                                    "border-l-purple-500 bg-purple-50",
                                    "border-l-orange-500 bg-orange-50",
                                    "border-l-pink-500 bg-pink-50",
                                    "border-l-cyan-500 bg-cyan-50",
                                  ];
                                  const colorClass =
                                    colors[index % colors.length];

                                  return (
                                    <div
                                      key={section.section_id}
                                      className={`border-l-4 rounded-md p-3 shadow-sm hover:shadow-md transition-all ${colorClass} border border-slate-200 relative group`}
                                    >
                                      <button
                                        onClick={() => handleOpenModal(section)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow-md"
                                        title="Edit Schedule"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <div className="font-bold text-sm text-slate-900 mb-2">
                                        Section {section.section_name}
                                      </div>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                          <Clock size={12} />
                                          <span>
                                            {section.schedule_time_start} -{" "}
                                            {section.schedule_time_end}
                                          </span>
                                        </div>
                                        {section.room && (
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            <MapPin size={12} />
                                            <span>{section.room}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                          <Users size={12} />
                                          <span>
                                            {section.current_enrolled}/
                                            {section.max_capacity} students
                                          </span>
                                        </div>
                                      </div>
                                      {section.period_name && (
                                        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                                          {section.period_name} {section.year}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12">
                <Calendar
                  size={48}
                  className="text-slate-300 mx-auto mb-3"
                />
                <p className="text-slate-500 font-medium text-sm">
                  No classes scheduled for {selectedDay}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Try selecting a different day or adjusting your filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Schedule Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  {editingSection ? "Edit Schedule" : "Add Schedule"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course/Program <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={courseOptions}
                    value={
                      courseOptions.find(
                        (c) => c.value === formData.course_id,
                      ) || null
                    }
                    onChange={(option) => {
                      console.log("Selected course option:", option);
                      const courseId = option ? option.value : null;
                      console.log("Course ID to set:", courseId);
                      setFormData((prev) => {
                        const newData = {
                          ...prev,
                          course_id: courseId,
                          section_id: "", // Reset section when course changes
                        };
                        console.log(
                          "New formData after course selection:",
                          newData,
                        );
                        return newData;
                      });
                    }}
                    placeholder="Select a course"
                    isDisabled={!!editingSection}
                    className="text-sm"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* Year Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Year Level <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={yearLevelOptions}
                    value={
                      yearLevelOptions.find(
                        (y) => y.value === formData.year_level,
                      ) || null
                    }
                    onChange={(option) => {
                      console.log("Selected year level:", option);
                      setFormData((prev) => ({
                        ...prev,
                        year_level: option ? option.value : null,
                        section_id: "", // Reset section when year level changes
                      }));
                    }}
                    placeholder="Select year level"
                    isDisabled={!!editingSection}
                    className="text-sm"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={(() => {
                      const filtered = sections.filter((s) => {
                        const matchesCourse =
                          formData.course_id === null ||
                          Number(s.course_id) === Number(formData.course_id);
                        // Sections don't have year_level, so we only filter by course
                        console.log(
                          `Section ${s.section_id}: course match=${matchesCourse}`,
                          s,
                        );
                        return matchesCourse;
                      });
                      console.log("Filtered sections:", filtered);
                      console.log("Current formData:", formData);
                      return filtered.map((s) => ({
                        value: s.section_id,
                        label: s.section_name || `Section ${s.section_id}`,
                      }));
                    })()}
                    value={(() => {
                      if (!formData.section_id) return null;
                      const section = sections.find(
                        (s) => s.section_id === formData.section_id,
                      );
                      if (!section) return null;
                      return {
                        value: section.section_id,
                        label:
                          section.section_name ||
                          `Section ${section.section_id}`,
                      };
                    })()}
                    onChange={(option) => {
                      console.log("Selected section:", option);
                      setFormData((prev) => ({
                        ...prev,
                        section_id: option ? option.value : "",
                      }));
                    }}
                    placeholder={
                      formData.course_id !== null
                        ? "Select a section"
                        : "Select course first"
                    }
                    isDisabled={!!editingSection || formData.course_id === null}
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Schedule Day */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="schedule_day"
                    value={formData.schedule_day}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="schedule_time_start"
                      value={formData.schedule_time_start}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="schedule_time_end"
                      value={formData.schedule_time_end}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="e.g., Room 101, Lab A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <Save size={16} />
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableBuilder;
