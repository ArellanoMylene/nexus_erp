import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  ArrowLeft,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
  Hash,
  LayoutDashboard,
  Users,
  School,
  Building2, // Added for mailing address/campus
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StudentRegistrationForm from "./StudentRegistrationForm";
import EmailVerification from "./EmailVerification";

/* ==========================================
    CENTERED TOAST CONTAINER STYLES
    Injected once so this file stays self-contained.
    Centers all toasts (success/error/warn) in the
    middle of the screen instead of top-center.
    ========================================== */
if (
  typeof document !== "undefined" &&
  !document.getElementById("centered-toast-styles")
) {
  const style = document.createElement("style");
  style.id = "centered-toast-styles";
  style.innerHTML = `
    .Toastify__toast-container.center-toast-container {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      transform: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      z-index: 9999;
    }
    .center-toast-container .Toastify__toast {
      width: 320px !important;
      max-width: 90vw !important;
      height: auto !important;
      min-height: auto !important;
      flex: 0 0 auto !important;
      align-self: center !important;
      margin: 0 !important;
      border-radius: 12px;
    }
  `;
  document.head.appendChild(style);
}

/* ==========================================
    SHARED COMPONENTS (Compact & Polished)
    ========================================== */

/**
 * A styled input field with optional icon and password toggle.
 */
