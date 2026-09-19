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
      if (!sectionData.period_id || !sectionData.section_name) {
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
  getSectionsForPeriod: async (periodId, programId = null) => {
    try {
      return await SectionsModel.getSectionsForPeriod(periodId, programId);
    } catch (error) {
      throw new Error(`Error fetching sections for period: ${error.message}`);
    }
  },

  // --- Balancing algorithm ---
  // Greedy load-balancer: each id (an enrollment_id, or any id) in turn
  // goes to whichever section currently has the FEWEST students that
  // still has an open slot. Repeat for the whole list and sections end
  // up roughly equal in size, regardless of list order - this is what
  // keeps sectioning "pantay-pantay" instead of filling one section to
  // max_capacity before the next section gets anyone.
  //
  // Pure function - no DB calls, so it's safe/cheap to run as a
  // simulation before actually committing anything.
  computeBalancedAssignment: (sections, ids) => {
    const pool = sections
      .filter((s) => s.status !== "inactive")
      .map((s) => ({
        section_id: s.section_id,
        section_name: s.section_name,
        current_enrolled: Number(s.current_enrolled) || 0,
        max_capacity: Number(s.max_capacity) || 0,
      }));

    const assignments = [];
    const unassigned = [];

    for (const id of ids) {
      const available = pool.filter(
        (s) => s.current_enrolled < s.max_capacity,
      );

      if (available.length === 0) {
        // Lahat ng section puno na - wala nang mapaglagyan.
        unassigned.push(id);
        continue;
      }

      // Pinakamababang headcount muna; kapag tie, pinakamababang fill
      // ratio; kapag tie pa rin, pinakamababang section_id para
      // deterministic/repeatable ang resulta.
      available.sort((a, b) => {
        if (a.current_enrolled !== b.current_enrolled) {
          return a.current_enrolled - b.current_enrolled;
        }
        const ratioA = a.current_enrolled / a.max_capacity;
        const ratioB = b.current_enrolled / b.max_capacity;
        if (ratioA !== ratioB) return ratioA - ratioB;
        return a.section_id - b.section_id;
      });

      const target = available[0];
      target.current_enrolled += 1;
      assignments.push({
        id,
        section_id: target.section_id,
        section_name: target.section_name,
      });
    }

    return { assignments, unassigned, finalCounts: pool };
  },
};

export default SectionsService;