import html2canvas from "html2canvas";

// Renders an already-mounted DOM element (the CertificateTemplate) directly
// to a PNG via html2canvas. Previously went through jsPDF's .html(), which
// silently produced a spurious second (blank) page and doesn't support
// html2canvas rendering everything correctly on every element style — a
// direct canvas -> PNG download is simpler and has neither problem.
export const downloadCertificatePng = async ({ element, fileName }) => {
  const canvas = await html2canvas(element, {
    scale: 2, // crisp output for a document meant to be printed/kept
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  if (!blob) {
    throw new Error("Failed to generate certificate image.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
