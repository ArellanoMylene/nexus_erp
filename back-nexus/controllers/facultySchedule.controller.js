import FacultyScheduleService from "../services/facultySchedule.service.js";

export const getAllSchedules = async (req, res) => {
  try {
    const result = await FacultyScheduleService.getAllSchedules();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyScheduleService.getScheduleById(id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSchedulesByFacultyId = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { periodId } = req.query;
    const result = await FacultyScheduleService.getSchedulesByFacultyId(
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

export const getSchedulesByAcademicPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;
    const result = await FacultyScheduleService.getSchedulesByAcademicPeriod(
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

export const createSchedule = async (req, res) => {
  try {
    const result = await FacultyScheduleService.createSchedule(req.body);
    if (result.success) {
      res.status(201).json({ message: result.message, data: result.data });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyScheduleService.updateSchedule(id, req.body);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacultyScheduleService.deleteSchedule(id);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getWeeklySchedule = async (req, res) => {
  try {
    const { facultyId, periodId } = req.params;
    const result = await FacultyScheduleService.getWeeklySchedule(
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
