import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "1d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

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
