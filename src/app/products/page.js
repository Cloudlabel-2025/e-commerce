"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptyComp = () => ({ competitorProductName: "", competitorPrice: "", brandName: "", platform: "" });

function getInsight(sellingPrice, comparisons) {
  if (!comparisons.length) return null;
  const prices = comparisons.map((c) => c.competitorPrice);
  const minComp = Math.min(...prices);
  const maxComp = Math.max(...prices);
  const avgComp = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diff = sellingPrice - avgComp;

  if (diff > 0) return { type: "warn", text: `You're ₹${diff.toFixed(0)} above the avg competitor price (₹${avgComp.toFixed(0)}). Consider adjusting.` };
  if (diff < 0) return { type: "good", text: `You're ₹${Math.abs(diff).toFixed(0)} below avg competitor price. Great competitive edge!` };
  return { type: "same", text: `Your price matches the avg competitor price of ₹${avgComp.toFixed(0)}.` };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [newComps, setNewComps] = useState({});
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const startAdding = (id) => {
    setAddingId(id);
    setNewComps((prev) => ({ ...prev, [id]: prev[id] || [emptyComp()] }));
  };

  const handleCompChange = (productId, index, e) => {
    const updated = [...(newComps[productId] || [])];
    updated[index][e.target.name] = e.target.value;
    setNewComps((prev) => ({ ...prev, [productId]: updated }));
  };

  const addRow = (productId) => {
    setNewComps((prev) => ({ ...prev, [productId]: [...(prev[productId] || []), emptyComp()] }));
  };

  const removeRow = (productId, index) => {
    setNewComps((prev) => ({ ...prev, [productId]: (prev[productId] || []).filter((_, i) => i !== index) }));
  };

  const saveComparisons = async (product) => {
    if (saving) return;
    setSaving(product._id);
    const merged = [
      ...product.comparisons,
      ...(newComps[product._id] || [])
        .map((c) => ({ ...c, competitorPrice: Number(c.competitorPrice) }))
        .filter((c) => c.competitorProductName && c.competitorPrice),
    ];
    const res = await fetch(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comparisons: merged }),
    });
    if (res.ok) {
      await fetchProducts();
      setAddingId(null);
      showToast("Comparisons saved!");
    } else {
      const d = await res.json();
      alert(d.message);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--primary)", width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div className="app-header">
        <h1>📋 My Products</h1>
        <button
          className="m-btn m-btn-primary"
          style={{ width: "auto", padding: "8px 16px", fontSize: 14 }}
          onClick={() => router.push("/")}
        >
          + Add
        </button>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No products yet</p>
            <p style={{ fontSize: 13 }}>Add your first product to start comparing prices</p>
            <button className="m-btn m-btn-primary" style={{ marginTop: 20, maxWidth: 200 }} onClick={() => router.push("/")}>
              + Add Product
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              {products.length} product{products.length > 1 ? "s" : ""} tracked
            </p>

            {products.map((product) => {
              const insight = getInsight(product.sellingPrice, product.comparisons);
              const margin = Number(product.profitMargin);
              const marginClass = margin >= 20 ? "good" : margin >= 10 ? "warn" : "bad";
              const isExpanded = expandedId === product._id;
              const isAdding = addingId === product._id;

              return (
                <div className="product-item" key={product._id}>
                  {/* Product Header */}
                  <div className="product-item-header" onClick={() => toggleExpand(product._id)} style={{ cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {product.productName}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {product.Quantity}g · {product.comparisons.length} competitor{product.comparisons.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 18 }}>₹{product.sellingPrice}</p>
                      <span className={`margin-pill ${marginClass}`} style={{ fontSize: 11 }}>{margin.toFixed(1)}%</span>
                    </div>
                    <div style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 18 }}>
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="product-item-body">
                      {/* Stats */}
                      <div className="stat-row" style={{ marginBottom: 14 }}>
                        <div className="stat-chip">
                          <div className="val">₹{product.costPrice}</div>
                          <div className="lbl">Cost</div>
                        </div>
                        <div className="stat-chip">
                          <div className="val">₹{product.sellingPrice}</div>
                          <div className="lbl">Selling</div>
                        </div>
                        <div className="stat-chip">
                          <div className={`val ${marginClass === "good" ? "text-success" : marginClass === "bad" ? "text-danger" : ""}`} style={{ color: marginClass === "good" ? "var(--success)" : marginClass === "bad" ? "var(--danger)" : "var(--warning)" }}>
                            {margin.toFixed(1)}%
                          </div>
                          <div className="lbl">Margin</div>
                        </div>
                      </div>

                      {/* Insight */}
                      {insight && (
                        <div className={`insight-banner ${insight.type === "same" ? "warn" : insight.type}`}>
                          {insight.text}
                        </div>
                      )}

                      {/* Competitor list */}
                      {product.comparisons.length > 0 && (
                        <>
                          <p className="section-label">Competitors</p>
                          {product.comparisons.map((c, i) => {
                            const diff = product.sellingPrice - c.competitorPrice;
                            return (
                              <div className="comp-card" key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="comp-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.competitorProductName}</p>
                                    <p className="comp-meta">
                                      {[c.brandName, c.platform].filter(Boolean).join(" · ") || "—"}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                                    <p className="comp-price">₹{c.competitorPrice}</p>
                                    <span className={`diff-badge ${diff > 0 ? "expensive" : diff < 0 ? "cheaper" : "same"}`}>
                                      {diff > 0 ? `+₹${diff} you` : diff < 0 ? `-₹${Math.abs(diff)} you` : "Same"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Add comparisons */}
                      {!isAdding ? (
                        <button className="m-btn m-btn-outline" style={{ marginTop: 10 }} onClick={() => startAdding(product._id)}>
                          + Add Competitor
                        </button>
                      ) : (
                        <div style={{ marginTop: 14 }}>
                          <p className="section-label">New Competitors</p>
                          {(newComps[product._id] || []).map((row, idx) => (
                            <div className="m-card-flat" key={idx}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>#{idx + 1}</span>
                                {(newComps[product._id] || []).length > 1 && (
                                  <button className="m-btn-danger-ghost" onClick={() => removeRow(product._id, idx)}>Remove</button>
                                )}
                              </div>
                              <div className="m-field">
                                <label className="m-label">Product Name</label>
                                <input className="m-input" name="competitorProductName" placeholder="Competitor product name" value={row.competitorProductName} onChange={(e) => handleCompChange(product._id, idx, e)} />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                <div>
                                  <label className="m-label">Price ₹</label>
                                  <input className="m-input" name="competitorPrice" type="number" inputMode="decimal" placeholder="0" value={row.competitorPrice} onChange={(e) => handleCompChange(product._id, idx, e)} />
                                </div>
                                <div>
                                  <label className="m-label">Brand</label>
                                  <input className="m-input" name="brandName" placeholder="Brand" value={row.brandName} onChange={(e) => handleCompChange(product._id, idx, e)} />
                                </div>
                              </div>
                              <div>
                                <label className="m-label">Platform</label>
                                <input className="m-input" name="platform" placeholder="Amazon / Flipkart / Blinkit" value={row.platform} onChange={(e) => handleCompChange(product._id, idx, e)} />
                              </div>
                            </div>
                          ))}
                          <button className="m-btn m-btn-outline" style={{ marginBottom: 10 }} onClick={() => addRow(product._id)}>
                            + Add Row
                          </button>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <button className="m-btn m-btn-outline" onClick={() => setAddingId(null)}>Cancel</button>
                            <button className="m-btn m-btn-success" disabled={saving === product._id} onClick={() => saveComparisons(product)}>
                              {saving === product._id ? <><span className="spinner" /> Saving</> : "Save"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {toast && <div className="toast-success">{toast}</div>}
    </div>
  );
}
