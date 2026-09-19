import ScholarshipBeneficiariesService from "../services/scholarshipBeneficiaries.service.js";

export const getAllBeneficiaries = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      scholarship_id: req.query.scholarship_id,
      student_id: req.query.student_id,
      academic_period_id: req.query.academic_period_id,
      disbursement_status: req.query.disbursement_status,
      search: req.query.search,
    };
    const beneficiaries = await ScholarshipBeneficiariesService.getAllBeneficiaries(filters);
    res.json(beneficiaries);
  } catch (error) {
    console.error("Error fetching beneficiaries:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getBeneficiaryById = async (req, res) => {
  try {
    const beneficiary = await ScholarshipBeneficiariesService.getBeneficiaryById(req.params.id);
    res.json(beneficiary);
  } catch (error) {
    console.error("Error fetching beneficiary:", error);
    res.status(404).json({ error: error.message });
  }
};

export const createBeneficiary = async (req, res) => {
  try {
    const beneficiary = await ScholarshipBeneficiariesService.createBeneficiary(req.body);
    res.status(201).json(beneficiary);
  } catch (error) {
    console.error("Error creating beneficiary:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateBeneficiary = async (req, res) => {
  try {
    const beneficiary = await ScholarshipBeneficiariesService.updateBeneficiary(req.params.id, req.body);
    res.json(beneficiary);
  } catch (error) {
    console.error("Error updating beneficiary:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteBeneficiary = async (req, res) => {
  try {
    await ScholarshipBeneficiariesService.deleteBeneficiary(req.params.id);
    res.json({ message: "Beneficiary deleted successfully" });
  } catch (error) {
    console.error("Error deleting beneficiary:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const statistics = await ScholarshipBeneficiariesService.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
