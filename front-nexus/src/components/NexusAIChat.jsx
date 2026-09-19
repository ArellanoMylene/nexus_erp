// src/components/NexusAIChat.jsx
// Powered by Google Gemini 1.5 Flash via backend API
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  ChevronDown,
  Minimize2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.254.102:5000";

// ─────────────────────────────────────────────
//  KB kept only as offline fallback (Gemini API is primary)
// ─────────────────────────────────────────────
const KB = [
  // ── Greetings ──
  {
    patterns: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "sup",
      "greetings",
    ],
    responses: [
      "Hello! 👋 I'm **Nexus AI**, your smart assistant for the Nexus ERP system. How can I help you today?",
      "Hey there! 😊 I'm **Nexus AI**. Ask me anything about the Nexus ERP system and I'll do my best to help!",
      "Hi! Great to see you. I'm **Nexus AI**, here to guide you through all things Nexus ERP. What would you like to know?",
    ],
  },

  // ── What is Nexus ERP ──
  {
    patterns: [
      "what is nexus",
      "what is this system",
      "about nexus",
      "nexus erp",
      "about the system",
      "tell me about nexus",
    ],
    responses: [
      "**Nexus ERP** is a comprehensive Enterprise Resource Planning system designed specifically for higher education institutions (colleges and universities).\n\nIt covers everything from **student admissions**, **enrollment**, **grade management**, **faculty scheduling**, **payroll**, **library**, **accounting**, and much more — all in one unified platform.",
    ],
  },

  // ── Modules overview ──
  {
    patterns: [
      "modules",
      "features",
      "what can nexus do",
      "capabilities",
      "functions",
      "what does nexus offer",
    ],
    responses: [
      "Nexus ERP includes the following core modules:\n\n **Academic** – Admissions, Enrollment, Grades, Sections, Courses\n👥 **People** – Students, Faculty, Staff, HR, Employee Records\n💰 **Finance** – Accounting, Payroll, Payments, Invoices, Scholarships\n📖 **Library** – Books, Transactions, Lost/Damage Logs\n🖥️ **LMS** – Materials, Assignments, Discussions\n📅 **Scheduling** – Timetables, Exams, Academic Calendar\n📊 **Reports** – Student, Faculty, and Financial Reports\n⚙️ **System** – RBAC, Settings, RFID, Email/SMS Gateway\n\nWhich module would you like to know more about?",
    ],
  },

  // ── Admissions ──
  {
    patterns: ["admission", "admissions", "apply", "applicant", "application"],
    responses: [
      "The **Admissions** module in Nexus ERP allows administrators to:\n\n• Manage incoming student applications\n• Track application statuses (Pending, Under Review, Accepted, Rejected, Enrolled)\n• Search and filter applicants\n• View full applicant profiles\n• Convert accepted applicants to enrolled students\n\nYou can access it from the sidebar under **Students → Admissions**.",
    ],
  },

  // ── Enrollment ──
  {
    patterns: [
      "enrollment",
      "enroll",
      "enrolled",
      "registration",
      "register student",
    ],
    responses: [
      "The **Enrollment** module lets administrators and staff:\n\n• View and manage student enrollment records\n• Enroll students into courses and sections\n• Monitor enrollment statuses\n• Handle course transfers\n• Generate enrollment reports\n\nNavigate to **Students → Enrollment Records** in the sidebar.",
    ],
  },

  // ── Students ──
  {
    patterns: [
      "student",
      "students",
      "student management",
      "student info",
      "student records",
    ],
    responses: [
      "Nexus ERP has robust **Student Management** features:\n\n🎓 **Student Information** – Full profiles, contact info, academic history\n📋 **Student Management** – Status tracking, academic standing\n📝 **Admissions** – Application processing\n📌 **Enrollment** – Course enrollment tracking\n📊 **Grades** – GPA, grade entries, grade history\n✅ **Clearances** – Clearance processing per semester\n\nAll accessible from the **Students** section in the sidebar.",
    ],
  },

  // ── Grades ──
  {
    patterns: [
      "grade",
      "grades",
      "grading",
      "gpa",
      "grade entry",
      "grade computation",
      "academic records",
    ],
    responses: [
      "The **Grades** module in Nexus ERP includes:\n\n• **Grade Entries** – Faculty input grades per course section\n• **Grade Management** – Admin oversight and approval\n• **Grade Computation Settings** – Configure grading formulas\n• **Grade Entry Approval** – Workflow for verifying submitted grades\n• **Academic History** – Historical GPA and transcript data\n\nFaculty can encode grades, and admins can review and approve them.",
    ],
  },

  // ── Faculty ──
  {
    patterns: [
      "faculty",
      "teacher",
      "instructor",
      "professor",
      "teaching staff",
    ],
    responses: [
      "The **Faculty Management** module covers:\n\n **Faculty Profiles** – Personal and academic credentials\n📘 **Course Assignments** – Assign faculty to courses/sections\n🗓️ **Faculty Scheduling** – Timetable and class schedules\n📋 **Advisory Assignment** – Assign advisers to student groups\n⭐ **Faculty Evaluation** – Student feedback and evaluations\n📅 **Attendance** – Staff attendance tracking\n🏖️ **Leave Management** – Staff leave requests\n\nAccessible from the **Faculty** section in the admin sidebar.",
    ],
  },

  // ── Courses / Curriculum ──
  {
    patterns: [
      "course",
      "courses",
      "curriculum",
      "subject",
      "subjects",
      "program",
      "programs",
      "department",
    ],
    responses: [
      "Nexus ERP manages the full academic curriculum:\n\n **Department Management** – Organize colleges and departments\n📚 **Course Management** – Add/edit courses, units, descriptions\n📋 **Program Offerings** – Define degree programs with course maps\n🔗 **Pre-requisite Setup** – Configure course pre-requisite chains\n📐 **Sections** – Manage class sections per course\n🕒 **Timetable Builder** – Automated schedule generation\n\nFound in the **Courses & Curriculum** menu.",
    ],
  },

  // ── Scheduling ──
  {
    patterns: [
      "schedule",
      "scheduling",
      "timetable",
      "class schedule",
      "exam schedule",
    ],
    responses: [
      "The **Scheduling** module includes:\n\n **Timetable Builder** – Drag-and-drop class schedule builder\n📅 **Academic Calendar** – Mark holidays, semester dates, events\n🎓 **Exam Schedule Builder** – Plan midterm and final exams\n📊 **Class Capacity Monitor** – Track room and section limits\n🏫 **School Calendar** – Public academic calendar management\n\nThis helps avoid conflicts and ensures efficient resource use.",
    ],
  },

  // ── Accounting / Finance ──
  {
    patterns: [
      "accounting",
      "finance",
      "payment",
      "payments",
      "invoice",
      "invoices",
      "billing",
      "fees",
      "tuition",
    ],
    responses: [
      "The **Accounting & Finance** module handles:\n\n **Student Payments** – Record and track fee payments\n🧾 **Invoices** – Generate student billing invoices\n💼 **Income & Expenses** – School financial records\n🏦 **Payment Gateway** – Online payment integration\n📉 **Deductions** – Track scholarship deductions from fees\n\nManaged under the **Accounting** role in Nexus ERP.",
    ],
  },

  // ── Payroll ──
  {
    patterns: ["payroll", "salary", "compensation", "wage", "wages"],
    responses: [
      "The **Payroll** module in Nexus ERP allows HR and Accounting to:\n\n• Generate payroll for all employee categories\n• Apply deductions (tax, SSS, PhilHealth, Pag-IBIG)\n• Track salary history\n• Manage employee benefits and allowances\n• Print payslips\n\nAccessible by users with **HR** or **Accounting** roles.",
    ],
  },

  // ── HR / Employee Records ──
  {
    patterns: [
      "hr",
      "human resource",
      "employee",
      "employees",
      "staff",
      "personnel",
      "staff leave",
      "leave",
    ],
    responses: [
      "The **HR (Human Resources)** module provides:\n\n **Employee Records** – Full employee profiles and contracts\n📅 **Staff Attendance** – Daily attendance monitoring\n🏖️ **Staff Leave** – Leave applications and approvals\n💰 **Payroll** – Salary computation and release\n📊 **Reports** – HR analytics and reports\n\nAdministrators and HR officers can manage all personnel data here.",
    ],
  },

  // ── Library ──
  {
    patterns: [
      "library",
      "book",
      "books",
      "borrow",
      "return",
      "library transaction",
      "lost book",
    ],
    responses: [
      "The **Library Management** module includes:\n\n **Book Catalog** – Manage all library books and resources\n🔄 **Library Transactions** – Track borrowed and returned books\n⚠️ **Lost & Damage Logs** – Record incidents and compute fines\n🔍 **Digital Library** – Access to digital resources\n📊 **Library Reports** – Usage statistics and overdue reports\n\nBoth students and staff can interact with the library system.",
    ],
  },

  // ── LMS ──
  {
    patterns: [
      "lms",
      "learning management",
      "materials",
      "assignment",
      "assignments",
      "discussion",
      "discussions",
      "online learning",
    ],
    responses: [
      "The **LMS (Learning Management System)** module enables:\n\n **Course Materials** – Faculty upload lecture notes, PDFs, videos\n📝 **Assignments** – Create, submit, and grade assignments online\n💬 **Discussions** – Forum-style discussions per class\n📊 **Student Progress** – Track completion and grades\n\nFaculty and students interact through their respective dashboards.",
    ],
  },

  // ── Scholarships ──
  {
    patterns: [
      "scholarship",
      "scholarships",
      "financial aid",
      "grant",
      "grants",
      "beneficiary",
    ],
    responses: [
      "The **Scholarship Management** module supports:\n\n **Scholarship Types** – Define different scholarship categories\n✅ **Eligibility** – Set GPA and requirement criteria\n📋 **Applications** – Students apply for scholarships\n🏅 **Beneficiaries** – Track current scholarship recipients\n💰 **Deductions** – Auto-apply scholarship discounts to fees\n\nAccessible from **Finance → Scholarships** in the admin menu.",
    ],
  },

  // ── Clearances ──
  {
    patterns: ["clearance", "clearances"],
    responses: [
      "The **Clearance** module manages student clearance processing:\n\n• Students request clearance at end of semester\n• Department offices sign off (Library, Finance, Registrar, etc.)\n• Admin monitors overall clearance status\n• Clearance is required before grade release or enrollment\n\nFound under **Students → Clearance Processing**.",
    ],
  },

  

  // ── Attendance ──
  {
    patterns: [
      "attendance",
      "absent",
      "absentee",
      "present",
      "mark attendance",
    ],
    responses: [
      "Nexus ERP has comprehensive **Attendance Tracking**:\n\n **Student Attendance** – Mark per class session by faculty\n👔 **Staff Attendance** – HR tracks employee daily attendance\n🔔 **Absentee Alerts** – Auto-notify when students miss too many classes\n📊 **Attendance Reports** – Detailed logs and summary reports\n🪪 **RFID Integration** – Automate tap-in/tap-out attendance\n\nAccessible from both Admin and Faculty dashboards.",
    ],
  },

  // ── Reports ──
  {
    patterns: ["report", "reports", "analytics", "statistics", "data"],
    responses: [
      "Nexus ERP offers powerful **Reporting & Analytics**:\n\n **Student Reports** – Enrollment, grades, attendance stats\n👩‍🏫 **Faculty Reports** – Teaching load, evaluations\n💰 **Financial Reports** – Revenue, expenses, payroll summaries\n📚 **Library Reports** – Book circulation statistics\n🔍 **System Logs** – Audit trails and system activity\n\nMost modules have built-in export options (PDF, Excel).",
    ],
  },

  // ── RBAC / Roles ──
  {
    patterns: [
      "rbac",
      "roles",
      "permissions",
      "access",
      "access control",
      "user roles",
      "role",
    ],
    responses: [
      "Nexus ERP uses **Role-Based Access Control (RBAC)**:\n\n **Admin** – Full system access\n **HR** – People management, payroll\n🟡 **Accounting** – Finance, billing, scholarships\n🟢 **Faculty** – Grades, schedules, LMS, attendance\n🔵 **Student** – Personal records, grades, LMS, library\n⚪ **Staff** – Library, limited admin functions\n\nAdmins can configure permissions per role from **System → User Management**.",
    ],
  },

  // ── User Management ──
  {
    patterns: [
      "user management",
      "manage users",
      "create user",
      "add user",
      "delete user",
      "user account",
    ],
    responses: [
      "The **User Management** module lets Admins:\n\n• View all users (students, faculty, staff, admin)\n• Create new employee accounts\n• Reset passwords and update profiles\n• Assign and modify user roles\n• Configure RBAC permissions per role\n• Deactivate or delete user accounts\n\nGo to **System → Manage Users** in the admin sidebar.",
    ],
  },

  // ── Settings ──
  {
    patterns: [
      "settings",
      "general settings",
      "system settings",
      "configure",
      "configuration",
    ],
    responses: [
      "The **System Settings** in Nexus ERP allow you to:\n\n• Set school/institution name and logo\n• Configure academic year and semester\n• Manage grading scales and computation formulas\n• Set up email/SMS gateway credentials\n• Configure system-wide preferences\n\nFound under **System → General Settings** in the admin sidebar.",
    ],
  },


  // ── How to login ──
  {
    patterns: [
      "login",
      "log in",
      "sign in",
      "how to login",
      "forgot password",
      "password",
    ],
    responses: [
      "To **login** to Nexus ERP:\n\n1. Go to the login page\n2. Enter your **University ID** or **Email**\n3. Enter your **Password**\n4. Click **Sign In**\n\nYour role determines what you'll see after logging in. If you forgot your password, contact your **system administrator** to reset it.",
    ],
  },

  // ── Dashboard ──
  {
    patterns: ["dashboard", "home", "overview", "main page"],
    responses: [
      "The **Admin Dashboard** provides a real-time overview of:\n\n **Key Performance Indicators** – Total students, courses, faculty, pending admissions\n📋 **Recent System Activity** – Latest enrollments, admissions, and clearances\n📅 **Upcoming Events Calendar** – View important academic dates\n\nIt's your central command center for monitoring the institution's operations.",
    ],
  },

  // ── Announcements / Events ──
  {
    patterns: [
      "announcement",
      "announcements",
      "event",
      "events",
      "public event",
      "news",
    ],
    responses: [
      "Nexus ERP supports institutional communication:\n\n **Announcements** – Post notices for students and faculty\n📅 **Event Scheduling** – Plan and manage school events\n🌐 **Public Event Posting** – Events visible on the public portal\n📆 **School Calendar** – Academic calendar with key dates\n\nKeep your community informed and engaged through these tools.",
    ],
  },

  // ── System Logs ──
  {
    patterns: ["system log", "logs", "audit", "audit trail", "activity log"],
    responses: [
      "The **System Logs** module provides a full **audit trail** of all user actions in Nexus ERP:\n\n• Who performed what action\n• Timestamp of every system event\n• Filter logs by user, action type, or date\n\nThis helps admins track changes, investigate issues, and ensure accountability. Go to **System → System Logs**.",
    ],
  },

  // ── Syllabus ──
  {
    patterns: ["syllabus", "syllabi", "course outline", "lesson plan"],
    responses: [
      "The **Syllabus Repository** in Nexus ERP allows:\n\n• Faculty to upload course syllabi and outlines\n• Admins to review and manage uploaded files\n• Students to access their course syllabi\n• Organize by department, course, and academic year\n\nSupports multiple file formats like PDF and DOCX.",
    ],
  },

  // ── ID Generator ──
  {
    patterns: ["id generator", "id card", "generate id", "student id"],
    responses: [
      "The **ID Generator** module lets admins:\n\n• Design and generate student/employee ID cards\n• Include photos, QR codes, and RFID chip details\n• Bulk generate IDs for new enrollees\n• Print-ready card layouts\n\nFound under **System → ID Generator** in the admin panel.",
    ],
  },

  // ── Exams ──
  {
    patterns: [
      "exam",
      "exams",
      "examination",
      "midterm",
      "final exam",
      "exam setup",
    ],
    responses: [
      "The **Exam Management** module covers:\n\n **Exam Setup** – Create and configure exam parameters\n📅 **Exam Schedule Builder** – Set exam dates, rooms, and invigilators\n📊 **Grade Integration** – Exam scores feed directly into grade computation\n\nFaculty and admins collaborate to ensure smooth examination periods.",
    ],
  },

  // ── Academic Year / Semester ──
  {
    patterns: [
      "academic year",
      "semester",
      "academic period",
      "school year",
      "term",
    ],
    responses: [
      "The **Academic Periods** module manages:\n\n **School Year Setup** – Define academic year start/end dates\n🗓️ **Semester Management** – Configure First, Second, and Summer terms\n✅ **Active Period** – Set the current active enrollment period\n🔒 **Period Locking** – Lock grades and records after semester ends\n\nAll enrollment and grade activities are linked to an active academic period.",
    ],
  },

  // ── Inventory / Assets ──
  {
    patterns: ["inventory", "asset", "assets", "equipment", "property"],
    responses: [
      "The **Inventory & Asset Management** module helps track:\n\n **IT Equipment** – Computers, projectors, lab devices\n🏫 **Furniture & Fixtures** – Classroom and office assets\n📦 **Supply Inventory** – Consumable supplies stock\n🔧 **Maintenance Logs** – Track repairs and maintenance\n\nHelps the institution maintain accurate records of all school property.",
    ],
  },

  // ── Nexus AI itself ──
  {
    patterns: [
      "who are you",
      "what are you",
      "are you ai",
      "are you a bot",
      "nexus ai",
      "your name",
      "what is your name",
    ],
    responses: [
      "I'm **Nexus AI**  — your intelligent assistant built into the Nexus ERP system!\n\nI'm here to help you navigate the system, understand how modules work, and answer any questions about Nexus ERP. Feel free to ask me anything!",
    ],
  },

  // ── Thanks ──
  {
    patterns: [
      "thank",
      "thanks",
      "thank you",
      "ty",
      "awesome",
      "great",
      "nice",
      "perfect",
      "helpful",
    ],
    responses: [
      "You're welcome!  Is there anything else I can help you with?",
      "Glad I could help! Let me know if you have more questions about Nexus ERP.",
      "Anytime! Don't hesitate to ask if you need more guidance. ",
    ],
  },

  // ── Bye ──
  {
    patterns: ["bye", "goodbye", "see you", "take care", "later", "exit"],
    responses: [
      "Goodbye!  Come back anytime if you need help with Nexus ERP. Have a great day!",
      "See you later! Don't hesitate to return if you have more questions. Take care!",
    ],
  },

  // ── Help ──
  {
    patterns: [
      "help",
      "what can you do",
      "how can you help",
      "guide",
      "support",
    ],
    responses: [
      "I can help you with anything related to **Nexus ERP**! Here are some topics you can ask about:\n\n• 📚 Modules (Admissions, Enrollment, Grades, etc.)\n• 👥 User roles and permissions\n• 💰 Finance, Payroll, and Scholarships\n• 🗓️ Scheduling and Academic Calendar\n• 📖 Library Management\n• 🖥️ LMS and Online Learning\n• ⚙️ System Settings and Configuration\n\nJust type your question and I'll answer it! 😊",
    ],
  },
  {
    patterns:[
      "code",
      "give me code",
      "help me to write code",
      "I'm sorry about that. I can't provide your request. If you really want that, Please use large language Model like Chatgpt,Claude. Thank you"
    ]
  }
];

