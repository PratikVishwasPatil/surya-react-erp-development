import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, FileText, Wrench, CheckCircle, Package, Layers, RefreshCw, FileDown, Loader } from 'lucide-react';

// ── Date formatter: "2025-04-02" or "02-04-2025" → "02-Apr-2025"
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Handle "dd-mm-yyyy / HH:MM AM/PM" (API datetime format)
  const dtMatch = String(dateStr).match(/^(\d{2})-(\d{2})-(\d{4})\s*[\/\\]\s*(.+)/);
  if (dtMatch) {
    const [, dd, mm, yyyy, time] = dtMatch;
    return `${dd}-${monthNames[parseInt(mm,10)-1]}-${yyyy} / ${time.trim()}`;
  }

  // Handle yyyy-mm-dd
  const isoMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}-${monthNames[parseInt(mm,10)-1]}-${yyyy}`;
  }

  // Handle dd-mm-yyyy
  const dmyMatch = String(dateStr).match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${dd}-${monthNames[parseInt(mm,10)-1]}-${yyyy}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2,'0');
    return `${dd}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  }

  return dateStr;
};

const SushamProjectDetail = () => {
  const [activeStaticTab, setActiveStaticTab] = useState('smetal');
  const [activeSubTab, setActiveSubTab] = useState('rfd-material-list');
  const [activeDynamicTab, setActiveDynamicTab] = useState('');
  const [theme, setTheme] = useState('light');
  const [dynamicTabs, setDynamicTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [drawingData, setDrawingData] = useState([]);
  const [leftOverData, setLeftOverData] = useState([]);
  const [materialData, setMaterialData] = useState([]);
  // RFD Material List — uses PPCTabwisedataApi
  const [rfdMaterialData, setRfdMaterialData] = useState(null);
  const [rfdMaterialLoading, setRfdMaterialLoading] = useState(false);

  const [error, setError] = useState(null);

  const [rfdTable1Data, setRfdTable1Data] = useState([]);
  const [rfdTable2Data, setRfdTable2Data] = useState([]);
  const [rfdTable3Data, setRfdTable3Data] = useState({ data: [], totals: {} });
  const [rfdTable4Data, setRfdTable4Data] = useState({ data: [], totals: {} });

  const [leftOverInputs, setLeftOverInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [materialInputs, setMaterialInputs] = useState({});
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  // const getFileIdFromUrl = () => {
  //   const hash = window.location.hash;
  //   const match = hash.match(/\/project-detail\/(\d+)/);
  //   return match ? match[1] : '5528';
  // };

  const getFileIdFromUrl = () => {
    const hash = window.location.hash;
    const match = hash.match(/\/project-detail\/(\d+)/);
    return match ? match[1] : '5528';
  };
  const fileId = getFileIdFromUrl();

// NEW: extracts "S-26-001-TEST" from the URL
const getFileNameFromUrl = () => {
  const hash = window.location.hash;
  // matches anything after the numeric fileId segment
  const match = hash.match(/\/project-detail\/\d+\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

  const staticTabs = [
    { id: 'smetal',      label: 'SMetal' },
    { id: 'foundation',  label: 'Foundation' },
    { id: 'fabrication', label: 'Fabrication' }
  ];

  const subTabs = [
    { id: 'rfd-material-list', label: 'RFD Material List',      icon: FileText    },
    { id: 'drawing',           label: 'Drawing',                icon: FileText    },
    { id: 'rfd-completion',    label: 'RFD Completion Status',  icon: CheckCircle },
    { id: 'left-over',         label: 'Left Over',              icon: Wrench      },
    { id: 'material',          label: 'Material',               icon: Package     }
  ];

  const BASE_URL = "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/susham";
  const PPC_URL  = "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api";

  // ── Map static tab → tabName param for PPCTabwisedataApi ──────────────────
  const getTabNameForStatic = () => {
    if (activeStaticTab === 'smetal')      return 'smetal';
    if (activeStaticTab === 'foundation')  return 'foundation';
    if (activeStaticTab === 'fabrication') return 'fab';
    return 'smetal';
  };

  const getApiEndpoints = () => {
    if (activeStaticTab === 'smetal') {
      return {
        tabs:          `${BASE_URL}/getTabsRfdApi.php?fileId=${fileId}`,
        drawing:       `${BASE_URL}/smetalDrawingListApi.php?fileId=${fileId}`,
        leftover:      `${BASE_URL}/smetalLeftOverApi.php?fileId=${fileId}`,
        material:      `${BASE_URL}/smetalMaterialListApi.php?fileId=${fileId}`,
        rfdCompletion1:`${BASE_URL}/RfdCompletionApi.php?fileId=${fileId}`,
        rfdCompletion2:`${BASE_URL}/RfdMaterialList2Api.php?fileId=${fileId}`,
        rfdCompletion3:`${BASE_URL}/RfdMaterialList3Api.php?fileId=${fileId}`,
        rfdCompletion4:`${BASE_URL}/RfdMaterialList4Api.php?fileId=${fileId}`
      };
    } else if (activeStaticTab === 'foundation') {
      return {
        tabs:          `${BASE_URL}/getTabsfoundApi.php?fileId=${fileId}`,
        drawing:       `${BASE_URL}/foundDrawingListApi.php?fileId=${fileId}`,
        leftover:      `${BASE_URL}/foundLeftOverMaterialApi.php?fileId=${fileId}`,
        material:      `${BASE_URL}/foundMaterialListApi.php?fileId=${fileId}`,
        rfdCompletion1:`${BASE_URL}/RfdCompletionApi.php?fileId=${fileId}`,
        rfdCompletion2:`${BASE_URL}/RfdMaterialList2Api.php?fileId=${fileId}`,
        rfdCompletion3:`${BASE_URL}/RfdMaterialList3Api.php?fileId=${fileId}`,
        rfdCompletion4:`${BASE_URL}/RfdMaterialList4Api.php?fileId=${fileId}`
      };
    } else if (activeStaticTab === 'fabrication') {
      return {
        tabs:          `${BASE_URL}/getTabsfabApi.php?fileId=${fileId}`,
        drawing:       `${BASE_URL}/fabDrawingListApi.php?fileId=${fileId}`,
        leftover:      `${BASE_URL}/fabLeftOverMaterialApi.php?fileId=${fileId}`,
        material:      `${BASE_URL}/fabMaterialListApi.php?fileId=${fileId}`,
        rfdCompletion1:`${BASE_URL}/RfdCompletionApi.php?fileId=${fileId}`,
        rfdCompletion2:`${BASE_URL}/RfdMaterialList2Api.php?fileId=${fileId}`,
        rfdCompletion3:`${BASE_URL}/RfdMaterialList3Api.php?fileId=${fileId}`,
        rfdCompletion4:`${BASE_URL}/RfdMaterialList4Api.php?fileId=${fileId}`
      };
    }
    return null;
  };

  // ── Fetch dynamic tabs (for future use / other sub-tabs if needed) ─────────
  useEffect(() => {
    fetchDynamicTabs();
  }, [activeStaticTab]);

  // ── Fetch RFD Material List when sub-tab changes to rfd-material-list ──────
  useEffect(() => {
  if (activeSubTab === 'rfd-material-list') {
    fetchRfdMaterialData();
  } else if (activeSubTab === 'drawing') {
    fetchDrawingData();
  } else if (activeSubTab === 'left-over') {
    fetchLeftOverData();
  } else if (activeSubTab === 'material') {
    fetchMaterialData();
  } else if (activeSubTab === 'rfd-completion') {
    fetchRfdCompletionData();
  }
}, [activeSubTab, activeStaticTab]);  // ← already correct, keep both

  const fetchDynamicTabs = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoints = getApiEndpoints();
      if (!endpoints) return;
      const response = await fetch(endpoints.tabs);
      const result   = await response.json();
      if (result.status && result.data && result.data.length > 0) {
        setDynamicTabs(result.data);
        const activeTab = result.data.find(tab => tab.is_active || tab.tab_active);
        if (activeTab) setActiveDynamicTab(activeTab.sheet_key);
      } else {
        setDynamicTabs([]);
      }
    } catch (err) {
      setError('Failed to load tabs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── NEW: fetch RFD Material using PPCTabwisedataApi ───────────────────────
  const fetchRfdMaterialData = async () => {
    setRfdMaterialLoading(true);
    setRfdMaterialData(null);
    try {
      const tabName  = getTabNameForStatic();
      const url      = `${PPC_URL}/PPCTabwisedataApi.php?fileId=${fileId}&tabName=${tabName}`;
      const response = await fetch(url);
      const result   = await response.json();
      if (result.status === 'success') {
        setRfdMaterialData(result);
      } else {
        setRfdMaterialData(null);
      }
    } catch (err) {
      console.error('Error fetching RFD material data:', err);
      setRfdMaterialData(null);
    } finally {
      setRfdMaterialLoading(false);
    }
  };

  const fetchDrawingData = async () => {
    try {
      setDataLoading(true);
      const endpoints = getApiEndpoints();
      if (!endpoints) return;
      const response = await fetch(endpoints.drawing);
      const result   = await response.json();
      setDrawingData(result.status && result.data ? result.data : []);
    } catch (err) {
      console.error('Error fetching drawing data:', err);
      setDrawingData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchLeftOverData = async () => {
    try {
      setDataLoading(true);
      const endpoints = getApiEndpoints();
      if (!endpoints) return;
      const response = await fetch(endpoints.leftover);
      const result   = await response.json();
      setLeftOverData(result.status && result.data ? result.data : []);
    } catch (err) {
      console.error('Error fetching leftover data:', err);
      setLeftOverData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchMaterialData = async () => {
    try {
      setDataLoading(true);
      const endpoints = getApiEndpoints();
      if (!endpoints) return;
      const response = await fetch(endpoints.material);
      const result   = await response.json();
      setMaterialData(result.status && result.data ? result.data : []);
    } catch (err) {
      console.error('Error fetching material data:', err);
      setMaterialData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchRfdCompletionData = async () => {
    try {
      setDataLoading(true);
      const endpoints = getApiEndpoints();
      if (!endpoints) return;
      const [res1, res2, res3, res4] = await Promise.all([
        fetch(endpoints.rfdCompletion1),
        fetch(endpoints.rfdCompletion2),
        fetch(endpoints.rfdCompletion3),
        fetch(endpoints.rfdCompletion4)
      ]);
      const [data1, data2, data3, data4] = await Promise.all([
        res1.json(), res2.json(), res3.json(), res4.json()
      ]);
      setRfdTable1Data(data1.status && data1.items ? data1.items : []);
      setRfdTable2Data(data2.status && data2.data  ? data2.data  : []);
      setRfdTable3Data(data3.status ? data3 : { data: [], totals: {} });
      setRfdTable4Data(data4.status ? data4 : { data: [], totals: {} });
    } catch (err) {
      console.error('Error fetching RFD completion data:', err);
      setRfdTable1Data([]);
      setRfdTable2Data([]);
      setRfdTable3Data({ data: [], totals: {} });
      setRfdTable4Data({ data: [], totals: {} });
    } finally {
      setDataLoading(false);
    }
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const getThemeStyles = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#0f172a', color: '#f1f5f9', cardBg: '#1e293b',
        inputBg: '#0f172a', inputBorder: '#334155', inputColor: '#f1f5f9',
        tabBg: '#334155', tabActiveBg: '#ef4444', buttonBg: '#ef4444',
        buttonHover: '#dc2626', labelColor: '#94a3b8', borderColor: '#334155',
        tableBg: '#1e293b', tableHeaderBg: '#334155', tableRowHover: '#334155'
      };
    }
    return {
      backgroundColor: '#f8fafc', color: '#0f172a', cardBg: '#ffffff',
      inputBg: '#ffffff', inputBorder: '#e2e8f0', inputColor: '#0f172a',
      tabBg: '#f1f5f9', tabActiveBg: '#ef4444', buttonBg: '#ef4444',
      buttonHover: '#dc2626', labelColor: '#64748b', borderColor: '#e2e8f0',
      tableBg: '#ffffff', tableHeaderBg: '#fef3c7', tableRowHover: '#f8fafc'
    };
  };

  const themeStyles = getThemeStyles();
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // ── Handle static tab click: reset sub-tab to drawing ────────────────────
const handleStaticTabClick = (tabId) => {
  setActiveStaticTab(tabId);
  setActiveSubTab('rfd-material-list');  // ← was 'drawing'
  setRfdMaterialData(null);
  setDrawingData([]);
  setLeftOverData([]);
  setMaterialData([]);
};

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: RFD Material List (uses PPCTabwisedataApi data)
  // Reference design from ProjectDetailsManager excel table
  // ─────────────────────────────────────────────────────────────────────────
  const renderRFDMaterialList = () => {
    const printRfdMaterial = () => {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  
  // Rebuild table HTML from current data
  const headerRow = headers.map(col => 
    `<th>${String(col).replace('COL_', '') || col}</th>`
  ).join('');

  const bodyRows = rows.map(row => {
    const isYellow = row.highlight === 'yellow';
    const isBlue   = row.highlight === '#bddff7';
    const bg = isYellow ? '#ffff00' : isBlue ? '#bddff7' : '';
    const fw = (isYellow || isBlue) ? 'bold' : 'normal';
    const cells = (row.data || []).map((cell, ci) => {
      const align = ci > 1 && cell !== '' && cell !== null && !isNaN(cell) ? 'right' : 'left';
      return `<td style="text-align:${align}">${cell ?? ''}</td>`;
    }).join('');
    return `<tr style="background:${bg};font-weight:${fw}">${cells}</tr>`;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${file_name || `File-${fileId}`} - RFD Material List</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2 { color: #1f4e79; margin-bottom: 4px; }
        .meta { color: #555; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1f4e79; color: #fff; padding: 8px 10px; border: 1px solid #155a8a; text-align: center; font-size: 11px; }
        td { padding: 5px 8px; border: 1px solid #ccc; font-size: 12px; }
        tr:nth-child(even) td { background: #f2f2f2; }
        @media print { @page { margin: 15mm; size: landscape; } }
      </style>
    </head>
    <body>
      <h2>${file_name || `File-${fileId}`} — RFD Material List (${staticTabs.find(t => t.id === activeStaticTab)?.label})</h2>
      <div class="meta">
        ${uploaded_by ? `Uploaded By: <strong>${uploaded_by}</strong> &nbsp;` : ''}
        ${uploaded_time ? `🕐 ${uploaded_time}` : ''}
      </div>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
};

    if (rfdMaterialLoading) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div style={{ fontSize: '15px', fontWeight: '600' }}>Loading RFD Material List...</div>
        </div>
      );
    }

    if (!rfdMaterialData || !rfdMaterialData.rows || rfdMaterialData.rows.length === 0) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', border: `1px solid ${themeStyles.borderColor}`, padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <div style={{ fontSize: '16px', fontWeight: '600' }}>No data found</div>
          <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
            No RFD material list available for{' '}
            <strong>{staticTabs.find(t => t.id === activeStaticTab)?.label}</strong>
          </div>
        </div>
      );
    }

    const { rows, columns, file_name, uploaded_by, uploaded_time } = rfdMaterialData;

    // Build header from columns or fallback
    const headers = columns && columns.length > 0 ? columns : (rows[0]?.data || []).map((_, i) => `COL_${i}`);

    return (
      <div>
        <style>{`
          @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          .excel-rfd-table { width:100%; border-collapse:collapse; font-family:'Calibri','Segoe UI',Arial,sans-serif; font-size:13px; }
          .excel-rfd-table th {
            background:#1f4e79; color:#fff; font-weight:700; font-size:12px;
            padding:8px 10px; border:1px solid #155a8a; white-space:nowrap;
            text-align:center; position:sticky; top:0; z-index:2; letter-spacing:0.3px;
          }
          .excel-rfd-table td { padding:5px 8px; border:1px solid #d0d0d0; white-space:nowrap; vertical-align:middle; line-height:1.3; }
          .excel-row-yellow td { background-color:#ffff00 !important; color:#000 !important; font-weight:700 !important; }
          .excel-row-blue   td { background-color:#bddff7 !important; color:#000 !important; font-weight:700 !important; }
          .excel-row-normal:nth-child(even) td { background-color:#ffffff; }
          .excel-row-normal:nth-child(odd)  td { background-color:#f2f2f2; }
          .excel-row-normal:hover td { background-color:#cce5ff !important; cursor:default; }
          .excel-row-yellow:hover td { background-color:#ffe600 !important; }
          .excel-row-blue:hover   td { background-color:#a8d4f0 !important; }
          .excel-col-id   { color:#1f4e79; font-weight:700; font-size:11px; text-align:center !important; width:45px; min-width:45px; }
          .excel-col-desc { text-align:left !important; min-width:200px; font-weight:600; color:#1a1a1a; }
          .excel-col-num  { text-align:right !important; font-variant-numeric:tabular-nums; color:#333; }
        `}</style>

        {/* Excel-style container */}
        <div style={{
          backgroundColor: themeStyles.cardBg,
          borderRadius: '12px',
          border: `1.5px solid ${theme === 'dark' ? '#334155' : '#c7c7c7'}`,
          overflow: 'hidden',
          boxShadow: theme === 'dark' ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 6px 24px rgba(0,0,0,0.13)',
          marginBottom: '20px'
        }}>

          {/* Excel header bar */}
          <div style={{
            background: theme === 'dark' ? '#2d3748' : '#f0f0f0',
            borderBottom: `2px solid ${theme === 'dark' ? '#4a5568' : '#c0c0c0'}`,
            padding: '8px 16px',
            fontSize: '13px', fontWeight: '600', color: theme === 'dark' ? '#e2e8f0' : '#333',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: "'Calibri', Arial, sans-serif",
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#1f4e79', fontWeight: '700', fontSize: '14px' }}>
    {file_name || `File-${fileId}`}
  </span>

  {/* Always show uploaded_time if present */}
  {uploaded_time && (
    <>
      <span style={{ color: theme === 'dark' ? '#718096' : '#aaa' }}>|</span>
      <span style={{ color: theme === 'dark' ? '#a0aec0' : '#555', fontSize: '12px' }}>
        {uploaded_by && <><strong>Uploaded By: {uploaded_by}</strong>&nbsp;&nbsp;</>}
        🕐 {uploaded_time}
      </span>
    </>
  )}
</div>

          {/* Scrollable table area */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
            <table className="excel-rfd-table">
              <thead>
                <tr>
                  {headers.map((col, i) => (
                    <th key={i} style={{ minWidth: i === 1 ? '220px' : i === 0 ? '50px' : '80px' }}>
                      {String(col).replace('COL_', '') || `C${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isYellow = row.highlight === 'yellow';
                  const isBlue   = row.highlight === '#bddff7';
                  const rowClass = isYellow ? 'excel-row-yellow' : isBlue ? 'excel-row-blue' : 'excel-row-normal';
                  const cells    = row.data || [];
                  return (
                    <tr key={idx} className={rowClass}>
                      {cells.map((cell, cellIdx) => {
                        const isIdCol   = cellIdx === 0 && !isYellow && !isBlue;
                        const isDescCol = cellIdx === 1 && !isYellow && !isBlue;
                        const isNum     = cellIdx > 1 && cell !== '' && cell !== null && !isNaN(cell);
                        return (
                          <td
                            key={cellIdx}
                            className={isIdCol ? 'excel-col-id' : isDescCol ? 'excel-col-desc' : isNum ? 'excel-col-num' : ''}
                            style={{
                              fontWeight: isYellow ? '700' : isBlue ? '700' : isIdCol ? '700' : isDescCol ? '600' : '400',
                              color: isYellow ? '#000' : isBlue ? '#000' : isIdCol ? '#1f4e79' : isDescCol ? '#111' : '#333',
                              fontSize: isIdCol ? '11px' : '13px',
                            }}
                          >
                            {cell !== null && cell !== undefined ? cell : ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print button */}
        <div style={{ textAlign: 'right' }}>
          <button
  onClick={printRfdMaterial} 
            style={{
              backgroundColor: themeStyles.buttonBg, color: '#fff',
              padding: '12px 48px', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s ease',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
          >
            <Printer size={16} />Print Material List
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Drawing
  // ─────────────────────────────────────────────────────────────────────────
  const renderDrawing = () => {
    const borderColor = themeStyles.borderColor;

    if (dataLoading) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>Loading drawings...</div>
        </div>
      );
    }

    const headerStyle = { padding: '12px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: '600', color: '#000000' };

    if (drawingData.length === 0) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ff6b35' }}>
                <td style={headerStyle}>Sr No</td>
                <td style={headerStyle}>Drawing Name</td>
                <td style={headerStyle}>Uploaded Date</td>
                <td style={headerStyle}>Action</td>
                <td style={headerStyle}>Print</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" style={{ padding: '80px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
                  <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>No drawings available</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}` }}>
          <thead>
            <tr style={{ backgroundColor: '#ff6b35' }}>
              <td style={{ ...headerStyle, width: '80px' }}>Sr No</td>
              <td style={headerStyle}>Drawing Name</td>
              <td style={{ ...headerStyle, width: '200px' }}>Uploaded Date</td>
              <td style={{ ...headerStyle, width: '120px' }}>Action</td>
              <td style={{ ...headerStyle, width: '120px' }}>Print</td>
            </tr>
          </thead>
          <tbody>
            {drawingData.map((drawing) => (
              <tr key={drawing.doc_id}
                style={{ backgroundColor: themeStyles.cardBg, transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d3748' : '#f7fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = themeStyles.cardBg}
              >
                <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>{drawing.sr_no}</td>
                <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', color: themeStyles.color }}>{drawing.document_name}</td>
                <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', color: themeStyles.color }}>
                  {formatDate(drawing.uploaded_on || drawing.timestamp)}
                </td>
                <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'center' }}>
                  <a
                    href={`http://93.127.167.54/Surya_React/surya_dynamic_api/${drawing.document_url.replace('../', '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#dc3545', textDecoration: 'none', fontSize: '20px', display: 'inline-block', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    title="View PDF"
                  >📄</a>
                </td>
                <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '16px' }}>🖨️</span>
                    <span style={{ fontSize: '12px', color: themeStyles.color }}>Print</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Left Over
  // ─────────────────────────────────────────────────────────────────────────
  const renderLeftOver = () => {
    const borderColor = themeStyles.borderColor;

    if (dataLoading) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>Loading leftover data...</div>
        </div>
      );
    }

    if (leftOverData.length === 0) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <Wrench size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <div>No leftover materials available</div>
        </div>
      );
    }

    const handleInputChange = (id, value) => setLeftOverInputs(prev => ({ ...prev, [id]: value }));

    const handleSubmit = async () => {
      try {
        setSubmitting(true);
        const rowids = [], leftover = [];
        leftOverData.forEach(item => {
          const id  = item.material_id || item.id;
          const val = leftOverInputs[id];
          if (val && val.trim() !== '') { rowids.push(id); leftover.push(val); }
        });
        if (rowids.length === 0) { alert('Please enter at least one quantity'); setSubmitting(false); return; }

        let apiUrl = '';
        if (activeStaticTab === 'smetal')      apiUrl = `${BASE_URL}/SaveSmetalLeftOverApi.php`;
        else if (activeStaticTab === 'foundation') apiUrl = `${BASE_URL}/SaveFoundlLeftOverApi.php`;
        else if (activeStaticTab === 'fabrication') apiUrl = `${BASE_URL}/SaveFabLeftOverApi.php`;

        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId, rowids, leftover }) });
        const result   = await response.json();
        if (result.status) { alert(result.message || 'Material Track Saved Successfully'); setLeftOverInputs({}); fetchLeftOverData(); }
        else alert(result.message || 'Failed to save data');
      } catch (err) {
        alert('Error submitting data: ' + err.message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}` }}>
            <thead>
              <tr style={{ backgroundColor: '#ff6b35' }}>
                <td style={{ padding: '12px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: '600', color: '#000' }}>Material Name</td>
                <td style={{ padding: '12px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: '600', color: '#000', width: '150px' }}>Assigned Qty</td>
                <td style={{ padding: '12px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: '600', color: '#000', width: '150px' }}>Enter Qty</td>
              </tr>
            </thead>
            <tbody>
              {leftOverData.map((item, index) => {
                const id = item.material_id || item.id;
                return (
                  <tr key={id || index}
                    style={{ backgroundColor: themeStyles.cardBg, transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d3748' : '#f7fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = themeStyles.cardBg}
                  >
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', color: themeStyles.color }}>{item.material_name}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>{item.assigned_qty}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'right' }}>
                      <input type="text" value={leftOverInputs[id] || ''} onChange={e => handleInputChange(id, e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: `1px solid ${borderColor}`, borderRadius: '4px', backgroundColor: themeStyles.inputBg, color: themeStyles.color, fontSize: '13px', textAlign: 'right' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ backgroundColor: submitting ? '#94a3b8' : '#ff6b35', color: '#fff', padding: '12px 48px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)', transition: 'all 0.2s ease' }}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Material
  // ─────────────────────────────────────────────────────────────────────────
  const renderMaterial = () => {
    const borderColor = themeStyles.borderColor;

    if (dataLoading) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>Loading material data...</div>
        </div>
      );
    }

    if (materialData.length === 0) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <div>No material data available</div>
        </div>
      );
    }

    const handleCheckboxChange = (id) => setSelectedMaterials(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleReturnQtyChange = (id, val) => setMaterialInputs(prev => ({ ...prev, [id]: val }));

    const handleSendMaterial = async () => {
      try {
        setMaterialSubmitting(true);
        const selectedItems = materialData.filter((item, idx) => selectedMaterials.includes(item.material_id || idx));
        if (selectedItems.length === 0) { alert('Please select at least one material'); setMaterialSubmitting(false); return; }

        let type = activeStaticTab === 'smetal' ? 'sheetmetal' : activeStaticTab === 'foundation' ? 'foundation' : 'fabrication';
        const apiUrl = `${BASE_URL}/ReturnStockApi.php`;

        const promises = selectedItems.map(async item => {
          const id       = item.material_id || item.id;
          const returnQty= materialInputs[id] || item.qty_remaining || 0;
          const dcId     = item.dc_id || item.chalan_id;
          const fd       = new FormData();
          fd.append('remain', returnQty); fd.append('name', id); fd.append('fileid', fileId);
          fd.append('type', type); fd.append('dc_value', dcId); fd.append('employee_id', 'vendor');
          const res = await fetch(apiUrl, { method: 'POST', body: fd });
          return res.json();
        });

        const results   = await Promise.all(promises);
        const allSuccess= results.every(r => r.status);
        if (allSuccess) { alert('Materials returned to stock successfully'); setSelectedMaterials([]); setMaterialInputs({}); fetchMaterialData(); }
        else { const failed = results.filter(r => !r.status).length; alert(`${results.length - failed} returned, ${failed} failed`); }
      } catch (err) {
        alert('Error submitting data: ' + err.message);
      } finally {
        setMaterialSubmitting(false);
      }
    };

    const hStyle = { padding: '12px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: '600', color: '#000' };

    return (
      <div>
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button style={{ backgroundColor: '#ff6b35', color: '#fff', padding: '10px 40px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>Export</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}`, minWidth: '1400px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ff6b35' }}>
                <td style={{ ...hStyle, width: '120px' }}>Chalan Id</td>
                <td style={hStyle}>Material Name</td>
                <td style={{ ...hStyle, width: '90px' }}>Quantity</td>
                <td style={{ ...hStyle, width: '90px' }}>Enter Qty</td>
                <td style={{ ...hStyle, width: '130px' }}>Consumed Qty.</td>
                <td style={{ ...hStyle, width: '130px' }}>Remaining Qty</td>
                <td style={{ ...hStyle, width: '100px' }}>Return Qty</td>
                <td style={{ ...hStyle, width: '140px' }}>Total Returned Qty</td>
                <td style={{ ...hStyle, width: '80px' }}>Return</td>
                <td style={{ ...hStyle, width: '80px' }}>Unit</td>
                <td style={{ ...hStyle, width: '80px' }}>Action</td>
              </tr>
            </thead>
            <tbody>
              {materialData.map((item, index) => {
                const id = item.material_id || index;
                const grayBg = theme === 'dark' ? '#1a202c' : '#e2e8f0';
                return (
                  <tr key={id}
                    style={{ backgroundColor: themeStyles.cardBg, transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d3748' : '#f7fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = themeStyles.cardBg}
                  >
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>{item.dc_id || item.chalan_id}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', color: themeStyles.color }}>{item.material_name}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>{item.qty_assigned || item.quantity}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'right', backgroundColor: grayBg }}>
                      <input type="text" value={item.qty_consumed || 0} readOnly style={{ width: '100%', padding: '6px 10px', border: `1px solid ${borderColor}`, borderRadius: '4px', backgroundColor: 'transparent', color: themeStyles.color, fontSize: '13px', textAlign: 'right', cursor: 'not-allowed' }} />
                    </td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color, backgroundColor: grayBg }}>{item.qty_consumed || 0}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color, backgroundColor: grayBg }}>{item.qty_remaining}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'right' }}>
                      <input type="text" value={materialInputs[id] || ''} onChange={e => handleReturnQtyChange(id, e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: `1px solid ${borderColor}`, borderRadius: '4px', backgroundColor: themeStyles.inputBg, color: themeStyles.color, fontSize: '13px', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>NO</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>{item.unit}</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', textAlign: 'right', color: themeStyles.color }}>KG</td>
                    <td style={{ padding: '10px 16px', border: `1px solid ${borderColor}`, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedMaterials.includes(id)} onChange={() => handleCheckboxChange(id)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {selectedMaterials.length > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={handleSendMaterial} disabled={materialSubmitting}
                style={{ backgroundColor: materialSubmitting ? '#94a3b8' : '#ff6b35', color: '#fff', padding: '12px 48px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: materialSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                {materialSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: RFD Completion Status
  // ─────────────────────────────────────────────────────────────────────────
  const renderRfdCompletion = () => {
    const borderColor = themeStyles.borderColor;

    if (dataLoading) {
      return (
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '60px 24px', textAlign: 'center', color: themeStyles.labelColor }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div>Loading RFD Completion Status...</div>
        </div>
      );
    }

    // const hStyle = (bg) => ({ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '11px', fontWeight: '600', color: '#000', ...(bg ? { backgroundColor: bg } : {}) });
    const hStyle = (bg) => ({
  padding: '12px 16px',
  border: `1px solid ${borderColor}`,
  fontSize: '13px',
  fontWeight: '600',
  color: '#000000',
  ...(bg ? { backgroundColor: bg } : {})
});
    const cStyle    = { padding: '10px 16px', border: `1px solid ${borderColor}`, fontSize: '13px', color: themeStyles.color };
const cNumStyle = { ...cStyle, textAlign: 'right' };
const cGreenStyle = { ...cStyle, backgroundColor: '#f0f9ff', textAlign: 'right' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Table 1 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}`, minWidth: '2000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ff6b35' }}>
                {['Material Name','DC ID','Width','Height','Qty','COL/P-C','Assign Qty','Vendor'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
                {['Semifinished Qty','RFD Qty','Completed Qty','Pending Qty','Dispatch Qty','Remaining Dispatch','Completed SHM Qty','Remaining SHM Qty'].map(h => <td key={h} style={hStyle('#90EE90')}>{h}</td>)}
                {['Enter SHM Qty','SHM Rate','SHM Amt','Sq Ft','PC Rate','Pc Amt','Total Amt'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
              </tr>
            </thead>
            <tbody>
              {rfdTable1Data.length === 0
                ? <tr><td colSpan="23" style={{ padding: '40px', textAlign: 'center', color: themeStyles.labelColor }}>No data available</td></tr>
                : rfdTable1Data.map((item, idx) => (
                  <tr key={item.row_id || idx} style={{ backgroundColor: themeStyles.cardBg }}>
                    <td style={cStyle}>{item.material}</td>
                    <td style={cStyle}>{item.dc_id}</td>
                    <td style={cNumStyle}>{item.weight}</td>
                    <td style={cNumStyle}>{item.height}</td>
                    <td style={cNumStyle}>{item.qty}</td>
                    <td style={cStyle}>{item.colour}</td>
                    <td style={cNumStyle}>{item.assignQty}</td>
                    <td style={cStyle}>{item.vendor}</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>{item.completedQty}</td>
                    <td style={cGreenStyle}>{item.remainingQty}</td>
                    <td style={cGreenStyle}>{item.dispatchQty}</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={{ ...cStyle, textAlign: 'right' }}>
                      <input type="text" style={{ width: '60px', padding: '4px', border: `1px solid ${borderColor}`, borderRadius: '4px', backgroundColor: themeStyles.inputBg, color: themeStyles.color, fontSize: '11px', textAlign: 'right' }} />
                    </td>
                    <td style={cNumStyle}>{item.sq_rate || ''}</td>
                    <td style={cNumStyle}>{item.sq_amount || ''}</td>
                    <td style={cNumStyle}>{item.sq_ft || ''}</td>
                    <td style={cNumStyle}>{item.pc_rate || ''}</td>
                    <td style={cNumStyle}>{item.pc_amount || ''}</td>
                    <td style={cNumStyle}>{item.totalAmt || ''}</td>
                  </tr>
                ))
              }
              {rfdTable1Data.length > 0 && (
                <tr style={{ backgroundColor: '#fffbeb' }}>
                  <td colSpan="2" style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '12px', fontWeight: '700' }}>TOTAL</td>
                  <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
                  <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
                  <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '11px', textAlign: 'right', fontWeight: '600' }}>{rfdTable1Data.reduce((s,i) => s+(parseInt(i.qty)||0), 0)}</td>
                  <td colSpan="18" style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}`, minWidth: '1600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#90EE90' }}>
                {['Material Name(1)','DC ID','Width','Height','Qty','COL/P-C','Assign Qty','Vendor','SHM Qty','SHM Rate','SHM Amt','Sq Ft','PC Rate','Pc Amt','Total Amt','Datetime'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
              </tr>
            </thead>
            <tbody>
              {rfdTable2Data.length === 0
                ? <tr><td colSpan="16" style={{ padding: '40px', textAlign: 'center', color: themeStyles.labelColor }}>No data available</td></tr>
                : rfdTable2Data.map((item, idx) => (
                  <tr key={item.row_id || idx} style={{ backgroundColor: themeStyles.cardBg }}>
                    <td style={cStyle}>{item.material}</td>
                    <td style={cStyle}>{item.dc_id}</td>
                    <td style={cNumStyle}>{item.weight}</td>
                    <td style={cNumStyle}>{item.height}</td>
                    <td style={cNumStyle}>{item.qty}</td>
                    <td style={cStyle}>{item.colour}</td>
                    <td style={cNumStyle}>{item.assignQty}</td>
                    <td style={cStyle}>{item.vendor}</td>
                    <td style={cNumStyle}>{item.labourQty || item.sqft || ''}</td>
                    <td style={cNumStyle}>{item.sq_rate || ''}</td>
                    <td style={cNumStyle}>{item.sq_amount || ''}</td>
                    <td style={cNumStyle}>{item.sqft || ''}</td>
                    <td style={cNumStyle}>{item.pc_rate || ''}</td>
                    <td style={cNumStyle}>{item.pc_amount || ''}</td>
                    <td style={cNumStyle}>{item.total_amount || ''}</td>
                    <td style={cStyle}>{formatDate(item.datetime) || ''}</td>
                  </tr>
                ))
              }
              {rfdTable2Data.length > 0 && (
                <tr style={{ backgroundColor: '#fffbeb' }}>
                  <td colSpan="4" style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '12px', fontWeight: '700' }}>TOTAL</td>
                  <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '11px', textAlign: 'right', fontWeight: '600' }}>{rfdTable2Data.reduce((s,i) => s+(parseInt(i.qty)||0), 0)}</td>
                  <td colSpan="11" style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 3 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}` }}>
            <thead>
              <tr style={{ backgroundColor: '#ff6b35' }}>
                {['Material Name','SECOND DC ID','Width','Height','Qty','COL/P-C','Assign Qty','Vendor'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
                {['Semifinished Qty','RFD Qty','Completed Qty','Pending Qty','Dispatch Qty','Remaining Dispatch','Completed SHM Qty','Remaining SHM Qty'].map(h => <td key={h} style={hStyle('#90EE90')}>{h}</td>)}
                {['Enter SHM Qty','SHM Rate','SHM Amt','Sq Ft','PC Rate','Pc Amt','Total Amt'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
              </tr>
            </thead>
            <tbody>
              {(!rfdTable3Data.data || rfdTable3Data.data.length === 0)
                ? <tr><td colSpan="23" style={{ padding: '40px', textAlign: 'center', color: themeStyles.labelColor }}>No data available</td></tr>
                : rfdTable3Data.data.map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: themeStyles.cardBg }}>
                    <td style={cStyle}>{item.material}</td>
                    <td style={cStyle}>{item.dc_id}</td>
                    <td style={cNumStyle}>{item.width}</td>
                    <td style={cNumStyle}>{item.height}</td>
                    <td style={cNumStyle}>{item.qty}</td>
                    <td style={cStyle}>{item.colour}</td>
                    <td style={cNumStyle}>{item.assign_qty}</td>
                    <td style={cStyle}>{item.vendor}</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>{item.completed_qty}</td>
                    <td style={cGreenStyle}>-</td>
                    <td style={cGreenStyle}>{item.dispatch_qty}</td>
                    <td colSpan="10" style={{ padding: '6px 10px', border: `1px solid ${borderColor}` }}></td>
                  </tr>
                ))
              }
              <tr style={{ backgroundColor: '#fffbeb' }}>
                <td colSpan="8" style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '12px', fontWeight: '700' }}>TOTAL</td>
                <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '11px', textAlign: 'right', fontWeight: '600' }}>{rfdTable3Data.totals?.qty || 0}</td>
                <td colSpan="14" style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button style={{ backgroundColor: '#ff6b35', color: '#fff', padding: '10px 40px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
              Assign Data Against Second DC
            </button>
          </div>
        </div>

        {/* Table 4 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${borderColor}` }}>
            <thead>
              <tr style={{ backgroundColor: '#90EE90' }}>
                {['Material Name','DC ID111','Width','Height','Qty','COL/P-C','Assign Qty','Vendor','SHM Qty','SHM Rate','SHM Amt','Sq Ft','PC Rate','Pc Amt','Total Amt','Datetime'].map(h => <td key={h} style={hStyle()}>{h}</td>)}
              </tr>
            </thead>
            <tbody>
              {(!rfdTable4Data.data || rfdTable4Data.data.length === 0)
                ? <tr><td colSpan="16" style={{ padding: '40px', textAlign: 'center', color: themeStyles.labelColor }}>No data available</td></tr>
                : rfdTable4Data.data.map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: themeStyles.cardBg }}>
                    <td style={cStyle}>{item.material}</td>
                    <td colSpan="15" style={{ padding: '6px 10px', border: `1px solid ${borderColor}` }}></td>
                  </tr>
                ))
              }
              <tr style={{ backgroundColor: '#fffbeb' }}>
                <td colSpan="4" style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '12px', fontWeight: '700' }}>TOTAL</td>
                <td style={{ padding: '8px 12px', border: `1px solid ${borderColor}`, fontSize: '11px', textAlign: 'right', fontWeight: '600' }}>{rfdTable4Data.totals?.total_qty || 0}</td>
                <td colSpan="11" style={{ padding: '8px 12px', border: `1px solid ${borderColor}` }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button style={{ backgroundColor: '#ff6b35', color: '#fff', padding: '10px 40px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>Export</button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Main content dispatcher
  // ─────────────────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeSubTab === 'rfd-material-list') return renderRFDMaterialList();
    if (activeSubTab === 'drawing')           return renderDrawing();
    if (activeSubTab === 'rfd-completion')    return renderRfdCompletion();
    if (activeSubTab === 'left-over')         return renderLeftOver();
    if (activeSubTab === 'material')          return renderMaterial();
    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: themeStyles.backgroundColor, padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: theme === 'dark' ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 4px 15px -2px rgba(0,0,0,0.1)', border: `1px solid ${themeStyles.borderColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: themeStyles.color }}>
              {/* Project Detail — File #{fileId} */}
              Project Detail — {getFileNameFromUrl() || `File #${fileId}`}
            </h1>
            <button onClick={toggleTheme}
              style={{ padding: '10px 20px', backgroundColor: themeStyles.buttonBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseEnter={e => e.target.style.backgroundColor = themeStyles.buttonHover}
              onMouseLeave={e => e.target.style.backgroundColor = themeStyles.buttonBg}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>

        {/* ── Static tabs (SMetal / Foundation / Fabrication) ── */}
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: theme === 'dark' ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 4px 15px -2px rgba(0,0,0,0.1)', border: `1px solid ${themeStyles.borderColor}` }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {staticTabs.map(tab => (
              <button key={tab.id} onClick={() => handleStaticTabClick(tab.id)}
                style={{ padding: '12px 32px', backgroundColor: activeStaticTab === tab.id ? themeStyles.tabActiveBg : themeStyles.tabBg, color: activeStaticTab === tab.id ? '#fff' : themeStyles.color, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeStaticTab === tab.id ? '0 4px 12px rgba(239,68,68,0.3)' : 'none' }}
                onMouseEnter={e => { if (activeStaticTab !== tab.id) e.target.style.backgroundColor = theme === 'dark' ? '#475569' : '#e2e8f0'; }}
                onMouseLeave={e => { if (activeStaticTab !== tab.id) e.target.style.backgroundColor = themeStyles.tabBg; }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sub tabs ── */}
        <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: theme === 'dark' ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 4px 15px -2px rgba(0,0,0,0.1)', border: `1px solid ${themeStyles.borderColor}` }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {subTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
                  style={{ padding: '10px 20px', backgroundColor: activeSubTab === tab.id ? themeStyles.tabActiveBg : themeStyles.tabBg, color: activeSubTab === tab.id ? '#fff' : themeStyles.color, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: activeSubTab === tab.id ? '0 4px 12px rgba(239,68,68,0.3)' : 'none' }}
                  onMouseEnter={e => { if (activeSubTab !== tab.id) e.currentTarget.style.backgroundColor = theme === 'dark' ? '#475569' : '#e2e8f0'; }}
                  onMouseLeave={e => { if (activeSubTab !== tab.id) e.currentTarget.style.backgroundColor = themeStyles.tabBg; }}
                >
                  <Icon size={16} />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content area ── */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default SushamProjectDetail;