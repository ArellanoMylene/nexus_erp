// userModel.js
import db from "../config/db.js";

const getCurrentDateValue = () => new Date().toISOString().split("T")[0];

const getStudentNumberPrefix = () => `B${String(new Date().getFullYear()).slice(-2)}`;

const pickValue = (source, ...keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

const joinAddressParts = (...parts) => parts.filter(Boolean).join(", ");

// Remove sensitive fields (like password_hash) from a user row (or array of
// rows) before it's returned from the model layer. Centralized here so every
// read path (getAllUsers, findUserById, etc.) is guaranteed to scrub it,
// instead of relying on each caller to remember to omit it.
const omitSensitiveFields = (row) => {
  if (!row) return row;
  const { password_hash, ...safeRow } = row;
  return safeRow;
};

const omitSensitiveFieldsFromRows = (rows) => rows.map(omitSensitiveFields);

const studentDetailSelect = `
      s.student_number,
  s.student_type,
      s.course,
      s.major,
      s.year_level,
      s.previous_school,
      s.year_graduated,
      s.mailing_address,
  s.elementary_school_completed_at,
  s.elementary_school_year_graduated,
  s.junior_high_school_completed_at,
  s.junior_high_school_year_graduated,
  s.senior_high_school_completed_at,
  s.senior_high_school_year_graduated,
  s.college_program_course_attended,
  s.school_year_attended,
      s.father_name,
      s.mother_name,
      s.parent_phone,
      s.civil_status,
      s.religion,
      s.is_pwd,
      s.indigenous_people,
      s.zip_code,
      s.date_registered,
      s.permanent_sitio,
      s.permanent_barangay,
      s.permanent_city_municipality,
      s.permanent_province,
      s.present_sitio,
      s.present_barangay,
      s.present_city_municipality,
      s.present_province,
      s.birth_place,
      s.citizenship,
      s.father_status,
      s.father_residence_street,
      s.father_residence_barangay,
      s.father_residence_city,
      s.father_residence_province,
      s.father_residence_zip_code,
      s.father_occupation,
      s.father_phone,
      s.mother_status,
      s.mother_residence_street,
      s.mother_residence_barangay,
      s.mother_residence_city,
      s.mother_residence_province,
      s.mother_residence_zip_code,
      s.mother_occupation,
      s.mother_phone,
      s.guardian_name,
      s.guardian_relationship,
      s.guardian_residence_street,
      s.guardian_residence_barangay,
      s.guardian_residence_city,
      s.guardian_residence_province,
      s.guardian_residence_zip_code,
      s.guardian_occupation,
      s.guardian_phone,
      s.other_financial_assistance,
      s.scholarship_assistance_1,
      s.scholarship_assistance_2,
      s.scholarship_assistance_3
`;

const getNextStudentNumber = async (connection = db) => {
  const prefix = getStudentNumberPrefix();
  const [rows] = await connection.query(
    `SELECT student_number
     FROM student_details
     WHERE student_number LIKE ?
     ORDER BY CAST(SUBSTRING_INDEX(student_number, '-', -1) AS UNSIGNED) DESC
     LIMIT 1`,
    [`${prefix}-%`],
  );

  const latestStudentNumber = rows[0]?.student_number;
  const nextSequence = latestStudentNumber
    ? Number.parseInt(latestStudentNumber.split("-").pop(), 10) + 1
    : 1;

  return `${prefix}-${String(nextSequence).padStart(4, "0")}`;
};
// Pagkatapos ng getNextStudentNumber function, dagdag ito:
const getNextEmployeeId = async (connection = db) => {
  const [rows] = await connection.query(
    `SELECT employee_id
     FROM employee_details
     WHERE employee_id LIKE 'EMP-%'
     ORDER BY CAST(SUBSTRING_INDEX(employee_id, '-', -1) AS UNSIGNED) DESC
     LIMIT 1`
  );

  const latest = rows[0]?.employee_id;
  const nextSeq = latest
    ? Number.parseInt(latest.split("-").pop(), 10) + 1
    : 1;

  return `EMP-${String(nextSeq).padStart(4, "0")}`;
};

export const previewNextEmployeeId = async () => {
  return await getNextEmployeeId();
};
const buildStudentDetailPayload = (studentData, studentNumber) => ({
  student_number: studentNumber || pickValue(studentData, "studentNumber"),
  student_type: pickValue(studentData, "studentType"),
  course: pickValue(studentData, "courseProgram", "course"),
  major: pickValue(studentData, "major"),
  year_level: pickValue(studentData, "yearLevel"),
  previous_school: pickValue(
    studentData,
    "previousSchool",
    "seniorHighSchool",
    "senior_high_school_completed_at",
  ),
  year_graduated: pickValue(
    studentData,
    "yearGraduated",
    "seniorHighYearGraduated",
    "senior_high_school_year_graduated",
  ),
  mailing_address: pickValue(studentData, "mailingAddress"),
  elementary_school_completed_at: pickValue(studentData, "elementarySchool"),
  elementary_school_year_graduated: pickValue(studentData, "elementaryYearGraduated"),
  junior_high_school_completed_at: pickValue(studentData, "juniorHighSchool"),
  junior_high_school_year_graduated: pickValue(studentData, "juniorHighYearGraduated"),
  senior_high_school_completed_at: pickValue(studentData, "seniorHighSchool"),
  senior_high_school_year_graduated: pickValue(studentData, "seniorHighYearGraduated"),
  college_program_course_attended: pickValue(studentData, "collegeProgramAttended"),
  school_year_attended: pickValue(studentData, "schoolYearAttended"),
  father_name: pickValue(studentData, "fatherName"),
  mother_name: pickValue(studentData, "motherName"),
  parent_phone: pickValue(studentData, "parentPhone"),
  academic_year: pickValue(studentData, "academicYear"),
  semester: pickValue(studentData, "semester"),
  civil_status: pickValue(studentData, "civilStatus"),
  religion: pickValue(studentData, "religion"),
  is_pwd: pickValue(studentData, "isPwd", "pwdStatus"),
  indigenous_people: pickValue(studentData, "indigenousPeople"),
  zip_code: pickValue(studentData, "zipCode"),
  date_registered: pickValue(studentData, "dateRegistered") || getCurrentDateValue(),
  permanent_sitio: pickValue(studentData, "permanentSitio"),
  permanent_barangay: pickValue(studentData, "permanentBarangay"),
  permanent_city_municipality: pickValue(
    studentData,
    "permanentCityMunicipality",
  ),
  permanent_province: pickValue(studentData, "permanentProvince"),
  present_sitio: pickValue(studentData, "presentSitio"),
  present_barangay: pickValue(studentData, "presentBarangay"),
  present_city_municipality: pickValue(studentData, "presentCityMunicipality"),
  present_province: pickValue(studentData, "presentProvince"),
  birth_place: pickValue(studentData, "birthPlace"),
  citizenship: pickValue(studentData, "citizenship"),
  father_status: pickValue(studentData, "fatherStatus"),
  father_residence_street: pickValue(studentData, "fatherResidenceStreet"),
  father_residence_barangay: pickValue(studentData, "fatherResidenceBarangay"),
  father_residence_city: pickValue(studentData, "fatherResidenceCity"),
  father_residence_province: pickValue(studentData, "fatherResidenceProvince"),
  father_residence_zip_code: pickValue(studentData, "fatherResidenceZipCode"),
  father_occupation: pickValue(studentData, "fatherOccupation"),
  father_phone: pickValue(studentData, "fatherPhone"),
  mother_status: pickValue(studentData, "motherStatus"),
  mother_residence_street: pickValue(studentData, "motherResidenceStreet"),
  mother_residence_barangay: pickValue(studentData, "motherResidenceBarangay"),
  mother_residence_city: pickValue(studentData, "motherResidenceCity"),
  mother_residence_province: pickValue(studentData, "motherResidenceProvince"),
  mother_residence_zip_code: pickValue(studentData, "motherResidenceZipCode"),
  mother_occupation: pickValue(studentData, "motherOccupation"),
  mother_phone: pickValue(studentData, "motherPhone"),
  guardian_name: pickValue(studentData, "guardianName"),
  guardian_relationship: pickValue(studentData, "guardianRelationship"),
  guardian_residence_street: pickValue(studentData, "guardianResidenceStreet"),
  guardian_residence_barangay: pickValue(studentData, "guardianResidenceBarangay"),
  guardian_residence_city: pickValue(studentData, "guardianResidenceCity"),
  guardian_residence_province: pickValue(studentData, "guardianResidenceProvince"),
  guardian_residence_zip_code: pickValue(studentData, "guardianResidenceZipCode"),
  guardian_occupation: pickValue(studentData, "guardianOccupation"),
  guardian_phone: pickValue(studentData, "guardianPhone"),
  other_financial_assistance: pickValue(
    studentData,
    "otherFinancialAssistance",
    "hasOtherFinancialAssistance",
  ),
  scholarship_assistance_1: pickValue(studentData, "scholarshipAssistance1"),
  scholarship_assistance_2: pickValue(studentData, "scholarshipAssistance2"),
  scholarship_assistance_3: pickValue(studentData, "scholarshipAssistance3"),
});

// Used internally by the login/auth flow only — this one is ALLOWED to
// include password_hash, because the auth controller needs it to verify the
// submitted password. Never pass this function's result straight through to
// an API response; strip password_hash first if you ever expose it.
export const findUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  // console.log("findUserByEmail result:", rows);
  return rows[0];
};

