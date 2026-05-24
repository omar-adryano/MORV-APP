import { useState } from "react";
import { 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Search, 
  Download, 
  UploadCloud, 
  Plus, 
  Sparkles,
  Info,
  CheckCircle,
  File
} from "lucide-react";
import { FileDoc } from "../types";

interface FilesProps {
  files: FileDoc[];
  setFiles: (f: FileDoc[]) => void;
  lang: 'ar' | 'en';
}

export default function FileManager({
  files,
  setFiles,
  lang
}: FilesProps) {
  const isRtl = lang === 'ar';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [successNote, setSuccessNote] = useState("");

  const handleSimulatedUpload = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete and add file
          const newDoc: FileDoc = {
            id: "doc_" + Date.now(),
            name: "MORV_Invoice_Export_" + Math.floor(100 + Math.random()*900) + ".pdf",
            size: "1.8 MB",
            mimeType: "application/pdf",
            uploadDate: new Date().toISOString().split('T')[0]
          };
          setFiles([newDoc, ...files]);
          setSuccessNote(isRtl ? "تم رفع الملف بنجاح وتأمينه!" : "File uploaded and secured successfully!");
          setTimeout(() => setSuccessNote(""), 3500);
          return null;
        }
        return prev + 30;
      });
    }, 300);
  };

  // Searching filter 
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.mimeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (mime: string) => {
    if (mime.includes("pdf")) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mime.includes("csv") || mime.includes("excel") || mime.includes("spreadsheet")) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mime.includes("image")) return <Image className="w-5 h-5 text-sky-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header section with export modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cloud uploading deck */}
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="font-sans">
            <h3 className="text-base font-extrabold text-white leading-none">{isRtl ? "حقيبة المستندات السحابية" : "Private Ledger Cloud"}</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              {isRtl ? "ارفع دفاتر العمل، سجلات الموردين أو العقود القانونية لتقوم بمزامنتها." : "Upload ledger folders, employee logs, check statements."}
            </p>
          </div>

          <div className="bg-black/60 border-2 border-dashed border-zinc-900 rounded-2xl p-6 text-center hover:border-cyan-500/35 transition-all relative">
            <UploadCloud className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <span className="block text-xs font-bold text-zinc-200 mb-1 font-sans">{isRtl ? "اسحب وأسقط أية ملفات هنا" : "Upload client databases"}</span>
            <span className="block text-[10px] text-zinc-600 font-mono">{isRtl ? "أي ملف PDF، Excel، CSV حتى 20 ميجا" : "PDF, Excel ledger values up to 20MB"}</span>
            
            {uploadProgress !== null ? (
              <div className="mt-4 space-y-2 font-mono">
                <p className="text-xs font-bold text-cyan-400">{isRtl ? `جاري التأمين والرفع: ${uploadProgress}%` : `Uploading: ${uploadProgress}%`}</p>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleSimulatedUpload}
                type="button"
                className="mt-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs px-4 py-2.5 rounded-xl text-cyan-400 font-extrabold tracking-tight inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? "اختيار مستند للرفع" : "Upload File"}</span>
              </button>
            )}
          </div>

          {successNote && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successNote}</span>
            </div>
          )}
        </div>

        {/* Export downloads console */}
        <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="font-sans">
            <h3 className="text-base font-extrabold text-white leading-none">{isRtl ? "تصدير الملفات والتقارير القانونية" : "Regulatory PDF & Excel Exports"}</h3>
            <p className="text-xs text-zinc-550 mt-1.5 leading-relaxed">
              {isRtl ? "قم بتنزيل كافة المعاملات الحسابية بالصيغ المعتمدة لتقديمها مباشرة للضرائب والبنوك المصرية." : "Download all general ledger audits instantly."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PDF Export trigger */}
            <a 
              href="/api/export/pdf" 
              download 
              className="bg-black/35 p-4 rounded-xl border border-white/5 hover:border-cyan-500/20 flex flex-col justify-between h-32 transition-all group shadow-lg cursor-pointer"
            >
              <FileText className="w-8 h-8 text-rose-500 group-hover:scale-105 transition-transform" />
              <div>
                <span className="block text-xs font-bold text-zinc-100 font-sans">{isRtl ? "تصدير التقرير PDF" : "Download PDF report"}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1.5 font-mono">
                  <Download className="w-3" /> EGP_Status.pdf
                </span>
              </div>
            </a>

            {/* Excel CSV Export trigger */}
            <a 
              href="/api/export/excel" 
              download 
              className="bg-black/35 p-4 rounded-xl border border-white/5 hover:border-cyan-500/20 flex flex-col justify-between h-32 transition-all group shadow-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-500 group-hover:scale-105 transition-transform" />
              <div>
                <span className="block text-xs font-bold text-zinc-100 font-sans">{isRtl ? "تصدير كشف Excel" : "Extract Excel CSV"}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1.5 font-mono">
                  <Download className="w-3" /> Ledger_Dump.csv
                </span>
              </div>
            </a>

          </div>
        </div>

      </div>

      {/* FILTER SEARCH AND FILES CATALOG CONTAINER */}
      <div className="bg-[#080808]/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="font-sans">
            <h3 className="font-extrabold text-white text-base leading-none">{isRtl ? "مخزن ومستودع المستندات" : "Unified Business Documents Inventory"}</h3>
            <p className="text-xs text-zinc-500 mt-1.5">{isRtl ? "البحث والفرز التلقائي للأوراق الخاصة بالعمل" : "Filter catalogs and search files"}</p>
          </div>

          <div className="relative w-full sm:w-64 font-sans">
            <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} pr-3 flex items-center pointer-events-none text-zinc-500`}>
              <Search className="w-4 h-4 text-zinc-500" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "ابحث بالاسم أو النوع..." : "Search general archives..."}
              className={`w-full bg-black border border-white/5 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-cyan-500/40 transition-all`}
            />
          </div>
        </div>

        {/* Search Results list */}
        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/20">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-500 text-xs border-b border-white/5 font-sans">
                <th className="p-4 text-start">{isRtl ? "اسم الملف والمستند" : "Document Reference"}</th>
                <th className="p-4">{isRtl ? "الحجم" : "Filesize"}</th>
                <th className="p-4">{isRtl ? "تاريخ التعبئة" : "Uploaded date"}</th>
                <th className="p-4 text-center">{isRtl ? "الإجراء" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-sans text-zinc-200">
              {filteredFiles.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-start flex items-center gap-3">
                    {getIcon(f.mimeType)}
                    <div>
                      <p className="font-bold text-zinc-150">{f.name}</p>
                      <p className="text-[10px] text-zinc-550 font-mono mt-0.5">{f.mimeType}</p>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 font-mono text-xs">{f.size}</td>
                  <td className="p-4 text-zinc-400 text-xs font-mono">{f.uploadDate}</td>
                  <td className="p-4 text-center">
                    {/* Simulated download href */}
                    <a 
                      href={`/api/export/pdf`}
                      download
                      className="p-1.5 px-4 text-xs bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-white/5 rounded-xl inline-flex items-center gap-1 font-extrabold cursor-pointer transition-all"
                    >
                      <Download className="w-3" />
                      <span>{isRtl ? "تحميل" : "Download"}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
