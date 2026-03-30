import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';

// Export data as PDF
export const exportPDF = (data, title) => {
    const doc = new jsPDF();

    doc.text(title, 20, 10);
    doc.autoTable({
        head: [Object.keys(data[0])],
        body: data.map(row => Object.values(row)),
    });

    doc.save(`${title}.pdf`);
};

// Export data as CSV
export const exportCSV = (data, title) => {
    const headers = Object.keys(data[0]);
    const csvData = data.map(row => headers.map(header => row[header]));

    return (
        <CSVLink
            data={[headers, ...csvData]}
            filename={`${title}.csv`}
            className="btn btn-primary"
        >
            Download CSV
        </CSVLink>
    );
};

// Export data as DOCX
export const exportDOCX = (data, title) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: title,
                        heading: 'Heading1',
                    }),
                    ...data.map(row =>
                        new Paragraph({
                            children: Object.values(row).map(value =>
                                new TextRun({
                                    text: value.toString(),
                                    break: 1,
                                })
                            ),
                        })
                    ),
                ],
            },
        ],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${title}.docx`);
    });
};

// Print data
export const PrintComponent = ({ data, title }) => {
    const componentRef = useRef();

    const printableContent = (
        <div ref={componentRef}>
            <h1>{title}</h1>
            <table>
                <thead>
                    <tr>
                        {Object.keys(data[0]).map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex}>{value}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            {printableContent}
            <ReactToPrint
                trigger={() => <button>Print this out!</button>}
                content={() => componentRef.current}
            />
        </div>
    );
};
