import { useState } from "react";
import {
  Upload,
  CheckCircle2,
  XSquare,
  AlertCircle,
  FileDown,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import { cn } from "../utils/cn";

const BulkOnboardPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(
        "/admin/ambassadors/bulk",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResults(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error uploading file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "firstName,lastName,email,university\nJohn,Doe,john@example.com,Lagos State University\nJane,Smith,jane@example.com,";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fellows_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading text-neutral-900">
          Bulk Onboarding
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Upload a CSV file to create multiple fellows accounts at once.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold">
              1. Prepare your file
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="text-blue-600 gap-2"
            >
              <FileDown size={18} /> Download CSV Template
            </Button>
          </div>
          <p className="text-sm text-neutral-500 bg-neutral-50 p-4 rounded-xl">
            Ensure your CSV matches the template structure. Required columns:{" "}
            <code className="text-blue-600 font-bold">firstName</code>,{" "}
            <code className="text-blue-600 font-bold">lastName</code>,{" "}
            <code className="text-blue-600 font-bold">email</code>.{" "}
            Optional: <code className="text-neutral-400 font-bold">university</code>.
          </p>

          <div className="h-px bg-neutral-100"></div>

          <h2 className="text-lg font-heading font-bold">2. Upload</h2>
          <div
            className={cn(
              "border-2 border-dashed rounded-3xl p-12 text-center transition-colors",
              file
                ? "border-blue-200 bg-blue-50/30"
                : "border-neutral-200 hover:border-blue-300"
            )}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600 w-8 h-8" />
              </div>
              <p className="text-neutral-900 font-heading font-bold">
                {file ? file.name : "Choose CSV file or drag and drop"}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                Only .csv files up to 5MB
              </p>
            </label>
          </div>

          <Button
            className="w-full h-12"
            disabled={!file || isUploading}
            isLoading={isUploading}
            onClick={handleUpload}
          >
            Start Processing
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-bold mb-6">Processing Results</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle2 size={18} />
                <span className="text-sm font-heading font-bold uppercase tracking-wider">
                  Success
                </span>
              </div>
              <p className="text-2xl font-heading font-bold text-green-900">
                {results.successCount}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XSquare size={18} />
                <span className="text-sm font-heading font-bold uppercase tracking-wider">
                  Errors
                </span>
              </div>
              <p className="text-2xl font-heading font-bold text-red-900">
                {results.errorCount}
              </p>
            </div>
          </div>

          {results.errors?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase">
                Error Details
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {results.errors.map((err: any, i: number) => (
                  <div
                    key={i}
                    className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-neutral-900">
                      {err.email || "Record " + (i + 1)}
                    </span>
                    <span className="text-red-600">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkOnboardPage;
