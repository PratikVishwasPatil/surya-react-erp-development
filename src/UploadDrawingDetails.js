import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

// ── Date formatter → "03-Apr-2026" ─────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // "dd-mm-yyyy ..." or "dd-mm-yyyy / HH:MM AM"
  const dmyMatch = String(dateStr).match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${dd}-${monthNames[parseInt(mm, 10) - 1]}-${yyyy}`;
  }
  // "yyyy-mm-dd"
  const isoMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}-${monthNames[parseInt(mm, 10) - 1]}-${yyyy}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2,"0")}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  }
  return dateStr;
};

const UploadDrawingDetails = () => {
  const { fileId: paramFileId } = useParams();

  const getFileIdFromUrl = () => {
    const hash = window.location.hash;
    const hashMatch = hash.match(/\/upload-drawing-details\/(\d+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1];
    return paramFileId;
  };

  const [fileId, setFileId]       = useState(getFileIdFromUrl());
  const [theme, setTheme]         = useState("light");
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth <= 768);

  const [fileDetails, setFileDetails]           = useState(null);
  const [drawingCategories, setDrawingCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [designComments, setDesignComments]     = useState([]);

  const [uploadForm, setUploadForm] = useState({ docName: "", comment: "", files: [] });
  const fileInputRef = useRef(null);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = "info") => {
    const toastDiv = document.createElement("div");
    toastDiv.style.cssText = `
      position:fixed;top:20px;right:20px;padding:15px 25px;
      background:${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#17a2b8"};
      color:white;border-radius:5px;box-shadow:0 4px 6px rgba(0,0,0,0.2);
      z-index:9999;font-family:Arial,sans-serif;animation:slideIn 0.3s ease-out;
    `;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => {
      toastDiv.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => document.body.removeChild(toastDiv), 300);
    }, 3000);
  };

  // ─── Global styles ────────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes slideOut{ from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
      @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .fade-in { animation:fadeIn 0.5s ease-out; }

      /* ── Drawing entry wrapper ── */
      .drawing-entry {
        border: 1px solid #dee2e6;
        border-radius: 6px;
        margin-bottom: 16px;
        overflow: hidden;
      }
      .drawing-entry-dark {
        border-color: #495057;
      }

      /* ── Meta row: avatar + Name/Date/Time spread across full width ── */
      .drawing-meta-row {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 16px;
        border-bottom: 1px solid #dee2e6;
      }
      .drawing-meta-row-dark {
        border-bottom-color: #495057;
      }

      /* Avatar — matches the orange/yellow oval in the screenshot */
      .drawing-avatar {
        width: 64px;
        height: 46px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f5a623 0%, #f0c040 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        border: 2px solid #e0940a;
      }
      .drawing-avatar i {
        font-size: 1.6rem;
        color: #5a3a00;
      }

      /* Name / Date / Time — spread across remaining space */
      .drawing-meta-fields {
        display: flex;
        flex: 1;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      .drawing-meta-field {
        font-size: 0.9rem;
        white-space: nowrap;
      }
      .drawing-meta-field span {
        font-weight: 600;
      }

      /* ── Documents table inside each entry ── */
      .drawing-docs-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .drawing-docs-table th {
        padding: 9px 14px;
        font-weight: 600;
        font-size: 0.82rem;
        background: #e9ecef;
        color: #495057;
        border-bottom: 1px solid #dee2e6;
        white-space: nowrap;
      }
      .drawing-docs-table-dark th {
        background: #3a3f47 !important;
        color: #adb5bd !important;
        border-bottom-color: #495057 !important;
      }
      .drawing-docs-table td {
        padding: 9px 14px;
        border-bottom: 1px solid #f0f0f0;
        vertical-align: middle;
      }
      .drawing-docs-table-dark td {
        border-bottom-color: #3a3f47 !important;
      }
      .drawing-docs-table tbody tr:last-child td {
        border-bottom: none;
      }
      .drawing-docs-table tbody tr:hover td {
        background: rgba(0,123,255,0.04);
      }

      /* ── File chips ── */
      .file-chip {
        display:inline-flex;align-items:center;gap:6px;
        background:#e9ecef;border-radius:20px;padding:4px 12px;
        font-size:0.82rem;margin:4px;
      }
      .file-chip .remove-file {
        cursor:pointer;color:#dc3545;font-size:1rem;line-height:1;
      }
      .file-chip .remove-file:hover { color:#a71d2a; }

      /* ── Section title ── */
      .drawings-section-title {
        font-size: 1rem;
        font-weight: 700;
        padding-bottom: 10px;
        margin-bottom: 18px;
        border-bottom: 2px solid #764ba2;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const newId = getFileIdFromUrl();
      if (newId && newId !== fileId) setFileId(newId);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [fileId]);

  // ─── API ──────────────────────────────────────────────────────────────────
  const API = "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api";

  const fetchFileDetails = async () => {
    if (!fileId) return;
    try {
      const res  = await fetch(`${API}/getUploadDrawingFileDetailsApi.php?FILE_ID=${fileId}`);
      const data = await res.json();
      if (data.status === "success" && data.data) setFileDetails(data.data.file_details);
    } catch (err) { console.error("fetchFileDetails error:", err); }
  };

  const fetchDrawingCategories = async () => {
    try {
      const res  = await fetch(`${API}/getDrawingCategoriesApi.php`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.data)) setDrawingCategories(data.data);
    } catch (err) { console.error("fetchDrawingCategories error:", err); }
  };

  const fetchDesignComments = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/getDesignCommentsApi.php?file_id=${fileId}`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.data)) setDesignComments(data.data);
      else setDesignComments([]);
    } catch (err) { console.error("fetchDesignComments error:", err); setDesignComments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFileDetails();
    fetchDrawingCategories();
    fetchDesignComments();
  }, [fileId]);

  // ─── File handling ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;
    setUploadForm((prev) => ({
      ...prev,
      files: [
        ...prev.files,
        ...newFiles.filter(
          (nf) => !prev.files.some((ef) => ef.name === nf.name && ef.size === nf.size)
        ),
      ],
    }));
    e.target.value = "";
  };

  const removeFile = (index) =>
    setUploadForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));

  // ─── Upload ───────────────────────────────────────────────────────────────
  const handleUploadSubmit = async () => {
    if (!selectedCategory)           { showToast("Please select a drawing category", "error"); return; }
    if (!uploadForm.docName.trim())  { showToast("Please enter document name", "error"); return; }
    if (!uploadForm.comment.trim())  { showToast("Please enter a comment", "error"); return; }
    if (uploadForm.files.length === 0) { showToast("Please select at least one file", "error"); return; }

    setUploading(true);
    try {
      const employeeId = sessionStorage.getItem("userId");
      const formData   = new FormData();
      formData.append("fileId",        fileId);
      formData.append("employee_id",   employeeId);
      formData.append("docCategory",   selectedCategory);
      formData.append("DocumentName",  uploadForm.docName.trim());
      formData.append("comment",       uploadForm.comment.trim());
      uploadForm.files.forEach((file) => formData.append("file[]", file));

      const res  = await fetch(`${API}/uploadDrawingApi.php`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.status === "success") {
        showToast(`${uploadForm.files.length} file(s) uploaded successfully!`, "success");
        setUploadForm({ docName: "", comment: "", files: [] });
        setSelectedCategory("");
        await fetchDesignComments();
      } else {
        showToast(data.message || "Upload failed", "error");
      }
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.substring(0, 2)).toUpperCase();
  };

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const getThemeStyles = () =>
    theme === "dark"
      ? { backgroundColor: "#1a1d23", color: "#f8f9fa", cardBg: "#2d3238", cardHeader: "#3a3f47", borderColor: "#495057" }
      : { backgroundColor: "#f5f7fa", color: "#212529", cardBg: "#ffffff", cardHeader: "#f8f9fa", borderColor: "#dee2e6" };

  const ts = getThemeStyles();
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.style.background  = ts.backgroundColor;
    document.body.style.color       = ts.color;
    document.body.style.minHeight   = "100vh";
    return () => {
      document.body.style.background = "";
      document.body.style.color      = "";
      document.body.style.minHeight  = "";
    };
  }, [theme]);

  // ─── File icon ────────────────────────────────────────────────────────────
  const fileIcon = (fileName) => {
    const ext = (fileName || "").toLowerCase();
    if (ext.endsWith(".pdf"))
      return (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
          alt="PDF"
          style={{ width: "28px", height: "28px", cursor: "pointer" }}
          onClick={() => {}}
        />
      );
    if (ext.match(/\.(png|jpg|jpeg|gif|webp)$/))
      return <i className="bi bi-file-image-fill" style={{ fontSize: "1.5rem", color: "#0d6efd" }} />;
    return <i className="bi bi-file-earmark-fill" style={{ fontSize: "1.5rem", color: "#6c757d" }} />;
  };

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (loading && designComments.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: ts.backgroundColor }}>
        <div style={{ textAlign: "center", color: ts.color }}>
          <Spinner animation="border" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-3">Loading drawings...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: ts.backgroundColor, color: ts.color, padding: "20px 0" }}>
      <Container fluid>
        <Card style={{ backgroundColor: ts.cardBg, border: `1px solid ${ts.borderColor}`, borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>

          {/* ── Header ── */}
          <Card.Header
            style={{
              background: isDark
                ? "linear-gradient(135deg,#3a3f47 0%,#2d3238 100%)"
                : "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
              color: "#ffffff",
              padding: "1.5rem 2rem",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Row className="align-items-center">
              <Col xs={12} lg={8}>
                <h4 className="mb-1" style={{ fontWeight: "700" }}>
                  {fileDetails?.FILE_NAME || "Upload Drawing Details"}
                </h4>
                <small style={{ opacity: 0.9 }}>
                  File ID: {fileId} | Customer: {fileDetails?.CUSTOMER_NAME || "N/A"}
                </small>
              </Col>
              <Col xs={12} lg={4} className="text-end mt-3 mt-lg-0">
                <Button variant="outline-light" size="sm" onClick={toggleTheme} className="me-2">
                  {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                </Button>
                <Button variant="outline-light" size="sm" onClick={() => window.history.back()}>
                  <i className="bi bi-arrow-left me-2"></i>Back
                </Button>
              </Col>
            </Row>
          </Card.Header>

          {/* ── Body ── */}
          <Card.Body style={{ padding: "2rem" }} className="fade-in">

            {/* ── Upload Form ── */}
            <Card
              style={{
                backgroundColor: isDark ? "#3a3f47" : "#f8f9fa",
                border: `2px dashed ${ts.borderColor}`,
                marginBottom: "30px",
                borderRadius: "10px",
              }}
            >
              <Card.Body>
                <h5 style={{ fontWeight: "700", marginBottom: "20px" }}>
                  <i className="bi bi-cloud-upload me-2" style={{ color: "#667eea" }}></i>
                  Upload Drawings
                </h5>

                <Row className="g-3 align-items-end">
                  <Col xs={12} md={3}>
                    <Form.Label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Drawing Category <span style={{ color: "#dc3545" }}>*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{ backgroundColor: ts.cardBg, color: ts.color, borderColor: ts.borderColor }}
                    >
                      <option value="">Select category...</option>
                      {drawingCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.drawing_name}</option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={3}>
                    <Form.Label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Document Name <span style={{ color: "#dc3545" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter document name"
                      value={uploadForm.docName}
                      onChange={(e) => setUploadForm({ ...uploadForm, docName: e.target.value })}
                      style={{ backgroundColor: ts.cardBg, color: ts.color, borderColor: ts.borderColor }}
                    />
                  </Col>

                  <Col xs={12} md={3}>
                    <Form.Label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Comment <span style={{ color: "#dc3545" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Add comment"
                      value={uploadForm.comment}
                      onChange={(e) => setUploadForm({ ...uploadForm, comment: e.target.value })}
                      style={{ backgroundColor: ts.cardBg, color: ts.color, borderColor: ts.borderColor }}
                    />
                  </Col>

                  <Col xs={12} md={2}>
                    <Form.Label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Files <span style={{ color: "#dc3545" }}>*</span>
                    </Form.Label>
                    <Button
                      variant="outline-secondary"
                      className="w-100"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-paperclip me-2"></i>
                      {uploadForm.files.length > 0 ? `${uploadForm.files.length} file(s)` : "Choose Files"}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      style={{ display: "none" }}
                      accept=".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg"
                    />
                  </Col>

                  <Col xs={12} md={1}>
                    <Button
                      className="w-100"
                      onClick={handleUploadSubmit}
                      disabled={uploading}
                      style={{
                        background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
                        border: "none",
                        minHeight: "38px",
                      }}
                    >
                      {uploading ? <Spinner animation="border" size="sm" /> : <i className="bi bi-send"></i>}
                    </Button>
                  </Col>
                </Row>

                {uploadForm.files.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <small style={{ fontWeight: "600", marginRight: "8px" }}>Selected files:</small>
                    {uploadForm.files.map((f, i) => (
                      <span key={i} className="file-chip">
                        <i className="bi bi-file-earmark"></i>
                        {f.name}
                        <span className="remove-file" onClick={() => removeFile(i)} title="Remove">×</span>
                      </span>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* ── Drawings Section ── */}
            <div className="drawings-section-title" style={{ color: ts.color, borderBottomColor: isDark ? "#667eea" : "#764ba2" }}>
              <i className="bi bi-images me-2"></i>
              Drawings
              {loading && <Spinner animation="border" size="sm" className="ms-2" />}
            </div>

            {!loading && designComments.length === 0 ? (
              <Alert variant="info" className="text-center">
                <i className="bi bi-inbox me-2"></i>
                No drawings uploaded yet
              </Alert>
            ) : (
              designComments.map((comment) => (
                <div
                  key={comment.comment_id}
                  className={`drawing-entry${isDark ? " drawing-entry-dark" : ""}`}
                  style={{ backgroundColor: ts.cardBg, borderColor: ts.borderColor }}
                >
                  {/* ── Meta row: avatar | Name (flex-grow) | Date | Time ── */}
                  <div
                    className={`drawing-meta-row${isDark ? " drawing-meta-row-dark" : ""}`}
                    style={{
                      backgroundColor: isDark ? "#3a3f47" : "#ffffff",
                      borderBottomColor: ts.borderColor,
                    }}
                  >
                    {/* Avatar — orange oval with person icon, matching screenshot */}
                    <div className="drawing-avatar">
                      <i className="bi bi-person-fill"></i>
                    </div>

                    {/* Name / Date / Time spread across full remaining width */}
                    <div className="drawing-meta-fields">
                      <div className="drawing-meta-field" style={{ color: ts.color }}>
                        Name: <span>{comment.employee_name || "—"}</span>
                      </div>
                      <div className="drawing-meta-field" style={{ color: ts.color }}>
                        Date: <span>{formatDate(comment.comment_date)}</span>
                      </div>
                      <div className="drawing-meta-field" style={{ color: ts.color }}>
                        Time: <span>{comment.comment_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Documents table ── */}
                  {comment.has_documents && Array.isArray(comment.documents) && comment.documents.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table className={`drawing-docs-table${isDark ? " drawing-docs-table-dark" : ""}`}>
                        <thead>
                          <tr>
                            <th style={{ width: "70px" }}>Sr No</th>
                            <th>Document Category</th>
                            <th>Document Name</th>
                            <th>Comment</th>
                            <th>File Name</th>
                            <th style={{ width: "90px", textAlign: "center" }}>Document</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comment.documents.map((doc, di) => (
                            <tr
                              key={doc.sr_no ?? di}
                              style={{ backgroundColor: ts.cardBg, color: ts.color }}
                            >
                              {/* Sr No — no number shown in screenshot (blank), but keep for alignment */}
                              <td style={{ color: isDark ? "#adb5bd" : "#6c757d", textAlign: "center" }}>
                                {/* sr_no intentionally left blank to match screenshot */}
                              </td>
                              <td>{doc.category_name}</td>
                              <td>{doc.document_name}</td>
                              <td style={{ color: isDark ? "#adb5bd" : "#6c757d" }}>
                                {comment.comment_text}
                              </td>
                              <td style={{ fontSize: "0.82rem", color: isDark ? "#adb5bd" : "#555" }}>
                                {doc.file_name}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  onClick={() => window.open(doc.file_path, "_blank")}
                                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                  title={`Open ${doc.file_name}`}
                                >
                                  {doc.file_name?.toLowerCase().endsWith(".pdf") ? (
                                    <img
                                      src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                                      alt="PDF"
                                      style={{ width: "26px", height: "26px" }}
                                    />
                                  ) : doc.file_name?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) ? (
                                    <i className="bi bi-file-image-fill" style={{ fontSize: "1.5rem", color: "#0d6efd" }} />
                                  ) : (
                                    <i className="bi bi-file-earmark-fill" style={{ fontSize: "1.5rem", color: "#6c757d" }} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default UploadDrawingDetails;