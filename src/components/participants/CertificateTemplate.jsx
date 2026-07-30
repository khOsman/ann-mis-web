import { forwardRef } from "react";
import certificateBg from "../../assets/certificate-bg.png";

// Exact dimensions of the certificate-bg.png asset — extracted directly from
// the real "ANN 2022 certificate template.ai" file (rasterized, with only
// the name and programme/year regions whitewashed for text overlay). Every
// other element (BRAC logo, ANN Changemakers logo, signature, decorative
// panel) is the real artwork, not a recreation.
const WIDTH = 1600;
const HEIGHT = 1130;

// Positions below are pixel-exact matches (at this WIDTH/HEIGHT) for the
// blanked-out regions in certificate-bg.png, measured from the source file.
const NAME_BOX = { left: 150, top: 444, width: 945, height: 63 };
const PROGRAMME_BOX = { left: 150, top: 654, width: 945, height: 54 };

const CertificateTemplate = forwardRef(function CertificateTemplate(
  { name, programmeName, year },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ width: WIDTH, height: HEIGHT, position: "relative" }}
    >
      <img
        src={certificateBg}
        alt=""
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: NAME_BOX.left,
          top: NAME_BOX.top,
          width: NAME_BOX.width,
          height: NAME_BOX.height,
          display: "flex",
          alignItems: "center",
          fontFamily: "Arial, 'Helvetica Neue', sans-serif",
          fontSize: 42,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#6B6B70",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {name || "Participant Name"}
      </div>

      <div
        style={{
          position: "absolute",
          left: PROGRAMME_BOX.left,
          top: PROGRAMME_BOX.top,
          width: PROGRAMME_BOX.width,
          height: PROGRAMME_BOX.height,
          display: "flex",
          alignItems: "center",
          fontFamily: "Arial, 'Helvetica Neue', sans-serif",
          fontSize: 34,
          fontWeight: "bold",
          whiteSpace: "nowrap",
          overflow: "hidden",
          backgroundImage: "linear-gradient(90deg, #681048 0%, #D03090 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {programmeName || "Amra Notun Changemakers' Programme"}
        {year ? `, ${year}` : ""}
      </div>
    </div>
  );
});

export default CertificateTemplate;
export { WIDTH as CERTIFICATE_WIDTH, HEIGHT as CERTIFICATE_HEIGHT };
