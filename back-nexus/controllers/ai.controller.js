import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// ---------------------------------------------------------------------------
// TensorFlow.js Universal Sentence Encoder — lazy-loaded fallback
// Loaded only when all Gemini models fail, so startup is not affected.
// ---------------------------------------------------------------------------
let _tf = null;
let _useModel = null;

const getTFInstances = async () => {
  if (!_useModel) {
    console.log("[Nexus AI] Loading TensorFlow.js fallback engine...");
    _tf = await import("@tensorflow/tfjs-node");
    const useLib =
      await import("@tensorflow-models/universal-sentence-encoder");
    _useModel = await useLib.default.load();
    console.log("[Nexus AI] TensorFlow.js fallback engine ready.");
  }
  return { tf: _tf, useModel: _useModel };
};

// ERP-aware knowledge base used for semantic matching
const KNOWLEDGE_BASE = [
  {
    questions: [
      "hello",
      "hi",
      "hey",
      "howdy",
      "good morning",
      "good afternoon",
      "good evening",
      "greetings",
    ],
    answer:
      "Hi there! I'm Nexus AI running in offline fallback mode. My main AI engine is temporarily unavailable, but I can help with basic Nexus ERP questions!",
  },
  {
    questions: [
      "how are you",
      "how are you doing",
      "how do you do",
      "what's up",
      "whats up",
    ],
    answer:
      "Doing my best in offline mode! My Gemini engine is temporarily down, but feel free to ask me anything about Nexus ERP.",
  },
  {
    questions: [
      "who are you",
      "what are you",
      "your name",
      "your identity",
      "are you ai",
      "are you a bot",
    ],
    answer:
      "I'm Nexus AI — your smart assistant built into the Nexus ERP system! I'm currently running in offline fallback mode (powered by TensorFlow.js), so my capabilities are limited.",
  },
  {
    questions: [
      "what is nexus",
      "what is nexus erp",
      "what does nexus do",
      "tell me about nexus",
      "describe nexus",
    ],
    answer:
      "Nexus is a comprehensive ERP platform built for colleges and universities. It covers academics, student management, grades, faculty, finance, scholarships, payroll, HR, library, LMS, and more!",
  },
  {
    questions: [
      "help",
      "what can you do",
      "your features",
      "capabilities",
      "how can you help",
    ],
    answer:
      "I can help you navigate the Nexus ERP system — enrollment, grades, payments, library, faculty schedules, and more. Currently in offline fallback mode, so for full AI conversation please try again soon!",
  },
  {
    questions: [
      "enrollment",
      "how to enroll",
      "how do i enroll",
      "student enrollment",
      "enroll student",
    ],
    answer:
      "To enroll students, go to Academic Management → Enrollment. Admin or Registrar roles can process enrollment for each academic period.",
  },
  {
    questions: [
      "grades",
      "how to enter grades",
      "grade entry",
      "submit grades",
      "faculty grades",
    ],
    answer:
      "Grades can be entered via Grades → Grade Entries. Faculty input and submit grades, which then go through an admin approval workflow.",
  },
  {
    questions: [
      "payment",
      "how to pay",
      "tuition payment",
      "billing",
      "invoice",
      "fees",
      "tuition",
    ],
    answer:
      "Payments and billing are in Finance & Accounting → Student Payments and Invoices. Students can view invoices, and accounting staff can process payments.",
  },
  {
    questions: [
      "library",
      "borrow book",
      "book borrowing",
      "return book",
      "library transaction",
    ],
    answer:
      "The Library module covers the book catalog, borrowing/return transactions, and lost/damage logs. Access it from the Library section in the sidebar.",
  },
  {
    questions: [
      "scholarship",
      "apply for scholarship",
      "scholarship application",
      "financial aid",
    ],
    answer:
      "Scholarships are under the Scholarships module. Students can apply, and admins manage types, eligibility, and beneficiaries.",
  },
  {
    questions: [
      "payroll",
      "salary",
      "payslip",
      "employee salary",
      "staff salary",
      "deduction",
    ],
    answer:
      "Payroll covers salary computation, deductions (SSS, PhilHealth, Pag-IBIG, Tax), and payslip generation — all under the Payroll module.",
  },
  {
    questions: [
      "faculty",
      "teacher",
      "professor",
      "faculty schedule",
      "faculty assignment",
    ],
    answer:
      "Faculty management includes profiles, course assignments, scheduling, advisory assignments, evaluations, and attendance — all under the Faculty Management section.",
  },
  {
    questions: [
      "lms",
      "learning management system",
      "course materials",
      "assignments",
      "discussions",
      "online class",
    ],
    answer:
      "The LMS module includes course materials, assignments, and discussions. Faculty can upload content and create assignments for students.",
  },
  {
    questions: [
      "announcement",
      "announcements",
      "school news",
      "news",
      "notice",
    ],
    answer:
      "Announcements are in the Communication section. Admins can post school-wide notices visible to all users.",
  },
  {
    questions: [
      "schedule",
      "timetable",
      "class schedule",
      "timetable builder",
      "build schedule",
    ],
    answer:
      "The Timetable Builder is under Academic Management. Admins can create class schedules, assign rooms, and manage time slots.",
  },
  {
    questions: [
      "admission",
      "admissions",
      "how to admit",
      "new student",
      "applicant",
    ],
    answer:
      "Admissions are under Academic Management → Admissions. Staff can process applications and accept or reject applicants.",
  },
  {
    questions: [
      "clearance",
      "student clearance",
      "get clearance",
      "clearance process",
    ],
    answer:
      "Student clearances are under Student Management → Clearance Processing. Each department marks clearance status before a student can get their credentials.",
  },
  {
    questions: [
      "user",
      "user management",
      "add user",
      "create account",
      "rbac",
      "roles",
      "permissions",
    ],
    answer:
      "User management and RBAC are under System → User Management and RBAC. Admins can create users and assign roles.",
  },
  {
    questions: [
      "report",
      "reports",
      "generate report",
      "analytics",
      "data report",
    ],
    answer:
      "Reports & Analytics covers student, faculty, financial, and library reports. Access them from the Reports section in the sidebar.",
  },
  {
    questions: ["rfid", "rfid card", "id card", "student id"],
    answer:
      "RFID integration is under System → RFID Integration. It supports card-based attendance and access management.",
  },
  {
    questions: [
      "thank you",
      "thanks",
      "thank u",
      "many thanks",
      "appreciate it",
    ],
    answer: "You're welcome! Let me know if you need anything else. 😊",
  },
  {
    questions: ["bye", "goodbye", "see you", "see ya", "farewell", "take care"],
    answer: "Goodbye! Come back anytime if you need help with Nexus ERP. 👋",
  },
  {
    questions:["code","give me a code","write a code"],
    answer:"Sorry, I can't help you with that. Please use large language model. Thank you."
  }
];

