import db from "../config/db.js";

const email = "mylene123@gmail.com";
const sql = `
SELECT
  u.user_id,
  u.email,
  u.first_name,
  u.last_name,
  s.student_number,
  s.course,
  s.major,
  s.year_level,
  s.previous_school,
  s.year_graduated,
  s.mailing_address,
  s.father_name,
  s.mother_name,
  s.parent_phone
FROM users u
LEFT JOIN student_details s ON u.user_id = s.user_id
WHERE u.email = ?
`;

try {
  const [rows] = await db.query(sql, [email]);
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
