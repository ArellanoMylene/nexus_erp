import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "supersecretkey" || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return secret;
};

export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "1d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

const authCookieOptions = () => {
  const sameSite = String(process.env.AUTH_COOKIE_SAME_SITE || "lax").toLowerCase();
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("AUTH_COOKIE_SAME_SITE must be lax, strict, or none");
  }
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
  if (process.env.AUTH_COOKIE_DOMAIN) options.domain = process.env.AUTH_COOKIE_DOMAIN;
  return options;
};

export const setAuthCookie = (res, token) => {
  res.cookie("nexus_session", token, authCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = authCookieOptions();
  delete options.maxAge;
  res.clearCookie("nexus_session", options);
};

export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.nexus_session;

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const roleIs = (user, ...roles) => roles.some(
  (role) => String(user?.role || "").toLowerCase() === role.toLowerCase(),
);

const deny = (res) => res.status(403).json({ message: "You do not have permission to access this resource" });

export const enforceApiAccess = (req, res, next) => {
  const path = req.originalUrl.split("?")[0].replace(/\/$/, "") || "/";
  const method = req.method.toUpperCase();
  const userId = String(req.user?.userId ?? req.user?.user_id ?? "");
  const resourcePath = path.replace(/^\/api/, "");

  // Public registration and reference data required by the sign-up screen.
  const isSelfProfileUpdate = /^\/users\/(student|employee)\/[^/]+$/.test(resourcePath)
    && method === "PUT"
    && resourcePath.split("/").at(-1) === userId;
  if (isSelfProfileUpdate) return next();

  const adminOnlyPrefixes = [
    "/course", "/courses", "/programs", "/academic-periods", "/dept",
    "/prerequisites", "/faculty-advisory",
    "/faculty-evaluations", "/grade-computation-settings", "/rbac",
    "/system-settings", "/inventory", "/rooms",
  ];
  if (adminOnlyPrefixes.some((prefix) => resourcePath === prefix || resourcePath.startsWith(`${prefix}/`))) {
    return method === "GET" || roleIs(req.user, "Admin") ? next() : deny(res);
  }

  const adminOnlyResources = ["/academic-history", "/clearances", "/course-transfers"];
  if (adminOnlyResources.some((prefix) => resourcePath === prefix || resourcePath.startsWith(`${prefix}/`))) {
    return roleIs(req.user, "Admin") ? next() : deny(res);
  }

  const facultyAssignments = resourcePath.match(/^\/faculty-assignments\/faculty\/([^/]+)$/);
  if (facultyAssignments && method === "GET") {
    return roleIs(req.user, "Admin") || facultyAssignments[1] === userId ? next() : deny(res);
  }
  if (resourcePath === "/faculty-assignments" || resourcePath.startsWith("/faculty-assignments/")) {
    return roleIs(req.user, "Admin") ? next() : deny(res);
  }

  if (resourcePath === "/reports" || resourcePath.startsWith("/reports/")) {
    if (resourcePath === "/reports/payroll" || resourcePath.startsWith("/reports/payroll/")) {
      return roleIs(req.user, "Admin", "HR", "Accounting") ? next() : deny(res);
    }
    return roleIs(req.user, "Admin") ? next() : deny(res);
  }

  if (resourcePath === "/users" || resourcePath.startsWith("/users/")) {
    if (resourcePath === "/users" && method === "GET") {
      const requestedRole = String(req.query?.role || "").trim().toLowerCase();
      if (requestedRole === "student" && roleIs(req.user, "Admin", "HR", "Accounting", "Staff")) return next();
      if (requestedRole === "faculty" && roleIs(req.user, "Admin", "HR", "Staff")) return next();
      // Accounting needs role-filtered recipients for student and employee
      // invoices. Keep this limited to the known invoice recipient roles.
      const invoiceRecipientRoles = new Set(["faculty", "admin", "hr", "accounting", "staff"]);
      if (invoiceRecipientRoles.has(requestedRole) && roleIs(req.user, "Accounting")) return next();
    }
    if (/^\/users\/[^/]+$/.test(resourcePath) && method === "GET"
      && resourcePath.split("/").at(-1) === userId) return next();
    // Profile edits are limited to the account owner (or authorized administrators).
    if (/^\/users\/(student|employee)\/[^/]+$/.test(resourcePath) && method === "PUT") {
      return roleIs(req.user, "Admin", "HR") || resourcePath.split("/").at(-1) === userId
        ? next()
        : deny(res);
    }
    return roleIs(req.user, "Admin", "HR") ? next() : deny(res);
  }

  if (/^\/(enrollments|invoices|payments)\/student\/[^/]+$/.test(resourcePath) && method === "GET") {
    const requestedUserId = resourcePath.split("/").at(-1);
    return roleIs(req.user, "Admin", "HR", "Accounting") || requestedUserId === userId
      ? next()
      : deny(res);
  }

  if (/^\/calendar\/student\/[^/]+\/exams$/.test(resourcePath) && method === "GET") {
    const requestedUserId = resourcePath.split("/").at(-2);
    return roleIs(req.user, "Admin", "Faculty") || requestedUserId === userId
      ? next()
      : deny(res);
  }

  if (resourcePath === "/calendar/unified" && req.query.student_id) {
    return roleIs(req.user, "Admin", "Faculty") || String(req.query.student_id) === userId
      ? next()
      : deny(res);
  }

  if (resourcePath === "/payroll/my-payslips" && method === "GET") return next();

  const employeeByUser = resourcePath.match(/^\/employees\/by-user\/([^/]+)$/);
  if (employeeByUser && method === "GET") {
    return roleIs(req.user, "Admin", "HR", "Accounting") || employeeByUser[1] === userId ? next() : deny(res);
  }

  if (["/payroll", "/employees", "/deductions"].some(
    (prefix) => resourcePath === prefix || resourcePath.startsWith(`${prefix}/`),
  )) {
    return roleIs(req.user, "Admin", "HR") ? next() : deny(res);
  }

  if (["/accounting", "/payments", "/payment-gateway", "/invoices", "/tuition-fees", "/income-expenses"].some(
    (prefix) => resourcePath === prefix || resourcePath.startsWith(`${prefix}/`),
  )) {
    if (resourcePath === "/payments" && method === "POST") {
      return roleIs(req.user, "Admin", "Accounting")
        || String(req.body?.student_id ?? "") === userId
        ? next()
        : deny(res);
    }
    if (resourcePath === "/invoices/my-invoices" && method === "GET") return next();
    if (resourcePath === "/tuition-fees/student-schedule" && method === "GET") return next();
    const isActiveGatewayLookup = resourcePath === "/payment-gateway/config/active" && method === "GET";
    if (isActiveGatewayLookup) return next();
    if (resourcePath.startsWith("/payment-gateway/transactions") && method === "POST") return next();
    return roleIs(req.user, "Admin", "Accounting") ? next() : deny(res);
  }

  if (resourcePath.startsWith("/auth/change-password/") && method === "POST") {
    const requestedUserId = resourcePath.split("/").at(-1);
    return roleIs(req.user, "Admin") || requestedUserId === userId ? next() : deny(res);
  }

  return next();
};
