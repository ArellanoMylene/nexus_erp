import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { Download, FileText, Calendar, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateCSV, downloadCSV, downloadPDF } from "../../../utils/exportHelpers";

const PayrollReports = () => {
  const [payrollSetups, setPayrollSetups] = useState([]);
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [reportType, setReportType] = useState("Summary");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    "Summary",
    "Detailed",
    "Department",
    "Tax Report",
    "Bank Transfer",
  ];

  useEffect(() => {
    fetchPayrollSetups();
  }, []);

  const fetchPayrollSetups = async () => {
    try {
      const response = await api.get(`/api/payroll/setups`);
      setPayrollSetups(response.data.data || []);
    } catch (error) {
      console.error("Error fetching payroll setups:", error);
    }
  };

  const generateReport = async () => {
    if (!selectedSetup) {
      alert("Please select a payroll period");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/api/payroll/summary/${selectedSetup}`,
        {
          params: { report_type: reportType },
        }
      );
      setReportData(response.data.data);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) {
      alert("Generate a report first");
      return;
    }

    // Transform payslips data for export
    const exportData = reportData.payslips.map((p) => ({
      employee_number: p.employee_number || "",
      employee_name: `${p.first_name} ${p.last_name}`,
      department: p.department || "",
      position: p.position || "",
      basic_pay: parseFloat(p.basic_pay || 0).toFixed(2),
      overtime_pay: parseFloat(p.overtime_pay || 0).toFixed(2),
      holiday_pay: parseFloat(p.holiday_pay || 0).toFixed(2),
      night_differential: parseFloat(p.night_differential || 0).toFixed(2),
      allowances: parseFloat(p.allowances || 0).toFixed(2),
      bonus: parseFloat(p.bonus || 0).toFixed(2),
      gross_pay: parseFloat(p.gross_pay || 0).toFixed(2),
      sss_deduction: parseFloat(p.sss_deduction || 0).toFixed(2),
      philhealth_deduction: parseFloat(p.philhealth_deduction || 0).toFixed(2),
      pagibig_deduction: parseFloat(p.pagibig_deduction || 0).toFixed(2),
      tax_deduction: parseFloat(p.tax_deduction || 0).toFixed(2),
      loan_deduction: parseFloat(p.loan_deduction || 0).toFixed(2),
      other_deductions: parseFloat(p.other_deductions || 0).toFixed(2),
      total_deductions: parseFloat(p.total_deductions || 0).toFixed(2),
      net_pay: parseFloat(p.net_pay || 0).toFixed(2),
      bank_name: p.bank_name || "",
      bank_account_number: p.bank_account_number || "",
    }));

    const csv = generateCSV(exportData, {
      headers: [
        "employee_number",
        "employee_name",
        "department",
        "position",
        "basic_pay",
        "overtime_pay",
        "holiday_pay",
        "night_differential",
        "allowances",
        "bonus",
        "gross_pay",
        "sss_deduction",
        "philhealth_deduction",
        "pagibig_deduction",
        "tax_deduction",
        "loan_deduction",
        "other_deductions",
        "total_deductions",
        "net_pay",
        "bank_name",
        "bank_account_number",
      ],
      includeTimestamps: false,
    });

    const filename = `payroll_${reportType.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
  };

  const downloadReportPDF = () => {
    if (!reportData) {
      alert("Generate a report first");
      return;
    }

    // Transform payslips data for PDF export
    const exportData = reportData.payslips.map((p) => ({
      employee_number: p.employee_number || "",
      employee_name: `${p.first_name} ${p.last_name}`,
      department: p.department || "",
      position: p.position || "",
      basic_pay: parseFloat(p.basic_pay || 0).toFixed(2),
      gross_pay: parseFloat(p.gross_pay || 0).toFixed(2),
      sss_deduction: parseFloat(p.sss_deduction || 0).toFixed(2),
      philhealth_deduction: parseFloat(p.philhealth_deduction || 0).toFixed(2),
      pagibig_deduction: parseFloat(p.pagibig_deduction || 0).toFixed(2),
      tax_deduction: parseFloat(p.tax_deduction || 0).toFixed(2),
      total_deductions: parseFloat(p.total_deductions || 0).toFixed(2),
      net_pay: parseFloat(p.net_pay || 0).toFixed(2),
    }));

    const filename = `Payroll ${reportType} Report`;
    downloadPDF(jsPDF, autoTable, exportData, {
      title: filename,
      orientation: "landscape",
      headers: [
        "employee_number",
        "employee_name",
        "department",
        "position",
        "basic_pay",
        "gross_pay",
        "sss_deduction",
        "philhealth_deduction",
        "pagibig_deduction",
        "tax_deduction",
        "total_deductions",
        "net_pay",
      ],
      includeTimestamps: false,
    });
  };

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Payroll Reports
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Generate and download reports
          </span>
        </div>

        {/* Report Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
            Generate Report
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payroll Period *
              </label>
              <select
                value={selectedSetup || ""}
                onChange={(e) => setSelectedSetup(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select a period</option>
                {payrollSetups.map((setup) => (
                  <option key={setup.payroll_setup_id} value={setup.payroll_setup_id}>
                    {setup.period_type} - {new Date(setup.start_date).toLocaleDateString()} to {new Date(setup.end_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Report Type *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={generateReport}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                {loading ? "Generating..." : "Generate"}
              </button>
              {reportData && (
                <>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap bg-green-600 text-white hover:bg-green-700 border-green-700 dark:border-green-600 shadow-md shadow-green-500/30"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                  <button
                    onClick={downloadReportPDF}
                    className="flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors text-sm border shadow-sm whitespace-nowrap bg-red-600 text-white hover:bg-red-700 border-red-700 dark:border-red-600 shadow-md shadow-red-500/30"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Report Description */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Report Types:</h4>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <li><strong>Summary:</strong> Overview of total payroll with gross pay, deductions, and net pay</li>
              <li><strong>Detailed:</strong> Complete breakdown of all earnings and deductions per employee</li>
              <li><strong>Department:</strong> Payroll summary grouped by department</li>
              <li><strong>Tax Report:</strong> Tax deductions summary for government compliance</li>
              <li><strong>Bank Transfer:</strong> Bank account details for payroll processing</li>
            </ul>
          </div>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Preview</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 border-l-4 border-l-indigo-600 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Total Employees</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {reportData.employee_count || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 border-l-4 border-l-green-600 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Total Gross Pay</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  ₱{parseFloat(reportData.total_gross_pay || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 border-l-4 border-l-red-600 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  ₱{parseFloat(reportData.total_deductions || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Total Net Pay</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  ₱{parseFloat(reportData.total_net_pay || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Detailed / Tax Report View */}
            {(reportType === "Detailed" || reportType === "Tax Report") && reportData.payslips && reportData.payslips.length > 0 && (
              <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-700/70">
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <th className="px-4 py-2.5">Employee</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5 text-right">Basic Pay</th>
                      <th className="px-4 py-2.5 text-right">Overtime</th>
                      <th className="px-4 py-2.5 text-right">Allowances</th>
                      <th className="px-4 py-2.5 text-right">Gross Pay</th>
                      <th className="px-4 py-2.5 text-right">Deductions</th>
                      <th className="px-4 py-2.5 text-right">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {reportData.payslips.map((payslip, index) => (
                      <tr key={index} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                        <td className="px-4 py-2">
                          <div>
                            <div className="font-medium">{payslip.first_name} {payslip.last_name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{payslip.employee_number}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2">{payslip.department}</td>
                        <td className="px-4 py-2 text-right">₱{parseFloat(payslip.basic_pay || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">₱{parseFloat(payslip.overtime_pay || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">₱{parseFloat(payslip.allowances || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400">₱{parseFloat(payslip.gross_pay || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600 dark:text-red-400">₱{parseFloat(payslip.total_deductions || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">₱{parseFloat(payslip.net_pay || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-slate-700/70">
                    <tr className="text-sm font-bold text-slate-900 dark:text-white">
                      <td colSpan="5" className="px-4 py-2.5 text-right">TOTALS:</td>
                      <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400">
                        ₱{parseFloat(reportData.total_gross_pay || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600 dark:text-red-400">
                        ₱{parseFloat(reportData.total_deductions || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-indigo-600 dark:text-indigo-400">
                        ₱{parseFloat(reportData.total_net_pay || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Department Report */}
            {reportType === "Department" && reportData.payslips && reportData.payslips.length > 0 && (
              <div className="space-y-6">
                {Object.entries(
                  reportData.payslips.reduce((acc, payslip) => {
                    const dept = payslip.department || "Unassigned";
                    if (!acc[dept]) acc[dept] = [];
                    acc[dept].push(payslip);
                    return acc;
                  }, {})
                ).map(([dept, employees]) => {
                  const deptTotals = employees.reduce(
                    (sum, p) => ({
                      gross: sum.gross + parseFloat(p.gross_pay || 0),
                      deductions: sum.deductions + parseFloat(p.total_deductions || 0),
                      net: sum.net + parseFloat(p.net_pay || 0),
                    }),
                    { gross: 0, deductions: 0, net: 0 }
                  );

                  return (
                    <div key={dept} className="rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-700/70 px-4 py-2 font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 flex justify-between">
                        <span>{dept} Department</span>
                        <span className="text-xs font-normal text-slate-500 self-center">{employees.length} Employees</span>
                      </div>
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="px-4 py-2">Employee</th>
                            <th className="px-4 py-2 text-right">Gross Pay</th>
                            <th className="px-4 py-2 text-right">Deductions</th>
                            <th className="px-4 py-2 text-right">Net Pay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                          {employees.map((p, idx) => (
                            <tr key={idx} className="text-sm text-slate-700 dark:text-slate-200">
                              <td className="px-4 py-1.5">{p.first_name} {p.last_name}</td>
                              <td className="px-4 py-1.5 text-right">₱{parseFloat(p.gross_pay || 0).toLocaleString()}</td>
                              <td className="px-4 py-1.5 text-right">₱{parseFloat(p.total_deductions || 0).toLocaleString()}</td>
                              <td className="px-4 py-1.5 text-right font-medium">₱{parseFloat(p.net_pay || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 dark:bg-slate-800/50 font-semibold text-sm">
                            <td className="px-4 py-2 text-right">Subtotal:</td>
                            <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">₱{deptTotals.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">₱{deptTotals.deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-2 text-right text-indigo-600 dark:text-indigo-400">₱{deptTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bank Transfer Section (if applicable) */}
            {reportType === "Bank Transfer" && reportData.payslips && reportData.payslips.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Bank Transfer Details
                </h4>
                <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-700/70">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <th className="px-4 py-2.5">Employee</th>
                        <th className="px-4 py-2.5">Bank Name</th>
                        <th className="px-4 py-2.5">Account Number</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {reportData.payslips
                        .filter((p) => p.bank_name && p.bank_account_number)
                        .map((payslip, index) => (
                          <tr key={index} className="text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition duration-150">
                            <td className="px-4 py-2">{payslip.first_name} {payslip.last_name}</td>
                            <td className="px-4 py-2">{payslip.bank_name}</td>
                            <td className="px-4 py-2 font-mono">{payslip.bank_account_number}</td>
                            <td className="px-4 py-2 text-right font-semibold">₱{parseFloat(payslip.net_pay || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
   </div>
  );
};

export default PayrollReports;
