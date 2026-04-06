import React, { useEffect, useMemo, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry } from "ag-grid-community";
import {
    ClientSideRowModelModule,
    ValidationModule,
    DateFilterModule,
    NumberFilterModule,
    TextFilterModule,
    RowSelectionModule,
    PaginationModule,
    CsvExportModule
} from "ag-grid-community";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ValidationModule,
    DateFilterModule,
    NumberFilterModule,
    TextFilterModule,
    RowSelectionModule,
    PaginationModule,
    CsvExportModule
]);

const PackingListManager = () => {
    const getFileIdFromUrl = () => {
        const path = window.location.pathname;
        const match = path.match(/\/excel-list\/details\/(\d+)/);
        return match ? match[1] : '5507';
    };

    const getFileNameFromUrl = () => {
    const hash = window.location.hash; // e.g. "#/excel-list/details/5530/S-26-TEJ"
    const match = hash.match(/#\/excel-list\/details\/\d+\/(.+)/);
    return match ? decodeURIComponent(match[1]) : '';
};
    const [fileName, setFileName] = useState(getFileNameFromUrl());

    const [fileId] = useState(getFileIdFromUrl());
    // FIX 2: Changed default from 'Metal' to 'SMetal' to match tabs array
    const [activeTab, setActiveTab] = useState('SMetal');
    const [theme, setTheme] = useState('light');
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [loading, setLoading] = useState(false);
    // const [fileName, setFileName] = useState('');
    const [revision, setRevision] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const [metalFormData, setMetalFormData] = useState({
        packingMaterial: '', cw: '', ch: '', hl: '', qty: '', w: '', h: '', qty1: '', wt: '',
        sq_m: '', sqft: '', colpc: '', col11: '', matlReqmt: '', col13: '', col14: '', index: ''
    });

    const [foundationFormData, setFoundationFormData] = useState({
        specification: '', moc: '', size: '', l: '', qty: '', mtrs: '', sqft: '', wtMtr: '', wt: '', index: ''
    });

    const [fabricationFormData, setFabricationFormData] = useState({
        specification: '', col2: '', inMm: '', qty: '', mtrs: '', sqft: '', color: '', weight: '', index: ''
    });

    const [assemblyFormData, setAssemblyFormData] = useState({
        assemblyMaterial: '', col2: '', col3: '', col4: '', qty: '', col6: '', col7: '', index: ''
    });

    const [metalRowData, setMetalRowData] = useState([]);
    const [foundationRowData, setFoundationRowData] = useState([]);
    const [fabricationRowData, setFabricationRowData] = useState([]);
    const [assemblyRowData, setAssemblyRowData] = useState([]);

    const gridRef = useRef();
    const API_BASE_URL = "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api";

    // FIX 2: tabs array kept as-is, now activeTab default matches 'SMetal'
    const tabs = ['SMetal', 'Foundation', 'Fabrication', 'Assembly'];

    const fetchMetalData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/smetalswapApi.php?file=${fileId}`);
            const result = await response.json();
            if (result.status === "success" && Array.isArray(result.data)) {
                const mappedData = result.data.map((item) => ({
                    index: item.id,
                    dbId: item.DT_RowId,
                    packingMaterial: item.pm || '',
                    cw: item.cw || '0',
                    ch: item.ch || '0',
                    hl: item.hl || '0',
                    qty: item.qty || '0',
                    w: item.mm || '0',
                    h: item.h || '0',
                    qty1: item.qty1 || '0',
                    sqm: item.sqm || '',
                    sqft: item.sqf || '',
                    colpc: item.col || '',
                    col11: item.col11 || '',
                    matlReqmt: item.matl || '',
                    col13: item.col13 || '',
                    col14: item.col14 || '',
                    wt: item.wt || '0',
                    updatedBy: item.time || '-'
                }));
                setMetalRowData(mappedData);
                // setFileName(result.fileName || `File-${fileId}`);
                if (result.fileName) setFileName(result.fileName);
// Don't overwrite the URL-derived name with a fallback
                setRevision(result.revision || '0');
            }
        } catch (error) {
            console.error("Error fetching metal data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFoundationData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/foundswapApi.php?file=${fileId}`);
            const result = await response.json();
            if (result.status === "success" && Array.isArray(result.data)) {
                const mappedData = result.data.map((item) => ({
                    index: item.id,
                    dbId: item.DT_RowId,
                    specification: item.spe || '',
                    moc: item.moc || '',
                    size: item.size || '',
                    l: item.l || '',
                    qty: item.qty || '0',
                    mtrs: item.mtrs || '',
                    sqft: item.sqft || '',
                    wtMtr: item.wtMtr || '',
                    wt: item.wt || '0',
                    updatedBy: item.time || '-'
                }));
                setFoundationRowData(mappedData);
                // setFileName(result.fileName || `File-${fileId}`);
                if (result.fileName) setFileName(result.fileName);
// Don't overwrite the URL-derived name with a fallback
                setRevision(result.revision || '0');
            }
        } catch (error) {
            console.error("Error fetching foundation data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFabricationData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/fabswapApi.php?file=${fileId}`);
            const result = await response.json();
            if (result.status === "success" && Array.isArray(result.data)) {
                const mappedData = result.data.map((item) => ({
                    index: item.id,
                    dbId: item.DT_RowId,
                    specification: item.spe || '',
                    col2: item.col2 || '',
                    inMm: item.inmm || '',
                    qty: item.qty || '0',
                    mtrs: item.mtrs || '',
                    sqft: item.sqft || '',
                    color: item.color || '',
                    weight: item.weight || '0',
                    updatedBy: item.time || '-'
                }));
                setFabricationRowData(mappedData);
                // setFileName(result.fileName || `File-${fileId}`);
                if (result.fileName) setFileName(result.fileName);
// Don't overwrite the URL-derived name with a fallback
                setRevision(result.revision || '0');
            }
        } catch (error) {
            console.error("Error fetching fabrication data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssemblyData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/assemswapApi.php?file=${fileId}`);
            const result = await response.json();
            if (result.status === "success" && Array.isArray(result.data)) {
                const mappedData = result.data.map((item) => ({
                    index: item.id,
                    dbId: item.DT_RowId,
                    assemblyMaterial: item.spe || '',
                    col2: item.col2 || '',
                    col3: item.col3 || '',
                    col4: item.col4 || '',
                    qty: item.qty || '0',
                    col6: item.col6 || '',
                    col7: item.col7 || '',
                    updatedBy: item.time || '-'
                }));
                setAssemblyRowData(mappedData);
                // setFileName(result.fileName || `File-${fileId}`);
                if (result.fileName) setFileName(result.fileName);
// Don't overwrite the URL-derived name with a fallback
                setRevision(result.revision || '0');
            }
        } catch (error) {
            console.error("Error fetching assembly data:", error);
        } finally {
            setLoading(false);
        }
    };

    // FIX 2: All switch cases now use 'SMetal' instead of 'Metal'
    useEffect(() => {
        if (activeTab === 'SMetal') {
            fetchMetalData();
        } else if (activeTab === 'Foundation') {
            fetchFoundationData();
        } else if (activeTab === 'Fabrication') {
            fetchFabricationData();
        } else if (activeTab === 'Assembly') {
            fetchAssemblyData();
        }
    }, [fileId, activeTab]);

    const EditableCell = (props) => {
        const { value, node, colDef } = props;
        const [inputValue, setInputValue] = React.useState(value || "");

        React.useEffect(() => {
            setInputValue(value || "");
        }, [value]);

        const handleChange = (e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            node.setDataValue(colDef.field, newValue);
        };

        return (
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                    padding: "8px",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    textAlign: "right",
                    color: "inherit"
                }}
            />
        );
    };

    const MetalActionCell = (params) => {
        const handleSave = async () => {
            try {
                const shortname = sessionStorage.getItem('shortname') || 'admin';
                const payload = {
                    selectedRow: [{
                        index: params.data.index || '',
                        string: params.data.dbId || '',
                        packing_material: params.data.packingMaterial || '',
                        CW: params.data.cw || '',
                        C_H: params.data.ch || '',
                        Qty: params.data.qty || '',
                        W: params.data.w || '',
                        H: params.data.h || '',
                        Qty1: params.data.qty1 || '',
                        sq_m: params.data.sqm || '',
                        Sq_Ft: params.data.sqft || '',
                        Col_PC: params.data.colpc || '',
                        COL_11: params.data.col11 || '',
                        Matl_Reqmt: params.data.matlReqmt || '',
                        COL_13: params.data.col13 || '',
                        COL_14: params.data.col14 || '',
                        Wt: params.data.wt || '',
                        shortname: shortname
                    }]
                };
                const response = await fetch(`${API_BASE_URL}/smetalUpdateApi.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                const button = document.getElementById(`save-btn-${params.data.index}`);
                if (result.status === 'success') {
                    if (button) {
                        button.style.background = '#28a745';
                        button.innerHTML = '✅ Saved';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.success('Record updated successfully!');
                    await fetchMetalData();
                } else {
                    if (button) {
                        button.style.background = '#dc3545';
                        button.innerHTML = '❌ Error';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.error(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating:', error);
                toast.error('Error updating record');
            }
        };
        return (
            <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <button
                    id={`save-btn-${params.data.index}`}
                    onClick={handleSave}
                    style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white', border: 'none', borderRadius: '6px',
                        padding: '4px 12px', fontSize: '10px', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.2)', transition: 'all 0.3s ease'
                    }}
                >💾 Save</button>
            </div>
        );
    };

    const FoundationActionCell = (params) => {
        const handleSave = async () => {
            try {
                const requestData = {
                    selectedRowfound: [{
                        string: params.data.dbId,
                        index: params.data.index,
                        specification: params.data.specification,
                        MOC: params.data.moc,
                        size: params.data.size,
                        L: params.data.l,
                        Qty: params.data.qty,
                        Mtrs: params.data.mtrs,
                        sq_ft: params.data.sqft,
                        Wt_Mtr: params.data.wtMtr,
                        Wt: params.data.wt
                    }]
                };
                const response = await fetch(`${API_BASE_URL}/foundationUpdateApi.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                const result = await response.json();
                const button = document.getElementById(`save-btn-${params.data.index}`);
                if (result.status === 'success') {
                    if (button) {
                        button.style.background = '#28a745';
                        button.innerHTML = '✅ Saved';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.success('Record updated successfully!');
                    await fetchFoundationData();
                } else {
                    if (button) {
                        button.style.background = '#dc3545';
                        button.innerHTML = '❌ Error';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.error(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating:', error);
                toast.error('Error updating record');
            }
        };
        return (
            <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <button
                    id={`save-btn-${params.data.index}`}
                    onClick={handleSave}
                    style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white', border: 'none', borderRadius: '6px',
                        padding: '4px 12px', fontSize: '10px', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.2)', transition: 'all 0.3s ease'
                    }}
                >💾 Save</button>
            </div>
        );
    };

    const FabricationActionCell = (params) => {
        const handleSave = async () => {
            try {
                const requestData = {
                    selectedRowfab: [{
                        string: params.data.dbId,
                        index: params.data.index,
                        specification: params.data.specification,
                        COL_2: params.data.col2,
                        in_mm: params.data.inMm,
                        Qty: params.data.qty,
                        Mtrs: params.data.mtrs,
                        Sqft: params.data.sqft,
                        color: params.data.color,
                        wt: params.data.weight
                    }]
                };
                const response = await fetch(`${API_BASE_URL}/FabricationUpdateApi.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                const result = await response.json();
                const button = document.getElementById(`save-btn-${params.data.index}`);
                if (result.status === 'success') {
                    if (button) {
                        button.style.background = '#28a745';
                        button.innerHTML = '✅ Saved';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.success('Record updated successfully!');
                    await fetchFabricationData();
                } else {
                    if (button) {
                        button.style.background = '#dc3545';
                        button.innerHTML = '❌ Error';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.error(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating:', error);
                toast.error('Error updating record');
            }
        };
        return (
            <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <button
                    id={`save-btn-${params.data.index}`}
                    onClick={handleSave}
                    style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white', border: 'none', borderRadius: '6px',
                        padding: '4px 12px', fontSize: '10px', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.2)', transition: 'all 0.3s ease'
                    }}
                >💾 Save</button>
            </div>
        );
    };

    const AssemblyActionCell = (params) => {
        const handleSave = async () => {
            try {
                const requestData = {
                    selectedRowAsse: [{
                        string: params.data.dbId,
                        index: params.data.index,
                        assembly_mtrl: params.data.assemblyMaterial,
                        COL_2: params.data.col2,
                        COL_3: params.data.col3,
                        COL_4: params.data.col4,
                        Qty: params.data.qty,
                        COL_6: params.data.col6,
                        COL_7: params.data.col7
                    }]
                };
                const response = await fetch(`${API_BASE_URL}/assemblyUpdateApi.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                const result = await response.json();
                const button = document.getElementById(`save-btn-${params.data.index}`);
                if (result.status === 'success') {
                    if (button) {
                        button.style.background = '#28a745';
                        button.innerHTML = '✅ Saved';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.success('Record updated successfully!');
                    await fetchAssemblyData();
                } else {
                    if (button) {
                        button.style.background = '#dc3545';
                        button.innerHTML = '❌ Error';
                        setTimeout(() => {
                            button.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                            button.innerHTML = '💾 Save';
                        }, 2000);
                    }
                    toast.error(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating:', error);
                toast.error('Error updating record');
            }
        };
        return (
            <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <button
                    id={`save-btn-${params.data.index}`}
                    onClick={handleSave}
                    style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white', border: 'none', borderRadius: '6px',
                        padding: '4px 12px', fontSize: '10px', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,123,255,0.2)', transition: 'all 0.3s ease'
                    }}
                >💾 Save</button>
            </div>
        );
    };

    // FIX 3: Column order changed to DT_RowId → Action → Index for all tabs
    const metalColumnDefs = useMemo(() => [
        {
            headerName: "DT_RowId",
            field: "dbId",
            width: 90,
            pinned: 'left',
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        {
            headerName: "Action",
            field: "action",
            width: 100,
            pinned: 'left',
            cellRenderer: MetalActionCell,
            cellStyle: { backgroundColor: '#ff8c42' }
        },
        {
            headerName: "Index",
            field: "index",
            width: 80,
            pinned: 'left',
            cellRenderer: EditableCell,
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        { headerName: "Packing Material", field: "packingMaterial", width: 200, cellRenderer: EditableCell },
        { headerName: "CW", field: "cw", width: 80, cellRenderer: EditableCell },
        { headerName: "C H", field: "ch", width: 80, cellRenderer: EditableCell },
        { headerName: "H/L", field: "hl", width: 80, cellRenderer: EditableCell },
        { headerName: "Qty", field: "qty", width: 80, cellRenderer: EditableCell },
        { headerName: "W", field: "w", width: 80, cellRenderer: EditableCell },
        { headerName: "H", field: "h", width: 80, cellRenderer: EditableCell },
        { headerName: "Qty", field: "qty1", width: 80, cellRenderer: EditableCell },
        { headerName: "Sq. m", field: "sqm", width: 100, cellRenderer: EditableCell },
        { headerName: "Sq. Ft", field: "sqft", width: 100, cellRenderer: EditableCell },
        { headerName: "Col/P-C", field: "colpc", width: 100, cellRenderer: EditableCell },
        { headerName: "COL_11", field: "col11", width: 100, cellRenderer: EditableCell },
        { headerName: "Matl. Reqmt", field: "matlReqmt", width: 120, cellRenderer: EditableCell },
        { headerName: "COL_13", field: "col13", width: 100, cellRenderer: EditableCell },
        { headerName: "COL_14", field: "col14", width: 100, cellRenderer: EditableCell },
        { headerName: "Wt.", field: "wt", width: 80, cellRenderer: EditableCell },
        { headerName: "Updated by and time", field: "updatedBy", width: 180 }
    ], []);

    const foundationColumnDefs = useMemo(() => [
        {
            headerName: "DT_RowId",
            field: "dbId",
            width: 90,
            pinned: 'left',
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        {
            headerName: "Action",
            field: "action",
            width: 100,
            pinned: 'left',
            cellRenderer: FoundationActionCell,
            cellStyle: { backgroundColor: '#ff8c42' }
        },
        {
            headerName: "Index",
            field: "index",
            width: 80,
            pinned: 'left',
            cellRenderer: EditableCell,
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        { headerName: "Specification", field: "specification", width: 200, cellRenderer: EditableCell },
        { headerName: "MOC", field: "moc", width: 100, cellRenderer: EditableCell },
        { headerName: "Size", field: "size", width: 120, cellRenderer: EditableCell },
        { headerName: "L", field: "l", width: 80, cellRenderer: EditableCell },
        { headerName: "Qty", field: "qty", width: 80, cellRenderer: EditableCell },
        { headerName: "Mtrs", field: "mtrs", width: 100, cellRenderer: EditableCell },
        { headerName: "Sq. Ft.", field: "sqft", width: 100, cellRenderer: EditableCell },
        { headerName: "Wt/Mtr", field: "wtMtr", width: 100, cellRenderer: EditableCell },
        { headerName: "Wt", field: "wt", width: 80, cellRenderer: EditableCell },
        { headerName: "Updated by and time", field: "updatedBy", width: 180 }
    ], []);

    const fabricationColumnDefs = useMemo(() => [
        {
            headerName: "DT_RowId",
            field: "dbId",
            width: 90,
            pinned: 'left',
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        {
            headerName: "Action",
            field: "action",
            width: 100,
            pinned: 'left',
            cellRenderer: FabricationActionCell,
            cellStyle: { backgroundColor: '#ff8c42' }
        },
        {
            headerName: "Index",
            field: "index",
            width: 80,
            pinned: 'left',
            cellRenderer: EditableCell,
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        { headerName: "Specification", field: "specification", width: 200, cellRenderer: EditableCell },
        { headerName: "COL_2", field: "col2", width: 100, cellRenderer: EditableCell },
        { headerName: "in mm", field: "inMm", width: 100, cellRenderer: EditableCell },
        { headerName: "Qty", field: "qty", width: 80, cellRenderer: EditableCell },
        { headerName: "Mtrs", field: "mtrs", width: 100, cellRenderer: EditableCell },
        { headerName: "Sq.ft", field: "sqft", width: 100, cellRenderer: EditableCell },
        { headerName: "color", field: "color", width: 100, cellRenderer: EditableCell },
        { headerName: "weight", field: "weight", width: 100, cellRenderer: EditableCell },
        { headerName: "Updated by and time", field: "updatedBy", width: 180 }
    ], []);

    const assemblyColumnDefs = useMemo(() => [
        {
            headerName: "DT_RowId",
            field: "dbId",
            width: 90,
            pinned: 'left',
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        {
            headerName: "Action",
            field: "action",
            width: 100,
            pinned: 'left',
            cellRenderer: AssemblyActionCell,
            cellStyle: { backgroundColor: '#ff8c42' }
        },
        {
            headerName: "Index",
            field: "index",
            width: 80,
            pinned: 'left',
            cellRenderer: EditableCell,
            cellStyle: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ff8c42', color: '#000' }
        },
        { headerName: "Assembly Material ( M )", field: "assemblyMaterial", width: 250, cellRenderer: EditableCell },
        { headerName: "COL_2", field: "col2", width: 100, cellRenderer: EditableCell },
        { headerName: "COL_3", field: "col3", width: 100, cellRenderer: EditableCell },
        { headerName: "COL_4", field: "col4", width: 100, cellRenderer: EditableCell },
        { headerName: "Qty", field: "qty", width: 80, cellRenderer: EditableCell },
        { headerName: "COL_6", field: "col6", width: 100, cellRenderer: EditableCell },
        { headerName: "COL_7", field: "col7", width: 100, cellRenderer: EditableCell },
        { headerName: "Updated by and time", field: "updatedBy", width: 180 }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
        filter: false
    }), []);

    const handleAddMetal = async () => {
        if (!metalFormData.packingMaterial) {
            toast.error('Please enter a packing material');
            return;
        }
        setLoading(true);
        try {
            const addFormData = new FormData();
            addFormData.append('fileIDs', fileId);
            addFormData.append('string', '');
            addFormData.append('index', metalFormData.index || '');
            addFormData.append('packing_material', metalFormData.packingMaterial);
            addFormData.append('CW', metalFormData.cw || '');
            addFormData.append('C_H', metalFormData.ch || '');
            addFormData.append('Qty', metalFormData.qty || '');
            addFormData.append('W', metalFormData.w || '');
            addFormData.append('H', metalFormData.h || '');
            addFormData.append('Qty1', metalFormData.qty1 || '');
            addFormData.append('sq_m', metalFormData.sq_m || '');
            addFormData.append('Sq_Ft', metalFormData.sqft || '');
            addFormData.append('Col_PC', metalFormData.colpc || '');
            addFormData.append('COL_11', metalFormData.col11 || '');
            addFormData.append('Matl_Reqmt', metalFormData.matlReqmt || '');
            addFormData.append('COL_13', metalFormData.col13 || '');
            addFormData.append('COL_14', metalFormData.col14 || '');
            addFormData.append('Wt', metalFormData.wt || '');
            const response = await fetch(`${API_BASE_URL}/SmetalAddApi.php`, { method: 'POST', body: addFormData });
            const result = await response.json();
            if (result.status === 'success') {
                toast.success('Material added successfully!');
                setMetalFormData({ packingMaterial: '', cw: '', ch: '', hl: '', qty: '', w: '', h: '', qty1: '', wt: '', sq_m: '', sqft: '', colpc: '', col11: '', matlReqmt: '', col13: '', col14: '', index: '' });
                setShowAddForm(false);
                await fetchMetalData();
            } else {
                toast.error(`Error: ${result.message || 'Failed to add material'}`);
            }
        } catch (error) {
            toast.error('Error adding material: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFoundation = async () => {
        if (!foundationFormData.specification) {
            toast.error('Please enter a specification');
            return;
        }
        setLoading(true);
        try {
            const addFormData = new FormData();
            addFormData.append('fileIDs', fileId);
            addFormData.append('index', foundationFormData.index || '');
            addFormData.append('specification', foundationFormData.specification);
            addFormData.append('MOC', foundationFormData.moc || '');
            addFormData.append('size', foundationFormData.size || '');
            addFormData.append('L', foundationFormData.l || '');
            addFormData.append('Qty', foundationFormData.qty || '');
            addFormData.append('Mtrs', foundationFormData.mtrs || '');
            addFormData.append('sq_ft', foundationFormData.sqft || '');
            addFormData.append('Wt_Mtr', foundationFormData.wtMtr || '');
            addFormData.append('Wt', foundationFormData.wt || '');
            const response = await fetch(`${API_BASE_URL}/FoundationAddApi.php`, { method: 'POST', body: addFormData });
            const result = await response.json();
            if (result.status === 'success') {
                toast.success('Foundation item added successfully!');
                setFoundationFormData({ specification: '', moc: '', size: '', l: '', qty: '', mtrs: '', sqft: '', wtMtr: '', wt: '', index: '' });
                setShowAddForm(false);
                await fetchFoundationData();
            } else {
                toast.error(`Error: ${result.message || 'Failed to add foundation item'}`);
            }
        } catch (error) {
            toast.error('Error adding foundation item: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFab = async () => {
        if (!fabricationFormData.specification) {
            toast.error('Please enter a specification');
            return;
        }
        setLoading(true);
        try {
            const addFormData = new FormData();
            addFormData.append('fileIDs', fileId);
            addFormData.append('index', fabricationFormData.index || '');
            addFormData.append('specification', fabricationFormData.specification);
            addFormData.append('COL_2', fabricationFormData.col2 || '');
            addFormData.append('in_mm', fabricationFormData.inMm || '');
            addFormData.append('Qty', fabricationFormData.qty || '');
            addFormData.append('Mtrs', fabricationFormData.mtrs || '');
            addFormData.append('Sqft', fabricationFormData.sqft || '');
            addFormData.append('color', fabricationFormData.color || '');
            addFormData.append('weight', fabricationFormData.weight || '');
            const response = await fetch(`${API_BASE_URL}/FabricationAddApi.php`, { method: 'POST', body: addFormData });
            const result = await response.json();
            if (result.status === 'success') {
                toast.success('Fabrication item added successfully!');
                setFabricationFormData({ specification: '', col2: '', inMm: '', qty: '', mtrs: '', sqft: '', color: '', weight: '', index: '' });
                setShowAddForm(false);
                await fetchFabricationData();
            } else {
                toast.error(`Error: ${result.message || 'Failed to add fabrication item'}`);
            }
        } catch (error) {
            toast.error('Error adding fabrication item: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssembly = async () => {
        if (!assemblyFormData.assemblyMaterial) {
            toast.error('Please enter assembly material');
            return;
        }
        setLoading(true);
        try {
            const addFormData = new FormData();
            addFormData.append('fileIDs', fileId);
            addFormData.append('index', assemblyFormData.index || '');
            addFormData.append('assembly_mtrl', assemblyFormData.assemblyMaterial);
            addFormData.append('COL_2', assemblyFormData.col2 || '');
            addFormData.append('COL_3', assemblyFormData.col3 || '');
            addFormData.append('COL_4', assemblyFormData.col4 || '');
            addFormData.append('Qty', assemblyFormData.qty || '');
            addFormData.append('COL_6', assemblyFormData.col6 || '');
            addFormData.append('COL_7', assemblyFormData.col7 || '');
            const response = await fetch(`${API_BASE_URL}/AssemblyAddApi.php`, { method: 'POST', body: addFormData });
            const result = await response.json();
            if (result.status === 'success') {
                toast.success('Assembly item added successfully!');
                setAssemblyFormData({ assemblyMaterial: '', col2: '', col3: '', col4: '', qty: '', col6: '', col7: '', index: '' });
                setShowAddForm(false);
                await fetchAssemblyData();
            } else {
                toast.error(`Error: ${result.message || 'Failed to add assembly item'}`);
            }
        } catch (error) {
            toast.error('Error adding assembly item: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    const getThemeStyles = () => {
        if (theme === 'dark') {
            return {
                backgroundColor: 'linear-gradient(135deg, #1a1d23 0%, #0f1419 100%)',
                color: '#f8f9fa', cardBg: '#252b36',
                cardHeader: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
                inputBg: '#1a202c', inputBorder: '#4a5568', inputColor: '#f7fafc'
            };
        }
        return {
            backgroundColor: 'linear-gradient(135deg, #f0f4f8 0%, #d9e8f5 100%)',
            color: '#1a202c', cardBg: '#ffffff',
            cardHeader: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
            inputBg: '#ffffff', inputBorder: '#cbd5e0', inputColor: '#2d3748'
        };
    };

    const themeStyles = getThemeStyles();
    const gridHeight = isFullScreen ? 'calc(100vh - 280px)' : '600px';

    useEffect(() => {
        document.body.style.background = themeStyles.backgroundColor;
        document.body.style.color = themeStyles.color;
        document.body.style.minHeight = '100vh';
        return () => {
            document.body.style.background = '';
            document.body.style.color = '';
            document.body.style.minHeight = '';
        };
    }, [theme]);

    // FIX 2: All cases updated to 'SMetal'
    const getCurrentRowData = () => {
        switch (activeTab) {
            case 'SMetal': return metalRowData;
            case 'Foundation': return foundationRowData;
            case 'Fabrication': return fabricationRowData;
            case 'Assembly': return assemblyRowData;
            default: return [];
        }
    };

    const getCurrentColumnDefs = () => {
        switch (activeTab) {
            case 'SMetal': return metalColumnDefs;
            case 'Foundation': return foundationColumnDefs;
            case 'Fabrication': return fabricationColumnDefs;
            case 'Assembly': return assemblyColumnDefs;
            default: return [];
        }
    };

    const inputStyle = (themeStyles) => ({
        width: '100%', padding: '8px 12px',
        border: `2px solid ${themeStyles.inputBorder}`,
        borderRadius: '6px', backgroundColor: themeStyles.inputBg,
        color: themeStyles.inputColor, fontSize: '13px'
    });

    const labelStyle = (theme) => ({
        display: 'block', marginBottom: '6px', fontSize: '12px',
        fontWeight: '600', color: theme === 'dark' ? '#a0aec0' : '#4a5568'
    });

    // FIX 2: renderAddForm uses 'SMetal'
    const renderAddForm = () => {
        const formWrapStyle = {
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px', alignItems: 'end', padding: '20px',
            backgroundColor: theme === 'dark' ? '#1a202c' : '#f7fafc',
            borderRadius: '8px', border: `2px solid ${themeStyles.inputBorder}`
        };
        const addBtnStyle = {
            width: '100%', background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
            border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: '600',
            fontSize: '13px', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)'
        };

        if (activeTab === 'SMetal') {
            return (
                <div style={formWrapStyle}>
                    {[
                        { label: 'Index', key: 'index', ph: 'Enter Index' },
                        { label: 'Packing Material', key: 'packingMaterial', ph: 'Enter material...' },
                        { label: 'CW', key: 'cw', ph: 'Enter CW...' },
                        { label: 'CH', key: 'ch', ph: 'Enter CH...' },
                        { label: 'Qty', key: 'qty', ph: 'Enter qty...' },
                        { label: 'W', key: 'w', ph: 'Enter W...' },
                        { label: 'H', key: 'h', ph: 'Enter H...' },
                        { label: 'Qty1', key: 'qty1', ph: 'Enter qty1...' },
                        { label: 'sq_m', key: 'sq_m', ph: 'Enter sq_m' },
                        { label: 'sq_ft', key: 'sqft', ph: 'Enter sq_ft' },
                        { label: 'Col_PC', key: 'colpc', ph: 'Enter colpc' },
                        { label: 'Col_11', key: 'col11', ph: 'Enter col11' },
                        { label: 'Matl_Reqmt', key: 'matlReqmt', ph: 'Enter Matl_Reqmt' },
                        { label: 'Col_13', key: 'col13', ph: 'Enter col13' },
                        { label: 'Col_14', key: 'col14', ph: 'Enter col14' },
                        { label: 'Wt', key: 'wt', ph: 'Enter weight...' },
                    ].map(({ label, key, ph }) => (
                        <div key={key}>
                            <label style={labelStyle(theme)}>{label}</label>
                            <input type="text" value={metalFormData[key] || ''} onChange={(e) => setMetalFormData({ ...metalFormData, [key]: e.target.value })} placeholder={ph} style={inputStyle(themeStyles)} />
                        </div>
                    ))}
                    <div>
                        <label style={{ ...labelStyle(theme), color: 'transparent' }}>.</label>
                        <button onClick={handleAddMetal} style={addBtnStyle}>➕ Add Row</button>
                    </div>
                </div>
            );
        } else if (activeTab === 'Foundation') {
            return (
                <div style={formWrapStyle}>
                    {[
                        { label: 'Index', key: 'index', ph: 'Enter Index' },
                        { label: 'Specification', key: 'specification', ph: 'Specification' },
                        { label: 'MOC', key: 'moc', ph: 'MOC' },
                        { label: 'Size', key: 'size', ph: 'Enter Size' },
                        { label: 'L', key: 'l', ph: 'Enter L' },
                        { label: 'Qty', key: 'qty', ph: 'Enter Qty' },
                        { label: 'Mtrs', key: 'mtrs', ph: 'Enter Mtrs' },
                        { label: 'sq_ft', key: 'sqft', ph: 'Enter sq_ft' },
                        { label: 'Wt_Mtr', key: 'wtMtr', ph: 'Enter Wt_Mtr' },
                        { label: 'Wt', key: 'wt', ph: 'Enter Wt' },
                    ].map(({ label, key, ph }) => (
                        <div key={key}>
                            <label style={labelStyle(theme)}>{label}</label>
                            <input type="text" value={foundationFormData[key] || ''} onChange={(e) => setFoundationFormData({ ...foundationFormData, [key]: e.target.value })} placeholder={ph} style={inputStyle(themeStyles)} />
                        </div>
                    ))}
                    <div>
                        <label style={{ ...labelStyle(theme), color: 'transparent' }}>.</label>
                        <button onClick={handleAddFoundation} style={addBtnStyle}>➕ Save</button>
                    </div>
                </div>
            );
        } else if (activeTab === 'Fabrication') {
            return (
                <div style={formWrapStyle}>
                    {[
                        { label: 'Index', key: 'index', ph: 'Enter Index' },
                        { label: 'Specification', key: 'specification', ph: 'Specification' },
                        { label: 'COL_2', key: 'col2', ph: 'COL_2' },
                        { label: 'In_mm', key: 'inMm', ph: 'Enter In_mm' },
                        { label: 'Qty', key: 'qty', ph: 'Enter Qty' },
                        { label: 'Mtrs', key: 'mtrs', ph: 'Enter Mtrs' },
                        { label: 'sq_ft', key: 'sqft', ph: 'Enter sq_ft' },
                        { label: 'Color', key: 'color', ph: 'Enter color' },
                        { label: 'Weight', key: 'weight', ph: 'Enter weight' },
                    ].map(({ label, key, ph }) => (
                        <div key={key}>
                            <label style={labelStyle(theme)}>{label}</label>
                            <input type="text" value={fabricationFormData[key] || ''} onChange={(e) => setFabricationFormData({ ...fabricationFormData, [key]: e.target.value })} placeholder={ph} style={inputStyle(themeStyles)} />
                        </div>
                    ))}
                    <div>
                        <label style={{ ...labelStyle(theme), color: 'transparent' }}>.</label>
                        <button onClick={handleAddFab} style={addBtnStyle}>➕ Save</button>
                    </div>
                </div>
            );
        } else if (activeTab === 'Assembly') {
            return (
                <div style={formWrapStyle}>
                    {[
                        { label: 'Index', key: 'index', ph: 'Enter Index' },
                        { label: 'Assembly Material', key: 'assemblyMaterial', ph: 'Assembly material' },
                        { label: 'COL_2', key: 'col2', ph: 'COL_2' },
                        { label: 'COL_3', key: 'col3', ph: 'Enter COL_3' },
                        { label: 'COL_4', key: 'col4', ph: 'Enter COL_4' },
                        { label: 'Qty', key: 'qty', ph: 'Enter Qty' },
                        { label: 'COL_6', key: 'col6', ph: 'Enter COL_6' },
                        { label: 'COL_7', key: 'col7', ph: 'Enter COL_7' },
                    ].map(({ label, key, ph }) => (
                        <div key={key}>
                            <label style={labelStyle(theme)}>{label}</label>
                            <input type="text" value={assemblyFormData[key] || ''} onChange={(e) => setAssemblyFormData({ ...assemblyFormData, [key]: e.target.value })} placeholder={ph} style={inputStyle(themeStyles)} />
                        </div>
                    ))}
                    <div>
                        <label style={{ ...labelStyle(theme), color: 'transparent' }}>.</label>
                        <button onClick={handleAddAssembly} style={addBtnStyle}>➕ Save</button>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ minHeight: '100vh', background: themeStyles.backgroundColor, color: themeStyles.color, padding: 0, margin: 0 }}>
            <div className={`container-fluid ${isFullScreen ? 'p-0' : ''}`}>
                <div className="card" style={{
                    backgroundColor: themeStyles.cardBg, color: themeStyles.color,
                    border: theme === 'dark' ? '1px solid #2d3748' : '1px solid #e2e8f0',
                    margin: isFullScreen ? 0 : 20, borderRadius: isFullScreen ? 0 : 12,
                    boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.08)'
                }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: `2px solid ${theme === 'dark' ? '#2d3748' : '#e2e8f0'}`, backgroundColor: themeStyles.cardBg }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '14px 28px', border: 'none',
                                    // FIX 1: highlight uses activeTab === tab correctly now that names match
                                    backgroundColor: activeTab === tab ? '#ff8c42' : themeStyles.cardBg,
                                    color: activeTab === tab ? '#fff' : themeStyles.color,
                                    fontSize: '15px', fontWeight: activeTab === tab ? '600' : '500',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab ? '3px solid #ff8c42' : 'none',
                                    transition: 'all 0.2s ease', outline: 'none'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="card-header" style={{
                        background: themeStyles.cardHeader, color: themeStyles.color,
                        fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '1.5rem 2rem',
                        borderBottom: `2px solid ${theme === 'dark' ? '#2d3748' : '#e2e8f0'}`
                    }}>
                        <div className="row align-items-center g-3">
                            <div className="col-12">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={() => setShowAddForm(!showAddForm)}
                                        style={{
                                            fontSize: '0.875rem', padding: '10px 18px', fontWeight: '600',
                                            background: showAddForm
                                                ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        {showAddForm ? '✖ Hide Form' : '➕ Add New'}
                                    </button>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                            <button onClick={toggleFullScreen} style={{ border: `2px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, color: themeStyles.color, padding: '8px 16px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer' }}>
                                                {isFullScreen ? '📉' : '📈'}
                                            </button>
                                            <button onClick={toggleTheme} style={{ border: `2px solid ${themeStyles.inputBorder}`, backgroundColor: themeStyles.inputBg, color: themeStyles.color, padding: '8px 16px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer' }}>
                                                {theme === 'light' ? '🌙' : '☀️'}
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', padding: '8px 16px', backgroundColor: theme === 'dark' ? '#2d3748' : '#f7fafc', borderRadius: '8px', border: `2px solid ${themeStyles.inputBorder}` }}>
                                            File: <span style={{ color: '#ff8c42' }}>{fileName}</span>
                                            {revision && <span style={{ marginLeft: '8px', color: theme === 'dark' ? '#a0aec0' : '#718096' }}>(Rev: {revision})</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {showAddForm && (
                                <div className="col-12">{renderAddForm()}</div>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center', fontSize: '18px', color: theme === 'dark' ? '#a0aec0' : '#718096' }}>
                                <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '4px solid rgba(255, 140, 66, 0.2)', borderTopColor: '#ff8c42', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <div style={{ marginTop: '16px' }}>Loading...</div>
                            </div>
                        ) : (
                            <div
                                className={theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
                                style={{
                                    height: gridHeight, width: '100%',
                                    '--ag-header-background-color': theme === 'dark' ? '#2d3748' : '#f7fafc',
                                    '--ag-header-foreground-color': theme === 'dark' ? '#f7fafc' : '#2d3748',
                                    '--ag-odd-row-background-color': theme === 'dark' ? '#1a202c' : '#ffffff',
                                    '--ag-background-color': theme === 'dark' ? '#252b36' : '#ffffff',
                                    '--ag-foreground-color': theme === 'dark' ? '#f7fafc' : '#2d3748',
                                    '--ag-border-color': theme === 'dark' ? '#2d3748' : '#e2e8f0',
                                    '--ag-row-hover-color': theme === 'dark' ? '#2d3748' : '#f7fafc',
                                    // FIX 1: Row highlight color via CSS variable
                                    '--ag-selected-row-background-color': '#ff8c42'
                                }}
                            >
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={getCurrentRowData()}
                                    columnDefs={getCurrentColumnDefs()}
                                    defaultColDef={defaultColDef}
                                    pagination={false}
                                    suppressMovableColumns={true}
                                    animateRows={true}
                                    domLayout='normal'
                                    headerHeight={48}
                                    rowHeight={42}
                                    // FIX 1: Enable row selection + click to select
                                    rowSelection="single"
                                    suppressRowClickSelection={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                /* FIX 1: Row highlight styles */
                .ag-theme-alpine .ag-row-selected,
                .ag-theme-alpine-dark .ag-row-selected {
                    background-color: #ff8c42 !important;
                    color: #fff !important;
                }
                .ag-theme-alpine .ag-row-selected input[type="text"],
                .ag-theme-alpine-dark .ag-row-selected input[type="text"] {
                    color: #fff !important;
                }
                .ag-theme-alpine .ag-header-cell,
                .ag-theme-alpine-dark .ag-header-cell {
                    font-weight: 600;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                }
                .ag-theme-alpine .ag-cell,
                .ag-theme-alpine-dark .ag-cell {
                    font-size: 13px;
                    line-height: 1.5;
                    display: flex;
                    align-items: center;
                }
                .ag-theme-alpine .ag-row,
                .ag-theme-alpine-dark .ag-row {
                    border-bottom: 1px solid ${theme === 'dark' ? '#2d3748' : '#e2e8f0'};
                }
                .ag-theme-alpine .ag-row-hover,
                .ag-theme-alpine-dark .ag-row-hover {
                    background-color: ${theme === 'dark' ? '#2d3748' : '#f7fafc'} !important;
                }
                .ag-theme-alpine input[type="text"],
                .ag-theme-alpine-dark input[type="text"] {
                    border-radius: 4px;
                    padding: 6px 10px;
                    border: 1px solid ${theme === 'dark' ? '#4a5568' : '#cbd5e0'};
                    background-color: transparent;
                    color: inherit;
                }
                .ag-theme-alpine input[type="text"]:focus,
                .ag-theme-alpine-dark input[type="text"]:focus {
                    outline: none;
                    border-color: #4299e1;
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
                }
                .ag-theme-alpine ::-webkit-scrollbar,
                .ag-theme-alpine-dark ::-webkit-scrollbar { width: 10px; height: 10px; }
                .ag-theme-alpine ::-webkit-scrollbar-track,
                .ag-theme-alpine-dark ::-webkit-scrollbar-track { background: ${theme === 'dark' ? '#1a202c' : '#f7fafc'}; }
                .ag-theme-alpine ::-webkit-scrollbar-thumb,
                .ag-theme-alpine-dark ::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#4a5568' : '#cbd5e0'}; border-radius: 5px; }
                .ag-theme-alpine ::-webkit-scrollbar-thumb:hover,
                .ag-theme-alpine-dark ::-webkit-scrollbar-thumb:hover { background: #ff8c42; }
                @media (max-width: 768px) {
                    .ag-theme-alpine, .ag-theme-alpine-dark { font-size: 12px; }
                    .ag-theme-alpine .ag-header-cell, .ag-theme-alpine-dark .ag-header-cell { font-size: 11px; padding: 8px 4px; }
                    .ag-theme-alpine .ag-cell, .ag-theme-alpine-dark .ag-cell { font-size: 11px; padding: 6px 4px; }
                }
            `}</style>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={theme}
            />
        </div>
    );
};

export default PackingListManager;