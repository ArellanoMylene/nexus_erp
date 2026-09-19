import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { LayoutDashboard, DollarSign, FileText, Award } from "lucide-react";

export default function AccountingDashboard() {
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [scholarshipStats, setScholarshipStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invoiceRes, scholarshipRes] = await Promise.all([
          api.get("/api/invoices/summary"),
          api.get("/api/scholarships/beneficiaries/statistics"),
        ]);

        // ✅ Unwrap nested .data from { success: true, data: {...} }
        setInvoiceSummary(invoiceRes.data.data);
        setScholarshipStats(scholarshipRes.data.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error.response ?? error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ✅ Use correct field names from getFinancialSummary SQL query
  const totalRevenue = parseFloat(invoiceSummary?.total_paid ?? 0);
  const invoicesIssued = invoiceSummary?.total_invoices ?? 0;
  const scholarshipsDisbursed = parseFloat(scholarshipStats?.total_disbursed ?? 0);

  const formatCurrency = (value) =>
    isNaN(value)
      ? "₱0.00"
      : `₱${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <div className="h-[80vh] font-sans text-gray-800">
      <main className="p-4">
        <div className="space-y-4">
          {/* Dashboard Header */}
          <div className="border-b-4 border-indigo-600 pb-4">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "Good Morning, Accounting";
                  else if (hour < 18) return "Good Afternoon, Accounting";
                  else return "Good Evening, Accounting";
                })()}
              </h2>
            </div>
            <p className="mt-1 text-gray-500 text-base">
              Overview of financial operations, billing, and scholarships.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stats */}
          <h3 className="text-xl font-bold text-gray-700">
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {loading ? "Loading..." : formatCurrency(totalRevenue)}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-gray-500">
                Current fiscal year
              </p>
            </div>

            {/* Invoices Issued */}
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Invoices Issued</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {loading ? "Loading..." : invoicesIssued}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-indigo-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-gray-500">
                This month
              </p>
            </div>

            {/* Scholarships Disbursed */}
            <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Scholarships Disbursed</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {loading ? "Loading..." : formatCurrency(scholarshipsDisbursed)}
                  </h2>
                </div>
                <div className="p-3 rounded-full bg-yellow-600 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-gray-500">
                Year to date
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}