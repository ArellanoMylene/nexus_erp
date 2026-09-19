import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  Award,
  Search,
  Info,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  ArrowRight,
} from "lucide-react";

const StudentScholarships = () => {
  const [programs, setPrograms] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentId = localStorage.getItem("userId");

      const [programsRes, appsRes] = await Promise.all([
        api.get(`/api/scholarships/programs?is_active=1`),
        studentId
          ? api.get(`/api/scholarships/student/${studentId}`)
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setPrograms(programsRes.data.data || []);
      setMyApplications(appsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching scholarship data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedProgram) return;

    try {
      setSubmitting(true);
      const studentId = localStorage.getItem("userId");

      if (!studentId) {
        alert("Please log in to apply for scholarships.");
        return;
      }

      const payload = {
        scholarship_id: selectedProgram.scholarship_id,
        student_id: parseInt(studentId),
        academic_period_id: selectedProgram.academic_period_id,
        status: "Pending",
        remarks: `Applied for ${selectedProgram.scholarship_name} via student portal`,
      };

      await api.post(`/api/scholarships/applications`, payload);

      alert(
        `Application for ${selectedProgram.scholarship_name} submitted successfully!`,
      );
      setShowApplyModal(false);
      setSelectedProgram(null);
      fetchData(); // Refresh lists
    } catch (err) {
      console.error("Error submitting application:", err);
      alert(
        err.response?.data?.error ||
          "Failed to submit application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
            <Clock size={14} /> Pending
          </span>
        );
      case "rejected":
      case "cancelled":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertCircle size={14} /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const appliedIds = new Set(myApplications.map((app) => app.scholarship_id));
  // Map scholarship_id -> highest-priority status
  const applicationStatusMap = myApplications.reduce((acc, app) => {
    const existing = acc[app.scholarship_id];
    const priority = {
      Approved: 4,
      Active: 3,
      Pending: 2,
      Rejected: 1,
      Cancelled: 0,
    };
    if (
      !existing ||
      (priority[app.status] ?? -1) > (priority[existing] ?? -1)
    ) {
      acc[app.scholarship_id] = app.status;
    }
    return acc;
  }, {});

  const filteredPrograms = programs.filter(
    (p) =>
      (p.scholarship_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (p.scholarship_code || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (

      <div className="w-full space-y-2 px-4 py-3 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-indigo-600" />
            Scholarships & Grants
          </h1>
          <p className="text-slate-500">
            View available programs and track your applications
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            Active Applications
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {myApplications.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            Approved Grants
          </p>
          <p className="text-2xl font-bold text-green-600">
            {
              myApplications.filter(
                (a) => a.status === "Approved" || a.status === "Active",
              ).length
            }
          </p>
        </div>
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
          onClick={() => setShowProgramsModal(true)}
        >
          <p className="text-sm font-medium text-slate-500 mb-1">
            Available Programs
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-indigo-600">
              {programs.filter((p) => !appliedIds.has(p.scholarship_id)).length}
            </p>
            <span className="text-xs font-semibold text-indigo-500 group-hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="space-y-6">
        {/* My Applications Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              My Applications
            </h2>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-all"
              onClick={() => setShowProgramsModal(true)}
            >
              <Award size={16} />
              Browse Programs
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Academic Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Amount/Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {myApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Clock size={32} className="text-slate-300" />
                          <p>You haven't applied for any scholarships yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myApplications
                      .slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE,
                      )
                      .map((app) => (
                        <tr
                          key={app.allocation_id || app.application_id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900">
                              {app.program_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {app.scholarship_code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-700">
                              {app.school_year} - {app.semester}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* Tuition Discount Display */}
                            {app.tuition_discount > 0 ? (
                              <div className="text-xs font-medium text-green-600 font-bold">
                                {app.tuition_discount}% Tuition Discount
                              </div>
                            ) : app.discount_type === "Percentage" &&
                              app.discount_value > 0 ? (
                              <div className="text-xs font-medium text-green-600 font-bold">
                                {app.discount_value}% Tuition Discount
                              </div>
                            ) : (
                              app.discount_type === "Fixed" &&
                              app.discount_value > 0 && (
                                <div className="text-xs font-medium text-green-600 font-bold">
                                  ₱{app.discount_value.toLocaleString()} Fixed
                                  Benefit
                                </div>
                              )
                            )}

                            {/* Allowance Display */}
                            {app.allowance_amount > 0 ? (
                              <div className="text-xs font-medium text-indigo-600 font-bold">
                                ₱{app.allowance_amount.toLocaleString()}{" "}
                                Allowance
                              </div>
                            ) : (
                              app.program_allowance_amount > 0 && (
                                <div className="text-xs font-medium text-indigo-600 font-bold">
                                  ₱
                                  {app.program_allowance_amount.toLocaleString()}{" "}
                                  Allowance
                                </div>
                              )
                            )}

                            {/* If everything is zero, show a placeholder */}
                            {!(
                              app.tuition_discount > 0 ||
                              app.discount_value > 0 ||
                              app.allowance_amount > 0 ||
                              app.program_allowance_amount > 0
                            ) && (
                              <span className="text-xs text-slate-400 italic">
                                No benefits specified
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                              onClick={() => {
                                setSelectedProgram(
                                  programs.find(
                                    (p) =>
                                      p.scholarship_id === app.scholarship_id,
                                  ),
                                );
                                // We could show more details here
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {myApplications.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    myApplications.length,
                  )}{" "}
                  of {myApplications.length} applications
                </p>
                <div className="flex items-center gap-1">
                  <button
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>
                  {Array.from(
                    {
                      length: Math.ceil(myApplications.length / ITEMS_PER_PAGE),
                    },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        page === currentPage
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={
                      currentPage ===
                      Math.ceil(myApplications.length / ITEMS_PER_PAGE)
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Available Programs Modal */}
      {showProgramsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white">
                <Award size={22} />
                <div>
                  <h2 className="text-lg font-bold">
                    Available Scholarship Programs
                  </h2>
                  <p className="text-indigo-200 text-xs">
                    {filteredPrograms.length} program
                    {filteredPrograms.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <button
                className="text-indigo-200 hover:text-white transition-colors"
                onClick={() => {
                  setShowProgramsModal(false);
                  setSearchQuery("");
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Programs Grid */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-48 bg-slate-100 animate-pulse rounded-xl"
                      />
                    ))
                ) : filteredPrograms.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-500">
                    <Filter size={40} className="mx-auto text-slate-300 mb-3" />
                    <p>No programs found matching your search.</p>
                  </div>
                ) : (
                  filteredPrograms.map((program) => (
                    <div
                      key={program.scholarship_id}
                      className={
                        `rounded-xl border shadow-sm transition-all p-5 flex flex-col items-start gap-4 ` +
                        (applicationStatusMap[program.scholarship_id] ===
                          "Approved" ||
                        applicationStatusMap[program.scholarship_id] ===
                          "Active"
                          ? "bg-slate-50 border-slate-200 opacity-70"
                          : applicationStatusMap[program.scholarship_id] ===
                              "Pending"
                            ? "bg-yellow-50/40 border-yellow-200"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md")
                      }
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <Award className="text-indigo-600" size={22} />
                        </div>
                        {program.discount_type === "Percentage" ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                            {program.discount_value}% OFF
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                            ₱{program.discount_value.toLocaleString()} Grant
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900">
                          {program.scholarship_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {program.scholarship_code}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {program.description ||
                          "This program provides financial assistance to qualified students based on academic performance and need."}
                      </p>
                      <div className="w-full pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          GPA Req:{" "}
                          <span className="font-semibold text-slate-700">
                            {program.required_gpa || "N/A"}
                          </span>
                        </div>
                        {(() => {
                          const status =
                            applicationStatusMap[program.scholarship_id];
                          if (status === "Approved" || status === "Active") {
                            return (
                              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <CheckCircle size={12} /> Approved
                              </span>
                            );
                          }
                          if (status === "Pending") {
                            return (
                              <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                                <Clock size={12} /> Pending
                              </span>
                            );
                          }
                          if (status === "Rejected" || status === "Cancelled") {
                            return (
                              <button
                                className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                onClick={() => {
                                  setSelectedProgram(program);
                                  setShowApplyModal(true);
                                  setShowProgramsModal(false);
                                  setSearchQuery("");
                                }}
                              >
                                Re-apply <ArrowRight size={14} />
                              </button>
                            );
                          }
                          return (
                            <button
                              className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                              onClick={() => {
                                setSelectedProgram(program);
                                setShowApplyModal(true);
                                setShowProgramsModal(false);
                                setSearchQuery("");
                              }}
                            >
                              Apply Now <ArrowRight size={14} />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowProgramsModal(false);
                  setSearchQuery("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details/Apply Modal Backdrop */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h2 className="text-xl font-bold">
                {selectedProgram.scholarship_name}
              </h2>
              <p className="text-indigo-100 text-sm">
                {selectedProgram.scholarship_code}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedProgram.description ||
                    "No detailed description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Benefit
                  </h4>
                  <p className="text-slate-800 font-bold text-green-600">
                    {selectedProgram.tuition_discount > 0
                      ? `${selectedProgram.tuition_discount}% Tuition Discount`
                      : selectedProgram.discount_type === "Percentage"
                        ? `${selectedProgram.discount_value}% Discount`
                        : selectedProgram.discount_type === "Fixed"
                          ? `₱${(selectedProgram.discount_value || 0).toLocaleString()} Fixed Benefit`
                          : "Percentage/Fixed"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Allowance
                  </h4>
                  <p className="text-slate-800 font-bold text-indigo-600">
                    ₱
                    {(
                      selectedProgram.allowance_amount ||
                      selectedProgram.program_allowance_amount ||
                      0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Requirements
                </h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Minimum GPA: {selectedProgram.required_gpa || "None"}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Max Income:{" "}
                    {selectedProgram.required_income_level
                      ? `₱${selectedProgram.required_income_level.toLocaleString()}`
                      : "Not specified"}
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setSelectedProgram(null);
                    setShowApplyModal(false);
                  }}
                >
                  Close
                </button>
                {showApplyModal && (
                  <button
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
                    onClick={handleApply}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Clock className="animate-spin" size={16} />{" "}
                        Submitting...
                      </span>
                    ) : (
                      "Confirm Interest"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentScholarships;
