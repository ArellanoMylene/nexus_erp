/* import LMSAssignments from "../model/lmsAssignments.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runTensorFlowAiCheck, initializeTensorFlow } from "../services/aiChecker.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AiCheckError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fetchSubmissionForAi = async ({ submissionId, assignmentId, studentId }) => {
  const db = (await import("../config/db.js")).default;
  let submission = null;

  if (submissionId) {
    const [rows] = await db.query(
      `SELECT las.*, la.total_points, la.title, la.model_answer
       FROM lms_assignment_submissions las
       JOIN lms_assignments la ON las.assignment_id = la.id
       WHERE las.id = ?`,
      [submissionId]
    );
    submission = rows[0] || null;
  }

  if (!submission && assignmentId && studentId) {
    const [rows] = await db.query(
      `SELECT las.*, la.total_points, la.title, la.model_answer
       FROM lms_assignment_submissions las
       JOIN lms_assignments la ON las.assignment_id = la.id
       WHERE las.assignment_id = ? AND las.student_id = ?`,
      [assignmentId, studentId]
    );
    submission = rows[0] || null;
  }

  return submission;
};

const extractSubmissionText = async (submission) => {
  let studentText = submission.submission_text || "";

  if (submission.file_url) {
    const filePath = path.join(__dirname, "../public", submission.file_url);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(submission.file_name || submission.file_url).toLowerCase();
      try {
        if (ext === ".pdf") {
          const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
          const buffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(buffer);
          studentText = pdfData.text || studentText;
        } else if (ext === ".docx" || ext === ".doc") {
          const mammoth = (await import("mammoth")).default;
          const result = await mammoth.extractRawText({ path: filePath });
          studentText = result.value || studentText;
        }
      } catch (parseErr) {
        console.warn("[AI Check] Could not parse file, using text fallback:", parseErr.message);
      }
    }
  }

  return studentText;
};

const runAiCheck = async ({ submission, modelAnswer }) => {
  if (!modelAnswer || !modelAnswer.trim()) {
    throw new AiCheckError(400, "Model answer is required for AI checking");
  }

  const studentText = await extractSubmissionText(submission);

  if (!studentText.trim()) {
    throw new AiCheckError(400, "No readable content found in the submission");
  }

  const totalPoints = submission.total_points || 100;

  try {
    // Initialize TensorFlow/USE model
    await initializeTensorFlow();

    // Run TensorFlow-based AI check with semantic similarity, keyword matching, and completeness
    const aiResult = await runTensorFlowAiCheck({
      submission: { submission_text: studentText },
      modelAnswer,
      totalPoints,
    });

    console.log("[AI Check] Used TensorFlow Universal Sentence Encoder for analysis");
    return aiResult;
  } catch (error) {
    console.error("[AI Check] Error during TensorFlow analysis:", error);
    throw new AiCheckError(
      500,
      "AI checker encountered an error. Please try again or grade manually."
    );
  }
};

const lmsAssignmentsController = {
  // Create new assignment
  create: async (req, res) => {
    try {
      const assignmentData = req.body;
      const assignmentId = await LMSAssignments.create(assignmentData);

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignmentId,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
        error: error.message,
      });
    }
  },
  

  // Get assignments by faculty
  getByFaculty: async (req, res) => {
    try {
      const { faculty_id, academic_period_id } = req.query;

      if (!faculty_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Faculty ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getByFaculty(
        faculty_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignments for a student based on their enrolled courses
  getByStudent: async (req, res) => {
    try {
      const { student_id, academic_period_id } = req.query;

      if (!student_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getByStudent(
        student_id,
        academic_period_id
      );

      console.log(`[DEBUG] getByStudent results for student ${student_id}:`, assignments);

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignments by section
  getBySection: async (req, res) => {
    try {
      const { section_id, academic_period_id } = req.query;

      if (!section_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Section ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getBySection(
        section_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignment by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await LMSAssignments.getById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        assignment,
      });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignment",
        error: error.message,
      });
    }
  },

  // Update assignment
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await LMSAssignments.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Assignment updated successfully",
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update assignment",
        error: error.message,
      });
    }
  },

  // Delete assignment
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await LMSAssignments.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete assignment",
        error: error.message,
      });
    }
  },

  // Submit assignment / quiz
  submitAssignment: async (req, res) => {
    try {
      const submissionData = req.body;
      const { assignment_id, submission_text } = submissionData;

      // Check if it's a quiz to grade it automatically
      const assignment = await LMSAssignments.getById(assignment_id);

      let score = null;
      let feedback = null;
      let status = 'submitted';

      if (assignment && assignment.assignment_type === 'quiz') {
        const questions = await LMSAssignments.getQuizQuestionsWithAnswers(assignment_id);
        const studentAnswers = JSON.parse(submission_text || "{}");

        let calculatedScore = 0;
        // let totalPoints = 0; // If we want to validate total points

        questions.forEach(q => {
          // totalPoints += q.points;
          if (studentAnswers[q.id] === q.correct_answer) {
            calculatedScore += q.points;
          }
        });

        score = calculatedScore;
        status = 'completed'; // Quizzes are completed instantly

        // Add score and status to submission data
        // We'll update the submission with these values
      }

      const submissionId = await LMSAssignments.submitAssignment({
        ...submissionData,
        status: status
      });

      // If graded, update the score immediately
      if (score !== null) {
        await LMSAssignments.gradeSubmission(submissionId, {
          score,
          feedback: 'Auto-graded quiz',
          graded_by: submissionData.student_id // Or system user ID if available
        });
      } else if (assignment?.model_answer?.trim()) {
        try {
          const submission = await fetchSubmissionForAi({ submissionId });
          if (submission) {
            const aiResult = await runAiCheck({
              submission,
              modelAnswer: assignment.model_answer,
            });

            await LMSAssignments.gradeSubmission(submissionId, {
              score: aiResult.score,
              feedback: aiResult.feedback,
              graded_by: null,
            });

            score = aiResult.score;
            feedback = aiResult.feedback;
          }
        } catch (error) {
          const message = error instanceof AiCheckError ? error.message : error.message || error;
          console.warn("[AI Check] Auto-grading skipped:", message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Assignment submitted successfully",
        submissionId,
        score, // Return score to student
        feedback,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit assignment",
        error: error.message,
      });
    }
  },

  // Get submissions
  getSubmissions: async (req, res) => {
    try {
      const { assignment_id } = req.params;

      const submissions = await LMSAssignments.getSubmissions(assignment_id);

      res.status(200).json({
        success: true,
        submissions,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch submissions",
        error: error.message,
      });
    }
  },

  // Grade submission
  gradeSubmission: async (req, res) => {
    try {
      const { submission_id } = req.params;
      const gradeData = req.body;

      const graded = await LMSAssignments.gradeSubmission(submission_id, gradeData);

      if (!graded) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Submission graded successfully",
      });
    } catch (error) {
      console.error("Error grading submission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to grade submission",
        error: error.message,
      });
    }
  },

  // Get student submission
  getStudentSubmission: async (req, res) => {
    try {
      const { assignment_id, student_id } = req.query;

      if (!assignment_id || !student_id) {
        return res.status(400).json({
          success: false,
          message: "Assignment ID and Student ID are required",
        });
      }

      const submission = await LMSAssignments.getStudentSubmission(
        assignment_id,
        student_id
      );

      res.status(200).json({
        success: true,
        submission,
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch submission",
        error: error.message,
      });
    }
  },

  // Create quiz question
  createQuizQuestion: async (req, res) => {
    try {
      const questionData = req.body;

      const questionId = await LMSAssignments.createQuizQuestion(questionData);

      res.status(201).json({
        success: true,
        message: "Quiz question created successfully",
        questionId,
      });
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create quiz question",
        error: error.message,
      });
    }
  },

  // Get quiz questions
  getQuizQuestions: async (req, res) => {
    try {
      const { assignment_id } = req.params;

      const questions = await LMSAssignments.getQuizQuestions(assignment_id);

      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quiz questions",
        error: error.message,
      });
    }
  },

  // Get quiz review (questions with answers, ONLY if submitted)
  getQuizReview: async (req, res) => {
    try {
      const { assignment_id } = req.params;
      const { student_id } = req.query;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID is required",
        });
      }

      // 1. Check if student has submitted
      // Note: Model parameter order is (assignment_id, student_id) based on previous view
      const submission = await LMSAssignments.getStudentSubmission(assignment_id, student_id);

      // Check for valid status variants
      if (!submission || (submission.status !== 'submitted' && submission.status !== 'graded' && submission.status !== 'completed')) {
        return res.status(403).json({
          success: false,
          message: "You must submit the quiz before reviewing results.",
        });
      }

      // 2. Fetch questions WITH answers
      const questions = await LMSAssignments.getQuizQuestionsWithAnswers(assignment_id);

      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching quiz review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quiz review",
        error: error.message,
      });
    }
  },

  // Upload assignment file
  uploadFile: async (req, res) => {
    try {
      const { file_base64, file_name } = req.body;

      if (!file_base64 || !file_name) {
        return res.status(400).json({
          success: false,
          message: "File content and name are required",
        });
      }

      // Remove header if present (e.g., "data:application/pdf;base64,")
      const base64Data = file_base64.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const uploadDir = path.join(__dirname, "../public/uploads/assignments");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create unique filename
      const uniqueFilename = `${Date.now()}-${file_name.replace(/\s+/g, "-")}`;
      const filepath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filepath, buffer);

      const fileUrl = `/uploads/assignments/${uniqueFilename}`;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file_url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  },
  // AI-assisted check of a student submission against a model answer
  aiCheckSubmission: async (req, res) => {
    try {
      const { submission_id } = req.params;
      const { model_answer, assignment_id, student_id } = req.body;

      const submission = await fetchSubmissionForAi({
        submissionId: submission_id,
        assignmentId: assignment_id,
        studentId: student_id,
      });

      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      const modelAnswer = model_answer?.trim() || submission.model_answer;
      const aiResult = await runAiCheck({ submission, modelAnswer });

      return res.json({
        success: true,
        score: aiResult.score,
        feedback: aiResult.feedback,
      });
    } catch (error) {
      console.error("Error in AI check submission:", error);
      const status = error instanceof AiCheckError ? error.status : 500;
      res.status(status).json({
        success: false,
        message:
          error instanceof AiCheckError
            ? error.message
            : "Failed to perform AI check",
        error: error.message,
      });
    }
  },
};

export default lmsAssignmentsController;
 */
