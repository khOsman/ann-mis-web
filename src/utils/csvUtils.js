import Papa from "papaparse";

export const parseCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("CSV file is required."));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0].message || "Failed to parse CSV."));
          return;
        }

        resolve(result.data || []);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};