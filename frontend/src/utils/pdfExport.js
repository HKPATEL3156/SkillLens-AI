/**
 * Exports a target DOM element to a clean, isolated PDF/Print document
 * completely eliminating background webpage elements and avoiding canvas oklch errors.
 * 
 * @param {HTMLElement} element - The DOM element containing only the report to export
 * @param {string} filename - Title and filename for the PDF document
 */
export const downloadPdfReport = (element, filename = "SkillLens_Assessment_Report.pdf") => {
  return new Promise((resolve, reject) => {
    try {
      if (!element) {
        throw new Error("No target report element provided for export.");
      }

      // Create a hidden isolated iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("title", filename);
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const cleanTitle = filename.replace(/\.pdf$/i, "");

      // Write isolated standalone HTML document containing only the report
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${cleanTitle}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 10mm 12mm 10mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 12px;
                color: #0f172a;
                background: #ffffff;
                font-size: 10.5pt;
                line-height: 1.45;
              }
              .print-break-inside-avoid, 
              .print-question-block {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 14px !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid #1e293b;
                padding: 6px 8px;
              }
              .border-2 { border: 2px solid #1e293b; }
              .border { border: 1px solid #cbd5e1; }
              .border-b-2 { border-bottom: 2px solid #1e293b; }
              .border-b { border-bottom: 1px solid #cbd5e1; }
              .border-t-2 { border-top: 2px solid #1e293b; }
              .border-t { border-top: 1px solid #e2e8f0; }
              .rounded-2xl { border-radius: 12px; }
              .rounded-xl { border-radius: 8px; }
              .rounded { border-radius: 4px; }
              .p-5 { padding: 18px; }
              .p-4 { padding: 14px; }
              .p-3 { padding: 10px; }
              .p-2 { padding: 6px; }
              .space-y-4 > * + * { margin-top: 14px; }
              .space-y-3 > * + * { margin-top: 10px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-5 > * + * { margin-top: 16px; }
              .space-y-6 > * + * { margin-top: 20px; }
              .grid { display: grid; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .gap-4 { gap: 14px; }
              .gap-3 { gap: 10px; }
              .gap-2 { gap: 8px; }
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-black { font-weight: 900; }
              .font-extrabold { font-weight: 800; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .uppercase { text-transform: uppercase; }
              .tracking-wider { letter-spacing: 0.05em; }
              .tracking-tight { letter-spacing: -0.025em; }
              .text-xs { font-size: 9.5pt; }
              .text-sm { font-size: 10.5pt; }
              .text-base { font-size: 11.5pt; }
              .text-lg { font-size: 13pt; }
              .text-xl { font-size: 15pt; }
              .text-3xl { font-size: 20pt; }
              .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
              .bg-slate-100 { background-color: #f1f5f9 !important; }
              .bg-slate-50 { background-color: #f8fafc !important; }
              .bg-emerald-50 { background-color: #ecfdf5 !important; }
              .bg-emerald-100 { background-color: #d1fae5 !important; }
              .bg-rose-50 { background-color: #fff1f2 !important; }
              .bg-rose-100 { background-color: #ffe4e6 !important; }
              .bg-blue-50 { background-color: #eff6ff !important; }
              .bg-blue-100 { background-color: #dbeafe !important; }
              .bg-amber-50 { background-color: #fffbeb !important; }
              .bg-indigo-50 { background-color: #eef2ff !important; }
              .text-emerald-700 { color: #047857 !important; }
              .text-emerald-800 { color: #065f46 !important; }
              .text-rose-700 { color: #b91c1c !important; }
              .text-rose-800 { color: #991b1b !important; }
              .text-blue-700 { color: #1d4ed8 !important; }
              .text-blue-900 { color: #1e3a8a !important; }
              .text-blue-950 { color: #172554 !important; }
              .text-slate-600 { color: #475569 !important; }
              .text-slate-700 { color: #334155 !important; }
              .text-slate-800 { color: #1e293b !important; }
              .text-slate-900 { color: #0f172a !important; }
              .text-slate-950 { color: #020617 !important; }
              .border-slate-800 { border-color: #1e293b !important; }
              .border-slate-300 { border-color: #cbd5e1 !important; }
              .border-slate-200 { border-color: #e2e8f0 !important; }
              .border-emerald-300 { border-color: #6ee7b7 !important; }
              .border-emerald-400 { border-color: #34d399 !important; }
              .border-rose-400 { border-color: #f87171 !important; }
              .border-emerald-200 { border-color: #a7f3d0 !important; }
              .overflow-hidden { overflow: hidden; }
              .shadow-sm { box-shadow: none; }
              pre { background-color: #0f172a; color: #f8fafc; padding: 10px; border-radius: 8px; font-size: 9pt; }
              .no-print, button, input { display: none !important; }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      // Trigger high-fidelity PDF print from isolated iframe
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(true);
        }, 1200);
      }, 350);
    } catch (err) {
      console.error("PDF Export error:", err);
      reject(err);
    }
  });
};
