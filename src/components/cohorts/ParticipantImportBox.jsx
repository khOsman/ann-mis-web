import { useState } from "react";
import { parseCsvFile } from "../../utils/csvUtils";
import { importParticipantsForCohort } from "../../services/participantImportService";

export default function ParticipantImportBox({ cohort, onImported, showAlert }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!file) {
      showAlert("warning", "Please select a CSV file first.");
      return;
    }

    setImporting(true);

    try {
      const rows = await parseCsvFile(file);

      const result = await importParticipantsForCohort({
        rows,
        cohort,
      });

      showAlert(
        "success",
        `${result.importedParticipants} participants imported successfully.`
      );

      setFile(null);

      if (onImported) {
        onImported();
      }
    } catch (error) {
      console.error("Participant import failed:", error);
      showAlert("error", error.message || "Failed to import participants.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold mb-2">Import Participants</h3>

      <p className="text-sm text-gray-500 mb-5">
        Upload participant data for this cohort using the approved CSV format.
      </p>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border border-gray-300 rounded-xl px-4 py-3 text-sm"
        />

        <button
          type="button"
          disabled={importing}
          onClick={handleImport}
          className="bg-[var(--ann-pink)] text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import Participants"}
        </button>
      </div>

      {file && (
        <p className="text-xs text-gray-500 mt-3">
          Selected file: {file.name}
        </p>
      )}
    </div>
  );
}