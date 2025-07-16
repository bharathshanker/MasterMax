import React, { useState, useRef, useEffect } from 'react';

function Rating({ value, onClick, label }) {
  // Color logic: 4-5 = green, 3 = yellow, 1-2 = red
  let fillColor = '#FFD700'; // default yellow
  if (value >= 4) fillColor = '#43a047'; // green
  else if (value === 3) fillColor = '#FFD700'; // yellow
  else if (value > 0) fillColor = '#f44336'; // red

  return (
    <div style={{ display: 'inline-block', cursor: onClick ? 'pointer' : 'default', textAlign: 'center' }} onClick={onClick}>
      {label && <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>}
      <div style={{ marginBottom: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ color: i <= value ? fillColor : '#fff', fontSize: 22 }}>&#9733;</span>
        ))}
      </div>
    </div>
  );
}

function PitchExpert() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [timer, setTimer] = useState(0);
  const chunks = useRef([]);
  const timerRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPitch, setPopupPitch] = useState(null);
  const [ratings, setRatings] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [page, setPage] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const pitchesPerPage = 6;

  useEffect(() => {
    fetch('/api/pitches')
      .then(res => res.json())
      .then(setPitches);
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const startRecording = async () => {
    if (!selectedProduct) return;
    setShowRecordingModal(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new window.MediaRecorder(stream);
    recorder.ondataavailable = e => chunks.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      setAudioURL(URL.createObjectURL(blob));
      chunks.current = [];
      uploadPitch(blob);
      clearInterval(timerRef.current);
      setTimer(0);
      setShowRecordingModal(false);
    };
    setMediaRecorder(recorder);
    recorder.start();
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    setRecording(false);
  };

  const uploadPitch = async (audio, isFile = false) => {
    if (!selectedProduct) return;
    setUploading(true);
    setFileError('');
    setShowLoader(true);
    const formData = new FormData();
    formData.append('audio', audio, isFile ? audio.name : 'pitch.webm');
    formData.append('productId', selectedProduct._id);
    await fetch('/api/pitch', {
      method: 'POST',
      body: formData
    });
    setUploading(false);
    setShowLoader(false);
    // Refresh pitch list
    fetch('/api/pitches')
      .then(res => res.json())
      .then(ps => {
        setPitches(ps);
        setPage(0);
      });
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB.');
      return;
    }
    uploadPitch(file, true);
  };

  const handleRatingClick = (pitch) => {
    setPopupPitch(pitch);
    setShowPopup(true);
  };

  const Popup = ({ pitch, onClose, rating, rationale }) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
    }}>
      <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#e44210', borderBottom: '2px solid #eee', paddingBottom: 10, marginBottom: 15 }}>Pitch Analysis</h2>
        <div style={{ marginBottom: 20 }}>
          <strong>Overall Rating:</strong> <Rating value={rating.cumulative} />
        </div>
        {Object.entries(rationale).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 12, padding: 10, background: '#f9f9f9', borderRadius: 6 }}>
            <strong style={{ textTransform: 'capitalize', color: '#333' }}>{key.replace(/_/g, ' ')}:</strong>
            <p style={{ margin: '5px 0 0', color: '#555' }}>{value}</p>
          </div>
        ))}
        <button onClick={onClose} style={{ padding: '10px 20px', background: '#e44210', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', marginTop: 10, float: 'right' }}>Close</button>
      </div>
    </div>
  );

  const LoaderPopup = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div className="loader" style={{
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #e44210',
          borderRadius: '50%',
          width: 50,
          height: 50,
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px auto'
        }}></div>
        <p style={{ fontSize: 18 }}>Analyzing your pitch...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Main App Layout
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '0 auto', padding: '20px', background: '#fff5f8', borderRadius: 12, boxShadow: '0 0 20px #0000001a' }}>
      <h1 style={{ textAlign: 'center', color: '#e44210', marginBottom: 30 }}>Pitch Expert</h1>

      {/* Product Selection */} 
      <div style={{ marginBottom: 25, padding: 15, background: '#ffebee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10, color: '#c62828' }}>Select Product:</h2>
        <select 
          onChange={e => setSelectedProduct(products.find(p => p._id === e.target.value))}
          value={selectedProduct ? selectedProduct._id : ''}
          style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #e44210', fontSize: 16 }}
        >
          <option value="">-- Select a Product --</option>
          {products.filter(p => p.active).map(product => (
            <option key={product._id} value={product._id}>{product.name}</option>
          ))}
        </select>
      </div>

      

      {/* Recording Section */} 
      <div style={{ textAlign: 'center', marginBottom: 25, padding: 20, background: selectedProduct ? '#e8f5e9' : '#eeeeee', borderRadius: 8, opacity: selectedProduct ? 1 : 0.6 }}>
        <h2 style={{ marginTop: 0, marginBottom: 15, color: selectedProduct ? '#2e7d32' : '#616161' }}>Record Your Pitch</h2>
        <button 
          onClick={recording ? stopRecording : startRecording} 
          disabled={!selectedProduct || uploading}
          style={{
            padding: '12px 30px', 
            fontSize: 18, 
            background: recording ? '#f44336' : (selectedProduct ? '#4CAF50' : '#bdbdbd'), 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            cursor: (selectedProduct && !uploading) ? 'pointer' : 'not-allowed',
            marginRight: 10
          }}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {audioURL && !uploading && (
          <button onClick={() => uploadPitch(new Blob(chunks.current, { type: 'audio/webm' }))} style={{ padding: '12px 25px', fontSize: 18, background: '#2196F3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Upload Recording
          </button>
        )}
        {fileError && <p style={{ color: 'red', marginTop: 10 }}>{fileError}</p>}
        <div style={{ marginTop: 15 }}>
          <label htmlFor="file-upload" style={{
              padding: '12px 25px', 
              fontSize: 18, 
              background: selectedProduct ? '#FF9800' : '#bdbdbd', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6, 
              cursor: selectedProduct ? 'pointer' : 'not-allowed',
              display: 'inline-block'
          }}>
            Upload Audio File
          </label>
          <input id="file-upload" type="file" accept="audio/*" onChange={handleFileUpload} disabled={!selectedProduct || uploading} style={{ display: 'none' }} />
        </div>
      </div>
      
      {showLoader && <LoaderPopup />}
      {showRecordingModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#fff', padding: 36, borderRadius: 14, minWidth: 320, textAlign: 'center', boxShadow: '0 4px 24px #0002' }}>
              <h2 style={{ color: '#e44210', marginBottom: 18 }}>Recording in Progress</h2>
              <div style={{ fontSize: 18, marginBottom: 16 }}>
                <span role="img" aria-label="mic" style={{ fontSize: 32, verticalAlign: 'middle' }}>&#127908;</span>
                <span style={{ marginLeft: 12, fontWeight: 600 }}>Speak now...</span>
              </div>
              <div style={{ fontSize: 16, color: '#333', marginBottom: 18 }}>Elapsed: <span style={{ fontWeight: 600 }}>{timer}s</span></div>
              <button onClick={stopRecording} style={{ padding: '10px 28px', fontSize: 17, background: '#e44210', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Stop Recording
              </button>
            </div>
          </div>
        )}
        {/* --- Viewing Section --- */}
        <h2>Previous Pitches</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pitches.slice(page * pitchesPerPage, (page + 1) * pitchesPerPage).map(pitch => {
            // Find the product name for this pitch
            const productName = (products.find(p => p._id === (pitch.product || pitch.productId)) || {}).name;
            return (
              <li key={pitch._id} style={{ marginBottom: 20, background: '#f2bac8', borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ background: '#e44210', borderRadius: 18, padding: '10px 20px', marginBottom: 6, display: 'inline-block' }}>
                    <audio controls src={`/uploads/${pitch.filename}`} style={{ background: 'transparent' }} />
                  </div>
                  <div style={{ fontSize: 14, color: '#333', marginTop: 5 }}>
                    {new Date(pitch.createdAt).toLocaleString()}
                  </div>
                  {productName && (
                    <div style={{ fontSize: 15, color: '#222', fontStyle: 'italic', marginTop: 2 }}>
                      Product: {productName}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 20, textAlign: 'center' }}>
                  <Rating value={pitch.ratings?.cumulative || 0} label="Rating" />
                  <div>
                    <button onClick={() => handleRatingClick(pitch)} style={{ marginTop: 8, background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 14, cursor: 'pointer' }}>
                      Know more
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {/* Pagination Controls */}
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ marginRight: 8, padding: '4px 14px', borderRadius: 4, border: '1px solid #ccc', background: page === 0 ? '#eee' : 'white', color: page === 0 ? '#888' : '#333', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <button onClick={() => setPage(p => (p + 1) * pitchesPerPage < pitches.length ? p + 1 : p)} disabled={(page + 1) * pitchesPerPage >= pitches.length} style={{ padding: '4px 14px', borderRadius: 4, border: '1px solid #ccc', background: (page + 1) * pitchesPerPage >= pitches.length ? '#eee' : 'white', color: (page + 1) * pitchesPerPage >= pitches.length ? '#888' : '#333', cursor: (page + 1) * pitchesPerPage >= pitches.length ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
        {showPopup && popupPitch && (
          <Popup pitch={popupPitch} onClose={() => setShowPopup(false)} rating={popupPitch.ratings || {}} rationale={popupPitch.rationale || {}} />
        )}
    </div>
  );
}

export default PitchExpert;
