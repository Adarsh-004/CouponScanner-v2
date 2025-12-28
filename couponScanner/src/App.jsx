import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import "./App.css";

const initialFields = { code: "", amount: "" };

const extractFields = (text) => {
  const normalized = text.toUpperCase();

  const codeMatch = normalized.match(
    /(?:CODE|COUPON|PROMO|VOUCHER)[^A-Z0-9]*([A-Z0-9]{5,12})/
  );
  const fallbackCode = normalized.match(/[A-Z0-9]{6,12}/);

  // 🔴 STEP 1: Look for currency-context numbers
  const currencyRegex =
    /(?:₹|RS\.?|INR)[\s:]*([0-9]{2,5})|([0-9]{2,5})\s*(?:₹|RS\.?|INR)/gi;

  let amountCandidates = [];
  let match;

  while ((match = currencyRegex.exec(text)) !== null) {
    const value = Number(match[1] || match[2]);
    if (value >= 50 && value <= 100000) {
      amountCandidates.push(value);
    }
  }

  // 🔴 STEP 2: Fallback ONLY if currency context failed
  if (amountCandidates.length === 0) {
    const lines = text.split("\n");
    for (const line of lines) {
      if (/RS|₹|INR/i.test(line)) {
        const nums = line.match(/\b\d{2,5}\b/g)?.map(Number) || [];
        amountCandidates.push(...nums);
      }
    }
  }

  const amount =
    amountCandidates.length > 0
      ? amountCandidates[0] // first match near Rs
      : "";

  return {
    code: codeMatch?.[1] ?? fallbackCode?.[0] ?? "",
    amount: amount ? `₹${amount}` : "",
  };
};

