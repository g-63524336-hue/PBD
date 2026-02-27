import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Plus, Upload, FileText, Trash2, ChevronDown, ChevronUp, Edit3, ChevronRight } from "lucide-react";
import { Class, Subject, DSKPItem } from "../types";
import { parseDSKP } from "../services/geminiService";
import { cn } from "../utils";

interface SubjectManagerProps {
  classData: Class;
}

export default function SubjectManager({ classData }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [dskpItems, setDskpItems] = useState<DSKPItem[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isUploadingDSKP, setIsUploadingDSKP] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/classes/${classData.id}/subjects`).then(res => res.json()).then(setSubjects);
  }, [classData.id]);

  useEffect(() => {
    if (selectedSubject) {
      fetch(`/api/subjects/${selectedSubject.id}/dskp`).then(res => res.json()).then(setDskpItems);
    } else {
      setDskpItems([]);
    }
  }, [selectedSubject]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/classes/${classData.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjectName }),
    });
    if (res.ok) {
      const data = await res.json();
      const newSub = { id: data.id, class_id: classData.id, name: newSubjectName };
      setSubjects([...subjects, newSub]);
      setNewSubjectName("");
      setIsAddingSubject(false);
      setSelectedSubject(newSub);
    }
  };

  const handleDSKPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject) return;

    setIsUploadingDSKP(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const items = await parseDSKP(base64, file.type);
        
        for (const item of items) {
          await fetch(`/api/subjects/${selectedSubject.id}/dskp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
        }
        
        // Refresh list
        const res = await fetch(`/api/subjects/${selectedSubject.id}/dskp`);
        const data = await res.json();
        setDskpItems(data);
        setIsUploadingDSKP(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("DSKP Parse Error:", error);
      setIsUploadingDSKP(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Subjects Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">Subjects</h2>
          <button 
            onClick={() => setIsAddingSubject(true)}
            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {isAddingSubject && (
          <form onSubmit={handleAddSubject} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <input
              autoFocus
              required
              type="text"
              placeholder="Subject Name (e.g. BM, English)"
              className="w-full p-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-emerald-500"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingSubject(false)} className="text-sm text-stone-500 px-3 py-1">Cancel</button>
              <button type="submit" className="text-sm bg-stone-900 text-white px-4 py-1 rounded-lg">Save</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                selectedSubject?.id === sub.id 
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md" 
                  : "bg-white text-stone-700 border-stone-200 hover:border-emerald-300"
              )}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={cn("w-5 h-5", selectedSubject?.id === sub.id ? "text-emerald-100" : "text-stone-400")} />
                <span className="font-bold">{sub.name}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4", selectedSubject?.id === sub.id ? "text-emerald-100" : "text-stone-300")} />
            </button>
          ))}
          {subjects.length === 0 && !isAddingSubject && (
            <p className="text-center py-8 text-stone-400 text-sm italic">No subjects added yet.</p>
          )}
        </div>
      </div>

      {/* DSKP Content */}
      <div className="lg:col-span-2 space-y-6">
        {selectedSubject ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-900">{selectedSubject.name} DSKP</h2>
                <p className="text-stone-500">Standard Kandungan & Pembelajaran</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDSKP}
                  className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-stone-800 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingDSKP ? "Parsing DSKP..." : "Import DSKP (PDF)"}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleDSKPUpload} accept=".pdf" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">DSKP Structure</span>
                <span className="text-xs font-bold text-stone-400">{dskpItems.length} Items</span>
              </div>
              <div className="divide-y divide-stone-100">
                {dskpItems.map((item, idx) => (
                  <div key={item.id} className="p-6 hover:bg-stone-50 transition-colors group">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-mono text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-tighter mb-1">Standard Kandungan (SK)</p>
                          <p className="text-stone-900 font-semibold leading-relaxed">{item.sk}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-stone-100">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-tighter mb-1">Standard Pembelajaran (SP)</p>
                          <p className="text-stone-600 text-sm leading-relaxed">{item.sp}</p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                        <button className="p-2 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {dskpItems.length === 0 && !isUploadingDSKP && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-400">No DSKP items found for this subject.</p>
                    <p className="text-stone-400 text-sm">Upload a PDF to auto-extract SK/SP items.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-stone-200 rounded-3xl bg-white/50">
            <BookOpen className="w-16 h-16 text-stone-200 mb-4" />
            <h3 className="text-xl font-bold text-stone-400">Select a Subject</h3>
            <p className="text-stone-400 max-w-xs">Choose a subject from the left panel to manage its DSKP standards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
