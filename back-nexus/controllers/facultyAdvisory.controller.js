import FacultyAdvisoryService from "../services/facultyAdvisory.service.js";

export const getAllAdvisories = async (req, res) => {
  try {
    const result = await FacultyAdvisoryService.getAllAdvisories();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAdvisoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyAdvisoryService.getAdvisoryById(id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAdvisoriesByFacultyId = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const result = await FacultyAdvisoryService.getAdvisoriesByFacultyId(
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

export const getAdvisoryByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await FacultyAdvisoryService.getAdvisoryByStudentId(
      studentId
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

export const createAdvisory = async (req, res) => {
  try {
    const result = await FacultyAdvisoryService.createAdvisory(req.body);
    if (result.success) {
      res.status(201).json({ message: result.message, data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAdvisory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyAdvisoryService.updateAdvisory(id, req.body);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAdvisory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyAdvisoryService.deleteAdvisory(id);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAdvisoryLoad = async (req, res) => {
  try {
    const { facultyId, periodId } = req.params;
    const result = await FacultyAdvisoryService.getAdvisoryLoad(
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

export const getStudentsWithoutAdvisors = async (req, res) => {
  try {
    const { periodId } = req.params;
    const result = await FacultyAdvisoryService.getStudentsWithoutAdvisors(
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