import LMSAssignments from "../model/lmsAssignments.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runTensorFlowAiCheck, initializeTensorFlow } from "../services/aiChecker.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AiCheckError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fetchSubmissionForAi = async ({ submissionId, assignmentId, studentId }) => {
  const db = (await import("../config/db.js")).default;
  let submission = null;

  if (submissionId) {
    const [rows] = await db.query(
      `SELECT las.*, la.total_points, la.title, la.model_answer
       FROM lms_assignment_submissions las
       JOIN lms_assignments la ON las.assignment_id = la.id
       WHERE las.id = ?`,
      [submissionId]
    );
    submission = rows[0] || null;
  }

  if (!submission && assignmentId && studentId) {
    const [rows] = await db.query(
      `SELECT las.*, la.total_points, la.title, la.model_answer
       FROM lms_assignment_submissions las
       JOIN lms_assignments la ON las.assignment_id = la.id
       WHERE las.assignment_id = ? AND las.student_id = ?`,
      [assignmentId, studentId]
    );
    submission = rows[0] || null;
  }

  return submission;
};

const extractSubmissionText = async (submission) => {
  let studentText = submission.submission_text || "";

  if (submission.file_url) {
    const filePath = path.join(__dirname, "../public", submission.file_url);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(submission.file_name || submission.file_url).toLowerCase();
      try {
        if (ext === ".pdf") {
          const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
          const buffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(buffer);
          studentText = pdfData.text || studentText;
        } else if (ext === ".docx" || ext === ".doc") {
          const mammoth = (await import("mammoth")).default;
          const result = await mammoth.extractRawText({ path: filePath });
          studentText = result.value || studentText;
        }
      } catch (parseErr) {
        console.warn("[AI Check] Could not parse file, using text fallback:", parseErr.message);
      }
    }
  }

  return studentText;
};