export const findUserById = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      u.*,
${studentDetailSelect},
      e.employee_id,
      e.position_title,
      e.department,
      e.date_hired,
      e.specialization,
      e.educational_attainment,
      e.license_number,
      e.access_level
    FROM users u
    LEFT JOIN student_details s ON u.user_id = s.user_id
    LEFT JOIN employee_details e ON u.user_id = e.user_id
    WHERE u.user_id = ?
  `,
    [userId],
  );
  // Never return password_hash to callers — this result is used to build
  // API responses (e.g. "get current user" / "get user by id").
  return omitSensitiveFields(rows[0]);
};
// Fetch all users with their student or employee details
export const getAllUsers = async (role = null) => {
  let query = `
    SELECT 
      u.*,
${studentDetailSelect},
      e.employee_id,
      e.department,
      e.position_title,
      e.date_hired,
      e.specialization,
      e.educational_attainment,
      e.license_number,
      e.access_level
    FROM users u
    LEFT JOIN student_details s ON u.user_id = s.user_id
    LEFT JOIN employee_details e ON u.user_id = e.user_id`;
  
  if (role) {
    query += ` WHERE u.role = ?`;
  }
  
  const [rows] = role ? await db.query(query, [role]) : await db.query(query);
  // Never return password_hash to callers — this feeds list endpoints like
  // /api/users, which the frontend renders directly (student/faculty pickers,
  // user management tables, etc.).
  return omitSensitiveFieldsFromRows(rows);
};

// Create a new student user
export const createStudentUser = async (userData) => {
  const {
    email,
    passwordHash,
    firstName,
    middleName,
    lastName,
    suffix,
    dateOfBirth,
    gender,
    phone,
    permanentAddress,
    profilePictureUrl,
  } = userData;

  // Start a transaction
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const requestedStudentNumber = pickValue(userData, "studentNumber");
    const studentNumber = requestedStudentNumber || await getNextStudentNumber(connection);
    const studentDetails = buildStudentDetailPayload(userData, studentNumber);
    const studentDetailColumns = Object.keys(studentDetails);
    const studentDetailValues = Object.values(studentDetails);

    const combinedPermanentAddress =
      permanentAddress ||
      joinAddressParts(
        pickValue(userData, "permanentSitio"),
        pickValue(userData, "permanentBarangay"),
        pickValue(userData, "permanentCityMunicipality"),
        pickValue(userData, "permanentProvince"),
        pickValue(userData, "zipCode"),
      );

    // 1️ Insert into users table
    const [userResult] = await connection.query(
      `INSERT INTO users 
       (email, password_hash, role, first_name, middle_name, last_name, suffix, date_of_birth, gender, phone, permanent_address, profile_picture_url, is_verified, verification_code, verification_expires_at)
       VALUES (?, ?, 'Student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        passwordHash, // <-- already hashed
        firstName,
        middleName || null,
        lastName,
        suffix || null,
        dateOfBirth || null,
        gender || null,
        phone || null,
        combinedPermanentAddress || null,
        profilePictureUrl || null,
        userData.isVerified ? 1 : 0,
        userData.verificationCode || null,
        userData.verificationExpiresAt || null,
      ],
    );

    const userId = userResult.insertId;

    // 2️ Insert into student_details table
    await connection.query(
      `INSERT INTO student_details
       (user_id, ${studentDetailColumns.join(", ")})
       VALUES (?, ${studentDetailColumns.map(() => "?").join(", ")})`,
      [userId, ...studentDetailValues],
    );

    // Commit transaction
    await connection.commit();
    connection.release();

    return { userId, studentNumber };
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};

