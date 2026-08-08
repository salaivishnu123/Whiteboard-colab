import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Toolbar from "./Toolbar";
import { API_BASE } from "../services/api";
import "./../styles/whiteboard.css";

// Use dynamic API base from services

const WhiteboardCanvas = ({ whiteboardId, role = "Editor" }) => {
	const [liveAlerts, setLiveAlerts] = useState([]);

	// Simulated alerts loop
	useEffect(() => {
		const timeouts = [
			setTimeout(() => triggerAlert("Alice Jenkins joined the board"), 3000),
			setTimeout(() => triggerAlert("Bob Miller started drawing"), 7000),
			setTimeout(() => triggerAlert("Dave Wilson joined"), 12000),
			setTimeout(() => triggerAlert("Charlie Davis commented: 'This looks fantastic!'"), 18000),
			setTimeout(() => triggerAlert("Bob Miller left"), 24000)
		];
		return () => timeouts.forEach(clearTimeout);
	}, []);

	const triggerAlert = (msg) => {
		const id = Date.now();
		setLiveAlerts((prev) => [...prev, { id, msg }]);
		setTimeout(() => {
			setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
		}, 5000);
	};
	const canvasRef = useRef(null);
	const overlayRef = useRef(null); // for grid and UI overlay
	const containerRef = useRef(null);

	const [ctx, setCtx] = useState(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [tool, setTool] = useState("pen");
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [fillColor, setFillColor] = useState("#00000000");
	const [strokeWidth, setStrokeWidth] = useState(2);
	const [zoom, setZoom] = useState(1);
	const [gridEnabled, setGridEnabled] = useState(true);
	const [snapEnabled, setSnapEnabled] = useState(false);
	const [background, setBackground] = useState("white");
	const [history, setHistory] = useState([]);
	const [future, setFuture] = useState([]);

	// Helpers
	const pushHistory = () => {
		const data = canvasRef.current.toDataURL();
		setHistory((h) => [...h.slice(-25), data]); // cap history
		setFuture([]);
	};

	const restoreFromDataUrl = (dataUrl) => {
		const img = new Image();
		img.onload = () => {
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
			ctx.drawImage(img, 0, 0);
			redrawOverlay();
		};
		img.src = dataUrl;
	};

	const devicePoint = (evt) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x = (evt.clientX - rect.left) / zoom;
		const y = (evt.clientY - rect.top) / zoom;
		return { x: snapEnabled ? Math.round(x / 10) * 10 : x, y: snapEnabled ? Math.round(y / 10) * 10 : y };
	};

	// Init canvas sizes and context
	useEffect(() => {
		const canvas = canvasRef.current;
		const overlay = overlayRef.current;
		const dpr = window.devicePixelRatio || 1;
		const width = 3000 * dpr;
		const height = 2000 * dpr;
		canvas.width = width;
		canvas.height = height;
		overlay.width = width;
		overlay.height = height;
		canvas.style.width = "3000px";
		canvas.style.height = "2000px";
		overlay.style.width = "3000px";
		overlay.style.height = "2000px";
		const context = canvas.getContext("2d");
		context.lineCap = "round";
		context.lineJoin = "round";
		setCtx(context);
	}, []);

	// Load initial canvas from backend
	useEffect(() => {
		const fetchCanvas = async () => {
			try {
				const res = await axios.get(`${API_BASE}/api/whiteboards/${whiteboardId}`);
				const canvasData = res.data.canvasData;
				if (canvasData) {
					restoreFromDataUrl(canvasData);
				} else {
					redrawOverlay();
				}
			} catch (error) {
				console.error("Failed to load canvas data:", error);
			}
		};
		if (ctx) fetchCanvas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [whiteboardId, ctx]);

	// Redraw overlay (grid/highlights)
	const redrawOverlay = useCallback(() => {
		if (!overlayRef.current) return;
		const overlay = overlayRef.current.getContext("2d");
		const w = overlayRef.current.width;
		const h = overlayRef.current.height;
		overlay.clearRect(0, 0, w, h);

		if (gridEnabled) {
			overlay.strokeStyle = background === "charcoal" ? "rgba(148, 163, 184, 0.28)" : "rgba(148, 163, 184, 0.45)";
			overlay.lineWidth = 1;
			const step = 20 * (window.devicePixelRatio || 1);
			overlay.beginPath();
			for (let x = 0; x < w; x += step) {
				overlay.moveTo(x + 0.5, 0);
				overlay.lineTo(x + 0.5, h);
			}
			for (let y = 0; y < h; y += step) {
				overlay.moveTo(0, y + 0.5);
				overlay.lineTo(w, y + 0.5);
			}
			overlay.stroke();
		}
	}, [gridEnabled, background]);

	useEffect(() => {
		redrawOverlay();
	}, [redrawOverlay]);

	const stageStyles = useMemo(() => {
		switch (background) {
			case "soft":
				return { backgroundColor: "#f8fafc" };
			case "charcoal":
				return { backgroundColor: "#0f172a" };
			case "transparent":
				return {
					backgroundImage:
						"linear-gradient(45deg, rgba(148, 163, 184, 0.15) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.15) 75%)," +
						"linear-gradient(45deg, rgba(148, 163, 184, 0.15) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.15) 75%)",
					backgroundSize: "32px 32px",
					backgroundPosition: "0 0, 16px 16px",
				};
			default:
				return { backgroundColor: "#ffffff" };
		}
	}, [background]);

	// Save canvas to backend
	const saveCanvas = async () => {
		try {
			const dataUrl = canvasRef.current.toDataURL("image/png");
			await axios.put(`${API_BASE}/api/whiteboards/${whiteboardId}/canvas`, { canvasData: dataUrl });
		} catch (error) {
			console.error("Failed to save canvas:", error);
		}
	};

	const start = (e) => {
		if (!ctx) return;
		if (role === "Viewer" || role === "Commenter") {
			if (role === "Commenter" && tool === "text") {
				// Commenters are only allowed to add comments via Text tool
			} else {
				alert("🔒 Draw permission denied: You have Viewer/Commenter access.");
				return;
			}
		}
		setIsDrawing(true);
		pushHistory();
		const { x, y } = devicePoint(e.nativeEvent);
		ctx.beginPath();
		ctx.strokeStyle = tool === "eraser" ? "#ffffff" : strokeColor;
		ctx.lineWidth = strokeWidth;
		if (tool === "pen" || tool === "eraser") {
			ctx.moveTo(x, y);
		} else if (tool === "text") {
			const text = prompt("Enter text");
			if (text) {
				ctx.font = `${Math.max(12, strokeWidth * 6)}px Arial`;
				ctx.fillStyle = strokeColor;
				ctx.fillText(text, x, y);
				setIsDrawing(false);
				redrawOverlay();
				saveCanvas();
			}
		} else if (tool === "note") {
			ctx.fillStyle = "#fff8c5";
			ctx.strokeStyle = "#f59e0b";
			ctx.lineWidth = 2;
			ctx.fillRect(x, y, 150, 100);
			ctx.strokeRect(x, y, 150, 100);
			setIsDrawing(false);
			redrawOverlay();
			saveCanvas();
		} else {
			// shape start point
			ctx._start = { x, y };
			ctx._snapshot = canvasRef.current.toDataURL();
		}
	};

	const move = (e) => {
		if (!isDrawing || !ctx) return;
		if (role === "Viewer" || role === "Commenter") return;
		const { x, y } = devicePoint(e.nativeEvent);

		if (tool === "pen" || tool === "eraser") {
			ctx.lineTo(x, y);
			ctx.stroke();
		} else if (["line", "rect", "circle"].includes(tool)) {
			const img = new Image();
			img.onload = () => {
				ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
				ctx.drawImage(img, 0, 0);
				ctx.strokeStyle = strokeColor;
				ctx.lineWidth = strokeWidth;
				const sx = ctx._start.x;
				const sy = ctx._start.y;
				if (tool === "line") {
					ctx.beginPath();
					ctx.moveTo(sx, sy);
					ctx.lineTo(x, y);
					ctx.stroke();
				} else if (tool === "rect") {
					const w = x - sx;
					const h = y - sy;
					if (fillColor && fillColor !== "#00000000") {
						ctx.fillStyle = fillColor;
						ctx.fillRect(sx, sy, w, h);
					}
					ctx.strokeRect(sx, sy, w, h);
				} else if (tool === "circle") {
					const rx = x - sx;
					const ry = y - sy;
					const r = Math.sqrt(rx * rx + ry * ry);
					ctx.beginPath();
					ctx.arc(sx, sy, r, 0, Math.PI * 2);
								if (fillColor && fillColor !== "#00000000") {
									ctx.fillStyle = fillColor;
									ctx.fill();
								}
					ctx.stroke();
				}
			};
			img.src = ctx._snapshot;
		}
	};

	const end = () => {
		if (!isDrawing) return;
		setIsDrawing(false);
		redrawOverlay();
		saveCanvas();
	};

	// Controls
	const onUndo = () => {
		if (!history.length) return;
		const last = history[history.length - 1];
		setHistory((h) => h.slice(0, -1));
		setFuture((f) => [canvasRef.current.toDataURL(), ...f]);
		restoreFromDataUrl(last);
		saveCanvas();
	};

	const onRedo = () => {
		if (!future.length) return;
		const next = future[0];
		setFuture((f) => f.slice(1));
		setHistory((h) => [...h, canvasRef.current.toDataURL()]);
		restoreFromDataUrl(next);
		saveCanvas();
	};

	const onClear = () => {
		pushHistory();
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		redrawOverlay();
		saveCanvas();
	};

	const onExport = async () => {
		try {
			const blob = await axios.post(`${API_BASE}/api/whiteboards/${whiteboardId}/export`, null, { responseType: "blob" }).then(r => r.data);
			const url = window.URL.createObjectURL(new Blob([blob]));
			const a = document.createElement("a");
			a.href = url;
			a.download = `whiteboard-${whiteboardId}.png`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			console.error("Export failed", e);
		}
	};

	const onImageUpload = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				pushHistory();
				ctx.drawImage(img, 50, 50, img.width, img.height);
				redrawOverlay();
				saveCanvas();
			};
			img.src = reader.result;
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="whiteboard-wrapper" ref={containerRef}>
			<Toolbar
				tool={tool}
				setTool={setTool}
				strokeColor={strokeColor}
				setStrokeColor={setStrokeColor}
				fillColor={fillColor}
				setFillColor={setFillColor}
				strokeWidth={strokeWidth}
				setStrokeWidth={setStrokeWidth}
				onUndo={onUndo}
				onRedo={onRedo}
				onClear={onClear}
				onExport={onExport}
				zoom={zoom}
				setZoom={setZoom}
				gridEnabled={gridEnabled}
				setGridEnabled={setGridEnabled}
				snapEnabled={snapEnabled}
				setSnapEnabled={setSnapEnabled}
				background={background}
				setBackground={setBackground}
				onImageUpload={onImageUpload}
				role={role}
			/>
			<div className="canvas-viewport" style={{ position: "relative" }}>

				{/* Joint Alert Notifications */}
				<div style={{
					position: "absolute",
					bottom: "20px",
					right: "20px",
					zIndex: 1000,
					display: "flex",
					flexDirection: "column",
					gap: "8px"
				}}>
					{liveAlerts.map((a) => (
						<div key={a.id} style={{
							background: "var(--bg-secondary)",
							border: "1px solid var(--glass-border-hover)",
							color: "white",
							padding: "8px 16px",
							borderRadius: "8px",
							fontSize: "0.8rem",
							fontWeight: "500",
							boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
							animation: "fadeIn 0.3s ease"
						}}>
							{a.msg}
						</div>
					))}
				</div>

				<div
					className="canvas-stage"
					style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", ...stageStyles }}
				>
					<canvas
						ref={overlayRef}
						className="whiteboard-overlay"
						aria-hidden
					/>
					<canvas
						ref={canvasRef}
						className="whiteboard-canvas"
						onMouseDown={start}
						onMouseMove={move}
						onMouseUp={end}
						onMouseLeave={end}
					/>
				</div>
			</div>
		</div>
	);
};

export default WhiteboardCanvas;