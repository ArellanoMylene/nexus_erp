import ScholarshipTypesService from "../services/scholarshipTypes.service.js";

export const getAllScholarshipTypes = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      funding_source: req.query.funding_source,
      search: req.query.search,
    };
    const scholarshipTypes = await ScholarshipTypesService.getAllScholarshipTypes(filters);
    res.json(scholarshipTypes);
  } catch (error) {
    console.error("Error fetching scholarship types:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getScholarshipTypeById = async (req, res) => {
  try {
    const scholarshipType = await ScholarshipTypesService.getScholarshipTypeById(req.params.id);
    res.json(scholarshipType);
  } catch (error) {
    console.error("Error fetching scholarship type:", error);
    res.status(404).json({ error: error.message });
  }
};

export const createScholarshipType = async (req, res) => {
  try {
    const scholarshipType = await ScholarshipTypesService.createScholarshipType(req.body);
    res.status(201).json(scholarshipType);
  } catch (error) {
    console.error("Error creating scholarship type:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateScholarshipType = async (req, res) => {
  try {
    const scholarshipType = await ScholarshipTypesService.updateScholarshipType(req.params.id, req.body);
    res.json(scholarshipType);
  } catch (error) {
    console.error("Error updating scholarship type:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteScholarshipType = async (req, res) => {
  try {
    await ScholarshipTypesService.deleteScholarshipType(req.params.id);
    res.json({ message: "Scholarship type deleted successfully" });
  } catch (error) {
    console.error("Error deleting scholarship type:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const statistics = await ScholarshipTypesService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getFundingSources = async (req, res) => {
  try {
    const fundingSources = await ScholarshipTypesService.getFundingSources();
    res.json(fundingSources);
  } catch (error) {
    console.error("Error fetching funding sources:", error);
    res.status(500).json({ error: error.message });
  }
};