// ─────────────────────────────────────────────
//  API CALL — Google Gemini 1.5 Flash via backend
// ─────────────────────────────────────────────
async function fetchAIResponse(message, history) {
  const { data } = await axios.post(`${API_BASE}/api/ai/chat`, {
    message,
    history,
  });
  return data.reply;
}

// ─────────────────────────────────────────────
//  RENDER MARKDOWN-LIKE formatting (bold, newlines, bullets)
// ─────────────────────────────────────────────
function formatMessage(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Split line by **bold**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
    );
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function NexusAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Hi there!  I'm **Nexus AI**, your assistant for the **Nexus ERP** system. Ask me anything about the system's modules, features, or how to use them!",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnread(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => setIsMinimized((p) => !p);

  const sendMessage = async (overrideText) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      time: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      // Store updated list in a ref so we can pass history
      historyRef.current = updated;
      return updated;
    });
    setInput("");
    setIsTyping(true);

    try {
      // Build history excluding the welcome message (index 0) and current user msg
      const history = historyRef.current
        .slice(1, -1) // skip first AI greeting + the just-added user msg
        .map((m) => ({ role: m.role, text: m.text }));

      const aiText = await fetchAIResponse(trimmed, history);
      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: aiText,
        time: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, aiMsg];
        historyRef.current = updated;
        return updated;
      });
      if (!isOpen || isMinimized) setUnread((u) => u + 1);
    } catch (err) {
      const errText =
        err?.response?.data?.error || "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: `⚠️ ${errText}`,
          time: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Suggested quick prompts
  const suggestions = [
    "What is Nexus ERP?",
    "Show me all modules",
    "How does enrollment work?",
    "Tell me about grading",
  ];

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="Open Nexus AI Chat"
        >
          <MessageCircle size={26} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? "h-[56px]" : "h-[520px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold leading-none">Nexus AI</p>
                  {/*  <span className="flex items-center gap-0.5 text-[9px] bg-white/20 rounded-full px-1.5 py-0.5">
                    <Sparkles size={9} /> Gemini
                  </span> */}
                </div>
                <p className="text-[10px] text-indigo-200 mt-0.5 leading-none">
                  {isTyping ? "thinking..." : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-1.5 rounded-md hover:bg-white/20 transition"
                aria-label="Minimize"
              >
                {isMinimized ? (
                  <ChevronDown size={16} className="rotate-180" />
                ) : (
                  <Minimize2 size={15} />
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-white/20 transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 text-sm">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mb-1">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {formatMessage(msg.text)}
                      </div>
                      <p
                        className={`text-[10px] text-gray-400 mt-1 ${
                          msg.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(msg.time)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Bot size={14} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick Suggestions (only when 1 message) */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      disabled={isTyping}
                      className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="px-3 py-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Nexus ERP..."
                  className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Send"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
