"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    productName: "",
    Quantity: "",
    costPrice: "",
    sellingPrice: "",
    profitMargin: "",
  });

  const [comparisons, setComparisons] = useState([
    {
      competitorProductName: "",
      competitorPrice: "",
      brandName: "",
      platform: "",
    },
  ]);

  // form logic
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    const cost = Number(updated.costPrice);
    const sell = Number(updated.sellingPrice);

    if (cost > 0 && sell > 0) {
      const profit = sell - cost;
      updated.profitMargin = ((profit / cost) * 100).toFixed(2);
    }

    setForm(updated);
  };

  // comparison logic
  const handleComparisonChange = (index, e) => {
    const updated = [...comparisons];
    updated[index][e.target.name] = e.target.value;
    setComparisons(updated);
  };

  const addComparison = () => {
    setComparisons([
      ...comparisons,
      {
        competitorProductName: "",
        competitorPrice: "",
        brandName: "",
        platform: "",
      },
    ]);
  };

  // submit
  const handleSubmit = async () => {
    const payload = {
      ...form,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      profitMargin: Number(form.profitMargin),
      comparisons: comparisons.map((c) => ({
        ...c,
        competitorPrice: Number(c.competitorPrice),
      })).filter((c) => c.competitorProductName && c.competitorPrice),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
    } else {
      setResult(data.data);
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-dark" onClick={() => router.push("/products")}>
          List
        </button>
      </div>

      {/* FORM 1 */}
      <div className="card p-3 mb-3">
        <h5>Product Details</h5>
        <label>Product Name</label>
        <input
          name="productName"
          placeholder="Product Name"
          className="form-control mb-2"
          onChange={handleFormChange}
        />
        <label>Quantity (Grams)</label>
        <input
          name="Quantity"
          type="number"
          placeholder="Quantity in Grams"
          className="form-control mb-2"
          onChange={handleFormChange}
        />
        <label>Cost Price</label>
        <input
          name="costPrice"
          type="number"
          placeholder="Cost Price"
          className="form-control mb-2"
          onChange={handleFormChange}
        />
        <label>selling Price</label>
        <input
          name="sellingPrice"
          type="number"
          placeholder="Selling Price"
          className="form-control mb-2"
          onChange={handleFormChange}
        />
       
        <label>Profit Margin %</label>
        <input
          value={form.profitMargin}
          readOnly
          className="form-control mb-2"
          placeholder="Profit Margin"
        />

        <button className="btn btn-primary" onClick={() => setStep(2)}>
          Next
        </button>
      </div>

      {/* FORM 2 */}
      {step === 2 && (
        <div className="card p-3 mb-3">
          <h5>Comparison</h5>

          {comparisons.map((item, index) => (
            <div key={index} className="border p-2 mb-2">
              <input
                name="competitorProductName"
                placeholder="Product Name"
                className="form-control mb-2"
                onChange={(e) => handleComparisonChange(index, e)}
              />

              <input
                name="competitorPrice"
                type="number"
                placeholder="Price"
                className="form-control mb-2"
                onChange={(e) => handleComparisonChange(index, e)}
              />

              <input
                name="brandName"
                placeholder="Brand"
                className="form-control mb-2"
                onChange={(e) => handleComparisonChange(index, e)}
              />

              <input
                name="platform"
                placeholder="Platform"
                className="form-control"
                onChange={(e) => handleComparisonChange(index, e)}
              />
            </div>
          ))}

          <button className="btn btn-secondary me-2" onClick={addComparison}>
            Add More
          </button>

          <button className="btn btn-success" onClick={handleSubmit}>
            Submit All
          </button>
        </div>
      )}

      {/* RESULT TABLE */}
      {result && (
        <div className="card p-3">
          <h5>Comparison Result</h5>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product</th>
                <th>Platform</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Difference</th>
              </tr>
            </thead>

            <tbody>
              {result.comparisons.map((item, i) => (
                <tr key={i}>
                  <td>{item.competitorProductName}</td>
                  <td>{item.platform}</td>
                  <td>{item.brandName}</td>
                  <td>{item.competitorPrice}</td>
                  <td>{item.priceDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}