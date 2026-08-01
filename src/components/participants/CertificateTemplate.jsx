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
          // line-height (not flex/align-items) centers the text — html2canvas
          // doesn't reliably capture flexbox vertical centering and was
          // rendering the text pushed outside this box, clipped by overflow:
          // hidden down to a few stray pixel slivers.
          lineHeight: `${NAME_BOX.height}px`,
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
          lineHeight: `${PROGRAMME_BOX.height}px`,
          fontFamily: "Arial, 'Helvetica Neue', sans-serif",
          fontSize: 34,
          fontWeight: "bold",
          whiteSpace: "nowrap",
          overflow: "hidden",
          // A flat color, not the original file's left-to-right gradient —
          // html2canvas (used to rasterize this for download) doesn't
          // support background-clip: text, and silently paints a solid
          // black box instead when it's used. This is the midpoint of the
          // sampled gradient (#681048 -> #D03090).
          color: "#9C206C",
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