const FormInput = ({ label, showToggle, toggle, icon: Icon, ...props }) => (
  <div className="w-full group">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider ml-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-amber-600 transition-colors">
          <Icon size={16} />
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg 
        ${Icon ? "pl-9" : "pl-3"} ${
          showToggle ? "pr-9" : "pr-3"
        } py-2 text-sm font-medium shadow-sm
        placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 
        transition-all duration-200 hover:border-amber-300 dark:hover:border-slate-600`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
        >
          {props.type === "password" && props.value ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      )}
    </div>
  </div>
);

/**
 * A styled select input field.
 */
const SelectInput = ({ label, options, ...props }) => (
  <div className="w-full group">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider ml-1">
      {label}
    </label>
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg 
        pl-3 pr-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 
        transition-all duration-200 hover:border-amber-300 dark:hover:border-slate-600 cursor-pointer"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt || "Select..."}
          </option>
        ))}
      </select>
      {/* Custom Arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  </div>
);

/* ==========================================
    LOGIN FORM
    ========================================== */

const LoginForm = ({ onRegisterClick, onLoginSuccess, onVerifyClick }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password) {
      toast.warn("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      // Send login request
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          email,
          password,
        },
      );

      //console.log("Login Response:", data);

      // Save JWT token & user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("firstName", data.firstName || "");
      localStorage.setItem("lastName", data.lastName || "");
      // Also store a user object for compatibility with SyllabusRepository
      localStorage.setItem(
        "user",
        JSON.stringify({ user_id: data.userId, role: data.role }),
      );

      // No success notification — proceed straight to the redirect.
      // Redirect based on role
      if (data.role === "Student") {
        navigate("/student/dashboard");
      } else if (data.role === "Admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "Faculty") {
        navigate("/faculty/dashboard");
      } else if (data.role === "Staff") {
        navigate("/staff/dashboard");
      } else if (data.role === "HR") {
        navigate("/hr/dashboard");
      } else if (data.role === "Accounting") {
        navigate("/accounting/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error.response?.status === 403 || error.response?.data?.requireVerification) {
        toast.warn(error.response.data?.message || "Email not verified. Please complete verification to log in.");
        if (onVerifyClick) {
          onVerifyClick(error.response.data?.email || email);
        }
        return;
      }

      if (error.response?.data?.message) {
        toast.error(`Login Failed: ${error.response.data.message}`);
      } else if (error.response?.status === 400) {
        toast.error(
          "Login Failed: Invalid email or password. Please check your credentials.",
        );
      } else {
        toast.error("Network error. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col md:flex-row w-full h-full min-h-[480px]">
      {/* LEFT SIDEBAR (Deep Academic Blue/Indigo) */}
      <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-800 to-indigo-900 p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-[-50px] top-[-50px] w-40 h-40 rounded-full border-4 border-white"></div>
          <div className="absolute left-[-30px] bottom-[20%] w-20 h-20 rounded-full bg-white blur-xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide">Nexus</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
            Welcome Back!
          </h2>
          <p className="text-blue-200 text-xs md:text-sm opacity-90">
            Log in to access your student portal, grades, and enrollment data.
          </p>
        </div>

        {/* Decorative Bottom Content */}
        <div className="hidden md:block relative z-10 mt-auto pt-6">
          <div className="p-3 bg-blue-900/30 rounded-lg backdrop-blur-md border border-blue-500/30">
            <p className="text-[10px] text-blue-200 font-medium mb-1 uppercase tracking-wider">
              System Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-white">
                Online & Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM AREA */}
      <div className="w-full md:w-2/3 p-6 md:p-8 bg-white dark:bg-slate-800 flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              Sign In
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Please enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Email / ID Input */}
            <FormInput
              label="University ID / Email"
              icon={User}
              placeholder="e.g. 2023-00123 / student@uni.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password Input */}
            <div>
              <FormInput
                label="Password"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showToggle
                toggle={() => setShowPassword(!showPassword)}
              />
              <div className="flex justify-between items-center mt-1">
                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="peer h-3.5 w-3.5 cursor-pointer appearance-none rounded border border-slate-300 bg-slate-50 checked:border-amber-600 checked:bg-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Check
                      size={9}
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    />
                  </div>
                  <label
                    htmlFor="remember"
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Submit Button (Amber Accent) */}
            <button
              type="submit"
              disabled={submitting}
              className="group mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-8 py-2.5 text-white text-sm font-semibold shadow-md shadow-amber-200 dark:shadow-none hover:bg-amber-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? "Logging in…" : "Log In"}
              {!submitting && (
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don’t have an account?{" "}
              <button
                onClick={onRegisterClick}
                className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline transition-all"
              >
                Create one now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
    REGISTRATION FORM (Multi-Step)
    ========================================== */

const RegistrationForm = ({ onBackToLogin, onRegistrationSuccess }) => {
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    systemId: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    dob: "",
    gender: "",
    phone: "",
    parentPhone: "",
    permanentAddress: "",
    mailingAddress: "", // Added this to differentiate
    fatherName: "",
    motherName: "",
    studentNumber: "",
    course: "",
    major: "",
    yearLevel: "",
    previousSchool: "",
    yearGraduated: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const isStep1Valid = () =>
    formData.systemId &&
    formData.email &&
    formData.password &&
    formData.password === formData.confirmPassword;

  const isStep2Valid = () =>
    formData.firstName &&
    formData.lastName &&
    formData.dob &&
    formData.gender &&
    formData.phone &&
    formData.parentPhone &&
    formData.permanentAddress;

  const getNextButtonDisabled = () => {
    if (step === 1) return !isStep1Valid();
    if (step === 2) return !isStep2Valid();
    return false; // Step 3
  };

  const changeStep = (direction) => {
    if (direction === "next" && step === 1 && !isStep1Valid()) return;
    if (direction === "next" && step === 2 && !isStep2Valid()) return;

    setAnimating(true);
    setTimeout(() => {
      setStep((s) =>
        direction === "next" ? Math.min(s + 1, 3) : Math.max(s - 1, 1),
      );
      setAnimating(false);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast.warn("Please accept the terms and conditions to proceed.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
        formData, // Make sure this matches your backend fields
      );

      // Successful registration
      if (onRegistrationSuccess) {
        onRegistrationSuccess(formData.email);
      } else {
        onBackToLogin();
      }
    } catch (error) {
      // Handle errors
      if (error.response) {
        // Backend returned an error
        toast.error(error.response.data.message || "Registration failed");
       // console.error("Backend error:", error.response.data);
      } else {
        // Network error
        toast.error("Network error. Please try again later.");
       // console.error("Network error:", error);
      }
    }
  };
  const steps = [
    {
      number: 1,
      label: "Account",
      icon: ShieldCheck,
      title: "Account Details",
    },
    { number: 2, label: "Personal", icon: User, title: "Personal Information" },
    { number: 3, label: "Academic", icon: BookOpen, title: "Academic Profile" },
  ];

  const currentStep = steps.find((s) => s.number === step);

  return (
    <div className="flex flex-col md:flex-row w-full h-full min-h-[480px]">
      {/* SIDEBAR (Deep Academic Blue/Indigo) */}
      <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-800 to-indigo-900 p-6 md:p-8 flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide">Nexus</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
            Start your journey.
          </h2>
          <p className="text-blue-200 text-xs md:text-sm opacity-90">
            Create your student portal account in 3 easy steps.
          </p>
        </div>

        {/* Stepper for Desktop */}
        <div className="hidden md:flex flex-col gap-4 mt-8">
          {steps.map((s) => {
            const isActive = step === s.number;
            const isCompleted = step > s.number;
            const Icon = s.icon;

            return (
              <div key={s.number} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 
                    ${
                      isActive
                        ? "bg-white text-amber-600 border-white scale-110 shadow-lg"
                        : isCompleted
                          ? "bg-amber-600 border-amber-600 text-white"
                          : "border-amber-400/50 text-amber-200"
                    }`}
                >
                  {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <div>
                  <p
                    className={`text-sm font-bold transition-colors ${
                      isActive ? "text-white" : "text-blue-300"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[10px] text-blue-300 opacity-80 mt-[-2px]">
                    {s.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 md:hidden">
          {/* Mobile Stepper */}
          <div className="flex items-center justify-between text-[10px] font-medium text-blue-300">
            <span className="font-semibold">{currentStep.title}</span>
            <span>
              Step {step} of 3 ({Math.round((step / 3) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-blue-900/30 h-1 rounded-full mt-1.5">
            <div
              className="bg-amber-400 h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* FORM AREA */}
      <div className="w-full md:w-2/3 p-6 md:p-8 bg-white dark:bg-slate-800 flex flex-col">
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col relative max-w-lg mx-auto w-full"
        >
          {/* Transition Container */}
          <div
            className={`flex-1 transition-all duration-250 ease-in-out ${
              animating
                ? "opacity-0 translate-x-2"
                : "opacity-100 translate-x-0"
            }`}
          >
            {/* STEP 1: ACCOUNT */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-amber-600" size={20} /> Account
                  Details
                </h3>

                <FormInput
                  label="University ID"
                  name="systemId"
                  icon={Hash}
                  value={formData.systemId}
                  onChange={handleChange}
                  placeholder="e.g. 2023-00123 (Required)"
                  autoFocus
                  required
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={User}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@university.edu (Required)"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput
                    label="Password"
                    name="password"
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    showToggle
                    toggle={() => setShowPass(!showPass)}
                    placeholder="••••••••"
                    required
                  />
                  <FormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    icon={Lock}
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    showToggle
                    toggle={() => setShowConfirm(!showConfirm)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {formData.password &&
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      Passwords do not match.
                    </p>
                  )}
              </div>
            )}

            {/* STEP 2: PERSONAL INFO */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <User className="text-amber-600" size={20} /> Personal
                  Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormInput
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                  <FormInput
                    label="Middle Name"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                  <FormInput
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                  <SelectInput
                    label="Suffix"
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                    options={["", "Jr.", "Sr.", "III", "IV"]}
                  />
                  <FormInput
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    icon={Calendar}
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                  <SelectInput
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={[
                      "",
                      "Male",
                      "Female",
                      "Non-Binary",
                      "Prefer not to say",
                    ]}
                    required
                  />
                </div>

                <h4 className="text-sm font-bold text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
                  Contact & Emergency Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormInput
                    label="Student Phone Number"
                    name="phone"
                    icon={Phone}
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                  <FormInput
                    label="Parent/Guardian Phone"
                    name="parentPhone"
                    icon={Phone}
                    type="tel"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="Emergency Contact"
                    required
                  />
                  <FormInput
                    label="Father's Name"
                    name="fatherName"
                    icon={Users}
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="Full Name (Optional)"
                  />
                  <FormInput
                    label="Mother's Name"
                    name="motherName"
                    icon={Users}
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="Full Name (Optional)"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <FormInput
                    label="Permanent Address"
                    name="permanentAddress"
                    icon={MapPin}
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    placeholder="Street, City, Province, Zip"
                    required
                  />
                  <FormInput
                    label="Mailing Address (if different)"
                    name="mailingAddress"
                    icon={Building2}
                    value={formData.mailingAddress}
                    onChange={handleChange}
                    placeholder="Leave blank if same as Permanent Address"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: STUDENT INFO */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="text-amber-600" size={20} />
                  Academic Profile
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormInput
                      label="Student Number"
                      name="studentNumber"
                      icon={Hash}
                      value={formData.studentNumber}
                      onChange={handleChange}
                      placeholder="Official Student No. (Optional)"
                    />
                    <SelectInput
                      label="Year Level"
                      name="yearLevel"
                      value={formData.yearLevel}
                      onChange={handleChange}
                      options={[
                        "",
                        "1st Year",
                        "2nd Year",
                        "3rd Year",
                        "4th Year",
                        "5th Year",
                        "Irregular",
                      ]}
                      required
                    />
                    <div className="sm:col-span-1">
                      {/* Empty div for layout on small screens */}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                      label="Course / Program"
                      name="course"
                      icon={BookOpen}
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="e.g. BS Computer Science (Required)"
                      required
                    />
                    <FormInput
                      label="Major"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineering (Optional)"
                    />
                  </div>

                  {/* PREVIOUS EDUCATION */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                      Previous Education
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Last School Attended"
                          name="previousSchool"
                          icon={School}
                          value={formData.previousSchool}
                          onChange={handleChange}
                          placeholder="e.g. St. Jude High School"
                        />
                      </div>
                      <FormInput
                        label="Year Graduated"
                        name="yearGraduated"
                        icon={Calendar}
                        value={formData.yearGraduated}
                        onChange={handleChange}
                        placeholder="YYYY"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Acceptance */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-start gap-2">
                    <div className="relative flex items-center pt-1">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-slate-300 bg-slate-50 checked:border-amber-600 checked:bg-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <Check
                        size={10}
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                      />
                    </div>
                    <label
                      htmlFor="termsAccepted"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                    >
                      I accept the{" "}
                      <a
                        href="#"
                        className="text-amber-600 hover:underline font-semibold"
                        onClick={(e) => e.preventDefault()}
                      >
                        Terms and Conditions
                      </a>{" "}
                      and acknowledge the{" "}
                      <a
                        href="#"
                        className="text-amber-600 hover:underline font-semibold"
                        onClick={(e) => e.preventDefault()}
                      >
                        Privacy Policy
                      </a>
                      .
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => changeStep("prev")}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 font-medium text-sm hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />{" "}
                Back
              </button>
            ) : (
              <div className="flex-1"></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => changeStep("next")}
                disabled={getNextButtonDisabled()}
                className={`group flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm font-semibold shadow-md transition-all 
                  ${
                    getNextButtonDisabled()
                      ? "bg-amber-600/50 cursor-not-allowed"
                      : "bg-amber-600 shadow-amber-200 hover:bg-amber-700 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
              >
                Next Step{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!termsAccepted} // Disabled until terms are accepted
                className={`group flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm font-semibold shadow-md transition-all 
                  ${
                    termsAccepted
                      ? "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-emerald-500/50 cursor-not-allowed"
                  }`}
              >
                Complete Registration <Check size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              onClick={onBackToLogin}
              className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline transition-all"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
    MAIN APP CONTAINER - Renamed for clarity
    ========================================== */
const LoginLayout = ({ onNavigateToAdmin, onNavigateByRole }) => {
  // onNavigateToAdmin is the handler for admin, onNavigateByRole for other roles
  const [view, setView] = useState("login"); // "login" | "register" | "verify"
  const [verificationEmail, setVerificationEmail] = useState("");

  // Handler for successful login
  const handleLoginSuccess = (userData) => {
    // Call the external navigation function to switch layouts/routes
    if (userData.role === "Admin") {
      onNavigateToAdmin(); // Navigate to the admin dashboard
    } else if (userData.role === "Faculty") {
      onNavigateByRole("Faculty"); // Navigate to faculty dashboard
    } else if (userData.role === "Student") {
      onNavigateByRole("Student"); // Navigate to student dashboard
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Renders the toast notifications */}
      <ToastContainer className="center-toast-container" autoClose={3000} />

      {/* Background Image Overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage:
            "url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Baco_Mahalta.jpg/1100px-Baco_Mahalta.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.5) blur(1px)",
          zIndex: 0,
        }}
      />

      {/* Main Form Container */}
      <div className="relative z-10 w-full max-w-3xl h-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-slate-600 overflow-hidden transition-all duration-500">
        {view === "login" ? (
          <LoginForm
            onRegisterClick={() => setView("register")}
            onLoginSuccess={handleLoginSuccess}
            onVerifyClick={(email) => {
              setVerificationEmail(email);
              setView("verify");
            }}
          />
        ) : view === "verify" ? (
          <EmailVerification
            email={verificationEmail}
            onVerificationSuccess={() => setView("login")}
            onBackToLogin={() => setView("login")}
            onChangeEmail={() => setView("register")}
          />
        ) : (
          <StudentRegistrationForm onBackToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
};

export default LoginLayout;