import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const helpersDirectory = path.dirname(fileURLToPath(import.meta.url));

// On Hostinger, point UPLOAD_DIR to a directory outside hbuilds/ and
// public_html/. The in-project folder remains the local-development fallback.
export const getUploadsRoot = () => path.resolve(
  process.env.UPLOAD_DIR || path.join(helpersDirectory, "../public/uploads"),
);

export const ensureUploadDirectory = (...segments) => {
  const uploadsRoot = getUploadsRoot();
  const directory = path.resolve(uploadsRoot, ...segments);
  if (directory !== uploadsRoot && !directory.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("Invalid upload directory");
  }
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

export const resolveUploadPath = (uploadUrl) => {
  const uploadsRoot = getUploadsRoot();
  const relativePath = String(uploadUrl || "").replace(/^\/uploads\/?/, "");
  const filePath = path.resolve(uploadsRoot, relativePath);
  if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("Invalid upload path");
  }
  return filePath;
};