// Flatten into individual sentence–answer pairs for embedding
const KB_ENTRIES = KNOWLEDGE_BASE.flatMap(({ questions, answer }) =>
  questions.map((q) => ({ question: q, answer })),
);

// Cosine similarity between two float arrays
const cosineSimilarity = (a, b) => {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
};

// TensorFlow.js fallback: finds the closest knowledge-base answer
const tfFallbackResponse = async (message) => {
  try {
    const { useModel } = await getTFInstances();

    // Embed the user message + all KB questions in one batch
    const allSentences = [message, ...KB_ENTRIES.map((e) => e.question)];
    const embeddings = await useModel.embed(allSentences);
    const embArray = await embeddings.array();
    embeddings.dispose();

    const msgEmb = embArray[0];
    let bestScore = -1;
    let bestAnswer = null;

    for (let i = 1; i < embArray.length; i++) {
      const score = cosineSimilarity(msgEmb, embArray[i]);
      if (score > bestScore) {
        bestScore = score;
        bestAnswer = KB_ENTRIES[i - 1].answer;
      }
    }

    console.log(
      `[Nexus AI TF Fallback] Best similarity: ${bestScore.toFixed(3)}`,
    );

    const reply =
      bestScore >= 0.5
        ? bestAnswer
        : "I'm running in offline fallback mode and couldn't find a confident answer. " +
          "The main Nexus AI (Gemini) is temporarily unavailable. " +
          "Try asking about enrollment, grades, payments, library, faculty, or other Nexus ERP features!";

    return {
      reply,
      model:
        bestScore >= 0.5
          ? "tensorflow.js/universal-sentence-encoder"
          : "tensorflow.js/fallback",
    };
  } catch (tfErr) {
    console.error("[Nexus AI TF Fallback] Error:", tfErr.message);
    return {
      reply:
        "Nexus AI is temporarily unavailable. Please try again in a moment.",
      model: "offline",
    };
  }
};

