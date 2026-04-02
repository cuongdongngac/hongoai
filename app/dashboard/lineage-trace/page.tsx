"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Person, Relationship } from "@/types";
import {
  Search,
  ChevronLeft,
  Download,
  Loader2,
  FileImage,
  FileText,
  Globe,
  Users,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TreePine,
  Crown,
  Heart,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MemberDetailModal from "@/components/MemberDetailModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";
import Image from "next/image";
import { getAvatarBg } from "@/utils/styleHelprs";
import DefaultAvatar from "@/components/DefaultAvatar";

// --- Types for Lineage ---
interface LineageEntry {
  person: Person;
  spouses: Person[];
}

// --- Export Component ---
function LineageExportButton({
  selectedPerson,
  lineageRef,
  lineage,
}: {
  selectedPerson: Person | null;
  lineageRef: React.RefObject<HTMLDivElement | null>;
  lineage: LineageEntry[];
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { view } = useDashboard();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "html" | "png" | "pdf") => {
    if (!selectedPerson) return;

    setIsExporting(true);
    try {
      switch (format) {
        case "html":
          const htmlContent = generateLineageHTML(selectedPerson, lineage);
          const blob = new Blob([htmlContent], {
            type: "text/html;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `lineage-${selectedPerson.full_name}.html`;
          link.click();
          URL.revokeObjectURL(url);
          break;
        case "png":
          if (lineageRef.current) {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(lineageRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });
            const a = document.createElement("a");
            a.download = `lineage-${selectedPerson.full_name}.png`;
            a.href = dataUrl;
            a.click();
          }
          break;
        case "pdf":
          if (lineageRef.current) {
            const { toPng } = await import("html-to-image");
            const { jsPDF } = await import("jspdf");
            const dataUrl = await toPng(lineageRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });
            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "px",
              format: [
                lineageRef.current.scrollWidth,
                lineageRef.current.scrollHeight,
              ],
            });
            pdf.addImage(
              dataUrl,
              "PNG",
              0,
              0,
              lineageRef.current.scrollWidth,
              lineageRef.current.scrollHeight,
            );
            pdf.save(`lineage-${selectedPerson.full_name}.pdf`);
          }
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const generateLineageHTML = (person: Person, lineage: LineageEntry[]) => {
    const getRelationshipTitle = (index: number) => {
      const relationships = ["Cha/Mẹ", "Ông/Bà", "Cụ/Kỵ", "Sơ kỵ", "Cao kỵ"];
      return relationships[index] || `Tổ tiên đời thứ ${index + 1}`;
    };

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Truy vết nguồn gốc: ${person.full_name}</title>
    <style>
        body { font-family: sans-serif; padding: 40px; background: #f5f5f4; color: #444; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        h1 { text-align: center; color: #b45309; margin-bottom: 40px; }
        .entry { display: flex; gap: 20px; margin-bottom: 30px; position: relative; }
        .entry::before { content: ''; position: absolute; left: 15px; top: 40px; bottom: -30px; width: 2px; background: #fbbf24; opacity: 0.3; }
        .entry:last-child::before { display: none; }
        .dot { width: 32px; height: 32px; border-radius: 50%; background: #fef3c7; border: 2px solid #fbbf24; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #b45309; z-index: 1; shrink: 0; }
        .card { flex: 1; padding: 20px; border: 1px solid #e7e5e4; border-radius: 16px; }
        .title { font-size: 12px; font-weight: bold; color: #d97706; text-transform: uppercase; margin-bottom: 5px; }
        .name { font-size: 18px; font-weight: bold; color: #1c1917; }
        .spouses { margin-top: 10px; font-size: 14px; color: #78716c; }
        .details { font-size: 13px; color: #a8a29e; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Dòng dõi của ${person.full_name}</h1>
        ${lineage
          .map(
            (entry, i) => `
            <div class="entry">
                <div class="dot">${i + 1}</div>
                <div class="card">
                    <div class="title">${getRelationshipTitle(i)}</div>
                    <div class="name">${entry.person.full_name}</div>
                    ${entry.spouses.length > 0 ? `<div class="spouses">Kết hôn với: ${entry.spouses.map((s) => s.full_name).join(", ")}</div>` : ""}
                    <div class="details">Năm sinh: ${entry.person.birth_year || "N/A"} | Đời thứ: ${entry.person.generation || "N/A"}</div>
                </div>
            </div>
        `,
          )
          .join("")}
    </div>
</body>
</html>`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center justify-center px-4 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 text-stone-600 hover:bg-white hover:text-stone-900 hover:shadow-md transition-all disabled:opacity-50 gap-2"
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
            className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-xl border border-stone-200/60 py-2 z-50 overflow-hidden"
          >
            <button
              onClick={() => handleExport("png")}
              className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 flex items-center gap-3"
            >
              <FileImage className="size-4 text-blue-500" />{" "}
              <span>Ảnh (PNG)</span>
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 flex items-center gap-3"
            >
              <FileText className="size-4 text-red-500" />{" "}
              <span>Tài liệu (PDF)</span>
            </button>
            <button
              onClick={() => handleExport("html")}
              className="w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 flex items-center gap-3"
            >
              <Globe className="size-4 text-emerald-500" />{" "}
              <span>Web (HTML)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Page Component ---
function LineageTraceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams.get("personId");
  const { setMemberModalId, showAvatar } = useDashboard();

  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineage, setLineage] = useState<LineageEntry[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const lineageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: pData } = await supabase.from("persons").select("*");
        const { data: rData } = await supabase
          .from("relationships")
          .select("*");

        setPersons(pData || []);
        setRelationships(rData || []);

        if (personId && pData) {
          const person = pData.find((p) => p.id === personId);
          if (person) {
            setSelectedPerson(person);
            const trace = buildLineage(person.id, pData, rData || []);
            setLineage(trace);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [personId]);

  const buildLineage = (
    startId: string,
    pList: Person[],
    rList: Relationship[],
  ): LineageEntry[] => {
    const result: LineageEntry[] = [];
    const pMap = new Map(pList.map((p) => [p.id, p]));
    let currentId: string | null = startId;

    while (currentId) {
      const person = pMap.get(currentId);
      if (!person) break;

      // Find spouses
      const spouses = rList
        .filter(
          (r) =>
            r.type === "marriage" &&
            (r.person_a === currentId || r.person_b === currentId),
        )
        .map((r) =>
          pMap.get(r.person_a === currentId ? r.person_b : r.person_a),
        )
        .filter(Boolean) as Person[];

      // Add the current person to the trace
      result.push({ person, spouses });

      // Find all parents
      const parentRels = rList.filter(
        (r) =>
          r.person_b === currentId &&
          (r.type === "biological_child" || r.type === "adopted_child"),
      );

      if (parentRels.length > 0) {
        // Find bloodline parent (not in-law)
        const bloodlineParentRel = parentRels.find(
          (r) => !pMap.get(r.person_a)?.is_in_law,
        );

        // Priority: 1. Bloodline parent, 2. Any available parent (usually the first one found)
        const nextParentRel = bloodlineParentRel || parentRels[0];
        const nextParent = pMap.get(nextParentRel.person_a);

        if (nextParent) {
          // Check for infinite loops
          if (result.some((entry) => entry.person.id === nextParent.id)) {
            break;
          }
          currentId = nextParent.id;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return result;
  };

  const getRelationshipTitle = (index: number) => {
    if (index === 0) return "Bản thân";
    const titles = ["Cha/Mẹ", "Ông/Bà", "Cụ/Kỵ", "Sơ kỵ", "Cao kỵ"];
    return titles[index - 1] || `Tổ tiên đời thứ ${index}`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="size-8 animate-spin text-amber-600" />
      </div>
    );

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft className="size-5" />
            <span className="font-medium">Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <TreePine className="size-5" />
            </div>
            <h1 className="text-lg font-bold text-stone-900">
              Truy vết nguồn gốc
            </h1>
          </div>

          <LineageExportButton
            selectedPerson={selectedPerson}
            lineageRef={lineageRef}
            lineage={lineage}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-10">
        {!selectedPerson ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
            <Users className="size-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">
              Vui lòng chọn một thành viên để bắt đầu truy vết
            </p>
          </div>
        ) : (
          <div
            ref={lineageRef}
            className="space-y-8 relative before:absolute before:left-[23px] before:top-10 before:bottom-10 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-amber-200 before:to-transparent"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-sm font-bold mb-4">
                <Sparkles className="size-4" />
                Dòng dõi của {selectedPerson.full_name}
              </div>
            </div>

            {lineage.map((entry, index) => (
              <motion.div
                key={entry.person.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 items-start group"
              >
                {/* Step Circle */}
                <div className="relative z-10 flex-shrink-0 mt-2">
                  <div
                    className={`size-12 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-110 ${index === 0 ? "bg-amber-500 border-amber-400 text-white" : "bg-white border-amber-200 text-amber-600"}`}
                  >
                    <span className="text-lg font-bold">{index + 1}</span>
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1 block">
                        {getRelationshipTitle(index)}
                      </span>
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                        {entry.person.full_name}
                      </h3>
                    </div>
                    {entry.person.generation && (
                      <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500">
                        Đời thứ {entry.person.generation}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
                      <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">
                        Năm sinh
                      </p>
                      <p className="font-bold text-stone-700">
                        {entry.person.birth_year || "N/A"}
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
                      <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">
                        Giới tính
                      </p>
                      <p className="font-bold text-stone-700">
                        {entry.person.gender === "male" ? "Nam" : "Nữ"}
                      </p>
                    </div>
                  </div>

                  {entry.spouses.length > 0 && (
                    <div className="pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="size-3 text-rose-400 fill-rose-400" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          Bạn đời (Rẽ nhánh tại đây)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.spouses.map((spouse) => (
                          <button
                            key={spouse.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/lineage-trace?personId=${spouse.id}`,
                              );
                            }}
                            className="flex items-center gap-2 bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100 hover:border-rose-300 hover:bg-rose-100 transition-all group/spouse"
                            title={`Truy vết từ ${spouse.full_name}`}
                          >
                            <div
                              className={`size-6 rounded-full overflow-hidden shrink-0 ${getAvatarBg(spouse.gender)}`}
                            >
                              {showAvatar && spouse.avatar_url ? (
                                <Image
                                  unoptimized
                                  src={spouse.avatar_url}
                                  alt={spouse.full_name}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <DefaultAvatar
                                  gender={spouse.gender}
                                  size={24}
                                />
                              )}
                            </div>
                            <span className="text-xs font-bold text-stone-700 group-hover/spouse:text-rose-700">
                              {spouse.full_name}
                            </span>
                            <ChevronRight className="size-3 text-rose-300 group-hover/spouse:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setMemberModalId(entry.person.id)}
                    className="mt-6 w-full py-3 bg-stone-50 hover:bg-amber-50 text-stone-500 hover:text-amber-700 text-xs font-bold rounded-2xl transition-colors border border-stone-100 hover:border-amber-200"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <MemberDetailModal />
    </div>
  );
}

export default function LineageTracePage() {
  return (
    <DashboardProvider>
      <LineageTraceContent />
    </DashboardProvider>
  );
}
