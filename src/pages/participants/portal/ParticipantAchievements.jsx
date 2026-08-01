import { useRef, useState } from "react";
import { Lock, Download } from "lucide-react";
import ParticipantLayout from "../../../layouts/ParticipantLayout";
import PageContainer from "../../../layouts/PageContainer";
import { useAuth } from "../../../context/AuthContext";
import { useParticipant } from "../../../hooks";
import { useAlert } from "../../../context/AlertContext";
import { GRADUATION_STATUS } from "../../../constants/status";
import CertificateTemplate, {
  CERTIFICATE_WIDTH,
  CERTIFICATE_HEIGHT,
} from "../../../components/participants/CertificateTemplate";
import { downloadCertificatePng } from "../../../services/certificateService";

const PREVIEW_SCALE = 0.55;

export default function ParticipantAchievements() {
  const { appUser } = useAuth();
  const { data: participant, loading } = useParticipant(appUser?.id);
  const { showAlert } = useAlert();

  const previewRef = useRef(null);
  // html2canvas captures an element's on-screen (transform-scaled) rendering,
  // not its natural layout size — capturing the shrunk preview node produced
  // a downscaled, visually corrupted image. This ref points at a separate,
  // off-screen, untransformed copy used only for the actual download.
  const downloadRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const graduated = participant?.graduation_status === GRADUATION_STATUS.GRADUATED;
  // Cohort codes use a 2-digit year suffix (e.g. "Raj-26") — expand to 4
  // digits to match the certificate's "..., 2022" style.
  const rawYear = participant?.cohort_code?.match(/(\d{2,4})$/)?.[1] || "";
  const cohortYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;

  const handleDownload = async () => {
    if (!downloadRef.current) return;

    setDownloading(true);

    try {
      await downloadCertificatePng({
        element: downloadRef.current,
        fileName: `${participant.participant_code || "certificate"}_Certificate.png`,
      });
    } catch (error) {
      console.error("Certificate download failed:", error);
      showAlert("error", "Failed to generate your certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ParticipantLayout title="Achievements" subtitle="Your milestones with Amra Notun Network">
      <PageContainer className="py-6 lg:py-8 space-y-6">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--ann-text-dark)]">
              Certificate of Appreciation
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {graduated
                ? "Congratulations on your graduation! Your certificate is ready to download."
                : "Your certificate will be available here once you graduate from the programme."}
            </p>

            {graduated ? (
              <>
                <div
                  className="mt-5 border border-gray-200 rounded-xl overflow-hidden"
                  style={{
                    width: CERTIFICATE_WIDTH * PREVIEW_SCALE,
                    height: CERTIFICATE_HEIGHT * PREVIEW_SCALE,
                  }}
                >
                  <div
                    style={{
                      width: CERTIFICATE_WIDTH,
                      height: CERTIFICATE_HEIGHT,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <CertificateTemplate
                      ref={previewRef}
                      name={participant.name}
                      programmeName="Amra Notun Network Changemakers' Training"
                      year={cohortYear}
                    />
                  </div>
                </div>

                <div style={{ position: "absolute", left: -99999, top: 0 }}>
                  <CertificateTemplate
                    ref={downloadRef}
                    name={participant.name}
                    programmeName="Amra Notun Network Changemakers' Training"
                    year={cohortYear}
                  />
                </div>

                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownload}
                  className="mt-5 inline-flex items-center gap-2 bg-[var(--ann-pink)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Download size={18} />
                  {downloading ? "Preparing..." : "Download Certificate"}
                </button>
              </>
            ) : (
              <div className="mt-5 border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center text-center text-gray-400">
                <Lock size={32} />
                <p className="mt-3 text-sm">
                  Locked — available after your graduation status is set to "Graduated".
                </p>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </ParticipantLayout>
  );
}
