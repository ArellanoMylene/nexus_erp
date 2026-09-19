import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tensorflowLoaded = false;
let USE = null;

// Initialize TensorFlow and Universal Sentence Encoder
export const initializeTensorFlow = async () => {
  if (tensorflowLoaded && USE) {
    return USE;
  }

  try {
    const tf = await import("@tensorflow/tfjs");
    const use = await import("@tensorflow-models/universal-sentence-encoder");
    
    console.log("[AI Checker] Loading Universal Sentence Encoder model...");
    USE = await use.load();
    tensorflowLoaded = true;
    console.log("[AI Checker] Universal Sentence Encoder loaded successfully");
    return USE;
  } catch (error) {
    console.error("[AI Checker] Failed to load TensorFlow/USE:", error);
    throw new Error("AI checker models failed to initialize");
  }
};

// Extract keywords from text
const extractKeywords = (text) => {
  // Simple keyword extraction: split by spaces, filter stop words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "been", "be",
    "have", "has", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "can", "this", "that", "these", "those", "i", "you",
    "he", "she", "it", "we", "they", "what", "which", "who", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "as"
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, ""));
};

// Calculate keyword match percentage
// Calculate weighted keyword match percentage (importance by frequency)
const calculateKeywordMatch = (studentKeywords, modelKeywords) => {
  if (modelKeywords.length === 0) return 0;

  const studentSet = new Set(studentKeywords);

  // Build frequency map for model keywords to represent importance
  const freq = {};
  let totalWeight = 0;
  for (const kw of modelKeywords) {
    freq[kw] = (freq[kw] || 0) + 1;
    totalWeight += 1;
  }

  // Sum weights for matched keywords
  let matchedWeight = 0;
  for (const kw of Object.keys(freq)) {
    if (studentSet.has(kw)) matchedWeight += freq[kw];
  }

  return (matchedWeight / totalWeight) * 100;
};

// Calculate text length/completeness score
const calculateCompletenessScore = (studentText, modelText) => {
  const studentLength = studentText.trim().length;
  const modelLength = modelText.trim().length;
  
  // Student should have at least 50% of model answer length to be considered complete
  const completenessRatio = studentLength / modelLength;
  
  if (completenessRatio >= 1) return 100; // At least as long as model
  if (completenessRatio >= 0.5) return 75 + (completenessRatio - 0.5) * 50; // 50-100% = 75-100 score
  if (completenessRatio >= 0.25) return 50 + (completenessRatio - 0.25) * 100; // 25-50% = 50-75 score
  return Math.max(0, completenessRatio * 200); // Less than 25% = 0-50 score
};

// Calculate semantic similarity using Universal Sentence Encoder
const calculateSemanticSimilarity = async (studentText, modelText) => {
  try {
    const encoder = await initializeTensorFlow();
    
    // Encode both texts
    const embeddings = await encoder.embed([studentText, modelText]);
    const studentEmbedding = embeddings.arraySync()[0];
    const modelEmbedding = embeddings.arraySync()[1];
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let studentNorm = 0;
    let modelNorm = 0;
    
    for (let i = 0; i < studentEmbedding.length; i++) {
      dotProduct += studentEmbedding[i] * modelEmbedding[i];
      studentNorm += studentEmbedding[i] * studentEmbedding[i];
      modelNorm += modelEmbedding[i] * modelEmbedding[i];
    }
    
    studentNorm = Math.sqrt(studentNorm);
    modelNorm = Math.sqrt(modelNorm);
    
    if (studentNorm === 0 || modelNorm === 0) {
      return 0; // Handle zero vectors
    }
    
    const similarity = dotProduct / (studentNorm * modelNorm);
    // Universal Sentence Encoder cosine similarities are typically in [0, 1].
    // Avoid shifting from [-1,1] which inflates scores; map 0..1 -> 0..100.
    const normalized = Math.max(0, Math.min(1, similarity));
    const similarityScore = normalized * 100;
    
    // Clean up tensors
    embeddings.dispose();
    
    return Math.min(100, Math.max(0, similarityScore));
  } catch (error) {
    console.error("[AI Checker] Semantic similarity calculation error:", error);
    return 0;
  }
};

