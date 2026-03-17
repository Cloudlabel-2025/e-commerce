"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [newComparisons, setNewComparisons] = useState({});
  const [saving, setSaving] = useState(null);

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setNewComparisons((prev) => ({
      ...prev,
      [id]: prev[id] || [{ competitorProductName: "", competitorPrice: "", brandName: "", platform: "" }],
    }));
  };

  const handleCompChange = (productId, index, e) => {
    const updated = [...(newComparisons[productId] || [])];
    updated[index][e.target.name] = e.target.value;
    setNewComparisons((prev) => ({ ...prev, [productId]: updated }));
  };

  const addRow = (productId) => {
    setNewComparisons((prev) => ({
      ...prev,
      [productId]: [
        ...(prev[productId] || []),
        { competitorProductName: "", competitorPrice: "", brandName: "", platform: "" },
      ],
    }));
  };

  const removeRow = (productId, index) => {
    const updated = (newComparisons[productId] || []).filter((_, i) => i !== index);
    setNewComparisons((prev) => ({ ...prev, [productId]: updated }));
  };

  const saveComparisons = async (product) => {
    setSaving(product._id);
    const merged = [
      ...product.comparisons,
      ...(newComparisons[product._id] || []).filter((c) => c.competitorProductName && c.competitorPrice),
    ];

    const res = await fetch(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comparisons: merged }),
    });

    if (res.ok) {
      await fetchProducts();
      setExpandedId(null);
    } else {
      const d = await res.json();
      alert(d.message);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <h4 className="mb-0">All Products</h4>
        <button className="btn btn-dark" onClick={() => router.push("/")}>
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-muted py-5">No products found. Add one!</div>
      ) : (
        <div className="row g-3">
          {products.map((product) => (
            <div key={product._id} className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  {/* Product Header */}
                  <div className="row align-items-center g-2">
                    <div className="col-12 col-sm-4">
                      <div className="fw-semibold fs-6">{product.productName}</div>
                      <small className="text-muted">Qty: {product.Quantity}g</small>
                    </div>
                    <div className="col-6 col-sm-2 text-center">
                      <small className="text-muted d-block">Cost</small>
                      <span>₹{product.costPrice}</span>
                    </div>
                    <div className="col-6 col-sm-2 text-center">
                      <small className="text-muted d-block">Selling</small>
                      <span>₹{product.sellingPrice}</span>
                    </div>
                    <div className="col-6 col-sm-2 text-center">
                      <small className="text-muted d-block">Margin</small>
                      <span
                        className={
                          product.profitMargin >= 0 ? "text-success fw-semibold" : "text-danger fw-semibold"
                        }
                      >
                        {Number(product.profitMargin).toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-6 col-sm-2 text-sm-end">
                      <button
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={() => toggleExpand(product._id)}
                      >
                        {expandedId === product._id ? "Hide" : `Compare (${product.comparisons.length})`}
                      </button>
                    </div>
                  </div>

                  {/* Comparisons Section */}
                  {expandedId === product._id && (
                    <div className="mt-3">
                      {/* Existing comparisons table */}
                      {product.comparisons.length > 0 && (
                        <div className="table-responsive mb-3">
                          <table className="table table-sm table-bordered mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Product</th>
                                <th>Brand</th>
                                <th>Platform</th>
                                <th>Price</th>
                                <th>Diff</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.comparisons.map((c, i) => (
                                <tr key={i}>
                                  <td>{c.competitorProductName}</td>
                                  <td>{c.brandName || "—"}</td>
                                  <td>{c.platform || "—"}</td>
                                  <td>₹{c.competitorPrice}</td>
                                  <td
                                    className={
                                      c.priceDifference >= 0 ? "text-success" : "text-danger"
                                    }
                                  >
                                    {c.priceDifference >= 0 ? "+" : ""}
                                    {c.priceDifference}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Add new comparisons */}
                      <p className="fw-semibold mb-2">Add Comparisons</p>
                      {(newComparisons[product._id] || []).map((row, idx) => (
                        <div key={idx} className="row g-2 mb-2 align-items-center">
                          <div className="col-12 col-sm-3">
                            <input
                              name="competitorProductName"
                              placeholder="Product Name"
                              className="form-control form-control-sm"
                              value={row.competitorProductName}
                              onChange={(e) => handleCompChange(product._id, idx, e)}
                            />
                          </div>
                          <div className="col-6 col-sm-2">
                            <input
                              name="competitorPrice"
                              type="number"
                              placeholder="Price"
                              className="form-control form-control-sm"
                              value={row.competitorPrice}
                              onChange={(e) => handleCompChange(product._id, idx, e)}
                            />
                          </div>
                          <div className="col-6 col-sm-3">
                            <input
                              name="brandName"
                              placeholder="Brand"
                              className="form-control form-control-sm"
                              value={row.brandName}
                              onChange={(e) => handleCompChange(product._id, idx, e)}
                            />
                          </div>
                          <div className="col-10 col-sm-3">
                            <input
                              name="platform"
                              placeholder="Platform"
                              className="form-control form-control-sm"
                              value={row.platform}
                              onChange={(e) => handleCompChange(product._id, idx, e)}
                            />
                          </div>
                          <div className="col-2 col-sm-1 text-end">
                            {(newComparisons[product._id] || []).length > 1 && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeRow(product._id, idx)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="d-flex flex-wrap gap-2 mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => addRow(product._id)}
                        >
                          + Add Row
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          disabled={saving === product._id}
                          onClick={() => saveComparisons(product)}
                        >
                          {saving === product._id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