const runAiCheck = async ({ submission, modelAnswer, modelAnswerFileUrl }) => {
  let finalModelAnswer = modelAnswer || "";

  // ✅ Extract text from model answer file if provided
  if (modelAnswerFileUrl) {
    const filePath = path.join(__dirname, "../public", modelAnswerFileUrl);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(modelAnswerFileUrl).toLowerCase();
      try {
        if (ext === ".pdf") {
          const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
          const buffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(buffer);
          finalModelAnswer = pdfData.text || finalModelAnswer;
        } else if (ext === ".docx" || ext === ".doc") {
          const mammoth = (await import("mammoth")).default;
          const result = await mammoth.extractRawText({ path: filePath });
          finalModelAnswer = result.value || finalModelAnswer;
        }
      } catch (err) {
        console.warn("[AI Check] Could not parse model answer file:", err.message);
      }
    }
  }

  if (!finalModelAnswer.trim()) {
    throw new AiCheckError(400, "Model answer is required for AI checking");
  }

  const studentText = await extractSubmissionText(submission);

  if (!studentText.trim()) {
    throw new AiCheckError(400, "No readable content found in the submission");
  }

  const totalPoints = submission.total_points || 100;

  try {
    await initializeTensorFlow();

    const aiResult = await runTensorFlowAiCheck({
      submission: { submission_text: studentText },
      modelAnswer: finalModelAnswer,
      totalPoints,
    });

    console.log("[AI Check] Used TensorFlow Universal Sentence Encoder for analysis");
    return aiResult;
  } catch (error) {
    console.error("[AI Check] Error during TensorFlow analysis:", error);
    throw new AiCheckError(
      500,
      "AI checker encountered an error. Please try again or grade manually."
    );
  }
};

