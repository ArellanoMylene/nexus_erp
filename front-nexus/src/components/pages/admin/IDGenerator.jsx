import React from "react";
import { FileText } from "lucide-react";

const IDGenerator = () => {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={24} /> ID Generator
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Generate and print student ID cards with QR codes and photos.
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
        <FileText className="mx-auto mb-4 text-slate-400" size={48} />
        <p className="text-slate-600">ID Generator interface coming soon.</p>
        <p className="text-xs text-slate-500 mt-2">
          This will allow batch ID generation, QR code creation, and printable
          ID card templates.
        </p>
      </div>
    </div>
  );
};

export default IDGenerator;
