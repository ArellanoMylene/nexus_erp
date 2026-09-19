import React, { useState, useEffect, useRef } from "react";
import { X, Download, Loader, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up PDF.js worker with bundled worker
const pdfjsWorkerURL = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
);
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerURL.href;

// Cache for loaded PDFs
const pdfCache = new Map();

// Resolve relative paths to full backend URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const resolveUrl = (url) =>
  url?.startsWith("http") ? url : `${API_BASE}${url}`;

const DocumentViewer = ({ fileUrl, fileName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderProgress, setRenderProgress] = useState(0);
  const [docxHtml, setDocxHtml] = useState("");
  const pdfCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const cancelTokenRef = useRef(null);

  const getFileExtension = (filename) => {
    return filename?.split(".").pop()?.toLowerCase() || "";
  };

  const fileExt = getFileExtension(fileName);
  const isPDF = fileExt === "pdf";
  const isDOCX = fileExt === "docx" || fileExt === "doc";
  const isText = ["txt", "md"].includes(fileExt);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt);

  // Full URL used for fetch/PDF.js (fixes relative path issue in Vite dev)
  const resolvedUrl = resolveUrl(fileUrl);

  // Render PDF page with optimizations
  const renderPdfPage = async (pdf, pageNum) => {
    try {
      if (cancelTokenRef.current?.cancelled) return;

      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = pdfCanvasRef.current;
      if (!canvas) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      setRenderProgress(100);
    } catch (err) {
      if (err.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF page:", err);
        setError("Failed to render PDF page");
      }
    }
  };

  // Convert DOCX to HTML
  const convertDocxToHtml = async (arrayBuffer) => {
    try {
      console.log("[DOCX Conversion] Starting conversion, buffer size:", arrayBuffer.byteLength);

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Invalid DOCX file: empty or corrupted");
      }

      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (!result.value) {
        throw new Error("Mammoth returned empty HTML");
      }

      console.log("[DOCX Conversion] Success! HTML length:", result.value.length);

      if (result.messages && result.messages.length > 0) {
        console.warn("[DOCX Conversion] Warnings:", result.messages);
      }

      return result.value;
    } catch (err) {
      console.error("[DOCX Conversion] Error:", err.message, err);
      throw new Error(`Failed to convert DOCX: ${err.message}`);
    }
  };

  // Load initial document
  useEffect(() => {
    const loadDocument = async () => {
      if (!isPDF && !isDOCX && !isImage && !isText) return;

      try {
        setLoading(true);
        setError(null);
        setRenderProgress(0);

        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancelled = true;
        }
        cancelTokenRef.current = { cancelled: false };

        if (isPDF) {
          let pdf = pdfCache.get(resolvedUrl);

          if (!pdf) {
            pdf = await pdfjsLib.getDocument({
              url: resolvedUrl,
              cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/",
              cMapPacked: true,
            }).promise;

            pdfCache.set(resolvedUrl, pdf);
          }

          if (cancelTokenRef.current?.cancelled) return;

          pdfDocRef.current = pdf;
          setPdfPages(pdf.numPages);
          setRenderProgress(50);

          await renderPdfPage(pdf, 1);
        } else if (isDOCX) {
          console.log("[DOCX Load] Starting DOCX load from:", resolvedUrl);
          setRenderProgress(25);

          const response = await fetch(resolvedUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch DOCX file: HTTP ${response.status}`);
          }

          const contentType = response.headers.get("content-type");
          console.log("[DOCX Load] Content-Type:", contentType);

          // Guard: server returned HTML instead of a binary file
          if (contentType && contentType.includes("text/html")) {
            throw new Error(
              "Server returned an HTML page instead of the DOCX file. " +
              "Check that your backend serves /uploads as static files."
            );
          }

          const blob = await response.blob();
          console.log("[DOCX Load] Blob size:", blob.size, "Type:", blob.type);

          if (blob.size === 0) {
            throw new Error("Downloaded file is empty");
          }

          setRenderProgress(50);

          const arrayBuffer = await blob.arrayBuffer();
          console.log("[DOCX Load] ArrayBuffer size:", arrayBuffer.byteLength);

          if (cancelTokenRef.current?.cancelled) return;

          setRenderProgress(75);
          const html = await convertDocxToHtml(arrayBuffer);

          if (cancelTokenRef.current?.cancelled) return;

          setDocxHtml(html);
          setRenderProgress(100);
          console.log("[DOCX Load] Successfully converted and displayed DOCX");
        } else {
          setRenderProgress(100);
        }
      } catch (err) {
        console.error("Error loading document:", err);
        if (!cancelTokenRef.current?.cancelled) {
          setError(err.message || "Failed to load file. Try downloading it instead.");
        }
      } finally {
        if (!cancelTokenRef.current?.cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancelled = true;
      }
    };
  }, [resolvedUrl, isPDF, isDOCX, isImage, isText]);

  // Handle PDF page changes
  useEffect(() => {
    if (!isPDF || !pdfDocRef.current || pdfPages === 0) return;

    const renderPage = async () => {
      setRenderProgress(0);

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: canvas.getContext("2d"),
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setRenderProgress(100);
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    renderPage();
  }, [currentPage, isPDF, pdfPages]);

  const nextPage = () => {
    if (currentPage < pdfPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 border-b px-6 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{fileName}</h3>
            <p className="text-xs text-gray-600">{fileExt.toUpperCase()} Document</p>
          </div>
          <div className="flex gap-2">
            <a
              href={resolvedUrl}
              download={fileName}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && renderProgress > 0 && renderProgress < 100 && (
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-gray-600 text-sm">
                Loading {isPDF ? "PDF" : "file"}...
              </p>
              {renderProgress > 0 && (
                <p className="text-xs text-gray-500">{renderProgress}%</p>
              )}
            </div>
          ) : error ? (
            <div className="text-center text-gray-600 p-8 max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-semibold text-sm mb-2">Error</p>
                <p className="text-red-700 text-xs break-words">{error}</p>
              </div>
              <p className="text-gray-600 text-sm mb-4">Please try downloading the file instead:</p>
              <a
                href={resolvedUrl}
                download={fileName}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          ) : isPDF ? (
            <div className="flex flex-col items-center w-full h-full">
              <div className="flex-1 overflow-auto w-full flex justify-center p-4">
                <canvas
                  ref={pdfCanvasRef}
                  className="shadow-lg border border-gray-300 rounded-lg"
                />
              </div>
              {pdfPages > 1 && (
                <div className="bg-gray-100 border-t px-6 py-3 flex items-center justify-center gap-4 w-full">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {pdfPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === pdfPages}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : isDOCX ? (
            <div className="w-full h-full overflow-auto bg-white">
              <div
                className="prose prose-sm max-w-none p-8 text-gray-900"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
                style={{
                  backgroundColor: "white",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#333",
                }}
              />
            </div>
          ) : isImage ? (
            <img
              src={resolvedUrl}
              alt={fileName}
              className="max-h-full max-w-full object-contain p-4"
            />
          ) : isText ? (
            <iframe
              src={resolvedUrl}
              className="w-full h-full"
              onError={() => setError("Could not display text file.")}
            />
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 font-medium">
                File type not supported for in-browser viewing
              </p>
              <a
                href={resolvedUrl}
                download={fileName}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;