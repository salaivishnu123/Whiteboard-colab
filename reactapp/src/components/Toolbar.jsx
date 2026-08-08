import React from "react";

const ToolButton = ({ label, active, onClick }) => (
  <button className={`tool-btn ${active ? "active" : ""}`} onClick={onClick}>
    {label}
  </button>
);

export default function Toolbar({
  tool,
  setTool,
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onRedo,
  onClear,
  onExport,
  zoom,
  setZoom,
  gridEnabled,
  setGridEnabled,
  snapEnabled,
  setSnapEnabled,
  background,
  setBackground,
  onImageUpload,
  role = "Editor"
}) {
  const isViewer = role === "Viewer";
  const isCommenter = role === "Commenter";
  const cannotEdit = isViewer || isCommenter;

  return (
    <div className="toolbar">
      {cannotEdit ? (
        <div className="toolbar-cluster" style={{ borderColor: "var(--color-danger)" }}>
          <span className="cluster-label" style={{ color: "var(--color-danger)" }}>
            {isViewer ? "🔒 READ-ONLY MODE" : "💬 COMMENT-ONLY MODE"}
          </span>
          <div className="cluster-body" style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", padding: "6px" }}>
            {isCommenter ? (
              <ToolButton label="💬 Comment (Text)" active={tool === "text"} onClick={() => setTool("text")} />
            ) : (
              <span>Drawing tools locked by owner permissions.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="toolbar-cluster">
          <span className="cluster-label">Sketch</span>
          <div className="cluster-body">
            <ToolButton label="Pen" active={tool === "pen"} onClick={() => setTool("pen")} />
            <ToolButton label="Eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
            <ToolButton label="Line" active={tool === "line"} onClick={() => setTool("line")} />
            <ToolButton label="Rect" active={tool === "rect"} onClick={() => setTool("rect")} />
            <ToolButton label="Circle" active={tool === "circle"} onClick={() => setTool("circle")} />
            <ToolButton label="Text" active={tool === "text"} onClick={() => setTool("text")} />
            <ToolButton label="Note" active={tool === "note"} onClick={() => setTool("note")} />
            <label className="upload-btn">
              Image
              <input type="file" accept="image/*" onChange={(e) => onImageUpload(e.target.files?.[0] || null)} hidden />
            </label>
          </div>
        </div>
      )}

      {!cannotEdit && (
        <div className="toolbar-cluster">
          <span className="cluster-label">Appearance</span>
          <div className="cluster-body">
            <label className="color-swatch">
              <span>Stroke</span>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
            </label>
            <label className="color-swatch">
              <span>Fill</span>
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} />
            </label>
            <label className="slider-control">
              <span>Width</span>
              <input
                type="range"
                min={1}
                max={20}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              />
            </label>
            <div className="background-select">
              <span>Surface</span>
              <select value={background} onChange={(e) => setBackground(e.target.value)}>
                <option value="white">Crisp white</option>
                <option value="soft">Soft cloud</option>
                <option value="charcoal">Night mode</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="toolbar-cluster">
        <span className="cluster-label">Canvas Controls</span>
        <div className="cluster-body">
          <label className="toggle">
            <input type="checkbox" checked={gridEnabled} onChange={(e) => setGridEnabled(e.target.checked)} /> Grid
          </label>
          <label className="toggle">
            <input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap
          </label>
          <div className="zoom-controls">
            <button onClick={() => setZoom(Math.max(0.2, Number((zoom - 0.1).toFixed(2))))}>-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(4, Number((zoom + 0.1).toFixed(2))))}>+</button>
            <button className="ghost" onClick={() => setZoom(1)}>Reset</button>
          </div>
        </div>
      </div>

      <div className="toolbar-cluster">
        <span className="cluster-label">History & Actions</span>
        <div className="cluster-body">
          {!cannotEdit && <button onClick={onUndo}>Undo</button>}
          {!cannotEdit && <button onClick={onRedo}>Redo</button>}
          {!cannotEdit && <button className="ghost" onClick={onClear}>Clear</button>}
          <button className="primary" onClick={onExport}>Export PNG</button>
        </div>
      </div>
    </div>
  );
}
