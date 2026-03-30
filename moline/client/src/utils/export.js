import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

/**
 * Unified export utility: CSV, XLSX, PDF, TXT
 * @param {'csv'|'xlsx'|'pdf'|'txt'} type
 * @param {Array<Object>} data
 * @param {{header: string, field: string}[]} columns
 * @param {string} filename
 */
export function exportData(type, data, columns, filename) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((item) => columns.map((c) => item[c.field] ?? ""));

  switch (type) {
    case "csv": {
      const csv = Papa.unparse({ fields: headers, data: rows });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${filename}.csv`);
      break;
    }
    case "xlsx": {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, filename);
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        `${filename}.xlsx`
      );
      break;
    }
    case "pdf": {
      const doc = new jsPDF();
      doc.autoTable({ head: [headers], body: rows });
      doc.save(`${filename}.pdf`);
      break;
    }
    case "txt": {
      const txt = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join(
        "\n"
      );
      const blobTxt = new Blob([txt], { type: "text/plain;charset=utf-8;" });
      saveAs(blobTxt, `${filename}.txt`);
      break;
    }
    default:
      console.warn(`Unknown export type: ${type}`);
  }
}
/**
 * printData(data, columns)
 *   - Opens a new window with a simple HTML table and triggers print().
 */
export function printData(data, columns) {
  const headers = columns.map((c) => c.header);
  const rowsHtml = data
    .map(
      (item) =>
        `<tr>${columns
          .map((c) => `<td>${item[c.field] ?? ""}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const html = `
      <html><head><title>Print</title>
        <style>table{width:100%;border-collapse:collapse;}td,th{border:1px solid #999;padding:4px;}</style>
      </head><body>
        <table>
          <thead><tr>${headers
            .map((h) => `<th>${h}</th>`)
            .join("")}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`;
  const win = window.open("", "", "width=800,height=600");
  win.document.write(html);
  win.document.close();
  win.print();
}
