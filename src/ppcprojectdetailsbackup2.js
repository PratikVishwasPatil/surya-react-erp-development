import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  User,
  Send,
} from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// ── Date formatter: "27-10-2025" or "27-10-2025 / 05:38 PM" → "27-Oct-2025 / 05:38 PM"
const formatDate = (dateStr) => {
  if (!dateStr) return dateStr;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Match dd-mm-yyyy with optional time part
  return dateStr.replace(
    /(\d{2})-(\d{2})-(\d{4})/g,
    (_, dd, mm, yyyy) => {
      const monthIdx = parseInt(mm, 10) - 1;
      const monthName = monthNames[monthIdx] || mm;
      return `${dd}-${monthName}-${yyyy}`;
    }
  );
};

const ProjectDetailsManager = () => {
  const [mainTab, setMainTab] = useState("project-details");
  const [activeTab, setActiveTab] = useState("Foundation");
  const [selectedDrawings, setSelectedDrawings] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [drawingsData, setDrawingsData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [fileId, setFileId] = useState(null);
  const [tabData, setTabData] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [showForwardPopup, setShowForwardPopup] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [tabs, setTabs] = useState([
    "Foundation", "Assly", "Fab", "SMetal", "Hardware", "MtlRqmt", "Packing List", "UDL",
  ]);
  const [showAdvancePopup, setShowAdvancePopup] = useState(false);
  const [advanceSelectedSheet, setAdvanceSelectedSheet] = useState("");
  const [showDrawingsPopup, setShowDrawingsPopup] = useState(false);
  const [drawingsSelectedDepartment, setDrawingsSelectedDepartment] = useState("");
  const [sheetNames, setSheetNames] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [drawingsError, setDrawingsError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const path = hash ? hash.substring(1) : window.location.pathname;
    const matches = path.match(/\/details\/(\d+)/);
    if (matches && matches[1]) {
      setFileId(matches[1]);
    }
  }, []);

  useEffect(() => {
    if (!fileId) return;
    const fetchSheetNames = async () => {
      setLoadingSheets(true);
      try {
        const response = await fetch(
          `https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCselectsheetnameApi.php?fileId=${fileId}`
        );
        const result = await response.json();
        if (result.status === "success") setSheetNames(result.data);
      } catch (error) {
        console.error("Error fetching sheet names:", error);
      } finally {
        setLoadingSheets(false);
      }
    };
    fetchSheetNames();
  }, [fileId]);

  useEffect(() => {
    if (!fileId) return;
    const fetchDepartments = async () => {
      setLoadingDepts(true);
      try {
        const response = await fetch(
          `https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCselectdeptApi.php?fileId=${fileId}`
        );
        const result = await response.json();
        if (result.status === "success") setDepartments(result.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, [fileId]);

  useEffect(() => {
    if (!fileId || !activeTab) return;
    const fetchTabData = async () => {
      try {
        setTabLoading(true);
        const response = await fetch(
          `https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCTabwisedataApi.php?fileId=${fileId}&tabName=${activeTab.toLowerCase()}`
        );
        if (!response.ok) throw new Error("Failed to fetch tab data");
        const result = await response.json();
        setTabData(result.status === "success" ? result : null);
      } catch (err) {
        console.error("Error fetching tab data:", err);
        setTabData(null);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [fileId, activeTab]);

  useEffect(() => {
    if (!fileId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [res1, res2, res3, res4] = await Promise.all([
          fetch(`https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/giveUpdateSwapExcelApi.php?file=${fileId}`),
          fetch(`https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCDisplayDrawingsApi.php?fileId=${fileId}`),
          fetch(`https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCHistoryApi.php?fileId=${fileId}`),
          fetch(`https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCgetTabsApi.php?fileId=${fileId}`),
        ]);

        const result1 = await res1.json();
        if (result1.status === "success") setApiData(result1.data);
        else setError("Failed to fetch project details");

        const result2 = await res2.json();
        if (result2.status === "success" && result2.data) {
          const allDrawings = result2.data.flatMap((comment) =>
            comment.documents.map((doc) => ({
              doc_id: doc.doc_id,
              date: formatDate(comment.comment_date),
              time: comment.comment_time,
              type: doc.drawing_name,
              fileName: doc.file_path.split("/").pop().replace(".pdf", ""),
              filePath: doc.file_path,
              fileExtension: doc.file_extension,
            }))
          );
          setDrawingsData(allDrawings);
        } else {
          setDrawingsData([]);
        }

        setHistoryLoading(true);
        const result3 = await res3.json();
        setHistoryData(result3.status === "success" && result3.data ? result3.data : []);
        setHistoryLoading(false);

        const result4 = await res4.json();
        if (result4.status === "success" && result4.data) {
          const tabNames = result4.data.map((tab) => tab.sheetName);
          setTabs(tabNames);
          if (tabNames.length > 0) setActiveTab(tabNames[0]);
        }
      } catch (err) {
        setError("Error loading data: " + err.message);
        setHistoryLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fileId]);

  const openPDF = (filePath) => {
    if (filePath) window.open(`http://93.127.167.54/Surya_React/surya_dynamic_api/${filePath}`, "_blank");
  };

  const getModuleColor = (sheetName) => {
    const colors = {
      SMetal: "#3498db", "Sheet Metal": "#3498db", Fabrication: "#e74c3c",
      Fab: "#e74c3c", MtlRqmt: "#9b59b6", Foundation: "#f39c12",
      Assly: "#1abc9c", Hardware: "#34495e", "Packing List": "#16a085", UDL: "#d35400",
    };
    return colors[sheetName] || "#667eea";
  };

  const toggleDrawingSelection = (index) => {
    setSelectedDrawings((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const parseStatusMessage = (message) => {
    if (!message || message.includes("None")) return { text: message || "No data available" };
    const parts = message.split(" by ");
    if (parts.length > 1) {
      const afterBy = parts[1].split(" on ");
      return { text: message, user: afterBy[0] || null, date: afterBy[1] || null };
    }
    return { text: message };
  };

  const handleSendForward = async () => {
    const employeeId = sessionStorage.getItem('userId');
    if (!employeeId) { toast.error("Employee ID not found. Please login again."); return; }
    if (!selectedSheet) { toast.warning("Please select a sheet name"); return; }
    if (!selectedDepartment) { toast.warning("Please select a department"); return; }
    try {
      const response = await fetch(
        "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCForwardSheetsApi.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, department: [selectedDepartment], sheetName: [selectedSheet], employee_id: employeeId }),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(result.message || "Sheets forwarded successfully!");
        setShowForwardPopup(false);
        setSelectedSheet("");
        setSelectedDepartment("");
      } else {
        toast.error(result.message || "Failed to forward sheets");
      }
    } catch (error) {
      toast.error(`Error forwarding sheets: ${error.message}`);
    }
  };

  const handleSendAdvance = async () => {
    const employeeId = sessionStorage.getItem('userId');
    if (!employeeId) { toast.error("Employee ID not found. Please login again."); return; }
    if (!advanceSelectedSheet) { toast.warning("Please select a sheet name"); return; }
    if (!selectedDepartment) { toast.warning("Please select a department"); return; }
    try {
      const response = await fetch(
        "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCForwardAdvanceApi.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, department: [selectedDepartment], sheetName: [advanceSelectedSheet], employee_id: employeeId }),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(result.message || "Advance copy forwarded successfully!");
        setShowAdvancePopup(false);
        setAdvanceSelectedSheet("");
        setSelectedDepartment("");
      } else {
        toast.error(result.message || "Failed to forward advance copy");
      }
    } catch (error) {
      toast.error(`Error forwarding advance copy: ${error.message}`);
    }
  };

  const handleSendDrawings = async () => {
    const employeeId = sessionStorage.getItem('userId');
    if (!employeeId) { toast.error("Employee ID not found. Please login again."); return; }
    if (selectedDrawings.length === 0) { toast.warning("Please select at least one drawing"); return; }
    if (!drawingsSelectedDepartment) { toast.warning("Please select a department"); return; }
    try {
      const drawingIds = selectedDrawings.map((index) => drawingsData[index]?.doc_id).filter(Boolean);
      const response = await fetch(
        "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/PPCSaveDrawingApi.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, department: [drawingsSelectedDepartment], drawingIds, employee_id: employeeId }),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(`Drawings forwarded successfully! ${result.data?.totalRecordsInserted || ''} records inserted.`);
        setShowDrawingsPopup(false);
        setDrawingsSelectedDepartment("");
        setSelectedDrawings([]);
      } else {
        toast.error(result.message || "Failed to forward drawings");
      }
    } catch (error) {
      toast.error(`Error sending drawings: ${error.message}`);
    }
  };

  // ── Reusable popup shell ──────────────────────────────────────────────────
  const Popup = ({ title, onClose, children }) => (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: isMobile ? "16px" : "0" }}>
      <div style={{ backgroundColor: "white", borderRadius: "12px", width: isMobile ? "100%" : "500px", maxWidth: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: isMobile ? "16px" : "20px 24px", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? "18px" : "20px", fontWeight: "600", color: "#333" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#666", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: isMobile ? "16px" : "24px" }}>{children}</div>
      </div>
    </div>
  );

  const PopupSelect = ({ label, value, onChange, disabled, placeholder, options, optKey, optLabel }) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#666", fontWeight: "500" }}>{label}</label>
      <select value={value} onChange={onChange} disabled={disabled}
        style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "6px", outline: "none", backgroundColor: disabled ? "#f5f5f5" : "white", cursor: disabled ? "not-allowed" : "pointer", color: "#333" }}>
        <option value="">{disabled ? `Loading ${label.toLowerCase()}...` : placeholder}</option>
        {options.map((opt) => (
          <option key={opt[optKey]} value={opt[optKey]}>{opt[optLabel]}</option>
        ))}
      </select>
    </div>
  );

  const PopupActions = ({ onClose, onSend, disabled }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexDirection: isMobile ? "column" : "row", marginTop: "4px" }}>
      <button onClick={onClose} style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "600", border: "1px solid #ddd", borderRadius: "6px", backgroundColor: "white", color: "#666", cursor: "pointer", width: isMobile ? "100%" : "auto" }}>Close</button>
      <button onClick={onSend} disabled={disabled}
        style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "6px", backgroundColor: disabled ? "#ccc" : "#ff5722", color: "white", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, width: isMobile ? "100%" : "auto" }}>
        Send
      </button>
    </div>
  );
  const formatShortDate = (dateString) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months[date.getMonth()];

  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

  // ── Status box colors ─────────────────────────────────────────────────────
  const statusBoxes = [
    { key: "smetal", bg: "linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%)", color: "#006064", border: "rgba(0,150,136,0.2)" },
    { key: "found",  bg: "linear-gradient(135deg,#fff3e0 0%,#ffe0b2 100%)", color: "#e65100", border: "rgba(255,152,0,0.2)" },
    { key: "assly",  bg: "linear-gradient(135deg,#f3e5f5 0%,#e1bee7 100%)", color: "#4a148c", border: "rgba(156,39,176,0.2)" },
    { key: "fab",    bg: "linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%)", color: "#1b5e20", border: "rgba(76,175,80,0.2)" },
  ];

  // ── Excel-style table row background ─────────────────────────────────────
  // highlight === "yellow" → #ffff00 (exact yellow as in screenshot)
  // highlight === "#bddff7" → that blue for packing list headers
  // highlight === false → white / alternating
  const getRowBg = (highlight, idx) => {
    if (highlight === "yellow") return "#ffff00";
    if (highlight === "#bddff7") return "#bddff7";
    return idx % 2 === 0 ? "#ffffff" : "#f9f9f9";
  };

  const getRowHoverBg = (highlight) => {
    if (highlight === "yellow") return "#ffe600";
    if (highlight === "#bddff7") return "#a8d4f0";
    return "#eef2ff";
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .mobile-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

        /* ── Excel table styles ── */
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
        }
        .excel-table th {
          background: #1f4e79;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          padding: 7px 10px;
          border: 1px solid #155a8a;
          white-space: nowrap;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 2;
          letter-spacing: 0.3px;
        }
        .excel-table td {
          padding: 5px 8px;
          border: 1px solid #d0d0d0;
          white-space: nowrap;
          vertical-align: middle;
          line-height: 1.3;
        }
        .excel-row-yellow td {
          background-color: #ffff00 !important;
          color: #000000;
          font-weight: 700;
        }
        .excel-row-blue td {
          background-color: #bddff7 !important;
          color: #000000;
          font-weight: 700;
        }
        .excel-row-normal:nth-child(even) td {
          background-color: #ffffff;
        }
        .excel-row-normal:nth-child(odd) td {
          background-color: #f2f2f2;
        }
        .excel-row-normal:hover td {
          background-color: #cce5ff !important;
          cursor: default;
        }
        .excel-row-yellow:hover td {
          background-color: #ffe600 !important;
        }
        .excel-row-blue:hover td {
          background-color: #a8d4f0 !important;
        }
        /* first col (s1,s4 etc) styling */
        .excel-col-id {
          color: #1f4e79;
          font-weight: 700;
          font-size: 11px;
          text-align: center !important;
          width: 40px;
          min-width: 40px;
        }
        /* numeric cells right-aligned */
        .excel-col-num {
          text-align: right !important;
          font-variant-numeric: tabular-nums;
          color: #333;
        }
        /* description col */
        .excel-col-desc {
          text-align: left !important;
          min-width: 200px;
          font-weight: 600;
          color: #1a1a1a;
        }
        /* tab bar */
        .tab-btn {
          padding: 10px 22px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          letter-spacing: 0.2px;
        }
        .tab-btn.active {
          background: #ffffff;
          color: #1f4e79;
          border-bottom: 3px solid #1f4e79;
          box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
        }
        .tab-btn.inactive {
          background: rgba(255,255,255,0.55);
          color: #555;
          border-bottom: 3px solid transparent;
        }
        .tab-btn.inactive:hover {
          background: rgba(255,255,255,0.8);
          color: #1f4e79;
        }
        /* excel header bar */
        .excel-header-bar {
          background: #f0f0f0;
          border-bottom: 2px solid #c0c0c0;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Calibri', Arial, sans-serif;
          flex-shrink: 0;
          overflow-x: auto;
          white-space: nowrap;
        }
        .excel-header-bar .filename {
          color: #1f4e79;
          font-weight: 700;
          font-size: 14px;
        }
        .excel-header-bar .sep {
          color: #aaa;
          font-weight: 400;
        }
        .excel-header-bar .uploader {
          color: #555;
        }
        .excel-container {
          background: #fff;
          border-radius: 0 10px 10px 10px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0,0,0,0.13);
          margin-bottom: 28px;
          border: 1.5px solid #c7c7c7;
          display: flex;
          flex-direction: column;
        }
        .excel-scroll-area {
          overflow-x: auto;
          overflow-y: auto;
          flex: 1;
          max-height: 480px;
        }
      `}</style>

      {/* ── Header tabs ── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row" }}>
        <button onClick={() => setMainTab("project-details")}
          style={{ flex: 1, background: mainTab === "project-details" ? "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)" : "linear-gradient(135deg,#a8b8d8 0%,#8e9ebc 100%)", color: "white", border: "none", padding: isMobile ? "14px 16px" : "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "700", fontSize: isMobile ? "14px" : "17px", cursor: "pointer", transition: "all 0.3s ease" }}>
          <span style={{ flex: 1, textAlign: "left" }}>Project Details</span>
          <div style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: "50%", padding: isMobile ? "4px" : "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setShowForwardPopup(true); }}>
            <ChevronRight size={isMobile ? 16 : 20} strokeWidth={3} />
          </div>
        </button>

        <button onClick={() => setMainTab("advance-copy")}
          style={{ flex: 1, background: mainTab === "advance-copy" ? "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)" : "linear-gradient(135deg,#e0e0e0 0%,#c4c4c4 100%)", color: mainTab === "advance-copy" ? "white" : "#666", border: "none", padding: isMobile ? "14px 16px" : "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "700", fontSize: isMobile ? "14px" : "17px", cursor: "pointer", transition: "all 0.3s ease" }}>
          <span style={{ flex: 1, textAlign: "left" }}>{isMobile ? "Advance Copy" : "Advance Copy (Long Lead Material)"}</span>
          <div style={{ backgroundColor: mainTab === "advance-copy" ? "rgba(255,255,255,0.25)" : "#4facfe", borderRadius: "50%", padding: isMobile ? "4px" : "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setShowAdvancePopup(true); }}>
            <ChevronRight size={isMobile ? 16 : 20} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* ── Popups ── */}
      {showForwardPopup && (
        <Popup title="Forward Sheets" onClose={() => { setShowForwardPopup(false); setSelectedSheet(""); setSelectedDepartment(""); }}>
          <PopupSelect label="Select Sheet Name" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}
            disabled={loadingSheets} placeholder="Select a sheet..." options={sheetNames.map((s) => ({ id: s, name: s }))} optKey="id" optLabel="name" />
          <PopupSelect label="Select Department" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={loadingDepts} placeholder="Select a department..." options={departments} optKey="id" optLabel="name" />
          <PopupActions onClose={() => { setShowForwardPopup(false); setSelectedSheet(""); setSelectedDepartment(""); }}
            onSend={handleSendForward} disabled={!selectedSheet || !selectedDepartment} />
        </Popup>
      )}

      {showAdvancePopup && (
        <Popup title="Forward Advance Copy" onClose={() => { setShowAdvancePopup(false); setAdvanceSelectedSheet(""); setSelectedDepartment(""); }}>
          <PopupSelect label="Select Sheet Name" value={advanceSelectedSheet} onChange={(e) => setAdvanceSelectedSheet(e.target.value)}
            disabled={false} placeholder="Select a sheet..." options={tabs.map((t) => ({ id: t, name: t }))} optKey="id" optLabel="name" />
          <PopupSelect label="Select Department" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={loadingDepts} placeholder="Select a department..." options={departments} optKey="id" optLabel="name" />
          <PopupActions onClose={() => { setShowAdvancePopup(false); setAdvanceSelectedSheet(""); setSelectedDepartment(""); }}
            onSend={handleSendAdvance} disabled={!advanceSelectedSheet || !selectedDepartment} />
        </Popup>
      )}

      {showDrawingsPopup && (
        <Popup title="Forward Drawings" onClose={() => { setShowDrawingsPopup(false); setDrawingsSelectedDepartment(""); }}>
          <PopupSelect label="Select Department" value={drawingsSelectedDepartment} onChange={(e) => setDrawingsSelectedDepartment(e.target.value)}
            disabled={loadingDepts} placeholder="Select a department..." options={departments} optKey="id" optLabel="name" />
          <PopupActions onClose={() => { setShowDrawingsPopup(false); setDrawingsSelectedDepartment(""); }}
            onSend={handleSendDrawings} disabled={!drawingsSelectedDepartment} />
        </Popup>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "project-details" ? (
        <div style={{ padding: isMobile ? "16px" : "28px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ background: "rgba(255,255,255,0.95)", padding: isMobile ? "24px" : "32px", borderRadius: "16px", textAlign: "center", marginBottom: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
              <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#667eea" }}>Loading Project Data...</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "linear-gradient(135deg,#ffebee 0%,#ffcdd2 100%)", padding: isMobile ? "16px 20px" : "20px 24px", borderRadius: "12px", color: "#c62828", fontSize: isMobile ? "14px" : "15px", fontWeight: "600", marginBottom: "24px", border: "2px solid rgba(198,40,40,0.3)", display: "flex", alignItems: "center", gap: "12px" }}>
              <Clock size={20} />{error}
            </div>
          )}

          {!loading && apiData && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
              {statusBoxes.map(({ key, bg, color, border }) => (
                <div key={key} style={{ background: bg, padding: isMobile ? "12px 14px" : "16px 20px", borderRadius: "12px", color, fontSize: isMobile ? "12px" : "13px", fontWeight: "600", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: `2px solid ${border}`, display: "flex", alignItems: "flex-start", gap: "8px", minHeight: "60px" }}>
                  <Clock size={isMobile ? 14 : 16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ wordBreak: "break-word", lineHeight: "1.4" }}>{parseStatusMessage(apiData[key]).text}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Tabs ── */}
          {!loading && (
            <>
              {/* Tab buttons */}
              <div className={isMobile ? "mobile-scroll" : ""}
                style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "0" }}>
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`tab-btn ${activeTab === tab ? "active" : "inactive"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Excel-style table container ── */}
              <div className="excel-container">

                {/* Excel header bar */}
                <div className="excel-header-bar">
                  {tabData ? (
                    <>
                      <span className="filename">{tabData.file_name}</span>
                      <span className="sep">|</span>
                      <span className="uploader">
                        Uploaded By And Time :&nbsp;
                        <strong>{tabData.uploaded_by}</strong>&nbsp;
                        {formatDate(tabData.uploaded_time)}
                      </span>
                    </>
                  ) : (
                    <span>Loading...</span>
                  )}
                </div>

                {/* Table area */}
                {tabLoading ? (
                  <div style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: "36px", height: "36px", border: "4px solid #f3f3f3", borderTop: "4px solid #1f4e79", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#1f4e79", marginTop: "14px" }}>Loading {activeTab} data...</div>
                  </div>
                ) : tabData && tabData.rows && tabData.rows.length > 0 ? (
                  <div className="excel-scroll-area">
                    <table className="excel-table">
                      {/* Column header row built from first yellow row or columns array */}
                      <thead>
                        <tr>
                          {activeTab === "Packing List" && (
                            <th style={{ width: "40px" }}>✓</th>
                          )}
                          {/* Use columns from API if meaningful, else use first highlight row */}
                          {(() => {
                            // Find first yellow row with data as header reference
                            const firstYellowRow = tabData.rows.find(r => r.highlight === "yellow" && r.data && r.data.some(d => d !== ""));
                            const headerData = firstYellowRow ? firstYellowRow.data : (tabData.columns || []);
                            return headerData.map((col, i) => (
                              <th key={i} style={{ minWidth: i === 1 ? "200px" : i === 0 ? "45px" : "80px" }}>
                                {col || `COL_${i}`}
                              </th>
                            ));
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.rows.map((row, idx) => {
                          const isYellow = row.highlight === "yellow";
                          const isBlue   = row.highlight === "#bddff7";
                          const rowClass = isYellow ? "excel-row-yellow" : isBlue ? "excel-row-blue" : "excel-row-normal";
                          return (
                            <tr key={idx} className={rowClass}>
                              {activeTab === "Packing List" && (
                                <td style={{ textAlign: "center", padding: "4px 8px" }}>
                                  {!isYellow && !isBlue && (
                                    <input type="checkbox"
                                      checked={selectedDrawings.includes(idx)}
                                      onChange={() => toggleDrawingSelection(idx)}
                                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#1f4e79" }} />
                                  )}
                                </td>
                              )}
                              {row.data && row.data.map((cell, cellIdx) => {
                                const isIdCol   = cellIdx === 0;
                                const isDescCol = cellIdx === 1;
                                // numeric if not id/desc and value looks like number
                                const isNum = cellIdx > 1 && cell !== "" && !isNaN(cell);
                                return (
                                  <td key={cellIdx}
                                    className={isIdCol ? "excel-col-id" : isDescCol ? "excel-col-desc" : isNum ? "excel-col-num" : ""}
                                    style={{
                                      fontWeight: isYellow ? "700" : isIdCol ? "700" : isDescCol ? "600" : "400",
                                      color: isYellow ? "#000" : isIdCol ? "#1f4e79" : isDescCol ? "#111" : "#333",
                                      fontSize: isIdCol ? "11px" : "13px",
                                    }}>
                                    {cell !== null && cell !== undefined ? cell : ""}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "60px", textAlign: "center", color: "#95a5a6", fontSize: "15px", fontWeight: "600" }}>
                    No data available for {activeTab}
                  </div>
                )}
              </div>

              {/* ── Drawings + History ── */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.8fr 1fr", gap: isMobile ? "20px" : "28px" }}>

                {/* Uploaded Drawings */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: isMobile ? "20px" : "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "16px", borderBottom: "3px solid #f0f0f0", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#2c3e50", display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={isMobile ? 20 : 22} style={{ color: "#667eea" }} />
                      Uploaded Drawings
                    </h3>
                    <div style={{ background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", color: "white", borderRadius: "50%", padding: isMobile ? "6px" : "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(102,126,234,0.3)" }}
                      onClick={() => {
                        if (selectedDrawings.length === 0) {
                          setDrawingsError("Please select at least one drawing");
                          setTimeout(() => setDrawingsError(""), 3000);
                        } else {
                          setDrawingsError("");
                          setShowDrawingsPopup(true);
                        }
                      }}>
                      <ChevronRight size={isMobile ? 18 : 20} strokeWidth={3} />
                    </div>
                  </div>

                  {drawingsError && (
                    <div style={{ background: "linear-gradient(135deg,#ffebee 0%,#ffcdd2 100%)", padding: "12px 16px", borderRadius: "8px", color: "#c62828", fontSize: "13px", fontWeight: "600", marginBottom: "16px", border: "2px solid rgba(198,40,40,0.3)", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Clock size={16} />{drawingsError}
                    </div>
                  )}

                  {drawingsData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#95a5a6", fontSize: isMobile ? "14px" : "15px", fontWeight: "600" }}>
                      <FileText size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                      <div>No drawings available</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: isMobile ? "400px" : "600px", overflowY: "auto" }}>
                      {drawingsData.map((drawing, idx) => (
                        <div key={idx}
                          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 60px 35px" : "140px 130px 1fr 85px 45px", alignItems: "center", gap: isMobile ? "8px" : "16px", padding: isMobile ? "12px 14px" : "16px 18px", background: "linear-gradient(135deg,#f8f9fa 0%,#ffffff 100%)", borderRadius: "10px", fontSize: isMobile ? "12px" : "13px", border: "2px solid #e9ecef", transition: "all 0.3s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(102,126,234,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                          {isMobile ? (
                            <>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ color: "#7f8c8d", fontWeight: "600" }}>{drawing.date}</span>
                                <span style={{ color: "#2c3e50", fontWeight: "700", fontSize: "11px" }}>{drawing.type}</span>
                                <span style={{ color: "#34495e", fontWeight: "500", fontSize: "12px", wordBreak: "break-word" }}>{drawing.fileName}</span>
                              </div>
                              <div style={{ background: "linear-gradient(135deg,#e74c3c 0%,#c0392b 100%)", color: "white", padding: "8px 10px", borderRadius: "8px", textAlign: "center", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                onClick={() => openPDF(drawing.filePath)}>
                                <FileText size={12} />PDF
                              </div>
                              <input type="checkbox" checked={selectedDrawings.includes(idx)} onChange={() => toggleDrawingSelection(idx)}
                                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#667eea" }} />
                            </>
                          ) : (
                            <>
                              <span style={{ color: "#7f8c8d", fontWeight: "600" }}>Date: {drawing.date}</span>
                              <span style={{ color: "#2c3e50", fontWeight: "700", fontSize: "12px" }}>{drawing.type}</span>
                              <span style={{ color: "#34495e", fontWeight: "500", fontSize: "13px" }}>{drawing.fileName}</span>
                              <div style={{ background: "linear-gradient(135deg,#e74c3c 0%,#c0392b 100%)", color: "white", padding: "8px 12px", borderRadius: "8px", textAlign: "center", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "transform 0.2s" }}
                                onClick={() => openPDF(drawing.filePath)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                                <FileText size={14} />PDF
                              </div>
                              <input type="checkbox" checked={selectedDrawings.includes(idx)} onChange={() => toggleDrawingSelection(idx)}
                                style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#667eea" }} />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* History */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: isMobile ? "20px" : "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <h3 style={{ margin: "0 0 24px 0", fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#2c3e50", paddingBottom: "16px", borderBottom: "3px solid #f0f0f0", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Clock size={isMobile ? 20 : 22} style={{ color: "#667eea" }} />History
                  </h3>

                  {historyLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <div style={{ display: "inline-block", width: "30px", height: "30px", border: "3px solid #f3f3f3", borderTop: "3px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <div style={{ fontSize: "14px", color: "#7f8c8d", marginTop: "12px", fontWeight: "600" }}>Loading history...</div>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#95a5a6", fontSize: isMobile ? "13px" : "14px", fontWeight: "600" }}>
                      <Clock size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                      <div>No history records found</div>
                    </div>
                  ) : (
                    <div style={{ position: "relative", maxHeight: isMobile ? "400px" : "600px", overflowY: "auto" }}>
                      <div style={{ position: "absolute", left: isMobile ? "11px" : "13px", top: "35px", bottom: "35px", width: isMobile ? "2px" : "3px", background: "linear-gradient(180deg,#667eea 0%,#e9ecef 100%)" }} />
                      {historyData.map((item, idx) => (
                        <div key={idx} style={{ position: "relative", paddingLeft: isMobile ? "40px" : "48px", marginBottom: isMobile ? "24px" : "28px" }}>
                          <div style={{ position: "absolute", left: "0", top: "2px", width: isMobile ? "26px" : "30px", height: isMobile ? "26px" : "30px", borderRadius: "50%", background: `linear-gradient(135deg,${getModuleColor(item.sheet_name)} 0%,${getModuleColor(item.sheet_name)}dd 100%)`, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid white", boxShadow: `0 4px 16px ${getModuleColor(item.sheet_name)}40` }}>
                            <CheckCircle size={isMobile ? 14 : 16} color="white" strokeWidth={3} />
                          </div>
                          <div style={{ backgroundColor: "#f8f9fa", padding: isMobile ? "12px 14px" : "16px", borderRadius: "10px", border: "2px solid #e9ecef", transition: "all 0.3s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(102,126,234,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                              <span style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: "700", color: getModuleColor(item.sheet_name), background: `${getModuleColor(item.sheet_name)}15`, padding: isMobile ? "5px 10px" : "6px 12px", borderRadius: "6px", border: `1.5px solid ${getModuleColor(item.sheet_name)}40` }}>
                                {item.sheet_name}
                              </span>
                              {/* ✅ Date formatted */}
                              {/* <span style={{ fontSize: isMobile ? "10px" : "11px", color: "#95a5a6", fontWeight: "600" }}>{formatDate(item.timestamp)}</span> */}
                              <span
  style={{
    fontSize: isMobile ? "10px" : "11px",
    color: "#95a5a6",
    fontWeight: "600",
  }}
>
  {formatShortDate(item.timestamp)}
</span>
                            </div>
                            <div style={{ fontSize: isMobile ? "12px" : "13px", color: "#34495e", fontWeight: "600", marginBottom: "6px" }}>
                              <span style={{ color: "#7f8c8d" }}>From:</span> {item.sender}
                            </div>
                            <div style={{ fontSize: isMobile ? "12px" : "13px", color: "#34495e", fontWeight: "600" }}>
                              <span style={{ color: "#7f8c8d" }}>To:</span> {item.to_department}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        // Advance Copy placeholder
        <div style={{ padding: isMobile ? "16px" : "32px", textAlign: "center" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: isMobile ? "40px 24px" : "60px 40px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ width: isMobile ? "60px" : "80px", height: isMobile ? "60px" : "80px", background: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(245,87,108,0.4)" }}>
              <FileText size={isMobile ? 30 : 40} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: "700", color: "#2c3e50", marginBottom: "16px" }}>Advance Copy Section</h2>
            <p style={{ fontSize: isMobile ? "14px" : "16px", color: "#7f8c8d", lineHeight: "1.6", fontWeight: "500" }}>Long Lead Material management coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsManager;