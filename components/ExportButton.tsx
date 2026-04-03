"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  AlertCircle,
  Database,
  Download,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "./DashboardContext";
import { generateInteractiveHTML, downloadHTMLFile } from "@/utils/htmlExport";
import { Person, Relationship } from "@/types";
import { exportData } from "@/app/actions/data";

export default function ExportButton({
  persons,
  relationships,
}: {
  persons: Person[];
  relationships: Relationship[];
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { view, rootId } = useDashboard();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDataExport = async (format: "json" | "gedcom" | "csv") => {
    try {
      setIsExporting(true);
      setShowMenu(false);

      const data = await exportData(rootId || undefined);

      if ("error" in data) {
        throw new Error(data.error);
      }

      if (format === "csv") {
        const { exportToCsvZip } = await import("@/utils/csv");
        const zipBlob = await exportToCsvZip({
          persons: data.persons,
          relationships: data.relationships,
          person_details_private: data.person_details_private,
          custom_events: data.custom_events,
        });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `giapha-export-${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      let content = "";
      let type = "";
      let extension = "";

      if (format === "json") {
        content = JSON.stringify(data, null, 2);
        type = "application/json";
        extension = "json";
      } else {
        const { exportToGedcom } = await import("@/utils/gedcom");
        // Removed unused @ts-expect-error as types are now handled correctly
        content = exportToGedcom({
          persons: data.persons,
          relationships: data.relationships,
        });
        type = "text/plain";
        extension = "ged";
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `giapha-export-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Data export failed:", err);
      setError(err.message || "Xuất dữ liệu thất bại.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async (format: "png" | "pdf" | "html") => {
    try {
      setIsExporting(true);
      setShowMenu(false);
      setError(null);

      if (format === "html") {
        if (!rootId) {
          throw new Error("Vui lòng chọn gốc hiển thị trước khi xuất HTML.");
        }

        const personsMap = new Map(persons.map((p) => [p.id, p]));
        const roots = persons.filter((p) => p.id === rootId);

        if (roots.length === 0) {
          throw new Error("Không tìm thấy người gốc đã chọn.");
        }

        const html = await generateInteractiveHTML({
          personsMap,
          relationships,
          roots,
          view: view === "tree" || view === "mindmap" ? view : "tree",
          maxDepth: 999,
        });

        const filename = `gia-pha-${view}-${new Date().toISOString().split("T")[0]}.html`;
        downloadHTMLFile(html, filename);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = document.getElementById("export-container");
      if (!element) throw new Error("Không tìm thấy vùng dữ liệu để xuất.");

      element.classList.add("exporting");

      const exportOptions = {
        cacheBust: true,
        backgroundColor: "#f5f5f4",
        pixelRatio: 2,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: `${element.scrollWidth}px`,
          height: `${element.scrollHeight}px`,
        },
      };

      if (format === "png") {
        const url = await toPng(element, exportOptions);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gia-pha-${view}-${new Date().toISOString().split("T")[0]}.png`;
        a.click();
      } else if (format === "pdf") {
        const url = await toJpeg(element, { ...exportOptions, quality: 0.95 });
        const pdf = new jsPDF({
          orientation:
            element.scrollWidth > element.scrollHeight
              ? "landscape"
              : "portrait",
          unit: "px",
          format: [element.scrollWidth, element.scrollHeight],
        });
        pdf.addImage(
          url,
          "JPEG",
          0,
          0,
          element.scrollWidth,
          element.scrollHeight,
        );
        pdf.save(
          `gia-pha-${view}-${new Date().toISOString().split("T")[0]}.pdf`,
        );
      }

      element.classList.remove("exporting");
    } catch (err: any) {
      console.error("Export failed:", err);
      setError(err.message || "Xuất file thất bại. Vui lòng thử lại.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center justify-center px-4 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-md transition-all disabled:opacity-50 gap-2"
        title="Xuất file"
      >
        {isExporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        <span className="text-sm font-medium">Xuất file</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/60 py-2 z-50 overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 mb-1">
              Hình ảnh & Tài liệu
            </div>

            <button
              onClick={() => handleExport("png")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <FileImage className="size-4 text-blue-500" />
              <span>Ảnh (PNG)</span>
            </button>

            <button
              onClick={() => handleExport("pdf")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <FileText className="size-4 text-red-500" />
              <span>Tài liệu (PDF)</span>
            </button>

            <button
              onClick={() => handleExport("html")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <Globe className="size-4 text-emerald-500" />
              <span>Web (HTML)</span>
            </button>

            <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-y border-stone-100 my-1">
              Dữ liệu
            </div>

            <button
              onClick={() => handleDataExport("json")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <FileJson className="size-4 text-amber-500" />
              <span>Dữ liệu (JSON)</span>
            </button>

            <button
              onClick={() => handleDataExport("gedcom")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <FileCode className="size-4 text-indigo-500" />
              <span>GEDCOM 7.0</span>
            </button>

            <button
              onClick={() => handleDataExport("csv")}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-3 transition-colors"
            >
              <Database className="size-4 text-stone-500" />
              <span>Excel/CSV (.zip)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-24 right-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-[100]"
          >
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="text-sm font-medium">{error}</div>
            <button onClick={() => setError(null)} className="ml-2">
              <X className="size-4 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
