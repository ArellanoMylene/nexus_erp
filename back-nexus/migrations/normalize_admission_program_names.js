import db from "../config/db.js";

// Canonical configured program codes for the legacy free-text values currently
// stored by admission applications. Add a mapping only when the intended
// configured program is unambiguous.
const legacyProgramAliases = [
  { alias: "BACHELOR OF ARTS IN HISTORY", code: "BAH" },
  {
    alias: "Bachelor of Public Administration  Year: 1",
    code: "BPA",
  },
  { alias: "Bachelor of Public Administration", code: "BPA" },
  {
    alias: "BACHELOR OF TECHNICAL VOCATIONAL TEACHER EDUCATION MAJOR IN COMPUTER HARDWARE SERVICING",
    code: "BTVTED",
  },
];

const run = async () => {
  const connection = await db.getConnection();
  try {
    const [programs] = await connection.query(
      "SELECT code, name FROM programs WHERE code IN (?)",
      [legacyProgramAliases.map((mapping) => mapping.code)],
    );
    const programsByCode = new Map(programs.map((program) => [program.code, program]));
    const missingCodes = legacyProgramAliases
      .map((mapping) => mapping.code)
      .filter((code) => !programsByCode.has(code));
    if (missingCodes.length) {
      throw new Error(`Configured program(s) not found: ${missingCodes.join(", ")}`);
    }

    await connection.beginTransaction();
    const results = [];
    for (const mapping of legacyProgramAliases) {
      const configuredProgram = programsByCode.get(mapping.code);
      const [matches] = await connection.query(
        `SELECT DISTINCT email
         FROM admissions
         WHERE LOWER(TRIM(program_applied)) = LOWER(TRIM(?))
           AND BINARY program_applied <> BINARY ?`,
        [mapping.alias, configuredProgram.name],
      );

      const [admissionsUpdate] = await connection.query(
        `UPDATE admissions
         SET program_applied = ?
         WHERE LOWER(TRIM(program_applied)) = LOWER(TRIM(?))
           AND BINARY program_applied <> BINARY ?`,
        [configuredProgram.name, mapping.alias, configuredProgram.name],
      );

      let linkedStudentsUpdated = 0;
      for (const { email } of matches) {
        if (!email) continue;
        const [updateResult] = await connection.query(
          `UPDATE student_details sd
           JOIN users u ON u.user_id = sd.user_id
           SET sd.course = ?
           WHERE u.role = 'Student'
             AND u.email = ? COLLATE utf8mb4_unicode_ci`,
          [configuredProgram.name, email],
        );
        linkedStudentsUpdated += updateResult.affectedRows;
      }

      results.push({
        alias: mapping.alias,
        configuredProgram: `${configuredProgram.code} - ${configuredProgram.name}`,
        admissionsUpdated: admissionsUpdate.affectedRows,
        linkedStudentsUpdated,
      });
    }

    await connection.commit();
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
};

run().catch((error) => {
  console.error("Failed to normalize admission program names:", error);
  process.exitCode = 1;
});