// ✅ Moved outside the controller object — it's a standalone helper function
const parseQuestionsFromText = (text) => {
  const questions = [];

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const questionBlocks = normalized.split(
    /\n(?=(?:Q(?:uestion)?\s*\d+[\.\):\s]|\d+[\.\)]\s))/i
  ).filter(block => block.trim());

  for (const block of questionBlocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const questionLine = lines[0]
      .replace(/^(?:Q(?:uestion)?\s*\d+[\.\):\s]+|\d+[\.\)]\s*)/i, "")
      .trim();

    if (!questionLine) continue;

    const optionRegex = /^(?:\(?\s*[A-Da-d]\s*[\.\)\:]\s*)(.+)/;
    const answerRegex = /^(?:answer|ans|correct|key)\s*[\:\.\)]\s*/i;

    const options = [];
    let correctAnswer = "";
    let correctIndex = -1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (answerRegex.test(line)) {
        const answerRaw = line.replace(answerRegex, "").trim();
        const letterMatch = answerRaw.match(/^([A-Da-d])[\.\):\s]*/);
        if (letterMatch) {
          correctIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        } else {
          correctAnswer = answerRaw;
        }
        continue;
      }

      const optMatch = line.match(optionRegex);
      if (optMatch) {
        options.push(optMatch[1].trim());
      }
    }

    if (options.length < 2) continue;

    while (options.length < 4) options.push("");

    if (correctIndex >= 0 && correctIndex < options.length) {
      correctAnswer = options[correctIndex];
    } else if (!correctAnswer && options.length > 0) {
      correctAnswer = options[0];
    }

    if (correctAnswer && correctIndex === -1) {
      const matched = options.find(
        o => o.toLowerCase() === correctAnswer.toLowerCase()
      );
      if (matched) correctAnswer = matched;
    }

    questions.push({
      question_text: questionLine,
      options: options.slice(0, 4),
      correct_answer: correctAnswer,
      points: 1,
    });
  }

  return questions;
};

