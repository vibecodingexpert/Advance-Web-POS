const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

const generatePDF = async (data, columns, title, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s+/g, '_')}.pdf`);

  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(8).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
  doc.moveDown();

  const tableTop = doc.y;
  const colWidth = (doc.page.width - 60) / columns.length;

  doc.fontSize(8).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, 30 + i * colWidth, tableTop, { width: colWidth, align: 'left' });
  });

  doc.moveDown(0.5);
  let y = doc.y;

  doc.font('Helvetica').fontSize(7);
  data.forEach((row, rowIndex) => {
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = doc.y;
    }

    columns.forEach((col, i) => {
      const val = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
      doc.text(val, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
    });

    y += 15;
  });

  doc.end();
};

const generateExcel = async (data, columns, title, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.columns = columns.map(col => ({
    header: col,
    key: col,
    width: 20
  }));

  data.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/\s+/g, '_')}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = { generatePDF, generateExcel };
