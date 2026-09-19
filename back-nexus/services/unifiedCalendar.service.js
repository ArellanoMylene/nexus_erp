import db from "../config/db.js";

const UnifiedCalendarService = {
  /**
   * Get unified calendar data combining exams, events, and school calendar items
   * Optionally filters by student enrollment sections
   */
  getUnifiedCalendar: async (filters = {}) => {
    try {
      const { student_id, section_id, date_from, date_to, type_filter } =
        filters;

      const results = {
        exams: [],
        events: [],
        calendar: [],
      };

      // Query 1: Exam Schedules with Exam Details
      try {
        let examParams = [];
        let examQuery = `
          SELECT 
            es.schedule_id as id,
            'exam' as type,
            e.exam_name as title,
            'Exam' as description,
            e.exam_type,
            e.exam_duration,
            es.exam_date as date,
            es.exam_date as end_date,
            es.start_time,
            es.end_time,
            COALESCE(es.venue, 'TBA') as location,
            COALESCE(e.course_id, 0) as course_id,
            COALESCE(c.title, 'Unknown Subject') as subject,
            COALESCE(c.code, 'N/A') as course_code,
            COALESCE(s.section_name, 'N/A') as section,
            COALESCE(es.proctor_id, 0) as proctor_id,
            NULL as max_students,
            COALESCE(es.status, 'scheduled') as status,
            'exam' as category,
            DATEDIFF(es.exam_date, CURDATE()) as days_remaining
          FROM exam_schedules es
          LEFT JOIN exams e ON es.exam_id = e.exam_id
          LEFT JOIN courses c ON e.course_id = c.course_id
          LEFT JOIN sections s ON es.section_id = s.section_id
          WHERE 1=1
        `;

        if (date_from) {
          examQuery += " AND es.exam_date >= ?";
          examParams.push(date_from);
        }
        if (date_to) {
          examQuery += " AND es.exam_date <= ?";
          examParams.push(date_to);
        }

        examQuery += " ORDER BY es.exam_date ASC LIMIT 500";

        const [examResults] = await db.query(examQuery, examParams);
        results.exams = Array.isArray(examResults) ? examResults : [];
        console.log(
          `✓ Successfully fetched ${results.exams.length} exam schedules`,
        );
      } catch (examError) {
        console.warn("⚠ Could not fetch exam schedules:", examError.message);
        results.exams = [];
      }

      // Query 2: Events (general events + academic calendar events)
      try {
        const generalEventParams = [];
        const academicEventParams = [];

        let generalEventsQuery = `
          SELECT 
            e.event_id as id,
            'event' as type,
            COALESCE(e.event_name, 'Event') as title,
            COALESCE(e.description, '') as description,
            COALESCE(e.event_type, 'event') as event_type,
            DATE(e.start_date) as date,
            DATE(COALESCE(e.end_date, e.start_date)) as end_date,
            TIME(e.start_date) as start_time,
            TIME(e.end_date) as end_time,
            COALESCE(e.venue, 'TBA') as location,
            'all' as target_audience,
            NULL as subject,
            NULL as course_code,
            NULL as section,
            NULL as proctor_id,
            COALESCE(e.max_participants, 0) as max_students,
            COALESCE(e.status, 'scheduled') as status,
            COALESCE(e.event_category, 'event') as category,
            DATEDIFF(DATE(COALESCE(e.end_date, e.start_date)), CURDATE()) as days_remaining
          FROM events e
          WHERE 1=1
        `;

        let academicEventsQuery = `
          SELECT 
            ae.event_id as id,
            'event' as type,
            COALESCE(ae.event_name, 'Academic Event') as title,
            COALESCE(ae.description, '') as description,
            COALESCE(ae.event_type, 'academic') as event_type,
            DATE(ae.start_date) as date,
            DATE(COALESCE(ae.end_date, ae.start_date)) as end_date,
            TIME(ae.start_date) as start_time,
            TIME(ae.end_date) as end_time,
            COALESCE(ae.location, 'TBA') as location,
            COALESCE(ae.target_audience, 'all') as target_audience,
            NULL as subject,
            NULL as course_code,
            NULL as section,
            NULL as proctor_id,
            NULL as max_students,
            'scheduled' as status,
            'academic' as category,
            DATEDIFF(DATE(COALESCE(ae.end_date, ae.start_date)), CURDATE()) as days_remaining
          FROM academic_events ae
          WHERE COALESCE(ae.target_audience, 'all') IN ('all', 'students')
        `;

        if (date_from) {
          generalEventsQuery += " AND DATE(e.start_date) >= ?";
          academicEventsQuery += " AND DATE(ae.start_date) >= ?";
          generalEventParams.push(date_from);
          academicEventParams.push(date_from);
        }
        if (date_to) {
          generalEventsQuery += " AND DATE(e.start_date) <= ?";
          academicEventsQuery += " AND DATE(ae.start_date) <= ?";
          generalEventParams.push(date_to);
          academicEventParams.push(date_to);
        }

        const eventParams = [...generalEventParams, ...academicEventParams];

        const eventQuery = `
          SELECT * FROM (
            ${generalEventsQuery}
            UNION ALL
            ${academicEventsQuery}
          ) combined_events
          ORDER BY date ASC
          LIMIT 500
        `;

        const [eventResults] = await db.query(eventQuery, eventParams);
        results.events = Array.isArray(eventResults) ? eventResults : [];
        console.log(`✓ Successfully fetched ${results.events.length} events`);
      } catch (eventError) {
        console.warn("⚠ Could not fetch events:", eventError.message);
        results.events = [];
      }

      // Query 3: School Calendar Items
      try {
        let calendarParams = [];
        let calendarQuery = `
          SELECT 
            sc.calendar_id as id,
            'calendar' as type,
            COALESCE(sc.event_title, 'Calendar Item') as title,
            COALESCE(sc.event_description, '') as description,
            COALESCE(sc.calendar_type, 'event') as event_type,
            DATE(sc.start_date) as date,
            DATE(COALESCE(sc.end_date, sc.start_date)) as end_date,
            NULL as start_time,
            NULL as end_time,
            NULL as location,
            NULL as subject,
            NULL as course_code,
            NULL as section,
            NULL as proctor_id,
            NULL as max_students,
            COALESCE(sc.status, 'active') as status,
            'calendar' as category,
            DATEDIFF(DATE(sc.start_date), CURDATE()) as days_remaining
          FROM school_calendar sc
          WHERE 1=1
        `;

        if (date_from) {
          calendarParams.push(date_from);
          calendarQuery += " AND DATE(sc.start_date) >= ?";
        }
        if (date_to) {
          calendarParams.push(date_to);
          calendarQuery += " AND DATE(sc.start_date) <= ?";
        }

        calendarQuery += " ORDER BY sc.start_date ASC LIMIT 500";

        const [calendarResults] = await db.query(calendarQuery, calendarParams);
        results.calendar = Array.isArray(calendarResults)
          ? calendarResults
          : [];
        console.log(
          `✓ Successfully fetched ${results.calendar.length} calendar items`,
        );
      } catch (calendarError) {
        console.warn(
          "⚠ Could not fetch calendar items:",
          calendarError.message,
        );
        results.calendar = [];
      }

      // Combine results
      let combined = [...results.exams, ...results.events, ...results.calendar];

      // Apply type filter if specified
      if (type_filter) {
        combined = combined.filter((item) => item.type === type_filter);
      }

      // Sort by date
      combined.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateA - dateB;
      });

      return {
        success: true,
        data: combined,
        count: combined.length,
      };
    } catch (error) {
      console.error("Error in getUnifiedCalendar:", error);
      throw new Error(`Failed to fetch unified calendar: ${error.message}`);
    }
  },

  /**
   * Get only exam schedules for a specific student
   */
  getStudentExams: async (student_id, filters = {}) => {
    try {
      if (!student_id) {
        return {
          success: false,
          data: [],
          message: "Student ID is required",
        };
      }

      let query = `
        SELECT 
          es.schedule_id as id,
          e.exam_id,
          e.exam_name as title,
          e.exam_type,
            e.exam_duration,
          es.exam_date as date,
          es.start_time,
          es.end_time,
          es.venue as location,
          c.title as subject,
          c.code as course_code,
          s.section_name,
          u.first_name as proctor_first_name,
          u.last_name as proctor_last_name,
          NULL as max_students,
          es.status,
          DATEDIFF(es.exam_date, CURDATE()) as days_remaining
        FROM exam_schedules es
        LEFT JOIN exams e ON es.exam_id = e.exam_id
        LEFT JOIN courses c ON e.course_id = c.course_id
        LEFT JOIN sections s ON es.section_id = s.section_id
        LEFT JOIN users u ON es.proctor_id = u.user_id
        LEFT JOIN enrollments enr ON enr.section_id = s.section_id
        WHERE (enr.student_id = ? OR es.section_id IN (
          SELECT section_id FROM enrollments WHERE student_id = ?
        ))
        AND es.exam_date >= CURDATE()
        ORDER BY es.exam_date ASC
      `;

      try {
        const [results] = await db.query(query, [student_id, student_id]);
        return {
          success: true,
          data: results || [],
          count: (results || []).length,
        };
      } catch (queryError) {
        console.error("Query error in getStudentExams:", queryError);
        // Fallback: Try simpler query
        const fallbackQuery = `
          SELECT 
            es.schedule_id as id,
            es.exam_id,
            e.exam_duration,
            es.exam_date as date,
            es.start_time,
            es.end_time,
            es.venue as location,
            es.status
          FROM exam_schedules es
          WHERE es.exam_date >= CURDATE()
          ORDER BY es.exam_date ASC
          LIMIT 100
        `;
        const [fallbackResults] = await db.query(fallbackQuery);
        return {
          success: true,
          data: fallbackResults || [],
          count: (fallbackResults || []).length,
        };
      }
    } catch (error) {
      console.error("Error in getStudentExams:", error);
      throw new Error(`Failed to fetch student exams: ${error.message}`);
    }
  },

  /**
   * Get only events for students
   */
  getStudentEvents: async (filters = {}) => {
    try {
      const { date_from, date_to } = filters;

      let generalEventsQuery = `
        SELECT 
          e.event_id as id,
          e.event_name as title,
          COALESCE(e.description, '') as description,
          e.event_type,
          DATE(e.start_date) as date,
          DATE(COALESCE(e.end_date, e.start_date)) as end_date,
          TIME(e.start_date) as start_time,
          TIME(e.end_date) as end_time,
          e.venue as location,
          'all' as target_audience,
          COALESCE(e.event_category, 'event') as event_category,
          e.status,
          e.max_participants,
          COALESCE(e.registration_required, 0) as registration_required,
          DATEDIFF(DATE(COALESCE(e.end_date, e.start_date)), CURDATE()) as days_remaining
        FROM events e
        WHERE DATE(e.start_date) >= CURDATE()
      `;

      let academicEventsQuery = `
        SELECT 
          ae.event_id as id,
          ae.event_name as title,
          COALESCE(ae.description, '') as description,
          COALESCE(ae.event_type, 'academic') as event_type,
          DATE(ae.start_date) as date,
          DATE(COALESCE(ae.end_date, ae.start_date)) as end_date,
          TIME(ae.start_date) as start_time,
          TIME(ae.end_date) as end_time,
          ae.location as location,
          COALESCE(ae.target_audience, 'all') as target_audience,
          'academic' as event_category,
          'scheduled' as status,
          NULL as max_participants,
          0 as registration_required,
          DATEDIFF(DATE(COALESCE(ae.end_date, ae.start_date)), CURDATE()) as days_remaining
        FROM academic_events ae
        WHERE DATE(ae.start_date) >= CURDATE()
          AND COALESCE(ae.target_audience, 'all') IN ('all', 'students')
      `;

      const generalEventParams = [];
      const academicEventParams = [];

      if (date_from) {
        generalEventsQuery += " AND DATE(e.start_date) >= ?";
        academicEventsQuery += " AND DATE(ae.start_date) >= ?";
        generalEventParams.push(date_from);
        academicEventParams.push(date_from);
      }
      if (date_to) {
        generalEventsQuery += " AND DATE(e.start_date) <= ?";
        academicEventsQuery += " AND DATE(ae.start_date) <= ?";
        generalEventParams.push(date_to);
        academicEventParams.push(date_to);
      }

      const params = [...generalEventParams, ...academicEventParams];

      const query = `
        SELECT * FROM (
          ${generalEventsQuery}
          UNION ALL
          ${academicEventsQuery}
        ) combined_student_events
        ORDER BY date ASC
        LIMIT 500
      `;

      try {
        const [results] = await db.query(query, params);
        return {
          success: true,
          data: results || [],
          count: (results || []).length,
        };
      } catch (queryError) {
        console.error("Query error in getStudentEvents:", queryError);
        // Fallback: Return empty array
        return {
          success: true,
          data: [],
          count: 0,
        };
      }
    } catch (error) {
      console.error("Error in getStudentEvents:", error);
      throw new Error(`Failed to fetch student events: ${error.message}`);
    }
  },
};

export default UnifiedCalendarService;