const lmsAssignmentsController = {
  // Create new assignment
  create: async (req, res) => {
    try {
      const assignmentData = req.body;
      const assignmentId = await LMSAssignments.create(assignmentData);

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignmentId,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
        error: error.message,
      });
    }
  },

  // ✅ Now a proper controller method (was broken before due to misplaced parseQuestionsFromText)
  parseQuizDocument: async (req, res) => {
    try {
      const { file_base64, file_name } = req.body;

      if (!file_base64 || !file_name) {
        return res.status(400).json({ success: false, message: "File content and name are required" });
      }

      const base64Data = file_base64.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = path.extname(file_name).toLowerCase();

      let rawText = "";

      if (ext === ".pdf") {
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;
      } else if (ext === ".docx" || ext === ".doc") {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } else {
        return res.status(400).json({ success: false, message: "Only PDF and DOCX files are supported" });
      }

      if (!rawText.trim()) {
        return res.status(400).json({ success: false, message: "Could not extract text from the document" });
      }

      const questions = parseQuestionsFromText(rawText);

      if (questions.length === 0) {
        return res.status(422).json({
          success: false,
          message: "No questions found. Please use the supported format (see template).",
        });
      }

      return res.json({ success: true, questions });
    } catch (error) {
      console.error("Error parsing quiz document:", error);
      res.status(500).json({ success: false, message: "Failed to parse document", error: error.message });
    }
  },

  // Get assignments by faculty
  getByFaculty: async (req, res) => {
    try {
      const { faculty_id, academic_period_id } = req.query;

      if (!faculty_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Faculty ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getByFaculty(
        faculty_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignments for a student based on their enrolled courses
  getByStudent: async (req, res) => {
    try {
      const { student_id, academic_period_id } = req.query;

      if (!student_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getByStudent(
        student_id,
        academic_period_id
      );

      console.log(`[DEBUG] getByStudent results for student ${student_id}:`, assignments);

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignments by section
  getBySection: async (req, res) => {
    try {
      const { section_id, academic_period_id } = req.query;

      if (!section_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Section ID and Academic Period ID are required",
        });
      }

      const assignments = await LMSAssignments.getBySection(
        section_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  },

  // Get assignment by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const assignment = await LMSAssignments.getById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        assignment,
      });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch assignment",
        error: error.message,
      });
    }
  },

  // Update assignment
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await LMSAssignments.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Assignment updated successfully",
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update assignment",
        error: error.message,
      });
    }
  },

  // Delete assignment
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await LMSAssignments.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete assignment",
        error: error.message,
      });
    }
  },

  // Submit assignment / quiz
  submitAssignment: async (req, res) => {
    try {
      const submissionData = req.body;
      const { assignment_id, submission_text } = submissionData;

      const assignment = await LMSAssignments.getById(assignment_id);

      let score = null;
      let feedback = null;
      let status = "submitted";

      if (assignment && assignment.assignment_type === "quiz") {
        const questions = await LMSAssignments.getQuizQuestionsWithAnswers(assignment_id);
        const studentAnswers = JSON.parse(submission_text || "{}");

        let calculatedScore = 0;

        questions.forEach(q => {
          if (studentAnswers[q.id] === q.correct_answer) {
            calculatedScore += q.points;
          }
        });

        score = calculatedScore;
        status = "completed";
      }

      const submissionId = await LMSAssignments.submitAssignment({
        ...submissionData,
        status,
      });

      const modelAnswerFileUrl = assignment?.model_answer_file_url || null;

      if (score !== null) {
        await LMSAssignments.gradeSubmission(submissionId, {
          score,
          feedback: "Auto-graded quiz",
          graded_by: submissionData.student_id,
        });
      } else if (assignment?.model_answer?.trim() || modelAnswerFileUrl) {
        try {
          const submission = await fetchSubmissionForAi({ submissionId });
          if (submission) {
            const aiResult = await runAiCheck({
              submission,
              modelAnswer: assignment.model_answer,
              modelAnswerFileUrl,
            });

            await LMSAssignments.gradeSubmission(submissionId, {
              score: aiResult.score,
              feedback: aiResult.feedback,
              graded_by: null,
            });

            score = aiResult.score;
            feedback = aiResult.feedback;
          }
        } catch (error) {
          const message = error instanceof AiCheckError ? error.message : error.message || error;
          console.warn("[AI Check] Auto-grading skipped:", message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Assignment submitted successfully",
        submissionId,
        score,
        feedback,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit assignment",
        error: error.message,
      });
    }
  },

  // Get submissions
  getSubmissions: async (req, res) => {
    try {
      const { assignment_id } = req.params;

      const submissions = await LMSAssignments.getSubmissions(assignment_id);

      res.status(200).json({
        success: true,
        submissions,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch submissions",
        error: error.message,
      });
    }
  },

  // Grade submission
  gradeSubmission: async (req, res) => {
    try {
      const { submission_id } = req.params;
      const gradeData = req.body;

      const graded = await LMSAssignments.gradeSubmission(submission_id, gradeData);

      if (!graded) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Submission graded successfully",
      });
    } catch (error) {
      console.error("Error grading submission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to grade submission",
        error: error.message,
      });
    }
  },

  // Get student submission
  getStudentSubmission: async (req, res) => {
    try {
      const { assignment_id, student_id } = req.query;

      if (!assignment_id || !student_id) {
        return res.status(400).json({
          success: false,
          message: "Assignment ID and Student ID are required",
        });
      }

      const submission = await LMSAssignments.getStudentSubmission(
        assignment_id,
        student_id
      );

      res.status(200).json({
        success: true,
        submission,
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch submission",
        error: error.message,
      });
    }
  },

  // Create quiz question
  createQuizQuestion: async (req, res) => {
    try {
      const questionData = req.body;

      const questionId = await LMSAssignments.createQuizQuestion(questionData);

      res.status(201).json({
        success: true,
        message: "Quiz question created successfully",
        questionId,
      });
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create quiz question",
        error: error.message,
      });
    }
  },

  // Get quiz questions
  getQuizQuestions: async (req, res) => {
    try {
      const { assignment_id } = req.params;

      const questions = await LMSAssignments.getQuizQuestions(assignment_id);

      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quiz questions",
        error: error.message,
      });
    }
  },

  // Get quiz review (questions with answers, ONLY if submitted)
  getQuizReview: async (req, res) => {
    try {
      const { assignment_id } = req.params;
      const { student_id } = req.query;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID is required",
        });
      }

      const submission = await LMSAssignments.getStudentSubmission(assignment_id, student_id);

      if (!submission || (submission.status !== "submitted" && submission.status !== "graded" && submission.status !== "completed")) {
        return res.status(403).json({
          success: false,
          message: "You must submit the quiz before reviewing results.",
        });
      }

      const questions = await LMSAssignments.getQuizQuestionsWithAnswers(assignment_id);

      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching quiz review:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quiz review",
        error: error.message,
      });
    }
  },

  // Upload assignment file
  uploadFile: async (req, res) => {
    try {
      const { file_base64, file_name } = req.body;

      if (!file_base64 || !file_name) {
        return res.status(400).json({
          success: false,
          message: "File content and name are required",
        });
      }

      const base64Data = file_base64.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const uploadDir = path.join(__dirname, "../public/uploads/assignments");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueFilename = `${Date.now()}-${file_name.replace(/\s+/g, "-")}`;
      const filepath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filepath, buffer);

      const fileUrl = `/uploads/assignments/${uniqueFilename}`;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file_url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  },

  // AI-assisted check of a student submission against a model answer
  aiCheckSubmission: async (req, res) => {
    try {
      const { submission_id } = req.params;
      const { model_answer, assignment_id, student_id } = req.body;

      const submission = await fetchSubmissionForAi({
        submissionId: submission_id,
        assignmentId: assignment_id,
        studentId: student_id,
      });

      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      const modelAnswer = model_answer?.trim() || submission.model_answer;
      const aiResult = await runAiCheck({ submission, modelAnswer });

      return res.json({
        success: true,
        score: aiResult.score,
        feedback: aiResult.feedback,
      });
    } catch (error) {
      console.error("Error in AI check submission:", error);
      const status = error instanceof AiCheckError ? error.status : 500;
      res.status(status).json({
        success: false,
        message:
          error instanceof AiCheckError
            ? error.message
            : "Failed to perform AI check",
        error: error.message,
      });
    }
  },
};

export default lmsAssignmentsController;