import FacultyCourseAssignmentService from "../services/facultyCourseAssignment.service.js";

export const getAllAssignments = async (req, res) => {
  try {
    const result = await FacultyCourseAssignmentService.getAllAssignments();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyCourseAssignmentService.getAssignmentById(id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAssignmentsByFacultyId = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const result =
      await FacultyCourseAssignmentService.getAssignmentsByFacultyId(facultyId);
    if (result.success) {
      res.status(200).json(result); // Return the whole result object
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAssignmentsByAcademicPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const result =
      await FacultyCourseAssignmentService.getAssignmentsByAcademicPeriod(
        periodId,
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

export const createAssignment = async (req, res) => {
  try {
    const result = await FacultyCourseAssignmentService.createAssignment(
      req.body,
    );
    if (result.success) {
      res.status(201).json({ message: result.message, data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyCourseAssignmentService.updateAssignment(
      id,
      req.body,
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

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyCourseAssignmentService.deleteAssignment(id);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