export const previewNextStudentNumber = async () => {
  return await getNextStudentNumber();
};
export const createEmployeeUser = async (userData) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Auto-generate if not provided
    const employeeId = userData.employeeId || await getNextEmployeeId(connection);

    const { email, passwordHash, role = "Employee", firstName, middleName,
      lastName, suffix, dateOfBirth, gender, phone, permanentAddress,
      profilePictureUrl, status = "Active", department, positionTitle,
      dateHired, specialization, educationalAttainment, licenseNumber,
      accessLevel, isVerified = false, verificationCode = null, verificationExpiresAt = null } = userData;

    const [userResult] = await connection.query(
      `INSERT INTO users
        (email, password_hash, role, first_name, middle_name, last_name, suffix,
         date_of_birth, gender, phone, permanent_address, profile_picture_url, status,
         is_verified, verification_code, verification_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, role, firstName, middleName || null, lastName,
       suffix || null, dateOfBirth || null, gender || null, phone || null,
       permanentAddress || null, profilePictureUrl || null, status,
       isVerified ? 1 : 0, verificationCode, verificationExpiresAt],
    );

    const userId = userResult.insertId;

    await connection.query(
      `INSERT INTO employee_details
        (user_id, employee_id, department, position_title, date_hired,
         specialization, educational_attainment, license_number, access_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, employeeId, department || null, positionTitle || null,
       dateHired || null, specialization || null, educationalAttainment || null,
       licenseNumber || null, accessLevel || null],
    );

    await connection.commit();
    connection.release();
    return { userId, employeeId }; // ibalik ang employeeId
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};
// Update a student user
export const updateStudentUser = async (userId, userData) => {
  const {
    email,
    passwordHash, // optional, only update if provided
    firstName,
    middleName,
    lastName,
    suffix,
    dateOfBirth,
    gender,
    phone,
    permanentAddress,
    profilePictureUrl,
    studentNumber,
    course,
    major,
    yearLevel,
    previousSchool,
    seniorHighSchool,
    yearGraduated,
    seniorHighYearGraduated,
    mailingAddress,
    fatherName,
    motherName,
    parentPhone,
  } = userData;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1️ Update users table
    const updateUserFields = [
      email,
      firstName,
      middleName || null,
      lastName,
      suffix || null,
      dateOfBirth || null,
      gender || null,
      phone || null,
      permanentAddress || null,
      profilePictureUrl || null,
    ];

    let query = `
      UPDATE users
      SET email = ?, first_name = ?, middle_name = ?, last_name = ?, suffix = ?, 
          date_of_birth = ?, gender = ?, phone = ?, permanent_address = ?, profile_picture_url = ?
    `;
    if (passwordHash) query += `, password_hash = ?`;

    query += ` WHERE user_id = ?`;

    if (passwordHash) updateUserFields.push(passwordHash);
    updateUserFields.push(userId);

    await connection.query(query, updateUserFields);

    // 2️ Upsert student_details so legacy users without a row can still save profile data.
    await connection.query(
      `INSERT INTO student_details
       (user_id, student_number, course, major, year_level, previous_school, year_graduated, mailing_address, father_name, mother_name, parent_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         student_number = VALUES(student_number),
         course = VALUES(course),
         major = VALUES(major),
         year_level = VALUES(year_level),
         previous_school = VALUES(previous_school),
         year_graduated = VALUES(year_graduated),
         mailing_address = VALUES(mailing_address),
         father_name = VALUES(father_name),
         mother_name = VALUES(mother_name),
         parent_phone = VALUES(parent_phone)`,
      [
        userId,
        studentNumber,
        course,
        major,
        yearLevel,
        previousSchool || seniorHighSchool,
        yearGraduated || seniorHighYearGraduated,
        mailingAddress,
        fatherName,
        motherName,
        parentPhone,
      ],
    );

    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};
