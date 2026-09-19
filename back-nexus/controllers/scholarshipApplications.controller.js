import ScholarshipApplicationsService from "../services/scholarshipApplications.service.js";

export const getAllApplications = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      scholarship_id: req.query.scholarship_id,
      student_id: req.query.student_id,
      academic_period_id: req.query.academic_period_id,
      search: req.query.search,
    };
    const applications = await ScholarshipApplicationsService.getAllApplications(filters);
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const application = await ScholarshipApplicationsService.getApplicationById(req.params.id);
    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(404).json({ error: error.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    const application = await ScholarshipApplicationsService.createApplication(req.body);
    res.status(201).json(application);
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const application = await ScholarshipApplicationsService.updateApplication(req.params.id, req.body);
    res.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    await ScholarshipApplicationsService.deleteApplication(req.params.id);
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const statistics = await ScholarshipApplicationsService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
