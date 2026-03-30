const { PDFDocument } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Generate PDF
async function generatePDF(data) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    let y = height - 50;
    data.forEach((item) => {
        const driverName = `${item.driver_first_name} ${item.driver_last_name}`;
        const ownerName = `${item.owner_first_name} ${item.owner_last_name}`;
        page.drawText(`Matatu: ${item.number_plate}, Driver: ${driverName}, Owner: ${ownerName}, Status: ${item.status}`, {
            x: 50,
            y,
            size: 12,
        });
        y -= 20;
    });

    return await pdfDoc.save();
}

// Generate TXT
function generateTXT(data) {
    const lines = data.map(item => {
        const driverName = `${item.driver_first_name} ${item.driver_last_name}`;
        const ownerName = `${item.owner_first_name} ${item.owner_last_name}`;
        return `Matatu: ${item.number_plate}, Driver: ${driverName}, Owner: ${ownerName}, Status: ${item.status}`;
    });
    return Buffer.from(lines.join('\n'), 'utf-8');
}

// Generate DOCX
async function generateDOCX(data) {
    const doc = new Document();

    data.forEach(item => {
        const driverName = `${item.driver_first_name} ${item.driver_last_name}`;
        const ownerName = `${item.owner_first_name} ${item.owner_last_name}`;
        const paragraph = new Paragraph()
            .addRun(new TextRun(`Matatu: ${item.number_plate}, Driver: ${driverName}, Owner: ${ownerName}, Status: ${item.status}`).bold());
        doc.addParagraph(paragraph);
    });

    return await Packer.toBuffer(doc);
}

module.exports = { generatePDF, generateTXT, generateDOCX };
