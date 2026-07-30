import { forwardRef } from "react";
import annLogo from "../../assets/ann-logo.png";

// Fixed pixel canvas so the exported PDF has a predictable, consistent
// layout — html2canvas (used internally by jsPDF's .html()) renders
// whatever size this element actually is in the DOM.
const WIDTH = 1000;
const HEIGHT = 680;

// Placeholder — the repo has no BRAC logo asset separate from the ANN
// Changemakers mark, so this approximates the wordmark in CSS until a real
// logo file is supplied.
function BracWordmark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-full bg-[#E6007E] flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-white" />
      </div>
      <span className="text-3xl font-extrabold text-[#E6007E] tracking-tight">
        brac
      </span>
    </div>
  );
}

const PATTERN_CELLS = Array.from({ length: 9 }, (_, i) => i);

const CertificateTemplate = forwardRef(function CertificateTemplate(
  { name, programmeName, year },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ width: WIDTH, height: HEIGHT }}
      className="relative bg-white overflow-hidden flex"
    >
      {/* Left content area with dashed border */}
      <div
        className="relative flex-1 border-[3px] border-dashed m-6"
        style={{ borderColor: "#E6007E" }}
      >
        <div className="h-full flex flex-col justify-between px-14 py-10">
          <div className="flex items-start justify-between">
            <BracWordmark />
            <img src={annLogo} alt="ANN Changemakers" className="w-24 h-24 object-contain" />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              This certificate is proudly presented to
            </p>

            <h1
              className="text-6xl mt-3 text-gray-700"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {name || "Participant Name"}
            </h1>

            <p className="text-sm text-gray-500 mt-8">
              In recognition of your graduation from
            </p>

            <p className="text-2xl font-bold mt-1" style={{ color: "#E6007E" }}>
              {programmeName || "Amra Notun Changemakers' Programme"} {year || ""}
            </p>
          </div>

          <div className="flex items-end gap-4">
            <div>
              <p
                className="text-2xl text-gray-700"
                style={{ fontFamily: "'Brush Script MT', cursive" }}
              >
                Asif Saleh
              </p>
              <div className="border-t border-gray-400 w-52 mt-1 pt-1">
                <p className="font-bold text-gray-800 text-sm">Asif Saleh</p>
                <p className="text-xs text-gray-500">Executive Director</p>
                <p className="text-xs text-gray-500">BRAC</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right decorative panel */}
      <div className="relative w-56 flex flex-col">
        <div
          className="flex-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #FF008C 0px, #C2006B 40px, #FF008C 80px)",
          }}
        />

        <div className="grid grid-cols-3 gap-[3px] bg-[#2B2368] p-[3px]">
          {PATTERN_CELLS.map((i) => (
            <div
              key={i}
              className="aspect-square flex items-center justify-center"
              style={{
                backgroundColor: i % 2 === 0 ? "#FF008C" : "#2B2368",
                backgroundImage:
                  i % 3 === 0
                    ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 2px, transparent 2px, transparent 8px)"
                    : undefined,
              }}
            />
          ))}
        </div>

        <div className="bg-[#2B2368] text-center py-3">
          <p className="text-[#FF008C] font-extrabold text-xs tracking-wide">
            A CHANGEMAKERS' NETWORK
          </p>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
export { WIDTH as CERTIFICATE_WIDTH, HEIGHT as CERTIFICATE_HEIGHT };
