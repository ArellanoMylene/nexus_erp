import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import {
  CheckSquare,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
} from "lucide-react";

const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ))}
      <span className="text-sm ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

const EvaluationModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  faculty,
  students,
  periods,
}) => {
  const [formData, setFormData] = useState({
    faculty_id: null,
    student_id: null,
    period_id: null,
    teaching_effectiveness: 5,
    subject_mastery: 5,
    communication_skills: 5,
    professionalism: 5,
    student_engagement: 5,
    comments: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        faculty_id: initialData.faculty_id,
        student_id: initialData.student_id,
        period_id: initialData.period_id,
        teaching_effectiveness: initialData.teaching_effectiveness || 5,
        subject_mastery: initialData.subject_mastery || 5,
        communication_skills: initialData.communication_skills || 5,
        professionalism: initialData.professionalism || 5,
        student_engagement: initialData.student_engagement || 5,
        comments: initialData.comments || "",
        evaluation_id: initialData.evaluation_id,
      });
    } else {
      setFormData({
        faculty_id: null,
        student_id: null,
        period_id: null,
        teaching_effectiveness: 5,
        subject_mastery: 5,
        communication_skills: 5,
        professionalism: 5,
        student_engagement: 5,
        comments: "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const criteriaFields = [
    { name: "teaching_effectiveness", label: "Teaching Effectiveness" },
    { name: "subject_mastery", label: "Subject Mastery" },
    { name: "communication_skills", label: "Communication Skills" },
    { name: "professionalism", label: "Professionalism" },
    { name: "student_engagement", label: "Student Engagement" },
  ];

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
      onClick={onClose}
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
                ? "New Faculty Evaluation"
                : mode === "edit"
                  ? "Edit Evaluation"
                  : "View Evaluation"}
            </h2>
            <button
              onClick={onClose}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                  isDisabled={mode === "view"}
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Evaluator (Student) *
                </label>
                <Select
                  value={
                    students.find((s) => s.value === formData.student_id) ||
                    null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      student_id: selected?.value || null,
                    }))
                  }
                  options={students}
                  placeholder="Select student..."
                  isDisabled={mode === "view"}
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
                  isDisabled={mode === "view"}
                  className="text-sm"
                  styles={selectStyles}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Evaluation Criteria (1–5 Stars)
              </h4>
              {criteriaFields.map((field) => (
                <div key={field.name} className="mb-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData[field.name]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.name]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-indigo-600"
                      disabled={mode === "view"}
                    />
                    <span className="text-sm font-semibold text-slate-700 w-10 text-right">
                      {formData[field.name].toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comments: e.target.value }))
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Additional feedback..."
                disabled={mode === "view"}
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-lg">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                {mode === "view" ? "Close" : "Cancel"}
              </button>
              {mode !== "view" && (
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  {mode === "add" ? "Submit Evaluation" : "Update Evaluation"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacultyEvaluation = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentRecord, setCurrentRecord] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchEvaluations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty-evaluations`);
      setEvaluations(res.data);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/faculty`);
      const facultyList = (res.data || []).map((f) => ({
        value: f.user_id || f.faculty_id || f.id, // Use user_id for select value
        label: `${f.first_name} ${f.last_name}`,
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
          label: `${s.first_name} ${s.last_name}`,
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
    fetchEvaluations();
    fetchFaculty();
    fetchStudents();
    fetchPeriods();
  }, []);

  const filtered = evaluations.filter((e) => {
    const matchSearch =
      (e.faculty_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.student_name || "").toLowerCase().includes(search.toLowerCase());
    const matchFaculty = !filterFaculty || e.faculty_id === filterFaculty.value;
    return matchSearch && matchFaculty;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const displayed = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleSubmit = async (data) => {
    // Map fields for backend compatibility
    const submitData = {
      ...data,
      faculty_user_id: data.faculty_id,
      evaluator_id: data.student_id,
      evaluator_type: "student",
      academic_period_id: data.period_id,
    };
    delete submitData.faculty_id;
    delete submitData.student_id;
    delete submitData.period_id;
    try {
      if (modalMode === "add") {
        await axios.post(`${API_BASE}/api/faculty-evaluations`, submitData);
      } else {
        await axios.put(
          `${API_BASE}/api/faculty-evaluations/${data.evaluation_id}`,
          submitData,
        );
      }
      fetchEvaluations();
      setModalOpen(false);
      setCurrentRecord(null);
    } catch (err) {
      console.error("Error saving evaluation:", err);
      alert(err.response?.data?.message || "Failed to save evaluation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this evaluation?")) return;
    try {
      await axios.delete(`${API_BASE}/api/faculty-evaluations/${id}`);
      fetchEvaluations();
    } catch (err) {
      console.error("Error deleting evaluation:", err);
    }
  };

  const openModal = (mode, record = null) => {
    setModalMode(mode);
    setCurrentRecord(record);
    setModalOpen(true);
  };

  const calculateAverage = (evaluation) => {
    const ratings = [
      evaluation.teaching_effectiveness,
      evaluation.subject_mastery,
      evaluation.communication_skills,
      evaluation.professionalism,
      evaluation.student_engagement,
    ].filter((r) => r != null);

    return ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
  };

  return (
    <div className="p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare size={24} className="text-indigo-600" />
            Faculty Evaluation
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            Data Integrity: Online
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Total Evaluations</p>
            <p className="text-2xl font-bold text-indigo-600">
              {evaluations.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">Faculty Members</p>
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
              New Evaluation
            </button>
          </div>
        </div>

        {/* Evaluations Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800">
            Evaluation List
          </h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-4 py-2.5">Faculty</th>
                  <th className="px-4 py-2.5">Evaluator</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Average Rating</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayed.length > 0 ? (
                  displayed.map((evaluation) => (
                    <tr
                      key={evaluation.evaluation_id}
                      className="text-sm text-slate-700 hover:bg-indigo-50/50 transition duration-150"
                    >
                      <td className="px-4 py-2 font-medium">
                        {evaluation.faculty_name || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {evaluation.student_name || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {evaluation.school_year} {evaluation.semester}
                      </td>
                      <td className="px-4 py-2">
                        <RatingStars rating={calculateAverage(evaluation)} />
                      </td>
                      <td className="px-4 py-2">
                        {evaluation.evaluation_date || "-"}
                      </td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          onClick={() => openModal("view", evaluation)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openModal("edit", evaluation)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-slate-200"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(evaluation.evaluation_id)}
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
                      No evaluations found.
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

        <EvaluationModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setCurrentRecord(null);
          }}
          onSubmit={handleSubmit}
          mode={modalMode}
          initialData={currentRecord}
          faculty={faculty}
          students={students}
          periods={periods}
        />
      </div>
    </div>
  );
};

export default FacultyEvaluation;
