import FacultyService from "../services/faculty.service.js";

export const getAllFaculty = async (req, res) => {
  try {
    const result = await FacultyService.getAllFaculty();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyService.getFacultyById(id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFacultyByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const result = await FacultyService.getFacultyByDepartment(department);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const result = await FacultyService.createFaculty(req.body);
    if (result.success) {
      res.status(201).json({ message: result.message, data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyService.updateFaculty(id, req.body);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyService.deleteFaculty(id);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFacultyStats = async (req, res) => {
  try {
    const result = await FacultyService.getFacultyStats();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
