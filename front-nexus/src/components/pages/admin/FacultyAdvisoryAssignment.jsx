import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  ClipboardList,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
} from "lucide-react";

const AdvisoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  faculty,
  students,
  periods,
  programs,
  resetTrigger,
}) => {
  const initialFormState = {
    faculty_id: null,
    student_ids: [],
    period_id: null,
    advisory_type: "Academic",
    notes: "",
    program_id: null,
    year_level: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        faculty_id: initialData.faculty_id,
        student_ids: initialData.student_id ? [{ value: initialData.student_id, label: initialData.student_name }] : [],
        period_id: initialData.period_id,
        program_id: initialData.program_id || null,
        year_level: initialData.year_level || "",
        advisory_type: initialData.advisory_type || "Academic",
        notes: initialData.notes || "",
        advisory_id: initialData.advisory_id,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData, isOpen, resetTrigger]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // UI validation for required fields
    if (!formData.faculty_id || formData.student_ids.length === 0 || !formData.period_id) {
      setFormError(
        "Please select a faculty advisor, at least one student, and an academic period.",
      );
      return;
    }
    setFormError("");
    onSubmit(formData, () => setFormData(initialFormState));
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData(initialFormState);
    onClose();
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
      fontSize: "14px",
      borderColor: "rgb(203 213 225)",
      "&:hover": { borderColor: "rgb(148 163 184)" },
    }),
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {mode === "add"
                ? "New Advisory Assignment"
                : "Edit Advisory Assignment"}
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        {/* Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {formError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Faculty Advisor *
                </label>
                <Select
                  value={
                    faculty.find(
                      (f) => String(f.value) === String(formData.faculty_id),
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      faculty_id: selected?.value || null,
                    }))
                  }
                  options={faculty}
                  placeholder="Select faculty..."
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Students *
                </label>
                <Select
                  value={formData.student_ids}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      student_ids: selected || [],
                    }))
                  }
                  options={students}
                  placeholder="Select students..."
                  isMulti
                  isDisabled={mode === "edit"}
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Program
                </label>
                <Select
                  value={
                    programs.find((p) => p.value === formData.program_id) ||
                    null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      program_id: selected?.value || null,
                    }))
                  }
                  options={programs}
                  placeholder="Select program..."
                  isClearable
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Year Level
                </label>
                <select
                  value={formData.year_level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      year_level: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select year level...</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Advisory Type
                </label>
                <select
                  value={formData.advisory_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      advisory_type: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Academic">Academic</option>
                  <option value="Personal">Personal</option>
                  <option value="Career">Career</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {mode === "add" ? "Create Assignment" : "Update Assignment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacultyAdvisoryAssignment = () => {
  const [advisories, setAdvisories] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState([]);
  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/programs`);
      const programList = (res.data || []).map((p) => ({
        value: p.id || p.program_id,
        label: `${p.code} - ${p.name}`,
      }));
      setPrograms(programList);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };
  const [filterFaculty, setFilterFaculty] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchAdvisories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty-advisory`);
      setAdvisories(res.data);
    } catch (err) {
      console.error("Error fetching advisories:", err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty`);
      const facultyList = (res.data || []).map((f) => ({
        value: f.user_id || f.faculty_id || f.id, // Use the correct property for ID
        label: `${f.first_name} ${f.last_name} (${f.employee_id})`,
      }));
      setFaculty(facultyList);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`);
      const studentList = (res.data || [])
        .filter((u) => u.role === "Student")
        .map((s) => ({
          value: s.user_id,
          label: `${s.first_name} ${s.last_name} (${
            s.student_number || s.email
          })`,
        }));
      setStudents(studentList);
    } catch (err) {
      console.error("Error fetching students:", err);
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
    fetchAdvisories();
    fetchFaculty();
    fetchStudents();
    fetchPeriods();
    fetchPrograms();
  }, []);

  const filtered = advisories.filter((a) => {
    const matchSearch =
      (a.faculty_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.student_name || "").toLowerCase().includes(search.toLowerCase());
    const matchFaculty = !filterFaculty || a.faculty_id === filterFaculty.value;
    return matchSearch && matchFaculty;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    try {
      // For edit mode, keep the single student update
      if (modalMode === "edit") {
        const submitData = {
          ...data,
          faculty_user_id: data.faculty_id,
          academic_period_id: data.period_id,
          program_id: data.program_id,
          year_level: data.year_level,
          student_id: data.student_ids[0]?.value || data.student_ids,
        };
        delete submitData.faculty_id;
        delete submitData.period_id;
        delete submitData.student_ids;
        
        await axios.put(
          `${API_BASE}/api/faculty-advisory/${data.advisory_id}`,
          submitData,
        );
      } else {
        // For add mode, create an assignment for each selected student
        const studentIds = data.student_ids.map((s) => s.value);
        
        for (const studentId of studentIds) {
          const submitData = {
            faculty_user_id: data.faculty_id,
            academic_period_id: data.period_id,
            program_id: data.program_id,
            year_level: data.year_level,
            advisory_type: data.advisory_type,
            notes: data.notes,
            student_id: studentId,
          };
          
          await axios.post(`${API_BASE}/api/faculty-advisory`, submitData);
        }
      }
      
      fetchAdvisories();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving advisory:", err);
      alert(
        err.response?.data?.message || "Failed to save advisory assignment",
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this advisory assignment?")) return;
    try {
      await axios.delete(`${API_BASE}/api/faculty-advisory/${id}`);
      fetchAdvisories();
    } catch (err) {
      console.error("Error deleting advisory:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-600" />
            Faculty Advisory Assignments
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Total Assignments</p>
            <p className="text-2xl font-bold text-indigo-600">
              {advisories.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Faculty Advisors</p>
            <p className="text-2xl font-bold text-blue-600">{faculty.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Students</p>
            <p className="text-2xl font-bold text-green-600">
              {students.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Academic Periods</p>
            <p className="text-2xl font-bold text-purple-600">
              {periods.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input - LEFT */}
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search by faculty or student name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all shadow-inner"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
          </div>

          {/* Filters - RIGHT */}
          <div className="flex items-center gap-2">
            <Select
              value={filterFaculty}
              onChange={(selected) => {
                setFilterFaculty(selected);
                setPage(1);
              }}
              options={faculty}
              placeholder="Filter by Faculty"
              isClearable
              className="w-56 text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "36px",
                  fontSize: "14px",
                  borderColor: "rgb(203 213 225)",
                  "&:hover": { borderColor: "rgb(148 163 184)" },
                }),
              }}
            />
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition-colors shadow-md shadow-indigo-500/30"
            >
              <Plus size={14} />
              New Assignment
            </button>
          </div>
        </div>

        {/* Advisory Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            Advisory List
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Faculty Advisor</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Advisory Type</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayed.length > 0 ? (
                  displayed.map((advisory) => (
                    <tr
                      key={advisory.advisory_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {advisory.faculty_name || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {advisory.student_name || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {advisory.school_year} {advisory.semester}
                      </td>
                      <td className="px-4 py-2">
                        {advisory.advisory_type || "-"}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {advisory.notes
                          ? advisory.notes.substring(0, 50) + "..."
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          onClick={() => openModal("edit", advisory)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(advisory.advisory_id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      No advisory assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm text-slate-700">
            <span className="text-xs sm:text-sm">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages || 1}</span> | Total
              Records: {filtered.length}
            </span>
            <div className="flex gap-1 mt-2 sm:mt-0">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {[...Array(totalPages || 1)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    page === i + 1
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages || 1, page + 1))}
                disabled={page === (totalPages || 1)}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <AdvisoryModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentRecord(null);
          }}
          onSubmit={(data, resetForm) => {
            handleSubmit(data);
            if (resetForm) resetForm();
          }}
          mode={modalMode}
          initialData={currentRecord}
          faculty={faculty}
          students={students}
          periods={periods}
          programs={programs}
          resetTrigger={modalOpen === false}
        />
      </div>
    </div>
  );
};

export default FacultyAdvisoryAssignment;
