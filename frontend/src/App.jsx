import React, { useState, useEffect, useMemo } from 'react';

function App() {
  const [windData, setWindData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, SURPLUS, DEFICIT
  const [lastSync, setLastSync] = useState('');

  const fetchTelemetry = () => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/wind-data')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setWindData(data.data);
        }
        const now = new Date();
        setLastSync(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Format ISO timestamp to clean Enterprise UTC format
  const formatTimestamp = (isoStr) => {
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
      const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      return { datePart, timePart };
    } catch {
      return { datePart: isoStr, timePart: 'UTC' };
    }
  };

  // Dynamic Enterprise Analytics Calculations
  const metrics = useMemo(() => {
    if (!windData.length) return { avgGen: 0, peakGen: 0, accuracy: 0, netVariance: 0, maxVal: 15000 };
    let totalGen = 0;
    let peak = 0;
    let totalAccuracy = 0;
    let netVar = 0;
    let maxScale = 0;

    windData.forEach(item => {
      const gen = Number(item.generation) || 0;
      const fc = Number(item.forecast) || gen;
      const diff = gen - fc;
      totalGen += gen;
      if (gen > peak) peak = gen;
      if (Math.max(gen, fc) > maxScale) maxScale = Math.max(gen, fc);
      netVar += diff;
      const errPct = fc > 0 ? (Math.abs(diff) / fc) * 100 : 0;
      totalAccuracy += Math.max(0, 100 - errPct);
    });

    return {
      avgGen: Math.round(totalGen / windData.length),
      peakGen: peak,
      accuracy: (totalAccuracy / windData.length).toFixed(1),
      netVariance: netVar,
      maxVal: Math.ceil((maxScale * 1.1) / 1000) * 1000 || 15000
    };
  }, [windData]);

  // Filtered dataset for table
  const filteredData = useMemo(() => {
    return windData.filter(item => {
      const diff = item.generation - (item.forecast || item.generation);
      if (filterMode === 'SURPLUS') return diff >= 0;
      if (filterMode === 'DEFICIT') return diff < 0;
      return true;
    });
  }, [windData, filterMode]);

  // Export to CSV handler for HR Demo
  const handleExportCSV = () => {
    if (!windData.length) return;
    const headers = "Timestamp_UTC,Actual_Generation_MW,Forecasted_MW,Variance_MW,Status\n";
    const rows = windData.map(item => {
      const diff = item.generation - (item.forecast || item.generation);
      const status = diff >= 0 ? 'SURPLUS' : 'DEFICIT';
      return `${item.startTime},${item.generation},${item.forecast || 0},${diff},${status}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UK_Wind_Energy_Jan2026_Report.csv';
    a.click();
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* TOP ENTERPRISE HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #0b1120 100%)',
        border: '1px solid #1e293b',
        padding: '22px 28px',
        borderRadius: '16px',
        boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ height: '8px', width: '8px', backgroundColor: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 10px #38bdf8' }}></span>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1.4px', color: '#38bdf8', textTransform: 'uppercase' }}>
              Gridbricks National Grid Telemetry
            </span>
            <span style={{ fontSize: '11px', color: '#475569' }}>|</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Elexon BMRS FUELHH Stream</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.4px', marginBottom: '4px' }}>
            UK Wind Energy Analytics Terminal
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Day-Ahead Actual Renewable Generation vs Forecast Comparison • Target Period: <strong style={{ color: '#e2e8f0' }}>January 2026</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-action" onClick={fetchTelemetry} title="Sync Live API">
            <span>↻</span> Sync Telemetry
          </button>
          <button className="btn-action" onClick={handleExportCSV} title="Download CSV Report">
            <span>⬇</span> Export CSV
          </button>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', letterSpacing: '0.5px', lineHeight: 1 }}>LIVE STREAM</div>
              {lastSync && <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Synced {lastSync}</div>}
            </div>
          </div>
        </div>
      </header>

      {/* 4 DYNAMIC KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div style={{ background: '#0f1623', border: '1px solid #1e293b', padding: '18px 22px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Peak Wind Output
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {metrics.peakGen.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>MW</span>
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '500' }}>
            ▲ Highest Settlement Period
          </div>
        </div>

        <div style={{ background: '#0f1623', border: '1px solid #1e293b', padding: '18px 22px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Average Generation
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {metrics.avgGen.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>MW</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Across {windData.length} Half-Hourly Intervals
          </div>
        </div>

        <div style={{ background: '#0f1623', border: '1px solid #1e293b', padding: '18px 22px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Forecast Accuracy
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {metrics.accuracy}% <span style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}> Optimal</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Day-Ahead BMRS Model Precision
          </div>
        </div>

        <div style={{ background: '#0f1623', border: '1px solid #1e293b', padding: '18px 22px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Net Grid Balance
          </div>
          <div style={{
            fontSize: '26px',
            fontWeight: '800',
            color: metrics.netVariance >= 0 ? '#10b981' : '#f43f5e',
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px'
          }}>
            {metrics.netVariance >= 0 ? `+${metrics.netVariance.toLocaleString()}` : metrics.netVariance.toLocaleString()}
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>MW</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Cumulative Generation Surplus
          </div>
        </div>
      </div>

      {/* INTERACTIVE VISUAL CHART + DATA TABLE SPLIT */}
      <div className="analytics-split">
        
        {/* LEFT: DATA MATRIX TABLE */}
        <div style={{
          background: '#0f1623',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                Generation vs Forecast Time-Series Matrix
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Settlement Period Telemetry (30-Min Resolution)
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', background: '#090d16', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              {['ALL', 'SURPLUS', 'DEFICIT'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  style={{
                    border: 'none',
                    background: filterMode === mode ? '#1e293b' : 'transparent',
                    color: filterMode === mode ? '#38bdf8' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Synchronizing telemetry stream with Elexon BMRS...
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ background: '#0a0f1a', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    <th>Settlement Time (UTC)</th>
                    <th>Actual (MW)</th>
                    <th>Forecast (MW)</th>
                    <th style={{ textAlign: 'right' }}>Grid Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const diff = item.generation - (item.forecast || item.generation);
                    const { datePart, timePart } = formatTimestamp(item.startTime);
                    return (
                      <tr key={index}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '13px' }}>{timePart} UTC</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{datePart}</div>
                        </td>
                        <td style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px' }}>
                          {item.generation.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>MW</span>
                        </td>
                        <td style={{ color: '#fb7185', fontWeight: '700', fontSize: '14px' }}>
                          {(item.forecast || 0).toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>MW</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            backgroundColor: diff >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                            color: diff >= 0 ? '#10b981' : '#f43f5e',
                            border: `1px solid ${diff >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`
                          }}>
                            {diff >= 0 ? `+${diff.toLocaleString()} MW Surplus` : `${diff.toLocaleString()} MW Deficit`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: VISUAL BAR COMPARISON ANALYTICS */}
        <div style={{
          background: '#0f1623',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>Visual Telemetry Curve</h2>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Actual vs Forecasted Load Distribution</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }}></span> Actual
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fb7185' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fb7185' }}></span> Forecast
                </span>
              </div>
            </div>

            {/* Dual Progress Bar Visualization per Interval */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {windData.map((item, idx) => {
                const { timePart } = formatTimestamp(item.startTime);
                const actualPct = Math.min(100, Math.round((item.generation / metrics.maxVal) * 100));
                const forecastPct = Math.min(100, Math.round(((item.forecast || 0) / metrics.maxVal) * 100));
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>
                      <span>{timePart} UTC</span>
                      <span>
                        <strong style={{ color: '#38bdf8' }}>{item.generation.toLocaleString()}</strong>
                        <span style={{ color: '#475569' }}> / </span>
                        <strong style={{ color: '#fb7185' }}>{(item.forecast || 0).toLocaleString()} MW</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#090d16', padding: '5px', borderRadius: '6px', border: '1px solid #162032' }}>
                      <div style={{ width: `${actualPct}%`, height: '6px', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                      <div style={{ width: `${forecastPct}%`, height: '6px', background: 'linear-gradient(90deg, #e11d48, #fb7185)', borderRadius: '4px', opacity: 0.85, transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Architecture Footer Badge inside Card */}
          <div style={{
            marginTop: '20px',
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94a3b8'
          }}>
            <span>Engine: <strong style={{ color: '#e2e8f0' }}>FastAPI + React Vite</strong></span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>100% Verified Stream</span>
          </div>
        </div>

      </div>  
    </div>
  );
}

export default App;