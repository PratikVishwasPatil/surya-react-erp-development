import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from "ag-grid-react";
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
import { Container, Button, Row, Col, Card, ButtonGroup, Form } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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

const PackingListGrid = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('light');
    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [financialYears, setFinancialYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('all');
    const [currentFinancialYear, setCurrentFinancialYear] = useState('');
    const gridRef = useRef();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const generateColumnDefs = () => {
        return [
            {
                headerName: "Sr No",
                field: "serialNumber",
                valueGetter: (params) => params.node ? params.node.rowIndex + 1 : '',
                width: isMobile ? 60 : 80,
                minWidth: 50,
                pinned: 'left',
                lockPosition: true,
                cellStyle: { fontWeight: 'bold', textAlign: 'center' }
            },
            {
                field: "file",
                headerName: "File Name",
                width: isMobile ? 180 : 250,
                pinned: 'left',
                checkboxSelection: true,       // ✅ checkbox here
                headerCheckboxSelection: true,
                cellStyle: { fontWeight: 'bold' },
            },
            {
                field: "cname",
                headerName: "Customer Name",
                width: isMobile ? 200 : 300,
                filter: 'agTextColumnFilter',
            },
            {
                field: "ptype",
                headerName: "Product Type",
                width: isMobile ? 150 : 180,
                filter: 'agTextColumnFilter',
            },
            {
                field: "ftype",
                headerName: "File Type",
                width: isMobile ? 120 : 150,
                filter: 'agTextColumnFilter',
            },
            { field: "fileid",   headerName: "File ID",    hide: true, width: 0 },
            { field: "projectid", headerName: "Project ID", hide: true, width: 0 }
        ];
    };

    const defaultColDef = useMemo(() => ({
        filter: true,
        sortable: true,
        floatingFilter: !isMobile,
        resizable: true,
        suppressMenu: isMobile,
        cellStyle: { textAlign: 'left' }
    }), [isMobile]);

    // const fetchFinancialYears = async () => {
    //     try {
    //         const response = await fetch(
    //             "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/GetYearsApi.php",
    //             { method: "GET", headers: { "Content-Type": "application/json" } }
    //         );
    //         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    //         const data = await response.json();

    //         if (data.status === "success" && Array.isArray(data.data)) {
    //             const sortedYears = data.data.sort((a, b) =>
    //                 parseInt(a.sequence_no) - parseInt(b.sequence_no)
    //             );
    //             setFinancialYears(sortedYears);
    //             if (sortedYears.length > 0) {
    //                 const latestYear = sortedYears[sortedYears.length - 1];
    //                 setCurrentFinancialYear(latestYear.financial_year);
    //             }
    //         }
    //     } catch (error) {
    //         console.error("Error fetching financial years:", error);
    //         toast.error(`Error fetching financial years: ${error.message}`);
    //     }
    // };

    const fetchFinancialYears = async () => {
    try {
        const response = await fetch(
            "https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/GetYearsApi.php",
            { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.status === "success" && Array.isArray(data.data)) {
            // ✅ Sort descending — latest year first
            const sortedYears = data.data.sort((a, b) =>
                b.financial_year.localeCompare(a.financial_year)
            );
            setFinancialYears(sortedYears);

            // ✅ Auto-select the first (latest) year and fetch its data
            if (sortedYears.length > 0) {
                const latestYear = sortedYears[0].financial_year;
                setCurrentFinancialYear(latestYear);
                setSelectedYear(latestYear);         // set dropdown to latest
                fetchPackingListData(latestYear);    // fetch for latest year
            }
        }
    } catch (error) {
        console.error("Error fetching financial years:", error);
        toast.error(`Error fetching financial years: ${error.message}`);
    }
};
    const fetchPackingListData = async (year = 'all') => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://www.erp.suryaequipments.com/Surya_React/surya_dynamic_api/SwapExcelListApi.php?financial_year=${year}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.status === "success" && Array.isArray(data.data)) {
                setRowData(data.data);
                toast.success(`Loaded ${data.count} records for ${data.financial_year === 'all' ? 'all years' : `FY ${data.financial_year}`}`);
            } else if (Array.isArray(data)) {
                setRowData(data);
                toast.success(`Loaded ${data.length} records`);
            } else {
                throw new Error("No data received");
            }
        } catch (error) {
            console.error("Error fetching packing list data:", error);
            toast.error(`Error fetching data: ${error.message}`);
            setRowData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setColumnDefs(generateColumnDefs());
        fetchFinancialYears();
        fetchPackingListData(selectedYear);
    }, [isMobile]);

    const handleYearChange = (e) => {
        const year = e.target.value;
        setSelectedYear(year);
        fetchPackingListData(year);
    };

    // ✅ Navigate directly on checkbox selection — no button needed
    const onSelectionChanged = (event) => {
        const selectedNodes = event.api.getSelectedNodes();
        const selectedData = selectedNodes.map(node => node.data);
        setSelectedRows(selectedData);

        if (selectedData.length === 1) {
            const selectedRecord = selectedData[0];
            if (!selectedRecord.fileid) {
                toast.error('File ID not found in selected record');
                return;
            }
            navigate(`/excel-list/details/${selectedRecord.fileid}/${selectedRecord.file}`, {
                state: {
                    fileName: selectedRecord.file,
                    customerName: selectedRecord.cname,
                    projectId: selectedRecord.projectid
                }
            });
        }
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    const downloadExcel = () => {
        if (!gridRef.current?.api) return;
        try {
            gridRef.current.api.exportDataAsCsv({
                fileName: `PackingList_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`,
                allColumns: true,
                onlySelected: false
            });
            toast.success('Data exported successfully!');
        } catch (error) {
            toast.error('Error exporting data');
        }
    };

    const autoSizeAll = () => {
        if (!gridRef.current?.api) return;
        setTimeout(() => {
            const allColumnIds = gridRef.current.api.getColumns()?.map(col => col.getId()) || [];
            if (allColumnIds.length > 0) gridRef.current.api.autoSizeColumns(allColumnIds, false);
        }, 100);
    };

    const handleRefresh = () => {
        fetchPackingListData(selectedYear);
        toast.info('Refreshing data...');
    };

    const getThemeStyles = () => {
        if (theme === 'dark') return {
            backgroundColor: 'linear-gradient(135deg, #21262d 0%, #161b22 100%)',
            color: '#f8f9fa', cardBg: '#343a40',
            cardHeader: 'linear-gradient(135deg, #495057 0%, #343a40 100%)'
        };
        return {
            backgroundColor: 'linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%)',
            color: '#212529', cardBg: '#ffffff',
            cardHeader: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)'
        };
    };

    const themeStyles = getThemeStyles();
    const gridHeight = isFullScreen ? 'calc(100vh - 200px)' : (isMobile ? '400px' : '600px');

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

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: themeStyles.backgroundColor }}>
                <div style={{ textAlign: 'center', color: themeStyles.color }}>
                    <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading packing list data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: themeStyles.backgroundColor, color: themeStyles.color, padding: 0, margin: 0 }}>
            <Container fluid={isFullScreen}>
                <Card style={{
                    backgroundColor: themeStyles.cardBg,
                    color: themeStyles.color,
                    border: theme === 'dark' ? '1px solid #495057' : '1px solid #dee2e6',
                    margin: isFullScreen ? 0 : 20,
                    borderRadius: isFullScreen ? 0 : 8
                }}>
                    {/* ✅ Header — FY dropdown moved into top-right button area */}
                    <Card.Header style={{
                        background: themeStyles.cardHeader,
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        fontFamily: "'Maven Pro', sans-serif",
                        padding: '1rem 2rem'
                    }}>
                        <Row className="align-items-center">
                            <Col xs={12} lg={5} className="mb-2 mb-lg-0">
                                <h4 className="mb-0">
                                    <i className="bi bi-box-seam me-2"></i>
                                    Swap Excel List
                                </h4>
                                <small style={{ opacity: 0.8 }}>
                                    {`${rowData.length} records found`}
                                    {selectedRows.length > 0 && ` | ${selectedRows.length} selected`}
                                </small>
                            </Col>

                            <Col xs={12} lg={7}>
                                <div className="d-flex justify-content-end gap-2 flex-wrap align-items-center">

                                    {/* ✅ Financial Year Dropdown — top right, matching doc 2 style */}
                                    <div className="d-flex align-items-center gap-1">
                                        <Form.Label className="mb-0 small">
                                            <i className="bi bi-calendar3 me-1"></i>FY:
                                        </Form.Label>
                                        <Form.Select
                                            value={selectedYear}
                                            onChange={handleYearChange}
                                            size="sm"
                                            style={{
                                                minWidth: '130px',
                                                backgroundColor: theme === 'dark' ? '#495057' : '#ffffff',
                                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                                borderColor: theme === 'dark' ? '#6c757d' : '#ced4da'
                                            }}
                                        >
                                            {/* <option value="all">All Years</option> */}
                                            {financialYears.map((yearObj) => (
                                                <option key={yearObj.id} value={yearObj.financial_year}>
                                                    FY {yearObj.financial_year}
                                                    {yearObj.financial_year === currentFinancialYear && ' (Current)'}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </div>

                                    <Button variant="outline-primary" size="sm" onClick={handleRefresh} title="Refresh data">
                                        <i className="bi bi-arrow-clockwise"></i>
                                        {!isMobile && ' Refresh'}
                                    </Button>

                                    <ButtonGroup size="sm">
                                        <Button variant="success" onClick={downloadExcel}>
                                            <i className="bi bi-file-earmark-excel"></i>
                                            {!isMobile && ' Export CSV'}
                                        </Button>
                                        <Button variant="info" onClick={autoSizeAll}>
                                            <i className="bi bi-arrows-angle-expand"></i>
                                            {!isMobile && ' Auto Size'}
                                        </Button>
                                    </ButtonGroup>

                                    <ButtonGroup size="sm">
                                        <Button variant="outline-light" onClick={toggleFullScreen}>
                                            <i className={`bi ${isFullScreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`}></i>
                                            {!isMobile && (isFullScreen ? ' Exit' : ' Full')}
                                        </Button>
                                        <Button variant="outline-light" onClick={toggleTheme}>
                                            {theme === 'light' ? '🌙' : '☀️'}
                                            {!isMobile && (theme === 'light' ? ' Dark' : ' Light')}
                                        </Button>
                                    </ButtonGroup>
                                </div>
                            </Col>
                        </Row>
                    </Card.Header>

                    {/* Grid Body */}
                    <Card.Body style={{ backgroundColor: themeStyles.cardBg, padding: isFullScreen ? 0 : 15 }}>
                        {rowData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: themeStyles.color }}>
                                <i className="bi bi-box-seam" style={{ fontSize: '3rem', marginBottom: '20px' }}></i>
                                <h5>No packing list data available</h5>
                                <p>No records found for the selected financial year.</p>
                                <Button variant="primary" onClick={handleRefresh}>
                                    <i className="bi bi-arrow-clockwise me-2"></i>Refresh Data
                                </Button>
                            </div>
                        ) : (
                            <div
                                className="ag-theme-alpine"
                                style={{
                                    height: gridHeight,
                                    width: "100%",
                                    ...(theme === 'dark' && {
                                        '--ag-background-color': '#212529',
                                        '--ag-header-background-color': '#343a40',
                                        '--ag-odd-row-background-color': '#2c3034',
                                        '--ag-even-row-background-color': '#212529',
                                        '--ag-row-hover-color': '#495057',
                                        '--ag-foreground-color': '#f8f9fa',
                                        '--ag-header-foreground-color': '#f8f9fa',
                                        '--ag-border-color': '#495057',
                                        '--ag-selected-row-background-color': '#28a745',
                                        '--ag-input-background-color': '#343a40',
                                        '--ag-input-border-color': '#495057'
                                    })
                                }}
                            >
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={rowData}
                                    columnDefs={columnDefs}
                                    defaultColDef={defaultColDef}
                                    pagination={true}
                                    paginationPageSize={isMobile ? 10 : 25}
                                    rowSelection="single"
                                    suppressRowClickSelection={true}  
                                    onSelectionChanged={onSelectionChanged}
                                    suppressMovableColumns={isMobile}
                                    animateRows={!isMobile}
                                    enableCellTextSelection={true}
                                    suppressHorizontalScroll={false}
                                    headerHeight={isMobile ? 40 : 48}
                                    rowHeight={isMobile ? 35 : 42}
                                    onGridReady={() => setTimeout(() => autoSizeAll(), 500)}
                                />
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

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

export default PackingListGrid;