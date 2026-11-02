import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'public/files/demo');
mkdirSync(outputDir, { recursive: true });

function createPdf(label, filename) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${57 + label.length} >>\nstream\nBT /F1 18 Tf 72 760 Td (${label}) Tj 0 -32 Td /F1 11 Tf (DEMO - not an official school document) Tj ET\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n%DEMO\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  writeFileSync(join(outputDir, filename), pdf);
}

createPdf('Test document 1', 'test-document-1.pdf');
createPdf('Test document 2', 'test-document-2.pdf');
createPdf('Test document 3', 'test-document-3.pdf');