// ---------------------------------------------------------------------------
// @google/genai uses the v1 API — all current Gemini models are available here
// Priority order: cheapest free-tier first, fallback on quota (429) or not-found (404)
const MODEL_PRIORITY = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// System prompt that gives Nexus AI its identity and context
const SYSTEM_PROMPT = `You are Nexus AI, a smart, friendly, and conversational AI assistant embedded inside the Nexus ERP system — a comprehensive Enterprise Resource Planning platform designed for colleges and universities.

You have two modes:
1. **ERP Assistant** — Help users navigate and understand the Nexus ERP system.
2. **General Assistant** — Engage in normal, helpful conversation on any topic (science, math,greetings, writing, jokes, advice, current events, etc.) just like a knowledgeable friend would.
3. **Coding help** - Dont give code to use if they are asking to give a code of anylanguage. Always tell them you dont know the they are talking. Tell them to used coding agents like claude, codex etc. 
You should NEVER refuse a normal conversation. If someone says "hi", chat with them. If they ask a general question, answer it fully and naturally. Only bring up Nexus ERP when it's relevant.

The Nexus ERP system includes the following modules:
- Academic Management: Admissions, Enrollment, Sections, Timetable Builder, Academic Calendar, Exam Setup & Scheduling, Class Capacity Monitor
- Student Management: Student Information, Student Records, Clearance Processing, Course Transfer, Academic History
- Grades: Grade Entries, Grade Management, Grade Computation Settings, Grade Entry Approval
- Faculty Management: Faculty Profiles, Course Assignments, Faculty Scheduling, Advisory Assignments, Faculty Evaluation, Staff Attendance, Staff Leave
- Courses & Curriculum: Department Management, Course Management, Program Offerings, Pre-requisite Setup
- Finance & Accounting: Student Payments, Invoices, Income & Expenses, Payment Gateway, Deductions
- Scholarships: Scholarship Types, Eligibility, Applications, Beneficiaries
- Payroll: Salary computation, Deductions (SSS, PhilHealth, Pag-IBIG, Tax), Payslips
- HR: Employee Records, Staff Attendance, Staff Leave Management
- Library: Book Catalog, Borrowing/Return Transactions, Lost & Damage Logs, Digital Library
- LMS (Learning Management System): Course Materials, Assignments, Discussions
- Communication: Announcements, Events, School Calendar, Public Events, Email/SMS Gateway, Absentee Alerts
- System: User Management, Role-Based Access Control (RBAC), System Logs, RFID Integration, ID Generator, General Settings
- Reports & Analytics: Student, Faculty, Financial, Library reports

User roles in the system:
- Admin: Full system access
- Faculty: Grades, schedules, LMS, attendance
- Student: Personal records, grades, LMS, library
- HR: People management, payroll
- Accounting: Finance, billing, scholarships
- Staff: Library, limited admin functions

Personality & Guidelines:
- Be warm, friendly, and natural — talk like a real person, not a robot
- Use casual language for casual questions, professional tone for technical ones
- Feel free to use humor, emojis, and personality when appropriate
- Answer ALL general questions fully (history, science, coding, math, advice, etc.)
- For Nexus ERP questions, explain features and how to find them in the system
- If asked who you are: you are "Nexus AI", built into the Nexus ERP system
- Keep responses concise but complete — don't over-explain unless asked`;

export const chatWithNexusAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "[Nexus AI] No GEMINI_API_KEY found — using TensorFlow.js fallback.",
      );
      const fallback = await tfFallbackResponse(message);
      return res.json(fallback);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build contents array: history + current user message
    const contents = [
      ...history.map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    // Try each model in priority order until one works
    let lastError = null;
    for (const modelName of MODEL_PRIORITY) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        });
        console.log(`[Nexus AI] Responded using ${modelName}`);
        return res.json({ reply: response.text, model: modelName });
      } catch (err) {
        const shouldSkip =
          err.status === 429 ||
          err.status === 404 ||
          err.message?.includes("429") ||
          err.message?.includes("404") ||
          err.message?.includes("quota") ||
          err.message?.includes("RESOURCE_EXHAUSTED") ||
          err.message?.includes("not found") ||
          err.message?.includes("Not Found");
        if (shouldSkip) {
          console.warn(
            `[Nexus AI] Skipping ${modelName} (${err.status ?? "error"}), trying next...`,
          );
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    // All Gemini models exhausted — fall back to TensorFlow.js
    console.warn(
      "[Nexus AI] All Gemini models exhausted — switching to TensorFlow.js fallback.",
    );
    const fallback = await tfFallbackResponse(message);
    return res.json(fallback);
  } catch (error) {
    console.error("Gemini AI error:", error);

    if (
      error.message?.includes("API_KEY_INVALID") ||
      error.message?.includes("API key")
    ) {
      return res.status(401).json({
        error:
          "Please wait while the model is loading, or contact support if the issue persists.",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to get AI response. Please try again." });
  }
};
