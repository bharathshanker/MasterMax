import React, { useEffect, useState } from "react";
import RubricModal from './RubricModal';

export default function ProductManager({ products, onChange, selectedProduct, setSelectedProduct }) {
  const [newProduct, setNewProduct] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [activateOnAdd, setActivateOnAdd] = useState(true);
  const [selectedRubricId, setSelectedRubricId] = useState("");
  const [rubrics, setRubrics] = useState([]);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  // State for RubricModal when editing or creating criteria
  const [modalInitialName, setModalInitialName] = useState("");
  const [modalInitialQualities, setModalInitialQualities] = useState([]);
  const [modalRubricId, setModalRubricId] = useState(null);

  useEffect(() => {
    // Fetch rubrics on mount
    fetch("/api/rubric-list")
      .then(res => res.json())
      .then(setRubrics);
  }, [rubricModalOpen]); // refetch when modal closes

  const handleAdd = async () => {
    if (!newProduct.trim() || !selectedRubricId) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProduct, rubricId: selectedRubricId, active: activateOnAdd })
      });
      if (!res.ok) throw new Error("Failed to add product");
      setNewProduct("");
      setSelectedRubricId("");
      onChange(); // trigger reload
    } catch (err) {
      setError("Could not add product. Try again.");
    }
    setAdding(false);
  };

  // Deduplicate rubrics by name (show only unique rubric names)
  const uniqueRubrics = Array.from(
    new Map(rubrics.map(r => [r.name, r])).values()
  );

  return (
    <div style={{ background: '#f0f4ff', borderRadius: 12, padding: 18, marginBottom: 30 }}>
      <h2 style={{ marginTop: 0 }}>Product Master List</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={newProduct}
          onChange={e => setNewProduct(e.target.value)}
          placeholder="Add new product"
          style={{ fontSize: 16, padding: 6, borderRadius: 4, border: '1px solid #ccc', flex: 2 }}
        />
        <select
          value={selectedRubricId}
          onChange={e => {
            if (e.target.value === '__add__') {
              // Open modal to create new criteria
              setModalInitialName("");
              setModalInitialQualities([]);
              setModalRubricId(null);
              setRubricModalOpen(true);
            } else {
              setSelectedRubricId(e.target.value);
            }
          }}
          style={{ fontSize: 16, padding: 6, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
        >
          <option value="">Select pitch criteria</option>
          {uniqueRubrics.map(r => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
          <option value="__add__">+ Add Pitch Criteria</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15 }}>
          <input type="checkbox" checked={activateOnAdd} onChange={e => setActivateOnAdd(e.target.checked)} />
          Activate now?
        </label>
        <button onClick={handleAdd} disabled={adding || !newProduct.trim() || !selectedRubricId} style={{ background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, padding: '7px 18px', fontSize: 15, cursor: adding ? 'not-allowed' : 'pointer' }}>
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
      {uniqueRubrics.length === 0 && <div style={{ color: '#b71c1c', marginBottom: 8 }}>No pitch criteria found. Please create pitch criteria before adding a product.</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {products.map(prod => (
          <li key={prod._id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 5, padding: '6px 10px' }}>
            <span
              onClick={() => setSelectedProduct(prod)}
              style={{ cursor: 'pointer', fontWeight: selectedProduct && selectedProduct._id === prod._id ? 600 : 400, color: selectedProduct && selectedProduct._id === prod._id ? '#e44210' : '#111', flex: 1 }}>
              {prod.name}
            </span>
            <span style={{ fontSize: 13, color: prod.active ? '#388e3c' : '#b71c1c', fontWeight: 500, marginRight: 12 }}>
              {prod.active ? 'Activated' : 'Not activated'}
            </span>
            <button
              onClick={async () => {
                setAdding(true);
                setError("");
                try {
                  const res = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: prod.name, rubricId: prod.rubric?._id, active: !prod.active })
                  });
                  if (!res.ok) throw new Error("Failed to update product");
                  onChange();
                } catch (err) {
                  setError("Could not update product. Try again.");
                }
                setAdding(false);
              }}
              style={{ background: prod.active ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: 4, padding: '3px 12px', fontSize: 13, cursor: adding ? 'not-allowed' : 'pointer' }}
            >
              {prod.active ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
      <RubricModal
        open={rubricModalOpen}
        initialName={modalInitialName}
        initialQualities={modalInitialQualities}
        rubricId={modalRubricId}
        onClose={() => setRubricModalOpen(false)}
        onSave={rubric => {
          setRubricModalOpen(false);
          if (modalRubricId) {
            // Edited existing criteria
            setSelectedProduct(p => p && p.rubric && p.rubric._id === rubric._id ? { ...p, rubric } : p);
            onChange();
          } else {
            // Added new criteria for product creation
            setSelectedRubricId(rubric._id);
            setRubrics(old => [...old, rubric]);
          }
        }}
      />
      {/* Show criteria list for selected product */}
      {selectedProduct && selectedProduct.rubric && (
        <div style={{ background: '#fff', padding: '16px', borderRadius: 8, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Criteria for {selectedProduct.name}</h3>
            <button
              onClick={() => {
                // Open modal to edit existing criteria
                setModalInitialName(selectedProduct.rubric.name);
                setModalInitialQualities(selectedProduct.rubric.qualities || []);
                setModalRubricId(selectedProduct.rubric._id);
                setRubricModalOpen(true);
              }}
              style={{ background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
            >
              Edit Criteria
            </button>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
            {selectedProduct.rubric.qualities && selectedProduct.rubric.qualities.map((q, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <strong>{q.name}</strong>: {q.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
