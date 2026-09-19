import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Plus, Edit, Trash2, Award, DollarSign, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ScholarshipFundAllocation = () => {
  const [programs, setPrograms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [filters, setFilters] = useState({
    scholarship_type: "",
    academic_period_id: "",
    search: "",
  });

  const [programForm, setProgramForm] = useState({
    scholarship_id: null,
    scholarship_name: "",
    scholarship_code: "",
    scholarship_type: "Partial",
    discount_type: "Percentage",
    discount_value: "",
    funding_source: "",
    total_budget: "",
    max_beneficiaries: "",
    academic_period_id: "",
    required_gpa: "",
    required_income_level: "",
    eligibility_criteria: "",
    description: "",
  });

  const scholarshipTypes = [
    "Full",
    "Partial",
    "Variable",
  ];

  useEffect(() => {
    fetchPrograms();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPeriods = async () => {
    try {
      const response = await api.get("/api/academic-periods");
      // Adjust based on common API response pattern
      const periodList = response.data.data || response.data || [];
      setPeriods(periodList);
    } catch (error) {
      console.error("Error fetching academic periods:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get(`/api/scholarships/programs`, {
        params: filters,
      });
      setPrograms(response.data.data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    try {
      if (programForm.scholarship_id) {
        await api.put(
          `/api/scholarships/programs/${programForm.scholarship_id}`,
          programForm
        );
      } else {
        await api.post(`/api/scholarships/programs`, programForm);
      }
      setShowProgramModal(false);
      resetProgramForm();
      fetchPrograms();
      alert("Scholarship program saved successfully!");
    } catch (error) {
      console.error("Error saving program:", error);
      alert("Failed to save scholarship program");
    }
  };

  const handleDeleteProgram = async (id) => {
    if (window.confirm("Delete this scholarship program?")) {
      try {
        await api.delete(`/api/scholarships/programs/${id}`);
        fetchPrograms();
      } catch (error) {
        console.error("Error deleting program:", error);
      }
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      scholarship_id: null,
      scholarship_name: "",
      scholarship_code: "",
      scholarship_type: "Partial",
      discount_type: "Percentage",
      discount_value: "",
      funding_source: "",
      total_budget: "",
      max_beneficiaries: "",
      academic_period_id: "",
      required_gpa: "",
      required_income_level: "",
      eligibility_criteria: "",
      description: "",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Scholarship Fund Allocation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage scholarship programs and student allocations
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Data Integrity: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search programs, students..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.scholarship_type}
                onChange={(e) => {
                  setFilters({ ...filters, scholarship_type: e.target.value });
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Types</option>
                {scholarshipTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={filters.academic_period_id}
                onChange={(e) => {
                  setFilters({ ...filters, academic_period_id: e.target.value });
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Periods</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.school_year} - {period.semester}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  resetProgramForm();
                  setShowProgramModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/30"
              >
                <Award size={18} />
                New Program
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarship Programs */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Award className="text-purple-600 dark:text-purple-400" />
          Scholarship Programs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <div
              key={program.scholarship_id}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {program.scholarship_name}
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {program.scholarship_code}
                  </div>
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setProgramForm(program);
                      setShowProgramModal(true);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program.scholarship_id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between gap-1 mb-2">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs rounded-full">
                  {program.scholarship_type}
                </span>
                {program.school_year && (
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs rounded-full">
                    {program.school_year} {program.semester}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Budget:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₱{parseFloat(program.total_budget || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Allocated:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    ₱
                    {parseFloat(program.allocated_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Available:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ₱
                    {parseFloat(program.available_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Users size={14} />
                    Beneficiaries:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {program.total_recipients || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Program Modal */}
      {showProgramModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowProgramModal(false);
            resetProgramForm();
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {programForm.scholarship_id ? "Edit" : "Create"} Scholarship Program
              </h2>
              <button
                onClick={() => {
                  setShowProgramModal(false);
                  resetProgramForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleProgramSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Scholarship Name *
                    </label>
                    <input
                      type="text"
                      value={programForm.scholarship_name}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          scholarship_name: e.target.value,
                        })
                      }
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Scholarship Code *
                    </label>
                    <input
                      type="text"
                      value={programForm.scholarship_code}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          scholarship_code: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g. MERIT-2024"
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Type *
                    </label>
                    <select
                      value={programForm.scholarship_type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setProgramForm({
                          ...programForm,
                          scholarship_type: nextType,
                          discount_type:
                            nextType === "Full"
                              ? "Percentage"
                              : programForm.discount_type,
                          discount_value:
                            nextType === "Full" ? 100 : programForm.discount_value,
                        });
                      }}
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {scholarshipTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Academic Period *
                    </label>
                    <select
                      value={programForm.academic_period_id}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          academic_period_id: e.target.value,
                        })
                      }
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Period</option>
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.school_year} - {period.semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={programForm.discount_type}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          discount_type: e.target.value,
                        })
                      }
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed Amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Discount Value {programForm.discount_type === 'Percentage' ? '(%)' : ''}
                    </label>
                    <input
                      type="number"
                      value={programForm.discount_value}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          discount_value: e.target.value,
                        })
                      }
                      disabled={programForm.scholarship_type === 'Full'}
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Funding Source *
                    </label>
                    <input
                      type="text"
                      value={programForm.funding_source}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          funding_source: e.target.value,
                        })
                      }
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Total Budget *
                    </label>
                    <input
                      type="number"
                      value={programForm.total_budget}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          total_budget: e.target.value,
                        })
                      }
                      step="0.01"
                      required
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Beneficiaries
                    </label>
                    <input
                      type="number"
                      value={programForm.max_beneficiaries}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          max_beneficiaries: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 col-span-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Required GPA
                      </label>
                      <input
                        type="number"
                        value={programForm.required_gpa}
                        onChange={(e) =>
                          setProgramForm({
                            ...programForm,
                            required_gpa: e.target.value,
                          })
                        }
                        step="0.01"
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Income Level
                      </label>
                      <input
                        type="number"
                        value={programForm.required_income_level}
                        onChange={(e) =>
                          setProgramForm({
                            ...programForm,
                            required_income_level: e.target.value,
                          })
                        }
                        step="0.01"
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Eligibility Criteria
                    </label>
                    <textarea
                      value={programForm.eligibility_criteria}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          eligibility_criteria: e.target.value,
                        })
                      }
                      rows="2"
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={programForm.description}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          description: e.target.value,
                        })
                      }
                      rows="2"
                      className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-600 rounded-b-lg flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    resetProgramForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScholarshipFundAllocation;
