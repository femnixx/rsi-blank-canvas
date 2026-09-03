import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchWorkshop,
  createWorkshop,
  updateWorkshop,
  fetchMaterials,
  addMaterial,
  deleteMaterial,
} from "../../lib/api.js";

function FileIcon({ name }) {
  const ext = name.split(".").pop().toLowerCase();
  const color =
    ext === "pdf"
      ? "text-red-500"
      : ["doc", "docx"].includes(ext)
      ? "text-blue-500"
      : ["xls", "xlsx"].includes(ext)
      ? "text-green-600"
      : ["ppt", "pptx"].includes(ext)
      ? "text-orange-500"
      : ["zip", "rar", "7z"].includes(ext)
      ? "text-yellow-600"
      : ["png", "jpg", "jpeg", "gif", "svg"].includes(ext)
      ? "text-purple-500"
      : "text-zinc-500";

  return (
    <svg className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V11.25m8.625-9.75h2.25c.621 0 1.125.504 1.125 1.125v2.25m-13.5 0h13.5m-13.5 0L9 15m3.75-6v6" />
    </svg>
  );
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-blue/5 blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-brand-orange/5 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-brand-blue/5 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-navy" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-bg/50" />
    </div>
  );
}

function UploadProgress({ files, progress }) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm font-medium text-zinc-700">Uploading files...</p>
      <ul className="space-y-2">
        {files.map((file, index) => (
          <li key={index} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5">
            <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-700">{file.name}</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-brand-blue transition-all duration-300"
                  style={{ width: `${progress[index] || 0}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-zinc-500">{Math.round(progress[index] || 0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CreateWorkshop() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    speaker_name: "",
    event_date: "",
    location: "",
  });
  const [materials, setMaterials] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [createdWorkshopId, setCreatedWorkshopId] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadWorkshop();
    }
  }, [id, isEdit]);

  async function loadWorkshop() {
    try {
      const data = await fetchWorkshop(id);
      const w = data.workshop;
      setFormData({
        title: w.title,
        description: w.description || "",
        speaker_name: w.speaker_name || "",
        event_date: w.event_date ? w.event_date.slice(0, 16) : "",
        location: w.location || "",
      });

      const mats = await fetchMaterials(id, token);
      setMaterials(mats.materials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".zip", ".png", ".jpg", ".jpeg"];
      return allowed.includes(ext);
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    const workshopId = isEdit ? id : createdWorkshopId;
    if (!workshopId) {
      setError("Workshop must be saved before uploading materials.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    selectedFiles.forEach((file, index) => {
      formData.append(`titles[${index}]`, file.name.replace(/\.[^/.]+$/, ""));
    });

    setUploading(true);
    setUploadProgress({});

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = { ...prev };
        let allDone = true;
        selectedFiles.forEach((_, i) => {
          if (next[i] === undefined || next[i] < 90) {
            next[i] = (next[i] || 0) + Math.random() * 20;
            if (next[i] > 90) next[i] = 90;
            allDone = false;
          }
        });
        if (allDone) clearInterval(progressInterval);
        return next;
      });
    }, 300);

    try {
      const result = await addMaterial(workshopId, formData, token);
      clearInterval(progressInterval);
      setMaterials((prev) => [...prev, ...result.materials]);
      setSelectedFiles([]);
      setUploadProgress({});
      setSuccess(`Successfully uploaded ${result.materials.length} file(s)!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress({});
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const workshopId = isEdit ? id : createdWorkshopId;
      await deleteMaterial(workshopId, materialId, token);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.event_date) {
      setError("Title and event date are required.");
      return;
    }

    setSubmitting(true);
    try {
      let workshopId = id;
      if (isEdit) {
        await updateWorkshop(id, formData, token);
        setSuccess("Workshop updated successfully!");
      } else {
        const result = await createWorkshop(formData, token);
        workshopId = result.workshop.id;
        setCreatedWorkshopId(workshopId);
        setSuccess("Workshop created! You can now upload materials.");
      }
      setTimeout(() => setSuccess(""), 3000);
      if (!isEdit) {
        navigate(`/admin/create-workshop/${workshopId}/edit`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-brand-bg px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading workshop…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-56px)] bg-brand-bg px-6 py-12">
      <AnimatedBackground />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-brand-navy">
            {isEdit ? "Edit Workshop" : "Create New Workshop Session"}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:border-brand-blue hover:text-brand-navy"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        </div>

        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          <div className="relative flex items-start gap-6">
            <div className="flex-shrink-0 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A9 9 0 006 18c1.052 0 2.062-.18 3-.512m12-5.25a8.966 8.966 0 01-6 2.292m0 0a8.966 8.966 0 01-6-2.292m0 0v7.5" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{isEdit ? "Edit Session Details" : "New Workshop Session"}</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {isEdit ? "Update the workshop information below." : "Fill in the details below to publish a new workshop session."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duration: 2-3 hours
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h.75" />
                  </svg>
                  Certificate included
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm animate-slide-up">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm animate-slide-up">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">
                Workshop Title <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Advanced React Patterns"
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What will participants learn?"
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Speaker Name
                <input
                  type="text"
                  name="speaker_name"
                  value={formData.speaker_name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Smith"
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Location
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Room 203, Main Building"
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">
                Date & Time <span className="text-red-500">*</span>
                <input
                  type="datetime-local"
                  name="event_date"
                  required
                  value={formData.event_date}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 transition"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-lg bg-brand-blue px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? (isEdit ? "Saving Changes…" : "Publishing Workshop…") : isEdit ? "Save Changes" : "Publish Workshop"}
          </button>
        </form>

        {(isEdit || createdWorkshopId) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-brand-navy">Workshop Materials</h3>
                <p className="mt-1 text-sm text-zinc-500">Upload slides, PDFs, spreadsheets, or other resources for participants.</p>
              </div>
              <div className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-brand-blue">
                {materials.length} file{materials.length !== 1 ? "s" : ""}
              </div>
            </div>

            {materials.length > 0 && (
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="group relative flex items-start gap-3 rounded-xl border border-zinc-100 p-4 transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex-shrink-0 rounded-lg bg-zinc-50 p-2">
                      <FileIcon name={m.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-semibold text-brand-blue hover:underline"
                        title={m.title}
                      >
                        {m.title}
                      </a>
                      <p className="mt-1 text-xs text-zinc-500">{new Date(m.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                      title="Delete material"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isEdit && !createdWorkshopId && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                Publish the workshop first, then you can upload materials.
              </div>
            )}

            {(isEdit || createdWorkshopId) && (
              <form onSubmit={handleAddMaterial}>
                <div
                  className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition ${
                    dragOver
                      ? "border-brand-blue bg-blue-50/50 scale-[1.01]"
                      : "border-zinc-300 hover:border-zinc-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
                  />

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 transition group-hover:scale-110">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="mt-4 text-base font-semibold text-zinc-700">Drop files here or click to browse</p>
                  <p className="mt-2 text-xs text-zinc-500">PDF, DOC, PPT, XLS, TXT, ZIP, PNG, JPG up to 10 MB each</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-zinc-700">
                        Selected files ({selectedFiles.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Clear all
                      </button>
                    </div>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedFiles.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                        >
                          <div className="flex-shrink-0">
                            <FileIcon name={file.name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-700">{file.name}</p>
                            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploading && <UploadProgress files={selectedFiles} progress={uploadProgress} />}

                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="mt-6 w-full rounded-lg bg-brand-blue px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading…
                    </span>
                  ) : (
                    `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
