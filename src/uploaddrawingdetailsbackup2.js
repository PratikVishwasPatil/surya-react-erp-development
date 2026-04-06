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

const UploadDrawingDetails = () => {
  const { fileId: paramFileId } = useParams();

  const getFileIdFromUrl = () => {
    const hash = window.location.hash;
    const hashMatch = hash.match(/\/upload-drawing-details\/(\d+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1];
    return paramFileId;
  };

  const [fileId, setFileId] = useState(getFileIdFromUrl());
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // File Details (for header)
  const [fileDetails, setFileDetails] = useState(null);

  // Upload Drawings State
  const [drawingCategories, setDrawingCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [designComments, setDesignComments] = useState([]);

  // Upload form state — files is now an array
  const [uploadForm, setUploadForm] = useState({
    docName: "",
    comment: "",
    files: [],
  });

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

  // ─── Animations / global styles ──────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes slideOut{ from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
      @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .fade-in { animation:fadeIn 0.5s ease-out; }
      .comment-card {
        border-left:4px solid #28a745;margin-bottom:20px;
        transition:transform 0.2s,box-shadow 0.2s;
      }
      .comment-card:hover { transform:translateX(5px);box-shadow:0 4px 12px rgba(0,0,0,.15); }
      .document-row { padding:10px;border-radius:5px;transition:background-color 0.2s; }
      .document-row:hover { background-color:rgba(0,123,255,0.05); }
      .avatar-circle {
        width:50px;height:50px;border-radius:50%;
        background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:bold;font-size:1.2rem;flex-shrink:0;
      }
      .file-chip {
        display:inline-flex;align-items:center;gap:6px;
        background:#e9ecef;border-radius:20px;padding:4px 12px;
        font-size:0.82rem;margin:4px;
      }
      .file-chip .remove-file {
        cursor:pointer;color:#dc3545;font-size:1rem;line-height:1;
      }
      .file-chip .remove-file:hover { color:#a71d2a; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ─── Resize handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Hash change ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleHashChange = () => {
      const newId = getFileIdFromUrl();
      if (newId && newId !== fileId) setFileId(newId);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [fileId]);

  // ─── API calls ────────────────────────────────────────────────────────────
  const API = "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api";

  const fetchFileDetails = async () => {
    if (!fileId) return;
    try {
      const res = await fetch(`${API}/getUploadDrawingFileDetailsApi.php?FILE_ID=${fileId}`);
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setFileDetails(data.data.file_details);
      }
    } catch (err) {
      console.error("fetchFileDetails error:", err);
    }
  };

  const fetchDrawingCategories = async () => {
    try {
      const res = await fetch(`${API}/getDrawingCategoriesApi.php`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setDrawingCategories(data.data);
      }
    } catch (err) {
      console.error("fetchDrawingCategories error:", err);
    }
  };

  const fetchDesignComments = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/getDesignCommentsApi.php?file_id=${fileId}`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setDesignComments(data.data);
      } else {
        setDesignComments([]);
      }
    } catch (err) {
      console.error("fetchDesignComments error:", err);
      setDesignComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileDetails();
    fetchDrawingCategories();
    fetchDesignComments();
  }, [fileId]);

  // ─── File selection (multiple) ────────────────────────────────────────────
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;
    setUploadForm((prev) => ({
      ...prev,
      // Merge, avoid exact duplicates by name+size
      files: [
        ...prev.files,
        ...newFiles.filter(
          (nf) => !prev.files.some((ef) => ef.name === nf.name && ef.size === nf.size)
        ),
      ],
    }));
    // Reset input so same files can be re-added after removal
    e.target.value = "";
  };

  const removeFile = (index) => {
    setUploadForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // ─── Upload submit ────────────────────────────────────────────────────────
 const handleUploadSubmit = async () => {
    if (!selectedCategory) { showToast("Please select a drawing category", "error"); return; }
    if (!uploadForm.docName.trim()) { showToast("Please enter document name", "error"); return; }
    if (!uploadForm.comment.trim()) { showToast("Please enter a comment", "error"); return; }
    if (uploadForm.files.length === 0) { showToast("Please select at least one file", "error"); return; }

    setUploading(true);
    try {
        const shortname = sessionStorage.getItem("shortname") || "admin";
        // const employeeId = sessionStorage.getItem("employee_id") || "1"; // ← get real employee_id
    const employeeId = sessionStorage.getItem('userId');


        const formData = new FormData();
        formData.append("fileId", fileId);              // ← was "file_id", PHP expects "fileId"
        formData.append("employee_id", employeeId);     // ← was missing entirely
        formData.append("docCategory", selectedCategory); // ← was "drawing_category_id"
        formData.append("DocumentName", uploadForm.docName.trim()); // ← was "doc_name"
        formData.append("comment", uploadForm.comment.trim());

        // PHP uses $_FILES['file'], so key must be "file" not "files[]"
        uploadForm.files.forEach((file) => {
            formData.append("file[]", file);            // ← was "files[]"
        });

        const res = await fetch(`${API}/uploadDrawingApi.php`, {
            method: "POST",
            body: formData,
        });

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
        console.error("Upload error:", err);
        showToast("Upload failed: " + err.message, "error");
    } finally {
        setUploading(false);
    }
};

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // ─── Theme ────────────────────────────────────────────────────────────────
  const getThemeStyles = () =>
    theme === "dark"
      ? { backgroundColor: "#1a1d23", color: "#f8f9fa", cardBg: "#2d3238", cardHeader: "#3a3f47", borderColor: "#495057" }
      : { backgroundColor: "#f5f7fa", color: "#212529", cardBg: "#ffffff", cardHeader: "#f8f9fa", borderColor: "#dee2e6" };

  const ts = getThemeStyles();

  useEffect(() => {
    document.body.style.background = ts.backgroundColor;
    document.body.style.color = ts.color;
    document.body.style.minHeight = "100vh";
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
      document.body.style.minHeight = "";
    };
  }, [theme]);

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
              background: theme === "dark"
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
                backgroundColor: theme === "dark" ? "#3a3f47" : "#f8f9fa",
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
                  {/* Category */}
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

                  {/* Doc Name */}
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

                  {/* Comment */}
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

                  {/* File picker */}
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
                      {uploadForm.files.length > 0
                        ? `${uploadForm.files.length} file(s)`
                        : "Choose Files"}
                    </Button>
                    {/* multiple + accept all common drawing formats */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      style={{ display: "none" }}
                      accept=".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg"
                    />
                  </Col>

                  {/* Submit */}
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
                      {uploading
                        ? <Spinner animation="border" size="sm" />
                        : <i className="bi bi-send"></i>}
                    </Button>
                  </Col>
                </Row>

                {/* Selected files chips */}
                {uploadForm.files.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <small style={{ fontWeight: "600", marginRight: "8px" }}>
                      Selected files:
                    </small>
                    {uploadForm.files.map((f, i) => (
                      <span key={i} className="file-chip">
                        <i className="bi bi-file-earmark"></i>
                        {f.name}
                        <span
                          className="remove-file"
                          onClick={() => removeFile(i)}
                          title="Remove"
                        >×</span>
                      </span>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* ── Drawings List ── */}
            <h5
              style={{
                borderBottom: `2px solid ${theme === "dark" ? "#667eea" : "#764ba2"}`,
                paddingBottom: "10px",
                marginBottom: "25px",
                fontWeight: "600",
              }}
            >
              <i className="bi bi-images me-2"></i>
              Uploaded Drawings
              {loading && <Spinner animation="border" size="sm" className="ms-2" />}
            </h5>

            {!loading && designComments.length === 0 ? (
              <Alert variant="info" className="text-center">
                <i className="bi bi-inbox me-2"></i>
                No drawings uploaded yet
              </Alert>
            ) : (
              designComments.map((comment) => (
                <Card
                  key={comment.comment_id}
                  className="comment-card"
                  style={{ backgroundColor: ts.cardBg, border: `1px solid ${ts.borderColor}` }}
                >
                  <Card.Body>
                    {/* Author + date */}
                    <div className="d-flex align-items-start mb-3">
                      <div className="avatar-circle me-3">
                        {getInitials(comment.employee_name)}
                      </div>
                      <div className="flex-grow-1">
                        <h6 style={{ fontWeight: "700", marginBottom: "4px" }}>
                          {comment.employee_name}
                        </h6>
                        <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                          <i className="bi bi-calendar me-1"></i>{comment.comment_date}
                          <i className="bi bi-clock ms-3 me-1"></i>{comment.comment_time}
                        </div>
                      </div>
                    </div>

                    

                    {/* Documents table */}
                    {comment.has_documents && Array.isArray(comment.documents) && comment.documents.length > 0 && (
                      <div>
                        <h6 style={{ fontWeight: "600", marginBottom: "12px" }}>
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Documents ({comment.documents.length})
                        </h6>
                        <div style={{ overflowX: "auto" }}>
                          <Table
                            hover
                            size="sm"
                            style={{ backgroundColor: ts.cardBg, color: ts.color, minWidth: "600px" }}
                          >
                            <thead style={{ background: theme === "dark" ? "#3a3f47" : "#e9ecef" }}>
                              <tr>
                                <th>#</th>
                                <th>Category</th>
                                <th>Document Name</th>
                                <th>Comment</th>
                                <th>File Name</th>
                                <th>View</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comment.documents.map((doc, di) => (
                                <tr key={doc.sr_no ?? di} className="document-row">
                                  <td>{doc.sr_no ?? di + 1}</td>
                                  <td>{doc.category_name}</td>
                                  <td>{doc.document_name}</td>
                                  <td>{comment.comment_text}</td>
                                  <td>
                                    <small style={{ fontSize: "0.82rem" }}>{doc.file_name}</small>
                                  </td>
                                  <td>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => window.open(doc.file_path, "_blank")}
                                      style={{ padding: 0 }}
                                      title="View document"
                                    >
                                      <i
                                        className={`bi ${
                                          doc.file_name?.toLowerCase().endsWith(".pdf")
                                            ? "bi-file-pdf"
                                            : doc.file_name?.toLowerCase().match(/\.(png|jpg|jpeg)$/)
                                            ? "bi-file-image"
                                            : "bi-file-earmark"
                                        }`}
                                        style={{
                                          fontSize: "1.4rem",
                                          color: doc.file_name?.toLowerCase().endsWith(".pdf")
                                            ? "#dc3545"
                                            : "#667eea",
                                        }}
                                      ></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default UploadDrawingDetails;