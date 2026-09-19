import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  FileText,
  Clock,
  MapPin,
  Users,
  BookOpen,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const StudentCalendar = () => {
  const [activeTab, setActiveTab] = useState("exams");
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "exams") {
        await fetchExams();
      } else {
        await fetchEvents();
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchExams = async () => {
    try {
      // Use unified calendar endpoint, filtered for exams only
      const response = await axios.get(
        `${API_BASE}/api/calendar/unified?type=exam`,
        {
          headers: {
            user: localStorage.getItem("user"),
          },
        },
      );

      const data = response.data?.data || [];

      // Map unified response to component format
      const examEvents = data.map((e) => ({
        exam_id: e.id,
        subject_name: e.subject || e.course_code || "Unknown",
        title: e.title || "Exam",
        exam_type: e.exam_type || "midterm",
        exam_duration: e.exam_duration,
        exam_date: e.date,
        start_time: e.start_time,
        end_time: e.end_time,
        room: e.location || "TBA",
        description: e.description,
        section: e.section,
        proctor_name:
          e.proctor_first_name && e.proctor_last_name
            ? `${e.proctor_first_name} ${e.proctor_last_name}`
            : "TBA",
        status: e.status,
        daysRemaining: e.days_remaining,
      }));

      setExams(examEvents);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setExams([]);
      throw new Error("Failed to fetch exam schedule");
    }
  };

  const fetchEvents = async () => {
    try {
      // Use unified calendar endpoint, filtered for non-exam types
      const response = await axios.get(`${API_BASE}/api/calendar/unified`, {
        headers: {
          user: localStorage.getItem("user"),
        },
      });

      const data = response.data?.data || [];

      // Filter out exams and calendar items, keep only events
      const calendarEvents = data
        .filter((e) => e.type === "event")
        .map((e) => ({
          event_id: e.id,
          title: e.title,
          description: e.description,
          event_type: e.event_type || e.type || "academic",
          event_date: e.date,
          end_date: e.end_date || e.date,
          start_time: e.start_time,
          end_time: e.end_time,
          location: e.location,
          target_audience: e.target_audience || "All Students",
          registration_required: e.registration_required || false,
          category: e.category,
          status: e.status,
          daysRemaining: e.days_remaining,
        }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      throw new Error("Failed to fetch events");
    }
  };

  const getExamTypeColor = (type) => {
    const colors = {
      midterm:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      final:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      quiz: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      prelim:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
    return (
      colors[type] ||
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
    );
  };

  const getEventTypeColor = (type) => {
    const colors = {
      academic:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      cultural:
        "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      sports:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      social:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      orientation:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return (
      colors[type] ||
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
    );
  };

  const getEventTimingStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);

    // Treat end date as inclusive through the end of day.
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "past";
  };

  const formatEventDateRange = (startDate, endDate) => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    }

    return `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
  };

  const formatClockTime = (timeValue) => {
    if (!timeValue) return "";

    const rawValue = String(timeValue).trim();

    const twelveHourMatch = rawValue.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i,
    );
    if (twelveHourMatch) {
      const hour = parseInt(twelveHourMatch[1], 10);
      const minute = parseInt(twelveHourMatch[2], 10);
      const meridiem = twelveHourMatch[3].toUpperCase();
      const normalizedHour =
        hour === 0 ? 12 : hour > 12 ? ((hour - 1) % 12) + 1 : hour;
      return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`;
    }

    const twentyFourHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHourMatch) {
      const hour = parseInt(twentyFourHourMatch[1], 10);
      const minute = parseInt(twentyFourHourMatch[2], 10);
      const meridiem = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`;
    }

    return rawValue;
  };

  const addMinutesToTime = (startTime, durationMinutes) => {
    if (!startTime || durationMinutes === undefined || durationMinutes === null) {
      return "";
    }

    const parsedDuration = parseInt(durationMinutes, 10);
    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      return "";
    }

    const rawValue = String(startTime).trim();
    const twelveHourMatch = rawValue.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i,
    );

    let hours;
    let minutes;

    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = parseInt(twelveHourMatch[2], 10);
      const meridiem = twelveHourMatch[3].toUpperCase();

      if (hours === 12) {
        hours = meridiem === "AM" ? 0 : 12;
      } else if (meridiem === "PM") {
        hours += 12;
      }
    } else {
      const twentyFourHourMatch = rawValue.match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/,
      );

      if (!twentyFourHourMatch) {
        return "";
      }

      hours = parseInt(twentyFourHourMatch[1], 10);
      minutes = parseInt(twentyFourHourMatch[2], 10);
    }

    const totalMinutes = hours * 60 + minutes + parsedDuration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return formatClockTime(
      `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`,
    );
  };

  const formatExamTimeRange = (startTime, endTime, durationMinutes) => {
    const formattedStart = formatClockTime(startTime);
    const computedEnd = addMinutesToTime(startTime, durationMinutes);
    const formattedEnd = computedEnd || formatClockTime(endTime);

    if (!formattedStart && !formattedEnd) {
      return "All day";
    }

    if (!formattedEnd || formattedStart === formattedEnd) {
      return formattedStart || formattedEnd || "All day";
    }

    return `${formattedStart} - ${formattedEnd}`;
  };

  const formatEventTime = (startTime, endTime) => {
    const isMidnight = (value) =>
      value === "00:00" || value === "00:00:00" || value === "12:00 AM";

    if ((!startTime && !endTime) || (isMidnight(startTime) && isMidnight(endTime))) {
      return "All day";
    }

    const formatTime = (timeValue) => formatClockTime(timeValue);

    if (startTime && endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    if (startTime) {
      return formatTime(startTime);
    }

    return endTime ? formatTime(endTime) : "All day";
  };

  const tabs = [
    { id: "exams", label: "Exam Schedule", icon: FileText },
    { id: "events", label: "School Events", icon: CalendarIcon },
  ];

  return (
   <div className="dark:bg-slate-900 px-4 py-3 transition-colors duration-500">
      <div className="w-full space-y-2 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon size={24} className="text-indigo-600" />
            Academic Calendar
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Exams & Events
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            <p className="font-semibold">Error Loading Calendar</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-3">
              Loading calendar...
            </p>
          </div>
        )}

        {/* Exam Schedule Tab */}
        {!loading && activeTab === "exams" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {exams.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={48} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No upcoming exams scheduled
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Section
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Proctor
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {exams.map((exam) => (
                      <tr
                        key={exam.exam_id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {new Date(exam.exam_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {exam.subject_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {exam.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatExamTimeRange(
                            exam.start_time,
                            exam.end_time,
                            exam.exam_duration,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin
                              size={14}
                              className="text-slate-400 flex-shrink-0"
                            />
                            {exam.room}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {exam.section || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {exam.proctor_name || "TBA"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${getExamTypeColor(exam.exam_type)}`}
                          >
                            {exam.exam_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {getEventTimingStatus(
                            exam.exam_date,
                            exam.exam_date,
                          ) !== "past" ? (
                            <div>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                                {getEventTimingStatus(
                                  exam.exam_date,
                                  exam.exam_date,
                                ) === "ongoing"
                                  ? "Ongoing"
                                  : "Upcoming"}
                              </span>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {exam.daysRemaining !== undefined &&
                                exam.daysRemaining !== null
                                  ? `${Math.max(0, exam.daysRemaining)}d left`
                                  : `${Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24))}d left`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              Past
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* School Events Tab */}
        {!loading && activeTab === "events" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarIcon
                  size={48}
                  className="mx-auto text-slate-400 mb-3"
                />
                <p className="text-slate-500 dark:text-slate-400">
                  No upcoming events
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Event Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Audience
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {events.map((event) => (
                      <tr
                        key={event.event_id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {formatEventDateRange(event.event_date, event.end_date)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {event.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {event.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatEventTime(event.start_time, event.end_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {event.location ? (
                            <div className="flex items-center gap-1">
                              <MapPin
                                size={14}
                                className="text-slate-400 flex-shrink-0"
                              />
                              {event.location}
                            </div>
                          ) : (
                            "TBA"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Users
                              size={14}
                              className="text-slate-400 flex-shrink-0"
                            />
                            {event.target_audience}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${getEventTypeColor(event.event_type)}`}
                          >
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {getEventTimingStatus(
                            event.event_date,
                            event.end_date,
                          ) !== "past" ? (
                            <div>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                                {getEventTimingStatus(
                                  event.event_date,
                                  event.end_date,
                                ) === "ongoing"
                                  ? "Ongoing"
                                  : "Upcoming"}
                              </span>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {event.daysRemaining !== undefined &&
                                event.daysRemaining !== null
                                  ? `${Math.max(0, event.daysRemaining)}d left`
                                  : `${Math.ceil((new Date(event.end_date || event.event_date) - new Date()) / (1000 * 60 * 60 * 24))}d left`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              Past
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCalendar;