export const updateEmployeeUser = async (userId, userData) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1️⃣ Update users table (Partial Update)
    const userFields = [];
    const userValues = [];

    const userMappings = {
      email: "email",
      firstName: "first_name",
      middleName: "middle_name",
      lastName: "last_name",
      suffix: "suffix",
      dateOfBirth: "date_of_birth",
      gender: "gender",
      phone: "phone",
      permanentAddress: "permanent_address",
      profilePictureUrl: "profile_picture_url",
      status: "status",
      passwordHash: "password_hash", // handled separately if needed, but included here for completeness in mapping
    };

    Object.keys(userMappings).forEach((key) => {
      if (userData[key] !== undefined) {
        userFields.push(`${userMappings[key]} = ?`);
        userValues.push(userData[key]);
      }
    });

    if (userFields.length > 0) {
      userValues.push(userId);
      const userQuery = `UPDATE users SET ${userFields.join(", ")} WHERE user_id = ?`;
      await connection.query(userQuery, userValues);
    }

    // 2️⃣ Update employee_details table (Partial Update)
    const employeeFields = [];
    const employeeValues = [];

    const employeeMappings = {
      employeeId: "employee_id",
      department: "department",
      positionTitle: "position_title",
      dateHired: "date_hired",
      specialization: "specialization",
      educationalAttainment: "educational_attainment",
      licenseNumber: "license_number",
      accessLevel: "access_level",
    };

    Object.keys(employeeMappings).forEach((key) => {
      if (userData[key] !== undefined) {
        employeeFields.push(`${employeeMappings[key]} = ?`);
        // Normalize blank form values so nullable DB columns do not receive empty strings.
        if (userData[key] === "") {
          employeeValues.push(null);
        } else {
          employeeValues.push(userData[key]);
        }
      }
    });

    if (employeeFields.length > 0) {
      employeeValues.push(userId);
      const employeeQuery = `UPDATE employee_details SET ${employeeFields.join(", ")} WHERE user_id = ?`;
      await connection.query(employeeQuery, employeeValues);
    }

    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};

