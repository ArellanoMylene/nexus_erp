import { useEffect, useMemo, useState } from "react";
import { Check, ArrowLeft, ArrowRight, BookOpen, Calendar, Hash, LayoutDashboard, MapPin, Phone, GraduationCap, ShieldCheck, User, Users, School, Building2, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import api from "../../api/axios";
import EmailVerification from "./EmailVerification";

const todayValue = () => new Date().toISOString().split("T")[0];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const calculateAge = (value) => {
  if (!value) return "";
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return "";
  const diff = Date.now() - birthDate.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const combineAddress = (street, barangay, city, province) =>
  [street, barangay, city, province].filter(Boolean).join(", ");

const Input = ({ label, icon: Icon, error, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <div className="relative">
      {Icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={15} />
        </span>
      ) : null}
      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white ${Icon ? "pl-9" : "pl-3"} ${props.readOnly ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800/80" : ""} ${error ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : "border-slate-200"}`}
      />
    </div>
    {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
  </label>
);

const Select = ({ label, error, children, className = "", ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <select
      {...props}
      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white ${props.disabled ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800/80" : ""} ${error ? "border-red-400 focus:border-red-400 focus:ring-red-500/10" : "border-slate-200"}`}
    >
      {children}
    </select>
    {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
  </label>
);

const RadioGroup = ({ label, name, value, onChange, options, error }) => (
  <div>
    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      {options.map((option) => (
        <label key={option.value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          {option.label}
        </label>
      ))}
    </div>
    {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
  </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/65 md:p-5">
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-400/10">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const fieldToLabel = (field) => field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

const StudentRegistrationForm = ({ onBackToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [programsLoading, setProgramsLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [programs, setPrograms] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [studentNumber, setStudentNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    studentType: "New Student",
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    gender: "",
    phone: "",
    permanentSitio: "",
    permanentBarangay: "",
    permanentCityMunicipality: "",
    permanentProvince: "",
    presentSitio: "",
    presentBarangay: "",
    presentCityMunicipality: "",
    presentProvince: "",
    civilStatus: "Single",
    religion: "",
    isPwd: "No",
    indigenousPeople: "No",
    zipCode: "5201",
    academicYear: "",
    semester: "",
    courseProgram: "",
    yearLevel: "",
    dateRegistered: todayValue(),
    birthPlace: "",
    citizenship: "Filipino",
    elementarySchool: "",
    elementaryYearGraduated: "",
    juniorHighSchool: "",
    juniorHighYearGraduated: "",
    seniorHighSchool: "",
    seniorHighYearGraduated: "",
    collegeProgramAttended: "",
    schoolYearAttended: "",
    fatherName: "",
    fatherStatus: "Living",
    fatherResidenceStreet: "",
    fatherResidenceBarangay: "",
    fatherResidenceCity: "",
    fatherResidenceProvince: "",
    fatherResidenceZipCode: "",
    fatherOccupation: "",
    fatherPhone: "",
    motherName: "",
    motherStatus: "Living",
    motherResidenceStreet: "",
    motherResidenceBarangay: "",
    motherResidenceCity: "",
    motherResidenceProvince: "",
    motherResidenceZipCode: "",
    motherOccupation: "",
    motherPhone: "",
    guardianName: "",
    guardianRelationship: "",
    guardianResidenceStreet: "",
    guardianResidenceBarangay: "",
    guardianResidenceCity: "",
    guardianResidenceProvince: "",
    guardianResidenceZipCode: "",
    guardianOccupation: "",
    guardianPhone: "",
    otherFinancialAssistance: "No",
    scholarshipAssistance1: "",
    scholarshipAssistance2: "",
    scholarshipAssistance3: "",
  });

  const steps = [
    { title: "Account", subtitle: "Login & contact" },
    { title: "Profile", subtitle: "Identity & address" },
    { title: "Academic", subtitle: "School & family" },
    { title: "Review", subtitle: "Scholarship & confirm" },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [programResponse, periodResponse] = await Promise.allSettled([
          api.get("/api/programs"),
          api.get("/api/academic-periods/active"),
        ]);

        if (programResponse.status === "fulfilled") {
          const activePrograms = Array.isArray(programResponse.value.data)
            ? programResponse.value.data.filter((program) => !program.status || program.status === "Active")
            : [];
          setPrograms(activePrograms);
        }

        if (periodResponse.status === "fulfilled") {
          setActivePeriod(periodResponse.value.data || null);
          setFormData((prev) => ({
            ...prev,
            academicYear: periodResponse.value.data?.school_year || prev.academicYear,
            semester: periodResponse.value.data?.semester || prev.semester,
          }));
        }
      } finally {
        setProgramsLoading(false);
        setPeriodLoading(false);
      }
    };

    loadData();
  }, []);

  const age = useMemo(() => calculateAge(formData.dob), [formData.dob]);
  const combinedPermanentAddress = useMemo(
    () => combineAddress(formData.permanentSitio, formData.permanentBarangay, formData.permanentCityMunicipality, formData.permanentProvince),
    [formData.permanentSitio, formData.permanentBarangay, formData.permanentCityMunicipality, formData.permanentProvince],
  );

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const validateStep = (stepIndex) => {
    const nextErrors = {};

    if (stepIndex === 0) {
      if (!formData.email.trim()) nextErrors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address.";

      if (!formData.phone.trim()) nextErrors.phone = "Contact number is required.";
      if (!formData.password || formData.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
      if (!formData.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (stepIndex === 1) {
      ["firstName", "lastName", "dob", "gender"].forEach((field) => {
        if (!formData[field]) nextErrors[field] = `${fieldToLabel(field)} is required.`;
      });

      if (formData.dob && new Date(formData.dob) > new Date()) {
        nextErrors.dob = "Birthday cannot be in the future.";
      }

      if (!formData.permanentSitio || !formData.permanentBarangay || !formData.permanentCityMunicipality || !formData.permanentProvince) {
        nextErrors.permanentAddress = "Complete permanent address is required.";
      }

      if (!formData.presentSitio || !formData.presentBarangay || !formData.presentCityMunicipality || !formData.presentProvince) {
        nextErrors.presentAddress = "Complete present address is required.";
      }
    }

    if (stepIndex === 2) {
      ["courseProgram", "yearLevel", "academicYear", "semester"].forEach((field) => {
        if (!formData[field]) nextErrors[field] = `${fieldToLabel(field)} is required.`;
      });
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address.";

    if (!formData.password || formData.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";

    ["firstName", "lastName", "dob", "gender", "phone", "courseProgram", "yearLevel", "academicYear", "semester"].forEach((field) => {
      if (!formData[field]) nextErrors[field] = `${fieldToLabel(field)} is required.`;
    });

    if (formData.dob && new Date(formData.dob) > new Date()) {
      nextErrors.dob = "Birthday cannot be in the future.";
    }

    if (!formData.permanentSitio || !formData.permanentBarangay || !formData.permanentCityMunicipality || !formData.permanentProvince) {
      nextErrors.permanentAddress = "Complete permanent address is required.";
    }

    if (!formData.presentSitio || !formData.presentBarangay || !formData.presentCityMunicipality || !formData.presentProvince) {
      nextErrors.presentAddress = "Complete present address is required.";
    }

    if (formData.otherFinancialAssistance === "Yes") {
      if (!formData.scholarshipAssistance1.trim()) nextErrors.scholarshipAssistance1 = "Enter at least one assistance source.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dob,
        gender: formData.gender,
        phone: formData.phone.trim(),
        permanentAddress: combinedPermanentAddress,
        studentNumber: studentNumber.trim() || undefined,
        academicYear: formData.academicYear,
        semester: formData.semester,
        civilStatus: formData.civilStatus,
        religion: formData.religion.trim(),
        isPwd: formData.isPwd,
        indigenousPeople: formData.indigenousPeople,
        zipCode: formData.zipCode.trim(),
        courseProgram: formData.courseProgram,
        yearLevel: formData.yearLevel,
        dateRegistered: formData.dateRegistered,
        birthPlace: formData.birthPlace.trim(),
        citizenship: formData.citizenship.trim(),
        elementarySchool: formData.elementarySchool.trim(),
        elementaryYearGraduated: formData.elementaryYearGraduated.trim(),
        juniorHighSchool: formData.juniorHighSchool.trim(),
        juniorHighYearGraduated: formData.juniorHighYearGraduated.trim(),
        seniorHighSchool: formData.seniorHighSchool.trim(),
        seniorHighYearGraduated: formData.seniorHighYearGraduated.trim(),
        collegeProgramAttended: formData.collegeProgramAttended.trim(),
        schoolYearAttended: formData.schoolYearAttended.trim(),
        studentType: formData.studentType,
        fatherName: formData.fatherName.trim(),
        fatherStatus: formData.fatherStatus,
        fatherResidenceStreet: formData.fatherResidenceStreet.trim(),
        fatherResidenceBarangay: formData.fatherResidenceBarangay.trim(),
        fatherResidenceCity: formData.fatherResidenceCity.trim(),
        fatherResidenceProvince: formData.fatherResidenceProvince.trim(),
        fatherResidenceZipCode: formData.fatherResidenceZipCode.trim(),
        fatherOccupation: formData.fatherOccupation.trim(),
        fatherPhone: formData.fatherPhone.trim(),
        motherName: formData.motherName.trim(),
        motherStatus: formData.motherStatus,
        motherResidenceStreet: formData.motherResidenceStreet.trim(),
        motherResidenceBarangay: formData.motherResidenceBarangay.trim(),
        motherResidenceCity: formData.motherResidenceCity.trim(),
        motherResidenceProvince: formData.motherResidenceProvince.trim(),
        motherResidenceZipCode: formData.motherResidenceZipCode.trim(),
        motherOccupation: formData.motherOccupation.trim(),
        motherPhone: formData.motherPhone.trim(),
        guardianName: formData.guardianName.trim(),
        guardianRelationship: formData.guardianRelationship.trim(),
        guardianResidenceStreet: formData.guardianResidenceStreet.trim(),
        guardianResidenceBarangay: formData.guardianResidenceBarangay.trim(),
        guardianResidenceCity: formData.guardianResidenceCity.trim(),
        guardianResidenceProvince: formData.guardianResidenceProvince.trim(),
        guardianResidenceZipCode: formData.guardianResidenceZipCode.trim(),
        guardianOccupation: formData.guardianOccupation.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        otherFinancialAssistance: formData.otherFinancialAssistance,
        scholarshipAssistance1: formData.scholarshipAssistance1.trim(),
        scholarshipAssistance2: formData.scholarshipAssistance2.trim(),
        scholarshipAssistance3: formData.scholarshipAssistance3.trim(),
      };

      await api.post("/api/auth/register", payload);
      const emailToVerify = formData.email.trim();
      setVerificationEmail(emailToVerify);
      setIsVerifying(true);
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SectionCard title="Student Details" subtitle="Create your access credentials and contact information." icon={ShieldCheck}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Student Type" value={formData.studentType} onChange={(event) => updateField("studentType", event.target.value)}>
                <option value="New Student">New Student</option>
                <option value="Old Student">Old Student</option>
                <option value="Transferree">Transferree</option>
              </Select>
              <Input label="Student ID (optional)" icon={Hash} value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="Leave blank to auto-generate" />
              <Input label="Date Registered" icon={Calendar} value={formData.dateRegistered} readOnly />
              <Input label="Email Address" type="email" icon={User} value={formData.email} onChange={(event) => updateField("email", event.target.value)} error={errors.email} placeholder="student@school.edu" />
              <Input label="Contact Number" type="tel" icon={Phone} value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} error={errors.phone} placeholder="09xxxxxxxxx" />
              <div className="relative">
                <Input label="Password" type={showPassword ? "text" : "password"} icon={Lock} value={formData.password} onChange={(event) => updateField("password", event.target.value)} error={errors.password} placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[31px] text-slate-400 transition hover:text-amber-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Input label="Confirm Password" type={showConfirmPassword ? "text" : "password"} icon={Lock} value={formData.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} error={errors.confirmPassword} placeholder="Repeat password" />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-[31px] text-slate-400 transition hover:text-amber-600">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </SectionCard>
        );
      case 1:
        return (
          <>
            <SectionCard title="Personal Information" subtitle="Identity, date of birth, and residence details." icon={User}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Last Name" value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} error={errors.lastName} placeholder="Dela Cruz" />
                <Input label="First Name" value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} error={errors.firstName} placeholder="Maria" />
                <Input label="Middle Name" value={formData.middleName} onChange={(event) => updateField("middleName", event.target.value)} placeholder="Santos" />
                <Input label="Birthday" type="date" icon={Calendar} value={formData.dob} onChange={(event) => updateField("dob", event.target.value)} error={errors.dob} />
                <Input label="Age" value={age ? String(age) : ""} readOnly />
                <Select label="Gender" value={formData.gender} onChange={(event) => updateField("gender", event.target.value)} error={errors.gender}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </Select>
                <Select label="Civil Status" value={formData.civilStatus} onChange={(event) => updateField("civilStatus", event.target.value)}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Others">Others</option>
                </Select>
                <Select label="PWD" value={formData.isPwd} onChange={(event) => updateField("isPwd", event.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Select>
                <Select label="Indigenous People (IP)" value={formData.indigenousPeople} onChange={(event) => updateField("indigenousPeople", event.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Select>
                <Input label="Religion" value={formData.religion} onChange={(event) => updateField("religion", event.target.value)} placeholder="Roman Catholic" />
                <Input label="Birth Place" value={formData.birthPlace} onChange={(event) => updateField("birthPlace", event.target.value)} placeholder="City, Province" />
                <Input label="Citizenship" value={formData.citizenship} onChange={(event) => updateField("citizenship", event.target.value)} placeholder="Filipino" />
                <Input label="Zip Code" value={formData.zipCode} onChange={(event) => updateField("zipCode", event.target.value)} placeholder="5201" />
              </div>
            </SectionCard>

            <SectionCard title="Addresses" subtitle="Permanent and present residence details." icon={MapPin}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Permanent Address</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Sitio / Street" value={formData.permanentSitio} onChange={(event) => updateField("permanentSitio", event.target.value)} error={errors.permanentAddress} placeholder="Sitio name or street" />
                    <Input label="Barangay" value={formData.permanentBarangay} onChange={(event) => updateField("permanentBarangay", event.target.value)} error={errors.permanentAddress} placeholder="Barangay" />
                    <Input label="City / Municipality" value={formData.permanentCityMunicipality} onChange={(event) => updateField("permanentCityMunicipality", event.target.value)} error={errors.permanentAddress} placeholder="City or municipality" />
                    <Input label="Province" value={formData.permanentProvince} onChange={(event) => updateField("permanentProvince", event.target.value)} error={errors.permanentAddress} placeholder="Province" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Present Address</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Sitio / Street" value={formData.presentSitio} onChange={(event) => updateField("presentSitio", event.target.value)} error={errors.presentAddress} placeholder="Sitio name or street" />
                    <Input label="Barangay" value={formData.presentBarangay} onChange={(event) => updateField("presentBarangay", event.target.value)} error={errors.presentAddress} placeholder="Barangay" />
                    <Input label="City / Municipality" value={formData.presentCityMunicipality} onChange={(event) => updateField("presentCityMunicipality", event.target.value)} error={errors.presentAddress} placeholder="City or municipality" />
                    <Input label="Province" value={formData.presentProvince} onChange={(event) => updateField("presentProvince", event.target.value)} error={errors.presentAddress} placeholder="Province" />
                  </div>
                </div>
                <Input label="Permanent Address Summary" value={combinedPermanentAddress} readOnly />
              </div>
            </SectionCard>
          </>
        );
      case 2:
        return (
          <>
            <SectionCard title="Academic Background" subtitle="School history and your current academic enrollment." icon={GraduationCap}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Academic Year" value={formData.academicYear} readOnly disabled={periodLoading || Boolean(activePeriod)} />
                <Input label="Semester" value={formData.semester} readOnly disabled={periodLoading || Boolean(activePeriod)} />
                <Select label="Course / Program" value={formData.courseProgram} onChange={(event) => updateField("courseProgram", event.target.value)} error={errors.courseProgram} disabled={programsLoading && programs.length === 0}>
                  <option value="">Select active program</option>
                  {programs.map((program) => (
                    <option key={program.id || program.program_id} value={program.name || program.title || program.code}>
                      {program.code ? `${program.code} - ` : ""}{program.name || program.title}
                    </option>
                  ))}
                </Select>
                <Select label="Year Level" value={formData.yearLevel} onChange={(event) => updateField("yearLevel", event.target.value)} error={errors.yearLevel}>
                  <option value="">Select year level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </Select>
                <Input label="Elementary School Completed At" value={formData.elementarySchool} onChange={(event) => updateField("elementarySchool", event.target.value)} placeholder="Elementary school name" />
                <Input label="School Year Graduated" value={formData.elementaryYearGraduated} onChange={(event) => updateField("elementaryYearGraduated", event.target.value)} placeholder="YYYY" />
                <Input label="Junior High School Completed At" value={formData.juniorHighSchool} onChange={(event) => updateField("juniorHighSchool", event.target.value)} placeholder="Junior high school name" />
                <Input label="School Year Graduated" value={formData.juniorHighYearGraduated} onChange={(event) => updateField("juniorHighYearGraduated", event.target.value)} placeholder="YYYY" />
                <Input label="Senior High School Completed At" value={formData.seniorHighSchool} onChange={(event) => updateField("seniorHighSchool", event.target.value)} placeholder="Senior high school name" />
                <Input label="School Year Graduated" value={formData.seniorHighYearGraduated} onChange={(event) => updateField("seniorHighYearGraduated", event.target.value)} placeholder="YYYY" />
                <Input label="College / Program Course Attended" value={formData.collegeProgramAttended} onChange={(event) => updateField("collegeProgramAttended", event.target.value)} placeholder="Program or course" />
                <Input label="School Year Attended" value={formData.schoolYearAttended} onChange={(event) => updateField("schoolYearAttended", event.target.value)} placeholder="YYYY - YYYY" />
              </div>
            </SectionCard>

            <SectionCard title="Family Information" subtitle="Parents and guardian details." icon={Users}>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Father&apos;s Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Father&apos;s Name" value={formData.fatherName} onChange={(event) => updateField("fatherName", event.target.value)} placeholder="Full name" />
                    <Select label="Status" value={formData.fatherStatus} onChange={(event) => updateField("fatherStatus", event.target.value)}>
                      <option value="Living">Living</option>
                      <option value="Deceased">Deceased</option>
                    </Select>
                    <Input label="Residence Street" value={formData.fatherResidenceStreet} onChange={(event) => updateField("fatherResidenceStreet", event.target.value)} placeholder="Street" />
                    <Input label="Barangay" value={formData.fatherResidenceBarangay} onChange={(event) => updateField("fatherResidenceBarangay", event.target.value)} placeholder="Barangay" />
                    <Input label="Town / City" value={formData.fatherResidenceCity} onChange={(event) => updateField("fatherResidenceCity", event.target.value)} placeholder="Town or city" />
                    <Input label="Province" value={formData.fatherResidenceProvince} onChange={(event) => updateField("fatherResidenceProvince", event.target.value)} placeholder="Province" />
                    <Input label="Zip Code" value={formData.fatherResidenceZipCode} onChange={(event) => updateField("fatherResidenceZipCode", event.target.value)} placeholder="Zip code" />
                    <Input label="Occupation" value={formData.fatherOccupation} onChange={(event) => updateField("fatherOccupation", event.target.value)} placeholder="Occupation" />
                    <Input label="Phone Number" value={formData.fatherPhone} onChange={(event) => updateField("fatherPhone", event.target.value)} placeholder="Phone number" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Mother&apos;s Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Mother&apos;s Name" value={formData.motherName} onChange={(event) => updateField("motherName", event.target.value)} placeholder="Full name" />
                    <Select label="Status" value={formData.motherStatus} onChange={(event) => updateField("motherStatus", event.target.value)}>
                      <option value="Living">Living</option>
                      <option value="Deceased">Deceased</option>
                    </Select>
                    <Input label="Residence Street" value={formData.motherResidenceStreet} onChange={(event) => updateField("motherResidenceStreet", event.target.value)} placeholder="Street" />
                    <Input label="Barangay" value={formData.motherResidenceBarangay} onChange={(event) => updateField("motherResidenceBarangay", event.target.value)} placeholder="Barangay" />
                    <Input label="Town / City" value={formData.motherResidenceCity} onChange={(event) => updateField("motherResidenceCity", event.target.value)} placeholder="Town or city" />
                    <Input label="Province" value={formData.motherResidenceProvince} onChange={(event) => updateField("motherResidenceProvince", event.target.value)} placeholder="Province" />
                    <Input label="Zip Code" value={formData.motherResidenceZipCode} onChange={(event) => updateField("motherResidenceZipCode", event.target.value)} placeholder="Zip code" />
                    <Input label="Occupation" value={formData.motherOccupation} onChange={(event) => updateField("motherOccupation", event.target.value)} placeholder="Occupation" />
                    <Input label="Phone Number" value={formData.motherPhone} onChange={(event) => updateField("motherPhone", event.target.value)} placeholder="Phone number" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Guardian Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Guardian&apos;s Name" value={formData.guardianName} onChange={(event) => updateField("guardianName", event.target.value)} placeholder="Full name" />
                    <Input label="Relationship to Student" value={formData.guardianRelationship} onChange={(event) => updateField("guardianRelationship", event.target.value)} placeholder="Aunt, uncle, etc." />
                    <Input label="Residence Street" value={formData.guardianResidenceStreet} onChange={(event) => updateField("guardianResidenceStreet", event.target.value)} placeholder="Street" />
                    <Input label="Barangay" value={formData.guardianResidenceBarangay} onChange={(event) => updateField("guardianResidenceBarangay", event.target.value)} placeholder="Barangay" />
                    <Input label="Town / City" value={formData.guardianResidenceCity} onChange={(event) => updateField("guardianResidenceCity", event.target.value)} placeholder="Town or city" />
                    <Input label="Province" value={formData.guardianResidenceProvince} onChange={(event) => updateField("guardianResidenceProvince", event.target.value)} placeholder="Province" />
                    <Input label="Zip Code" value={formData.guardianResidenceZipCode} onChange={(event) => updateField("guardianResidenceZipCode", event.target.value)} placeholder="Zip code" />
                    <Input label="Occupation" value={formData.guardianOccupation} onChange={(event) => updateField("guardianOccupation", event.target.value)} placeholder="Occupation" />
                    <Input label="Phone Number" value={formData.guardianPhone} onChange={(event) => updateField("guardianPhone", event.target.value)} placeholder="Phone number" />
                  </div>
                </div>
              </div>
            </SectionCard>
          </>
        );
      default:
        return (
          <>
            <SectionCard title="Scholarship Information" subtitle="Review any scholarship or financial assistance you are receiving." icon={BookOpen}>
              <div className="space-y-4">
                <RadioGroup
                  label='Are you currently enjoying other educational financial assistance?'
                  name="otherFinancialAssistance"
                  value={formData.otherFinancialAssistance}
                  onChange={(event) => updateField("otherFinancialAssistance", event.target.value)}
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                />
                {formData.otherFinancialAssistance === "Yes" ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input label="Scholarship / Assistance #1" value={formData.scholarshipAssistance1} onChange={(event) => updateField("scholarshipAssistance1", event.target.value)} error={errors.scholarshipAssistance1} placeholder="Program or sponsor" />
                    <Input label="Scholarship / Assistance #2" value={formData.scholarshipAssistance2} onChange={(event) => updateField("scholarshipAssistance2", event.target.value)} placeholder="Optional" />
                    <Input label="Scholarship / Assistance #3" value={formData.scholarshipAssistance3} onChange={(event) => updateField("scholarshipAssistance3", event.target.value)} placeholder="Optional" />
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard title="Review Details" subtitle="A quick summary before final submission." icon={Check}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Student</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formData.firstName || "-"} {formData.lastName || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formData.email || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Program</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formData.courseProgram || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Academic Period</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{activePeriodLabel}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Permanent Address</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{combinedPermanentAddress || "-"}</p>
                </div>
              </div>
            </SectionCard>
          </>
        );
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-3xl">
          <EmailVerification
            email={verificationEmail}
            onVerificationSuccess={() => {
              setTimeout(() => {
                onBackToLogin();
              }, 1500);
            }}
            onBackToLogin={onBackToLogin}
            onChangeEmail={() => setIsVerifying(false)}
          />
        </div>
      </div>
    );
  }

  const activePeriodLabel = activePeriod
    ? `${activePeriod.school_year} - ${activePeriod.semester}`
    : "No active academic period";

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-slate-100 md:flex-row">
      <aside className="relative order-1 overflow-hidden bg-gradient-to-br from-blue-800 to-indigo-900 p-5 text-white md:order-1 md:w-[34%] md:p-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full border-4 border-white/20" />
          <div className="absolute left-[-20px] bottom-[18%] h-20 w-20 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-lg font-bold tracking-wide">Nexus</span>
          </div>

          <div className="mt-6 space-y-3 md:mt-10 md:space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90 md:text-xs">Student Registration</p>
            <h2 className="max-w-xs text-2xl font-black leading-tight md:text-4xl">Create your student profile</h2>
            <p className="hidden max-w-sm text-sm leading-6 text-blue-100 md:block">
              Build a complete student record in one pass.
            </p>
          </div>

          <div className="mt-6 hidden space-y-4 rounded-2xl border border-white/10 bg-blue-900/20 p-4 backdrop-blur-md md:mt-8 md:block">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-200">Student ID</p>
              <p className="mt-1 text-xl font-black text-white md:text-2xl">
                {studentNumber || "Auto-generated if left blank"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200">Date Registered</p>
                <p className="mt-1 font-semibold text-white">{formData.dateRegistered}</p>
              </div>
              <div className="rounded-xl bg-black/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200">Academic Period</p>
                <p className="mt-1 font-semibold text-white">{activePeriodLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto hidden md:block">
            <p className="text-xs text-blue-100/80">The form is validated step-by-step for a smoother enrollment process.</p>
          </div>
        </div>
      </aside>

      <main className="order-1 flex-1 bg-white p-3 md:order-2 md:bg-slate-50 md:p-6 dark:bg-slate-900 dark:md:bg-slate-900">
        <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950 md:max-h-[92vh] md:rounded-3xl md:shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:px-6 md:py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Registration Form</p>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white md:text-lg">Student Information Record</h3>
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:px-6">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    className={`min-w-[84px] rounded-xl border px-2 py-2 text-left transition ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                        : isComplete
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-[0.22em]">{index + 1}</div>
                    <div className="mt-1 text-xs font-semibold">{step.title}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-5">
            <div className="space-y-3 md:space-y-4">{renderStepContent()}</div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
              {errors.submit ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle size={16} /> {errors.submit}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full gap-2 sm:w-auto">
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft size={16} /> Previous
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onBackToLogin}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-700"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving registration…" : "Complete Registration"}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentRegistrationForm;
