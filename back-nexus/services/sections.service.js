import SectionsModel from "../model/sections.model.js";
const SectionsService = {
  getAllSections: async (filters) => {
    try {
      return await SectionsModel.getAllSections(filters);
    } catch (error) {
      throw new Error(`Error fetching sections: ${error.message}`);
    }
  },

  getSectionById: async (id) => {
    try {
      const section = await SectionsModel.getSectionById(id);
      if (!section) {
        throw new Error("Section not found");
      }
      return section;
    } catch (error) {
      throw new Error(`Error fetching section: ${error.message}`);
    }
  },

  createSection: async (sectionData) => {
    try {
      if (!sectionData.program_id || !sectionData.period_id || !sectionData.section_name || !sectionData.year_level) {
        throw new Error("Missing required fields");
      }

      const sectionId = await SectionsModel.createSection(sectionData);
      return await SectionsModel.getSectionById(sectionId);
    } catch (error) {
      throw new Error(`Error creating section: ${error.message}`);
    }
  },

  updateSection: async (id, sectionData) => {
    try {
      if (!sectionData.program_id || !sectionData.period_id || !sectionData.section_name || !sectionData.year_level) {
        throw new Error("Missing required fields");
      }
      const updated = await SectionsModel.updateSection(id, sectionData);
      if (!updated) {
        throw new Error("Section not found or not updated");
      }
      return await SectionsModel.getSectionById(id);
    } catch (error) {
      throw new Error(`Error updating section: ${error.message}`);
    }
  },

  deleteSection: async (id) => {
    try {
      const deleted = await SectionsModel.deleteSection(id);
      if (!deleted) {
        throw new Error("Section not found");
      }
      return { message: "Section deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting section: ${error.message}`);
    }
  },

  getEnrollmentCount: async (sectionId) => {
    try {
      return await SectionsModel.getEnrollmentCount(sectionId);
    } catch (error) {
      throw new Error(`Error fetching enrollment count: ${error.message}`);
    }
  },

  // Fetch all sections for a period (optionally filtered by program), used by sectioning.
  getSectionsForPeriod: async (periodId, programId = null, yearLevel = null) => {
    try {
      return await SectionsModel.getSectionsForPeriod(periodId, programId, yearLevel);
    } catch (error) {
      throw new Error(`Error fetching sections for period: ${error.message}`);
    }
  },

  // --- Balancing algorithm ---
  // Greedy load-balancer: spread this batch evenly across sections, while
  // counting pre-existing students outside the batch against capacity.
  //
  // Pure function - no DB calls, so it's safe/cheap to run as a
  // simulation before actually committing anything.
  computeBalancedAssignment: (sections, ids) => {
    const pool = sections
      .filter((s) => s.status !== "inactive")
      .map((s) => ({
        section_id: s.section_id,
        section_name: s.section_name,
        occupied: Number(s.current_enrolled) || 0,
        assigned: 0,
        max_capacity: Number(s.max_capacity) || 0,
      }));

    const assignments = [];
    const unassigned = [];

    for (const id of ids) {
      const available = pool.filter(
        (s) => s.occupied + s.assigned < s.max_capacity,
      );

      if (available.length === 0) {
        // Lahat ng section puno na - wala nang mapaglagyan.
        unassigned.push(id);
        continue;
      }

      available.sort((a, b) => {
        if (a.assigned !== b.assigned) return a.assigned - b.assigned;
        const ratioA = (a.occupied + a.assigned) / a.max_capacity;
        const ratioB = (b.occupied + b.assigned) / b.max_capacity;
        if (ratioA !== ratioB) return ratioA - ratioB;
        return a.section_id - b.section_id;
      });

      const target = available[0];
      target.assigned += 1;
      assignments.push({
        id,
        section_id: target.section_id,
        section_name: target.section_name,
      });
    }

    const finalCounts = pool.map((section) => ({
      ...section,
      current_enrolled: section.occupied + section.assigned,
    }));
    return { assignments, unassigned, finalCounts };
  },
};

export default SectionsService;