//FROM MODEL
export const deleteUser = async (userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete student details if exist
    await connection.query(`DELETE FROM student_details WHERE user_id = ?`, [
      userId,
    ]);

    // Delete employee details if exist
    await connection.query(`DELETE FROM employee_details WHERE user_id = ?`, [
      userId,
    ]);

    // Delete user record
    await connection.query(`DELETE FROM users WHERE user_id = ?`, [userId]);

    await connection.commit();
    connection.release();
    return true;
  } catch (err) {
    await connection.rollback();
    connection.release();
    throw err;
  }
};

/**
 * Update the verification code and expiration timestamp for a user.
 */
export const updateUserVerificationCode = async (email, verificationCode, verificationExpiresAt) => {
  const [result] = await db.query(
    `UPDATE users 
     SET verification_code = ?, verification_expires_at = ? 
     WHERE email = ?`,
    [verificationCode, verificationExpiresAt, email]
  );
  return result.affectedRows > 0;
};

/**
 * Verify user email by matching the code and ensuring it is not expired.
 * On success, sets is_verified = 1 and clears the code.
 */
export const verifyUserEmailInDb = async (email, code) => {
  const [rows] = await db.query(
    `SELECT user_id, email, first_name, last_name, role, is_verified, verification_code, verification_expires_at 
     FROM users 
     WHERE email = ?`,
    [email]
  );

  const user = rows[0];
  if (!user) {
    return { success: false, reason: "USER_NOT_FOUND" };
  }

  if (user.is_verified === 1 || user.is_verified === true) {
    return { success: true, alreadyVerified: true, user };
  }

  if (!user.verification_code || user.verification_code !== code) {
    return { success: false, reason: "INVALID_CODE" };
  }

  const now = new Date();
  const expiresAt = new Date(user.verification_expires_at);
  if (expiresAt < now) {
    return { success: false, reason: "CODE_EXPIRED" };
  }

  // Update user as verified
  await db.query(
    `UPDATE users 
     SET is_verified = 1, verification_code = NULL, verification_expires_at = NULL, email_verified_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`,
    [user.user_id]
  );

  return { success: true, user };
};

/**
 * Retrieve user verification status and details for verification flows.
 */
export const getUserVerificationStatus = async (email) => {
  const [rows] = await db.query(
    `SELECT user_id, email, first_name, last_name, role, is_verified, verification_code, verification_expires_at, email_verified_at 
     FROM users 
     WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
};