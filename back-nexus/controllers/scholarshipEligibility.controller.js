import EligibilityScreeningService from "../services/scholarshipEligibility.service.js";

export const getAllScreenings = async (req, res) => {
  try {
    const filters = {
      screening_status: req.query.screening_status,
      application_id: req.query.application_id,
      scholarship_id: req.query.scholarship_id,
      academic_period_id: req.query.academic_period_id,
      student_id: req.query.student_id,
      search: req.query.search,
    };
    const screenings = await EligibilityScreeningService.getAllScreenings(filters);
    res.json(screenings);
  } catch (error) {
    console.error("Error fetching screenings:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getScreeningById = async (req, res) => {
  try {
    const screening = await EligibilityScreeningService.getScreeningById(req.params.id);
    res.json(screening);
  } catch (error) {
    console.error("Error fetching screening:", error);
    res.status(404).json({ error: error.message });
  }
};

export const createScreening = async (req, res) => {
  try {
    const screening = await EligibilityScreeningService.createScreening(req.body);
    res.status(201).json(screening);
  } catch (error) {
    console.error("Error creating screening:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateScreening = async (req, res) => {
  try {
    const screening = await EligibilityScreeningService.updateScreening(req.params.id, req.body);
    res.json(screening);
  } catch (error) {
    console.error("Error updating screening:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteScreening = async (req, res) => {
  try {
    await EligibilityScreeningService.deleteScreening(req.params.id);
    res.json({ message: "Screening deleted successfully" });
  } catch (error) {
    console.error("Error deleting screening:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const statistics = await EligibilityScreeningService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
