import jsPDF from "jspdf";

// Renders an already-mounted DOM element (the CertificateTemplate) to a PDF
// via jsPDF's built-in .html() — which uses html2canvas internally, so no
// separate canvas-conversion step is needed here.
export const downloadCertificatePdf = ({ element, fileName }) => {
  return new Promise((resolve, reject) => {
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const doc = new jsPDF({
      orientation: width >= height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
    });

    doc.html(element, {
      x: 0,
      y: 0,
      width,
      windowWidth: width,
      callback: (pdf) => {
        try {
          pdf.save(fileName);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    });
  });
};
