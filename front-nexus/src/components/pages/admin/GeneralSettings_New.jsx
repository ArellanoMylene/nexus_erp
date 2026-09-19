import { useState, useEffect } from "react";
import { Settings, Globe, GraduationCap, Shield, Bell, Wrench, Save, RefreshCw } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const GeneralSettingsNew = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  // Form state organized by category
  const [formData, setFormData] = useState({
    // General System Settings
    system_name: "",
    system_logo: "",
    system_tagline: "",
    system_description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    
    // Regional Settings
    timezone: "",
    date_format: "",
    time_format: "",
    currency: "",
    language: "",

    // Notification Settings
    email_notifications: "false",
    sms_notifications: "false",
    notification_retention_days: "",

    // Maintenance Settings
    maintenance_mode: "false",
    maintenance_message: "",
    backup_enabled: "false",
    backup_frequency: "",
    backup_retention_days: "",
  });

  const tabs = [
    { id: "general", label: "General & Branding", icon: Globe },
    { id: "regional", label: "Regional Settings", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "maintenance", label: "System Maintenance", icon: Wrench },
  ];

  const timezones = [
    "Asia/Manila",
    "Asia/Tokyo",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "UTC",
  ];

  const dateFormats = [
    "YYYY-MM-DD",
    "MM/DD/YYYY",
    "DD/MM/YYYY",
    "DD-MM-YYYY",
  ];

  const currencies = ["PHP", "USD", "EUR", "JPY", "GBP"];
  const languages = [
    { value: "en", label: "English" },
    { value: "fil", label: "Filipino" },
  ];

  const semesters = [
    "First Semester",
    "Second Semester",
    "Summer",
    "Mid-Year",
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/system-settings/settings`);
      const data = await response.json();
      if (data.success) {
        const settingsObj = {};
        data.data.forEach((setting) => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsObj);
        setFormData((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category) => {
    try {
      setSaving(true);

      // Determine which settings to save based on category
      let settingsToSave = [];
      
      switch (category) {
        case "general":
          settingsToSave = [
            { key: "system_name", value: formData.system_name, category: "general" },
            { key: "system_logo", value: formData.system_logo, category: "general" },
            { key: "system_tagline", value: formData.system_tagline, category: "general" },
            { key: "system_description", value: formData.system_description, category: "general" },
            { key: "contact_email", value: formData.contact_email, category: "general" },
            { key: "contact_phone", value: formData.contact_phone, category: "general" },
            { key: "address", value: formData.address, category: "general" },
          ];
          break;
        case "regional":
          settingsToSave = [
            { key: "timezone", value: formData.timezone, category: "general" },
            { key: "date_format", value: formData.date_format, category: "general" },
            { key: "time_format", value: formData.time_format, category: "general" },
            { key: "currency", value: formData.currency, category: "general" },
            { key: "language", value: formData.language, category: "general" },
          ];
          break;
        case "notifications":
          settingsToSave = [
            { key: "email_notifications", value: formData.email_notifications, category: "notifications" },
            { key: "sms_notifications", value: formData.sms_notifications, category: "notifications" },
            { key: "notification_retention_days", value: formData.notification_retention_days, category: "notifications" },
          ];
          break;
        case "maintenance":
          settingsToSave = [
            { key: "maintenance_mode", value: formData.maintenance_mode, category: "maintenance" },
            { key: "maintenance_message", value: formData.maintenance_message, category: "maintenance" },
            { key: "backup_enabled", value: formData.backup_enabled, category: "maintenance" },
            { key: "backup_frequency", value: formData.backup_frequency, category: "maintenance" },
            { key: "backup_retention_days", value: formData.backup_retention_days, category: "maintenance" },
          ];
          break;
      }

      // Save each setting
      for (const setting of settingsToSave) {
        await fetch(`${API_BASE}/api/system-settings/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setting_key: setting.key,
            setting_value: setting.value,
            category: setting.category,
          }),
        });
      }

      alert("Settings saved successfully!");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-900 p-3 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-900 p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Configure system-wide settings and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* General & Branding Tab */}
      {activeTab === "general" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">General System Information & Branding</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Name *
                </label>
                <input
                  type="text"
                  value={formData.system_name}
                  onChange={(e) => handleInputChange("system_name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Nexus ERP"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The official name of your institution or system</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Tagline
                </label>
                <input
                  type="text"
                  value={formData.system_tagline}
                  onChange={(e) => handleInputChange("system_tagline", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Excellence in Education Management"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Description
                </label>
                <textarea
                  value={formData.system_description}
                  onChange={(e) => handleInputChange("system_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Brief description of your institution..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Logo Path
                </label>
                <input
                  type="text"
                  value={formData.system_logo}
                  onChange={(e) => handleInputChange("system_logo", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="/assets/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="info@institution.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="+63 123 456 7890"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Institution Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Street Address, City, Province, ZIP Code"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => fetchSettings()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => handleSave("general")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regional Settings Tab */}
      {activeTab === "regional" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Regional & Display Settings</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Configure timezone, formats, currency, and language preferences</p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Timezone *
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System-wide timezone for all dates and times</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date Format *
                </label>
                <select
                  value={formData.date_format}
                  onChange={(e) => handleInputChange("date_format", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  {dateFormats.map((format) => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How dates are displayed throughout the system</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Format *
                </label>
                <select
                  value={formData.time_format}
                  onChange={(e) => handleInputChange("time_format", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour (Military)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  {currencies.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Default currency for financial transactions</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  System Language *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange("language", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Primary language for the interface</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => fetchSettings()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => handleSave("regional")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Notification Settings</h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  checked={formData.email_notifications === "true"}
                  onChange={(e) => handleInputChange("email_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Notifications</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Send notifications via email</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  checked={formData.sms_notifications === "true"}
                  onChange={(e) => handleInputChange("sms_notifications", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SMS Notifications</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Send notifications via SMS</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notification Retention (days)
              </label>
              <input
                type="number"
                value={formData.notification_retention_days}
                onChange={(e) => handleInputChange("notification_retention_days", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="90"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Notifications older than this will be automatically deleted
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => fetchSettings()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => handleSave("notifications")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Maintenance Tab */}
      {activeTab === "maintenance" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">System Maintenance & Backup</h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenance_mode === "true"}
                    onChange={(e) => handleInputChange("maintenance_mode", e.target.checked ? "true" : "false")}
                    className="mt-0.5 w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-red-800 dark:text-red-300">Maintenance Mode</span>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      When enabled, the system will be temporarily unavailable to users. Only administrators can access the system.
                    </p>
                  </div>
                </label>
                
                {formData.maintenance_mode === "true" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      value={formData.maintenance_message}
                      onChange={(e) => handleInputChange("maintenance_message", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      placeholder="System is undergoing maintenance. We'll be back shortly."
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.backup_enabled === "true"}
                    onChange={(e) => handleInputChange("backup_enabled", e.target.checked ? "true" : "false")}
                    className="mt-0.5 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Automatic Database Backups</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Enable automated database backups to protect your data
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {formData.backup_enabled === "true" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={formData.backup_frequency}
                    onChange={(e) => handleInputChange("backup_frequency", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily (Recommended)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Backup Retention (days)
                  </label>
                  <input
                    type="number"
                    value={formData.backup_retention_days}
                    onChange={(e) => handleInputChange("backup_retention_days", e.target.value)}
                    min="7"
                    max="365"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="30"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    How long to keep backup files (7-365 days)
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => fetchSettings()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => handleSave("maintenance")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralSettingsNew;