import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Link,
  Plus,
  BookOpen,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import Select from "react-select";
import axios from "axios";

const Prerequisites = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [prerequisites, setPrerequisites] = useState([]);
  const [prereqForm, setPrereqForm] = useState({
    course: [], // support multiple selected prerequisite courses
    isCorequisite: false,
    error: "",
  });

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/course/courses`
      );
      setCourses(res.data);
      if (res.data.length > 0 && !selectedCourse) {
        setSelectedCourse(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  // Fetch prerequisites for selected course
  const fetchPrerequisites = async (courseId) => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/prerequisites/course/${courseId}`
      );
      setPrerequisites(res.data);
    } catch (err) {
      console.error("Failed to fetch prerequisites:", err);
      setPrerequisites([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchPrerequisites(selectedCourse.id);
    }
  }, [selectedCourse]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter(
        (course) =>
          course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
          course.title.toLowerCase().includes(courseSearch.toLowerCase())
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [courses, courseSearch]);

  const courseOptions = useMemo(() => {
    // build a set of already assigned prerequisite course IDs to exclude
    const excluded = new Set(
      (prerequisites || []).map((p) => p.prereq_course_id)
    );

    return courses
      .filter((c) => c.id !== selectedCourse?.id && !excluded.has(c.id))
      .map((course) => ({
        value: course.id,
        label: `${course.code} - ${course.title}`,
      }));
  }, [courses, selectedCourse, prerequisites]);

  const handlePrereqFormChange = (key, value) => {
    let newError = "";

    if (key === "course") {
      // value may be null, a single object, or an array when isMulti is used
      if (!value) {
        value = [];
      }

      // normalize to array
      const selected = Array.isArray(value) ? value : [value];

      // prevent selecting the same course as itself
      if (selected.some((v) => v.value === selectedCourse?.id)) {
        newError = `${selectedCourse.code} cannot be its own prerequisite.`;
        // remove any illegal selection
        value = selected.filter((v) => v.value !== selectedCourse?.id);
      } else {
        value = selected;
      }
    }

    setPrereqForm((prev) => ({ ...prev, [key]: value, error: newError }));
  };

  const handleAddPrerequisite = async () => {
    if (!prereqForm.course || prereqForm.course.length === 0) {
      alert("Please select at least one course to add as a prerequisite.");
      return;
    }
    const results = { created: [], skipped: [], errors: [] };

    for (const sel of prereqForm.course) {
      try {
        const payload = {
          course_id: selectedCourse.id,
          prereq_course_id: sel.value,
          // if per-item flag exists use it, otherwise fallback to global
          is_corequisite:
            typeof sel.is_corequisite !== "undefined"
              ? sel.is_corequisite
              : !!prereqForm.isCorequisite,
        };

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/prerequisites`,
          payload
        );
        results.created.push(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message;
        // Treat duplicate existence as a non-fatal skip (service returns "This prerequisite already exists")
        if (msg && msg.toString().toLowerCase().includes("already exists")) {
          results.skipped.push({ id: sel.value, message: msg });
        } else {
          results.errors.push({ id: sel.value, message: msg });
        }
      }
    }

    // Reset form and refresh
    setPrereqForm({ course: [], isCorequisite: false, error: "" });
    fetchPrerequisites(selectedCourse.id);

    // Summarize results
    if (results.errors.length > 0) {
      console.error("Some prerequisites failed:", results.errors);
      alert(
        `Completed with errors. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`
      );
    } else {
      alert(
        `Done. Created: ${results.created.length}, Skipped: ${results.skipped.length}`
      );
    }
  };

  const handleDeletePrerequisite = async (prereqId) => {
    if (!confirm("Are you sure you want to delete this prerequisite?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/prerequisites/${prereqId}`
      );
      fetchPrerequisites(selectedCourse.id);
      alert("Prerequisite deleted successfully!");
    } catch (err) {
      console.error("Failed to delete prerequisite:", err);
      alert(err.response?.data?.message || "Failed to delete prerequisite");
    }
  };

  const handleToggleCorequisite = async (prereq) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/prerequisites/${prereq.id}`,
        {
          course_id: prereq.course_id,
          prereq_course_id: prereq.prereq_course_id,
          is_corequisite: !prereq.is_corequisite,
        }
      );
      fetchPrerequisites(selectedCourse.id);
    } catch (err) {
      console.error("Failed to update prerequisite:", err);
      alert(err.response?.data?.message || "Failed to update prerequisite");
    }
  };

  if (!selectedCourse) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-600">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">
        Course Prerequisites Management
      </h1>
      <p className="text-sm text-slate-600 mb-4">
        Define course dependencies and prerequisites. Select a course from the
        left panel to manage its requirements.
      </p>

      <div className="flex gap-4">
        {/* Left Column - Course List */}
        <div className="w-1/3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <BookOpen size={16} />
            Select a Course
          </h2>

          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`p-2 rounded cursor-pointer transition text-sm ${
                  selectedCourse?.id === course.id
                    ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 font-semibold"
                    : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="font-semibold">{course.code}</div>
                <div className="text-xs">{course.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Prerequisites Management */}
        <div className="w-2/3 space-y-4">
          {/* Current Prerequisites */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Link size={18} />
              Prerequisites for: {selectedCourse.code} - {selectedCourse.title}
            </h2>

            {prerequisites.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded bg-slate-50">
                <Link size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-slate-600 text-sm">
                  No prerequisites defined for this course.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the form below to add one.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {prerequisites.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {prereq.prereq_code} - {prereq.prereq_title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            prereq.is_corequisite
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {prereq.is_corequisite
                            ? "Co-requisite"
                            : "Pre-requisite"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCorequisite(prereq)}
                        className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 transition"
                        title="Toggle prerequisite/corequisite"
                      >
                        Toggle Type
                      </button>
                      <button
                        onClick={() => handleDeletePrerequisite(prereq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete prerequisite"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Prerequisite Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Plus size={16} />
              Add New Prerequisite
            </h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Select Course *
              </label>
              <Select
                options={courseOptions}
                placeholder="Search and select a course..."
                isMulti
                value={prereqForm.course}
                onChange={(selected) =>
                  handlePrereqFormChange("course", selected)
                }
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "38px",
                  }),
                }}
              />
            </div>

            {prereqForm.error && (
              <div className="flex items-start p-2 text-sm bg-red-100 text-red-800 rounded border border-red-300">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{prereqForm.error}</span>
              </div>
            )}

            <div className="flex items-center pt-2">
              <input
                id="co-requisite-checkbox"
                type="checkbox"
                checked={prereqForm.isCorequisite}
                onChange={(e) =>
                  handlePrereqFormChange("isCorequisite", e.target.checked)
                }
                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="co-requisite-checkbox"
                className="ml-2 text-sm text-slate-700"
              >
                Mark as Co-requisite (can be taken concurrently)
              </label>
            </div>

            <button
              onClick={handleAddPrerequisite}
              disabled={!prereqForm.course || prereqForm.course.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
            >
              <Plus size={16} /> Add Prerequisite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prerequisites;
