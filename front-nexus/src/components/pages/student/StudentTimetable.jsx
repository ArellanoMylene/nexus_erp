import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Map day abbreviations to full day names
const parseDayAbbreviations = (dayString) => {
  if (!dayString) {
    console.log("❌ parseDayAbbreviations: dayString is empty/null");
    return [];
  }

  console.log(`📅 Parsing day abbreviations: "${dayString}"`);

  const dayMap = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    TH: "Thursday",
    F: "Friday",
    S: "Saturday",
  };

  const days = [];
  let i = 0;
  while (i < dayString.length) {
    if (dayString.substring(i, i + 2) === "TH") {
      days.push(dayMap["TH"]);
      console.log(`  ✓ Found: Thursday`);
      i += 2;
    } else {
      const char = dayString[i];
      if (dayMap[char]) {
        days.push(dayMap[char]);
        console.log(`  ✓ Found: ${dayMap[char]}`);
      } else {
        console.log(`  ⚠️ Unknown character: "${char}"`);
      }
      i += 1;
    }
  }

  console.log(`  Result: [${days.join(", ")}]`);
  return days;
};

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [selectedDay, setSelectedDay] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("role");

      console.log("🔍 === STUDENT TIMETABLE DEBUG START ===");
      console.log(`👤 User ID: ${userId}, Role: ${userRole}`);

      if (!userId) {
        console.error("❌ User ID not found in localStorage");
        setLoading(false);
        return;
      }

      let response;
      const timetableData = [];

      // Check user role to determine which endpoint to use
      if (userRole === "Faculty") {
        console.log("📚 Mode: FACULTY - Fetching faculty assignments");
        // Faculty: Fetch faculty course assignments
        response = await axios.get(
          `${API_BASE}/api/faculty-assignments/faculty/${userId}`,
        );

        const assignments = response.data.data || [];
        console.log(
          `✅ Fetched ${assignments.length} faculty assignments:`,
          assignments,
        );

        assignments.forEach((assignment, idx) => {
          console.log(
            `\n  [Assignment ${idx}] ${assignment.course_code} - ${assignment.course_title}`,
          );
          if (assignment.schedules && Array.isArray(assignment.schedules)) {
            console.log(`    📅 Schedules: ${assignment.schedules.length}`);
            assignment.schedules.forEach((schedule, schedIdx) => {
              console.log(
                `      [Schedule ${schedIdx}] Day: ${schedule.day}, Time: ${schedule.schedule_time_start}-${schedule.schedule_time_end}`,
              );
              const days = parseDayAbbreviations(schedule.day);
              days.forEach((day) => {
                timetableData.push({
                  day: day,
                  subject_name: assignment.course_title,
                  subject_code: assignment.course_code,
                  section: assignment.section,
                  start_time: schedule.schedule_time_start,
                  end_time: schedule.schedule_time_end,
                  room: assignment.room || "TBA",
                  instructor: assignment.faculty_name || "TBA",
                });
              });
            });
          } else {
            console.log(`    ⚠️ No schedules found`);
          }
        });
      } else {
        console.log("👨‍🎓 Mode: STUDENT - Fetching enrollments with schedules");
        // Student: Fetch from enrollments with section schedule data or faculty assignments
        console.log(
          `📡 Calling: ${API_BASE}/api/enrollments/student/${userId}`,
        );
        response = await axios.get(
          `${API_BASE}/api/enrollments/student/${userId}`,
        );

        const enrollments = response.data || [];
        console.log(
          `✅ Fetched ${enrollments.length} enrollments:`,
          enrollments,
        );

        enrollments.forEach((enrollment, idx) => {
          console.log(
            `\n  [Enrollment ${idx}] ${enrollment.course_code} - ${enrollment.course_title}`,
          );
          console.log(
            `    Section: ${enrollment.section_name}, Room: ${enrollment.room}`,
          );
          console.log(`    Instructor: ${enrollment.instructor_name}`);
          console.log(`    Schedule fields:`);
          console.log(`      - schedule_day: ${enrollment.schedule_day}`);
          console.log(
            `      - schedule_time_start: ${enrollment.schedule_time_start}`,
          );
          console.log(
            `      - schedule_time_end: ${enrollment.schedule_time_end}`,
          );
          console.log(
            `      - final_schedule_day: ${enrollment.final_schedule_day}`,
          );
          console.log(
            `      - final_schedule_time_start: ${enrollment.final_schedule_time_start}`,
          );
          console.log(
            `      - final_schedule_time_end: ${enrollment.final_schedule_time_end}`,
          );

          // Use final_schedule fields which combine section data + faculty assignment data
          const scheduleDay =
            enrollment.final_schedule_day || enrollment.schedule_day;
          const scheduleStart =
            enrollment.final_schedule_time_start ||
            enrollment.schedule_time_start;
          const scheduleEnd =
            enrollment.final_schedule_time_end || enrollment.schedule_time_end;

          console.log(
            `    Using: Day=${scheduleDay}, Start=${scheduleStart}, End=${scheduleEnd}`,
          );

          // Check if enrollment has schedule information
          if (scheduleDay && scheduleStart && scheduleEnd) {
            console.log(`    ✅ Has schedule - parsing days...`);
            const days = parseDayAbbreviations(scheduleDay);
            console.log(`    → Parsed days: [${days.join(", ")}]`);
            days.forEach((day) => {
              timetableData.push({
                day: day,
                subject_name: enrollment.course_title,
                subject_code: enrollment.course_code,
                section: enrollment.section_name || "TBA",
                start_time: scheduleStart,
                end_time: scheduleEnd,
                room: enrollment.room || "TBA",
                instructor: enrollment.instructor_name || "TBA",
              });
            });
          } else {
            // If no schedule, add as fallback entry
            console.log(`    ❌ No schedule found - adding fallback to Monday`);
            timetableData.push({
              day: "Monday",
              subject_name: enrollment.course_title,
              subject_code: enrollment.course_code,
              section: enrollment.section_name || "TBA",
              start_time: "TBA",
              end_time: "TBA",
              room: enrollment.room || "TBA",
              instructor: enrollment.instructor_name || "TBA",
            });
          }
        });
      }

      console.log(`\n📊 Final timetable entries: ${timetableData.length}`);
      console.log("📋 Timetable data:", timetableData);

      setTimetable(timetableData);
      setLoading(false);
      console.log("🔍 === STUDENT TIMETABLE DEBUG END ===\n");
    } catch (error) {
      console.error("❌ Error fetching timetable:", error);
      console.error("   Error message:", error.message);
      if (error.response) {
        console.error("   Response status:", error.response.status);
        console.error("   Response data:", error.response.data);
      }
      setLoading(false);
    }
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetable
      .filter((t) => t.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  return (
    <div className="dark:bg-slate-900 p-3 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-7xl mx-auto space-y-4 font-sans">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600" />
            My Timetable
          </h2>
        </div>

        {/* Day Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDay("all")}
            className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap ${
              selectedDay === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            All Days
          </button>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap ${
                selectedDay === day
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Debug Panel */}
        <div className="bg-slate-800 text-slate-100 p-4 rounded-lg font-mono text-xs space-y-2 mb-4">
          <div className="font-bold text-indigo-300">📊 DEBUG INFO</div>
          <div>👤 User ID: {localStorage.getItem("userId")}</div>
          <div>👥 Role: {localStorage.getItem("role")}</div>
          <div>📚 Total Classes: {timetable.length}</div>
          <div>📅 Classes by day:</div>
          <div className="ml-4">
            {days.map((day) => (
              <div key={day}>
                {day}: {timetable.filter((t) => t.day === day).length} class(es)
              </div>
            ))}
          </div>
          {timetable.length > 0 && (
            <>
              <div>📝 Sample class:</div>
              <div className="ml-4 bg-slate-700 p-2 rounded">
                <div>
                  Course: {timetable[0].subject_code} -{" "}
                  {timetable[0].subject_name}
                </div>
                <div>Day: {timetable[0].day}</div>
                <div>
                  Time: {timetable[0].start_time} - {timetable[0].end_time}
                </div>
                <div>Room: {timetable[0].room}</div>
              </div>
            </>
          )}
          <button
            onClick={() => console.table(timetable)}
            className="mt-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
          >
            📋 Show Full Data in Console
          </button>
        </div>

        {/* Timetable Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                Loading timetable...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {days.map((day) => {
              const classes = groupedByDay[day];
              if (selectedDay !== "all" && selectedDay !== day) return null;

              return (
                <div
                  key={day}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    {day}
                  </h3>
                  <div className="space-y-2">
                    {classes.length === 0 ? (
                      <p className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">
                        No classes scheduled
                      </p>
                    ) : (
                      classes.map((classItem, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {classItem.subject_name}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                Section: {classItem.section}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                              <Clock size={12} />
                              {classItem.start_time} - {classItem.end_time}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <BookOpen size={12} />
                              {classItem.subject_code}
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <MapPin size={12} />
                              {classItem.room}
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Users size={12} />
                              {classItem.instructor}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
