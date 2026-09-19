import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import LMSMaterials from "../model/lmsMaterials.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lmsMaterialsController = {
  // Upload a learning material file and return a persistent URL
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

      const uploadDir = path.join(__dirname, "../public/uploads/materials");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueFilename = `${Date.now()}-${file_name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/materials/${uniqueFilename}`;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file_url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading material file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  },

  // Create new learning material
  create: async (req, res) => {
    try {
      const materialData = req.body;
      const materialId = await LMSMaterials.create(materialData);

      res.status(201).json({
        success: true,
        message: "Learning material created successfully",
        materialId,
      });
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create learning material",
        error: error.message,
      });
    }
  },

  // Get materials by faculty
  getByFaculty: async (req, res) => {
    try {
      const { faculty_id, academic_period_id } = req.query;

      if (!faculty_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Faculty ID and Academic Period ID are required",
        });
      }

      const materials = await LMSMaterials.getByFaculty(
        faculty_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        materials,
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch materials",
        error: error.message,
      });
    }
  },

  // Get materials for a student based on their enrolled courses
  getByStudent: async (req, res) => {
    try {
      const { student_id, academic_period_id } = req.query;

      console.log('[DEBUG StudentLMS] Fetching materials with params:', { student_id, academic_period_id });

      if (!student_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Student ID and Academic Period ID are required",
        });
      }

      const materials = await LMSMaterials.getByStudent(
        student_id,
        academic_period_id
      );

      console.log('[DEBUG StudentLMS] Found', materials.length, 'materials for student', student_id);

      let isEnrolled = true;
      if (materials.length === 0) {
        isEnrolled = await LMSMaterials.hasEnrollments(student_id, academic_period_id);
      }

      res.status(200).json({
        success: true,
        materials,
        isEnrolled,
      });
    } catch (error) {
      console.error("Error fetching student materials:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch materials",
        error: error.message,
      });
    }
  },

  // Get materials by section
  getBySection: async (req, res) => {
    try {
      const { section_id, academic_period_id } = req.query;

      if (!section_id || !academic_period_id) {
        return res.status(400).json({
          success: false,
          message: "Section ID and Academic Period ID are required",
        });
      }

      const materials = await LMSMaterials.getBySection(
        section_id,
        academic_period_id
      );

      res.status(200).json({
        success: true,
        materials,
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch materials",
        error: error.message,
      });
    }
  },

  // Get material by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const material = await LMSMaterials.getById(id);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }

      res.status(200).json({
        success: true,
        material,
      });
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch material",
        error: error.message,
      });
    }
  },

  // Update material
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await LMSMaterials.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Material updated successfully",
      });
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update material",
        error: error.message,
      });
    }
  },

  // Delete material
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await LMSMaterials.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Material deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete material",
        error: error.message,
      });
    }
  },

  // Track material view
  trackView: async (req, res) => {
    try {
      const { material_id, student_id } = req.body;

      await LMSMaterials.trackView(material_id, student_id);

      res.status(200).json({
        success: true,
        message: "View tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track view",
        error: error.message,
      });
    }
  },

  // Get material views
  getViews: async (req, res) => {
    try {
      const { material_id } = req.params;

      const views = await LMSMaterials.getViews(material_id);

      res.status(200).json({
        success: true,
        views,
      });
    } catch (error) {
      console.error("Error fetching views:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch views",
        error: error.message,
      });
    }
  },
};

export default lmsMaterialsController;
