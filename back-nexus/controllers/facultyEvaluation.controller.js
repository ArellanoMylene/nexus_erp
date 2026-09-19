import FacultyEvaluationService from "../services/facultyEvaluation.service.js";

export const getAllEvaluations = async (req, res) => {
  try {
    const result = await FacultyEvaluationService.getAllEvaluations();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyEvaluationService.getEvaluationById(id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEvaluationsByFacultyId = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const result = await FacultyEvaluationService.getEvaluationsByFacultyId(
      facultyId
    );
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEvaluationsByAcademicPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const result =
      await FacultyEvaluationService.getEvaluationsByAcademicPeriod(periodId);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createEvaluation = async (req, res) => {
  try {
    const result = await FacultyEvaluationService.createEvaluation(req.body);
    if (result.success) {
      res.status(201).json({ message: result.message, data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyEvaluationService.updateEvaluation(
      id,
      req.body
    );
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyEvaluationService.deleteEvaluation(id);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAverageRatings = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { periodId } = req.query;
    const result = await FacultyEvaluationService.getAverageRatings(
      facultyId,
      periodId
    );
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