// Main AI check function
export const runTensorFlowAiCheck = async ({
  submission,
  modelAnswer,
  totalPoints = 100,
}) => {
  if (!modelAnswer || !modelAnswer.trim()) {
    throw new Error("Model answer is required for AI checking");
  }

  if (!submission || !submission.submission_text) {
    throw new Error("No submission text found");
  }

  const studentText = submission.submission_text.trim();
  const modelText = modelAnswer.trim();

  if (!studentText) {
    throw new Error("Student submission is empty");
  }

  // Extract keywords from both
  const studentKeywords = extractKeywords(studentText);
  const modelKeywords = extractKeywords(modelText);

  // Also keep original model keywords as short set for heuristics
  const modelKeywordSet = new Set(modelKeywords);

  // Calculate scores (each component is weighted)
  const semanticSimilarityScore = await calculateSemanticSimilarity(studentText, modelText);
  const keywordMatchScore = calculateKeywordMatch(studentKeywords, modelKeywords);
  const completenessScore = calculateCompletenessScore(studentText, modelText);

  // Detect contradiction or clear topic mismatch
  const contradiction = detectContradiction(studentKeywords, modelKeywords, studentText, modelText);

  // Weighted average:
  // Weighted average (reduced semantic weight, increased keyword weight):
  // - Semantic similarity: 40%
  // - Keyword matching: 35%
  // - Completeness: 25%
  let overallScore = (
    semanticSimilarityScore * 0.4 +
    keywordMatchScore * 0.35 +
    completenessScore * 0.25
  );

  // Apply contradiction penalty if detected (subtract 15 percentage points)
  if (contradiction) {
    overallScore = Math.max(0, overallScore - 15);
  }

  // Convert to total points
  const finalScore = Math.round((overallScore / 100) * totalPoints * 100) / 100;
  const clampedScore = Math.min(Math.max(finalScore, 0), totalPoints);

  // Generate feedback based on scores
  // Generate feedback based on scores
  const feedback = generateFeedback({
    semanticSimilarityScore,
    keywordMatchScore,
    completenessScore,
    overallScore,
    studentKeywordsCount: studentKeywords.length,
    modelKeywordsCount: modelKeywords.length,
    contradiction,
  });

  return {
    score: clampedScore,
    feedback,
    details: {
      semanticSimilarityScore: Math.round(semanticSimilarityScore),
      keywordMatchScore: Math.round(keywordMatchScore),
      completenessScore: Math.round(completenessScore),
      overallScore: Math.round(overallScore),
      contradiction: !!contradiction,
    },
  };
};

// Simple contradiction / topic-mismatch detector
const detectContradiction = (studentKeywords, modelKeywords, studentText, modelText) => {
  const negations = new Set(["not", "never", "no", "without", "n't"]);
  const studentHasNeg = studentText.toLowerCase().split(/\s+/).some(w => negations.has(w.replace(/[^\w']/g, "")));
  const modelHasNeg = modelText.toLowerCase().split(/\s+/).some(w => negations.has(w.replace(/[^\w']/g, "")));

  if (studentHasNeg !== modelHasNeg) return true; // possible contradiction in polarity

  const studentSet = new Set(studentKeywords);
  const modelSet = new Set(modelKeywords);

  // Heuristic: detect frontend/backend mismatch (common LMS mistake)
  const frontendWords = new Set(["frontend", "ui", "user", "interface", "client", "browser"]);
  const backendWords = new Set(["backend", "server", "database", "db", "api", "connect", "connects", "connecting"]);

  const studentHasFrontend = Array.from(studentSet).some(k => frontendWords.has(k));
  const studentHasBackend = Array.from(studentSet).some(k => backendWords.has(k));
  const modelHasFrontend = Array.from(modelSet).some(k => frontendWords.has(k));
  const modelHasBackend = Array.from(modelSet).some(k => backendWords.has(k));

  if ((modelHasFrontend && studentHasBackend) || (modelHasBackend && studentHasFrontend)) return true;

  return false;
};

// Generate constructive feedback
const generateFeedback = ({
  semanticSimilarityScore,
  keywordMatchScore,
  completenessScore,
  overallScore,
  studentKeywordsCount,
  modelKeywordsCount,
  contradiction,
}) => {
  const feedbackParts = [];

  // Semantic similarity feedback
  if (semanticSimilarityScore >= 80) {
    feedbackParts.push("Your answer demonstrates strong understanding of the concept.");
  } else if (semanticSimilarityScore >= 60) {
    feedbackParts.push("Your answer covers the main ideas but could benefit from more depth or clarity.");
  } else if (semanticSimilarityScore >= 40) {
    feedbackParts.push("Your answer addresses some relevant concepts but is missing key ideas.");
  } else {
    feedbackParts.push("Your answer lacks semantic similarity to the expected answer. Review the core concepts.");
  }

  // Keyword matching feedback
  if (keywordMatchScore >= 80) {
    feedbackParts.push("You've covered the key terminology and concepts.");
  } else if (keywordMatchScore >= 50) {
    feedbackParts.push(`You've included ${Math.round(keywordMatchScore)}% of key terms; try to include more important keywords.`);
  } else if (keywordMatchScore > 0) {
    feedbackParts.push("Include more of the key terms and concepts from the expected answer.");
  }

  // Completeness feedback
  if (completenessScore >= 80) {
    feedbackParts.push("The answer length is appropriate.");
  } else if (completenessScore >= 50) {
    feedbackParts.push("The answer is somewhat brief; consider expanding with more details.");
  } else {
    feedbackParts.push("The answer is too brief. Provide a more complete response.");
  }

  if (contradiction) {
    feedbackParts.push("The answer appears to contradict the expected content or addresses a different topic; review key concepts.");
  }

  return feedbackParts.join(" ");
};

export default {
  runTensorFlowAiCheck,
  extractKeywords,
  calculateKeywordMatch,
  calculateCompletenessScore,
  calculateSemanticSimilarity,
  initializeTensorFlow,
};
