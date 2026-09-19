import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";

const Pagination = ({ currentPage, totalPages, setPage, totalItems }) => (
  <div className="flex justify-between items-center mt-4 text-sm text-slate-700">
    <span>
      Page {currentPage} of {totalPages} | Total: {totalItems}
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 py-1">{currentPage}</span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-md border disabled:opacity-50 hover:bg-slate-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const ScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  faculty,
  periods,
}) => {
  const [formData, setFormData] = useState({
    faculty_id: null,
    period_id: null,
    day_of_week: "",
    start_time: "",
    end_time: "",
    room: "",
    course_code: "",
    course_title: "",
    section: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        faculty_id: initialData.faculty_id,
        period_id: initialData.period_id,
        day_of_week: initialData.day_of_week || "",
        start_time: initialData.start_time || "",
        end_time: initialData.end_time || "",
        room: initialData.room || "",
        course_code: initialData.course_code || "",
        course_title: initialData.course_title || "",
        section: initialData.section || "",
        schedule_id: initialData.schedule_id,
      });
    } else {
      setFormData({
        faculty_id: null,
        period_id: null,
        day_of_week: "",
        start_time: "",
        end_time: "",
        room: "",
        course_code: "",
        course_title: "",
        section: "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {mode === "add" ? "New Schedule Entry" : "Edit Schedule Entry"}
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Faculty Member *
              </label>
              <Select
                value={
                  faculty.find((f) => f.value === formData.faculty_id) || null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    faculty_id: selected?.value || null,
                  }))
                }
                options={faculty}
                placeholder="Select faculty..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Academic Period *
              </label>
              <Select
                value={
                  periods.find((p) => p.value === formData.period_id) || null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    period_id: selected?.value || null,
                  }))
                }
                options={periods}
                placeholder="Select period..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Day of Week *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    day_of_week: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select...</option>
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_time: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    course_code: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., CS101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={formData.course_title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    course_title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Intro to Programming"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, section: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., A, 1A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room *</label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, room: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Room 101, Lab 2"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {mode === "add" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacultyScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState(null);
  const [filterDay, setFilterDay] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty-schedules`);
      setSchedules(res.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty`);
      const facultyList = (res.data || []).map((f) => ({
        value: f.faculty_id,
        label: `${f.first_name} ${f.last_name}`,
      }));
      setFaculty(facultyList);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/academic-periods`);
      const periodList = (res.data || []).map((p) => ({
        value: p.id || p.period_id,
        label: `${p.school_year} - ${p.semester}`,
      }));
      setPeriods(periodList);
    } catch (err) {
      console.error("Error fetching periods:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchFaculty();
    fetchPeriods();
  }, []);

  const daysOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  const filtered = schedules.filter((s) => {
    const matchSearch =
      (s.faculty_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.course_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.room || "").toLowerCase().includes(search.toLowerCase());
    const matchFaculty = !filterFaculty || s.faculty_id === filterFaculty.value;
    const matchDay = !filterDay || s.day_of_week === filterDay.value;
    return matchSearch && matchFaculty && matchDay;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSubmit = async (data) => {
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/faculty-schedules`, data);
      } else {
        await axios.put(
          `${API_BASE}/api/faculty-schedules/${data.schedule_id}`,
          data
        );
      }
      fetchSchedules();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert(err.response?.data?.message || "Failed to save schedule");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule entry?")) return;
    try {
      await axios.delete(`${API_BASE}/api/faculty-schedules/${id}`);
      fetchSchedules();
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar size={24} /> Faculty Scheduling
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage faculty class schedules and timetables.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by faculty, course, or room..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={filterFaculty}
            onChange={(selected) => {
              setFilterFaculty(selected);
              setPage(1);
            }}
            options={faculty}
            placeholder="Filter by Faculty"
            isClearable
            className="w-48"
          />
          <Select
            value={filterDay}
            onChange={(selected) => {
              setFilterDay(selected);
              setPage(1);
            }}
            options={daysOptions}
            placeholder="Filter by Day"
            isClearable
            className="w-40"
          />
          <button
            onClick={() => openModal("add")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Schedule
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full divide-y">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Faculty
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Day</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Time
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Course
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Room
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold">
                Period
              </th>
              <th className="px-3 py-2 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {displayed.length > 0 ? (
              displayed.map((schedule) => (
                <tr key={schedule.schedule_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm">
                    {schedule.faculty_name || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">{schedule.day_of_week}</td>
                  <td className="px-3 py-2 text-xs">
                    {schedule.start_time} - {schedule.end_time}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {schedule.course_code
                      ? `${schedule.course_code} ${schedule.section || ""}`
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-sm">{schedule.room}</td>
                  <td className="px-3 py-2 text-xs">
                    {schedule.school_year} {schedule.semester}
                  </td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal("edit", schedule)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.schedule_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-4 text-slate-500 italic"
                >
                  No schedules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        setPage={setPage}
        totalItems={filtered.length}
      />

      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={currentRecord}
        faculty={faculty}
        periods={periods}
      />
    </div>
  );
};

export default FacultyScheduling;