function App() {
  const [imageUrl, setImageUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [amountCount, setAmountCount] = useState(0);
  const [view, setView] = useState("dashboard"); // dashboard, add, view-count
  const [stats, setStats] = useState([]);
  const [grand, setGrand] = useState({ totalCoupons: 0, totalAmount: 0 });

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const runOcr = async (file) => {
    setStatus("processing");
    setError("");
    setProgress(0);
    setRawText("");
    setFields(initialFields);

    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const cleaned = data.text?.trim() ?? "";
      setRawText(cleaned);
      setFields(extractFields(cleaned));
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(
        "We could not read that image. Retake the photo with better lighting or higher contrast."
      );
      setStatus("error");
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    runOcr(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (event) => event.preventDefault();

  const formatINR = (n) => new Intl.NumberFormat("en-IN").format(n || 0);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/coupons/stats`);
      const data = await response.json();

      // Calculate totalValue on frontend by multiplying amount × count
      const enrichedStats = (data.items || []).map((stat) => ({
        ...stat,
        totalValue: stat.amountValue * stat.count,
      }));

      // Calculate grand totals on frontend
      const totalCoupons = enrichedStats.reduce((sum, s) => sum + s.count, 0);
      const totalAmount = enrichedStats.reduce(
        (sum, s) => sum + s.totalValue,
        0
      );

      setStats(enrichedStats);
      setGrand({ totalCoupons, totalAmount });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const deleteCoupon = async (amount) => {
    if (!window.confirm(`Delete one coupon of ${amount}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/coupons/delete/${encodeURIComponent(amount)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        fetchStats(); // Refresh stats
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to delete coupon. Check if backend is running.");
      console.error(err);
    }
  };

  const clearAll = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to delete ALL coupons? This action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/coupons/clear-all`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        fetchStats(); // Refresh stats
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to clear coupons. Check if backend is running.");
      console.error(err);
    }
  };

  const addCoupon = async () => {
    if (!fields.code) {
      setMessage("❌ Coupon code not detected");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/coupons/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fields.code,
          amount: fields.amount,
          rawText: rawText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAmountCount(data.amountCount || 0);
        setMessage(
          `✅ Coupon added! Total for ${fields.amount}: ${data.amountCount}`
        );
        setTimeout(() => {
          setImageUrl("");
          setRawText("");
          setFields(initialFields);
          setMessage("");
        }, 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to add coupon. Check if backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = {
    idle: "Waiting for an image",
    processing: `Reading text (${progress}% )`,
    done: "Text extracted",
    error: "Could not read image",
  }[status];

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Coupon capture</p>
          <h1>Snap a coupon, extract the details</h1>
          <p className="lede">
            Use your camera or upload a photo. We run on-device OCR to pull out
            the code, expiry date, and discount so you can apply it fast.
          </p>
          <div className="badges">
            <span className="pill">Mobile-ready</span>
            <span className="pill">Works offline after load</span>
            <span className="pill">No uploads</span>
          </div>
        </div>
      </header>

      {view === "dashboard" && (
        <main className="dashboard">
          <div className="dashboard-card" onClick={() => setView("add")}>
            <div className="dashboard-icon">📷</div>
            <h2>Add New Coupon</h2>
            <p>Capture or upload a coupon image</p>
          </div>
          <div
            className="dashboard-card"
            onClick={() => {
              setView("view-count");
              fetchStats();
            }}
          >
            <div className="dashboard-icon">📊</div>
            <h2>View Count</h2>
            <p>See all coupon statistics</p>
          </div>
        </main>
      )}

      {view === "add" && (
        <>
          <button className="back-btn" onClick={() => setView("dashboard")}>
            ← Back to Dashboard
          </button>
          <main className="grid">
            <section
              className="card capture"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="card-header">
                <div>
                  <p className="label">Capture</p>
                  <h2>Take a photo or upload</h2>
                  <p className="muted">
                    Aim for clear lighting and the full coupon in frame. Drag &
                    drop also works.
                  </p>
                </div>
                <span className={`status ${status}`}>{statusLabel}</span>
              </div>

              <div className="capture-area">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Coupon preview"
                    className="preview"
                  />
                ) : (
                  <div className="placeholder">
                    <div className="placeholder-icon">📷</div>
                    <p>Use your camera or choose an existing photo.</p>
                  </div>
                )}
              </div>

              <div className="actions">
                <label className="button primary" htmlFor="file-camera">
                  Take photo (camera)
                </label>
                <input
                  id="file-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden-input"
                />
                <label className="button ghost" htmlFor="file-upload">
                  Upload from device
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-input"
                />
                {imageUrl && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => setImageUrl("")}
                  >
                    Clear photo
                  </button>
                )}
              </div>

              {status === "processing" && (
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                  <span>{progress}%</span>
                </div>
              )}

              {error && <div className="error">{error}</div>}
            </section>

            <section className="card results">
              <div className="card-header">
                <div>
                  <p className="label">Extracted data</p>
                  <h2>Coupon summary</h2>
                </div>
              </div>

              <div className="summary-grid">
                <div className="summary-tile">
                  <p className="label">Code</p>
                  <p className="value">{fields.code || "Not detected yet"}</p>
                </div>
                <div className="summary-tile">
                  <p className="label">Amount</p>
                  <p className="value">{fields.amount || "Not detected yet"}</p>
                </div>
              </div>

              <div className="raw">
                <div className="raw-header">
                  <p className="label">Raw text</p>
                  {rawText && <span className="pill subtle">OCR complete</span>}
                </div>
                <pre className="raw-box">
                  {rawText ||
                    "The extracted text will appear here after scanning."}
                </pre>
              </div>

              <div className="tips">
                <p className="label">Tips</p>
                <ul>
                  <li>Place the coupon on a flat surface and avoid shadows.</li>
                  <li>Fill the frame so the text is large and sharp.</li>
                  <li>Retake if the code or amount looks unclear.</li>
                </ul>
              </div>

              {status === "done" && fields.code && !message && (
                <button
                  className="button add-btn"
                  onClick={addCoupon}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "✓ ADD"}
                </button>
              )}

              {amountCount > 0 && (
                <div className="count-display">
                  <p>
                    Total coupons for <strong>{fields.amount}</strong>:{" "}
                    <strong>{amountCount}</strong>
                  </p>
                </div>
              )}

              {message && (
                <div
                  className={`message ${
                    message.includes("✅") ? "success" : "error"
                  }`}
                >
                  {message}
                </div>
              )}
            </section>
          </main>
        </>
      )}

      {view === "view-count" && (
        <>
          <button className="back-btn" onClick={() => setView("dashboard")}>
            ← Back to Dashboard
          </button>
          <main className="stats-container">
            <div className="card stats-card">
              <div className="card-header">
                <div>
                  <p className="label">Statistics</p>
                  <h2>Coupon Count by Amount</h2>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="button ghost" onClick={fetchStats}>
                    🔄 Refresh
                  </button>
                  {stats.length > 0 && (
                    <button
                      className="button ghost"
                      style={{ color: "#e74c3c" }}
                      onClick={clearAll}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
              </div>

              {stats.length === 0 ? (
                <div className="no-data">
                  <p>
                    No coupons added yet. Start by adding your first coupon!
                  </p>
                </div>
              ) : (
                <div className="stats-list">
                  {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                      <div className="stat-amount">
                        {stat.amount} × {stat.count}
                      </div>
                      <div className="stat-count">
                        ₹{formatINR(stat.totalValue)}
                      </div>
                      <button
                        className="button ghost delete-btn"
                        onClick={() => deleteCoupon(stat.amount)}
                        title="Delete one coupon"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <div className="stat-total">
                    <strong>
                      Overall Total: {grand.totalCoupons} coupons = ₹
                      {formatINR(grand.totalAmount)}
                    </strong>
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`message ${
                    message.includes("✅") ? "success" : "error"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
