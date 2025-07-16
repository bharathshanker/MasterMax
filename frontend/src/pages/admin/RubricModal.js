import React, { useState } from "react";

export default function RubricModal({ open, onClose, onSave, initialName = '', initialQualities = [], rubricId = null }) {
  const [name, setName] = useState(initialName);
  const [qualities, setQualities] = useState(initialQualities.length ? initialQualities : [{ name: "", description: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleQualityChange = (i, field, value) => {
    setQualities(qs =>
      qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q))
    );
  };
  const handleAddQuality = () => {
    setQualities(qs => [...qs, { name: "", description: "" }]);
  };
  const handleRemoveQuality = i => {
    setQualities(qs => qs.filter((_, idx) => idx !== i));
  };
  const handleSave = async () => {
    if (!name.trim() || qualities.some(q => !q.name.trim())) {
      setError("Pitch criteria name and all qualities are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Prepare payload; include rubricId when editing existing
      let body = { name, qualities };
      if (rubricId) {
        body.rubricId = rubricId;
      }
      const res = await fetch("/api/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to save pitch criteria");
      const rubric = await res.json();
      onSave(rubric);
    } catch (err) {
      setError("Could not save pitch criteria. Try again.");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 28, minWidth: 410, maxWidth: 600, boxShadow: "0 2px 24px #0002" }}>
        <h2 style={{ marginTop: 0 }}>Add New Pitch Criteria</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pitch criteria name"
            style={{ width: "100%", fontSize: 16, padding: 7, borderRadius: 4, border: '1px solid #bbb', marginBottom: 10 }}
          />
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Qualities to Rate</div>
          {qualities.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={q.name}
                onChange={e => handleQualityChange(i, "name", e.target.value)}
                placeholder="Quality name"
                style={{ flex: 2, fontSize: 15, padding: 5, borderRadius: 4, border: '1px solid #bbb' }}
              />
              <input
                value={q.description}
                onChange={e => handleQualityChange(i, "description", e.target.value)}
                placeholder="Description"
                style={{ flex: 4, fontSize: 15, padding: 5, borderRadius: 4, border: '1px solid #bbb' }}
              />
              <button type="button" onClick={() => handleRemoveQuality(i)} style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 14, cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={handleAddQuality} style={{ background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, padding: '6px 18px', fontSize: 15, marginTop: 6, cursor: 'pointer' }}>Add Quality</button>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 4, padding: '7px 18px', fontSize: 15 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, padding: '7px 18px', fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? "Saving..." : "Save Pitch Criteria"}</button>
        </div>
      </div>
    </div>
  );
}
