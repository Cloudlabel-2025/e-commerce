"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const emptyComp = () => ({ competitorProductName: "", competitorPrice: "", quantity: "", brandName: "", platform: "", productLink: "" });
const emptyForm = () => ({ productName: "", Quantity: "", costPrice: "", sellingPrice: "", profitMargin: "", profit: "" });

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [comparisons, setComparisons] = useState([emptyComp()]);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    const cost = Number(updated.costPrice);
    const sell = Number(updated.sellingPrice);
    if (cost > 0 && sell > 0) {
      updated.profitMargin = (((sell - cost) / cost) * 100).toFixed(2);
      updated.profit = (sell - cost).toFixed(2);
    } else {
      updated.profitMargin = "";
      updated.profit = "";
    }
    setForm(updated);
  };

  const handleCompChange = (index, e) => {
    const updated = [...comparisons];
    updated[index][e.target.name] = e.target.value;
    setComparisons(updated);
  };

  const addComp = () => setComparisons([...comparisons, emptyComp()]);
  const removeComp = (i) => setComparisons(comparisons.filter((_, idx) => idx !== i));

  const margin = Number(form.profitMargin);
  const marginClass = margin >= 20 ? "good" : margin >= 10 ? "warn" : margin > 0 ? "bad" : "";

  const step1Valid = form.productName && form.Quantity && form.costPrice && form.sellingPrice;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      ...form,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      profitMargin: Number(form.profitMargin),
      profit: Number(form.profit),
      comparisons: comparisons
        .map((c) => ({ ...c, competitorPrice: Number(c.competitorPrice) }))
        .filter((c) => c.competitorProductName && c.competitorPrice),
    };
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
      } else {
        showToast();
        setForm(emptyForm());
        setComparisons([emptyComp()]);
        setStep(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div className="app-header">
        <h1>📦 PriceCheck</h1>
        <button className="m-btn m-btn-outline" style={{ width: "auto", padding: "8px 16px", fontSize: 14 }} onClick={() => router.push("/products")}>
          My Products
        </button>
      </div>

      {/* Step bar */}
      <div className="step-bar">
        <div className={`step-pill ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`} />
        <div className={`step-pill ${step >= 2 ? "active" : ""}`} />
      </div>

      <div style={{ padding: "16px 16px 32px" }}>

        {/* STEP 1 — Product Details */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Your Product</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Enter your product details to analyse pricing</p>
            </div>

            <div className="m-card">
              <div className="m-field">
                <label className="m-label">Product Name</label>
                <input className="m-input" name="productName" placeholder="e.g. Turmeric Powder" value={form.productName} onChange={handleFormChange} />
              </div>

              <div className="m-field">
                <label className="m-label">Quantity (Grams)</label>
                <input className="m-input" name="Quantity" type="number" inputMode="numeric" placeholder="e.g. 500" value={form.Quantity} onChange={handleFormChange} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label className="m-label">Cost Price ₹</label>
                  <input className="m-input" name="costPrice" type="number" inputMode="decimal" placeholder="0" value={form.costPrice} onChange={handleFormChange} />
                </div>
                <div>
                  <label className="m-label">Selling Price ₹</label>
                  <input className="m-input" name="sellingPrice" type="number" inputMode="decimal" placeholder="0" value={form.sellingPrice} onChange={handleFormChange} />
                </div>
              </div>

              {form.profit && (
                <div style={{ background: "#f7fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Profit (Absolute)</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>₹{form.profit}</span>
                </div>
              )}

              {form.profitMargin && (
                <div style={{ background: "#f7fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Profit Margin</span>
                  <span className={`margin-pill ${marginClass}`}>{form.profitMargin}%</span>
                </div>
              )}

              {form.profitMargin && (
                <div className={`insight-banner ${marginClass}`}>
                  {margin >= 20 && "✅ Great margin! You have room to compete on price."}
                  {margin >= 10 && margin < 20 && "⚠️ Decent margin. Watch competitor prices closely."}
                  {margin > 0 && margin < 10 && "🔴 Thin margin. Consider reducing cost or increasing price."}
                </div>
              )}

              <button className="m-btn m-btn-primary" onClick={() => setStep(2)} disabled={!step1Valid}>
                Next — Add Competitors →
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — Competitors */}
        {step === 2 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700 }}>Competitors</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Add products you found on Amazon, Flipkart, etc.</p>
              </div>
              <button className="m-btn-ghost" onClick={() => setStep(1)}>← Back</button>
            </div>

            {/* Your product summary */}
            <div className="m-card-flat" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{form.productName}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.Quantity}g · Your selling price</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, fontSize: 20 }}>₹{form.sellingPrice}</p>
                  <span className={`margin-pill ${marginClass}`} style={{ fontSize: 11 }}>{form.profitMargin}%</span>
                </div>
              </div>
            </div>

            <p className="section-label">Competitor Products</p>

            {comparisons.map((item, index) => (
              <div className="m-card" key={index} style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Competitor {index + 1}</span>
                  {comparisons.length > 1 && (
                    <button className="m-btn-danger-ghost" onClick={() => removeComp(index)}>Remove</button>
                  )}
                </div>

                <div className="m-field">
                  <label className="m-label">Product Name</label>
                  <input className="m-input" name="competitorProductName" placeholder="e.g. Everest Turmeric 500g" value={item.competitorProductName} onChange={(e) => handleCompChange(index, e)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="m-label">Their Price ₹</label>
                    <input className="m-input" name="competitorPrice" type="number" inputMode="decimal" placeholder="0" value={item.competitorPrice} onChange={(e) => handleCompChange(index, e)} />
                  </div>
                  <div>
                    <label className="m-label">Quantity</label>
                    <input className="m-input" name="quantity" placeholder="e.g. 500g" value={item.quantity} onChange={(e) => handleCompChange(index, e)} />
                  </div>
                </div>

                <div className="m-field">
                  <label className="m-label">Brand</label>
                  <input className="m-input" name="brandName" placeholder="e.g. Everest" value={item.brandName} onChange={(e) => handleCompChange(index, e)} />
                </div>

                <div className="m-field">
                  <label className="m-label">Platform</label>
                  <input className="m-input" name="platform" placeholder="e.g. Amazon / Flipkart / Blinkit" value={item.platform} onChange={(e) => handleCompChange(index, e)} />
                </div>

                <div className="m-field" style={{ marginBottom: 0 }}>
                  <label className="m-label">Product Link</label>
                  <input className="m-input" name="productLink" placeholder="e.g. https://amazon.in/dp/..." value={item.productLink} onChange={(e) => handleCompChange(index, e)} />
                </div>

                {/* Live price diff preview */}
                {item.competitorPrice && form.sellingPrice && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>vs your price:</span>
                    {(() => {
                      const diff = Number(form.sellingPrice) - Number(item.competitorPrice);
                      if (diff > 0) return <span className="diff-badge expensive">You're ₹{diff} costlier</span>;
                      if (diff < 0) return <span className="diff-badge cheaper">You're ₹{Math.abs(diff)} cheaper</span>;
                      return <span className="diff-badge same">Same price</span>;
                    })()}
                  </div>
                )}
              </div>
            ))}

            <button className="m-btn m-btn-outline" style={{ marginBottom: 12 }} onClick={addComp}>
              + Add Another Competitor
            </button>

            <button className="m-btn m-btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner" /> Saving…</> : "✓ Save Product & Comparisons"}
            </button>
          </>
        )}
      </div>

      {toast && <div className="toast-success">✓ Product saved successfully!</div>}
    </div>
  );
}
