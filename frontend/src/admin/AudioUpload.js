import React, { useState } from 'react';

function AudioUpload() {
  const [audioFile, setAudioFile] = useState(null);
  const [tags, setTags] = useState({
    language: 'English',
    product: 'General',
    audioType: 'Inquiry',
    difficulty: 'Easy',
    evaluationCriteria: ''
  });
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    setAudioFile(event.target.files[0]);
    setUploadStatus('');
  };

  const handleTagChange = (event) => {
    const { name, value } = event.target;
    setTags(prevTags => ({ ...prevTags, [name]: value }));
    setUploadStatus('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!audioFile) {
      setUploadStatus('Please select an audio file.');
      return;
    }

    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('audio', audioFile); // 'audio' must match multer field name
    formData.append('language', tags.language);
    formData.append('product', tags.product);
    formData.append('audioType', tags.audioType);
    formData.append('difficulty', tags.difficulty);
    formData.append('evaluationCriteria', tags.evaluationCriteria);

    try {
      const response = await fetch('/api/admin/upload-customer-audio', {
        method: 'POST',
        body: formData, // No 'Content-Type' header needed; browser sets it for FormData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus(`Successfully uploaded ${audioFile.name}!`);
        setAudioFile(null); // Clear file input
        // Optionally reset tags or clear form
        document.getElementById('audioFile').value = ''; // Reset file input visually
      } else {
        console.error('Upload failed response:', result);
        setUploadStatus(`Upload failed: ${result.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Upload fetch error:', error);
      setUploadStatus(`Upload error: ${error.message}. Check network or server.`);
    }
  };

  // Basic inline styles for simplicity
  const styles = {
    container: { padding: '20px', maxWidth: '500px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
    select: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
    button: { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    status: { marginTop: '15px', fontWeight: 'bold' },
  };

  return (
    <div style={styles.container}>
      <h2>Upload Customer Call Audio</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="audioFile" style={styles.label}>Audio File:</label>
          <input
            type="file"
            id="audioFile"
            accept="audio/*"
            onChange={handleFileChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="language" style={styles.label}>Language:</label>
          <select id="language" name="language" value={tags.language} onChange={handleTagChange} style={styles.select}>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            {/* Add other languages as needed */}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="product" style={styles.label}>Product:</label>
          <input
            type="text"
            id="product"
            name="product"
            value={tags.product}
            onChange={handleTagChange}
            placeholder="e.g., Gold Loan, Insurance" 
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="audioType" style={styles.label}>Audio Type:</label>
          <select id="audioType" name="audioType" value={tags.audioType} onChange={handleTagChange} style={styles.select}>
            <option value="Inquiry">Inquiry</option>
            <option value="Complaint">Complaint</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Sales Pitch">Sales Pitch</option>
             {/* Add other types as needed */}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="difficulty" style={styles.label}>Difficulty:</label>
          <select id="difficulty" name="difficulty" value={tags.difficulty} onChange={handleTagChange} style={styles.select}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="evaluationCriteria" style={styles.label}>Evaluation Criteria:</label>
          <textarea
            id="evaluationCriteria"
            name="evaluationCriteria"
            value={tags.evaluationCriteria}
            onChange={handleTagChange}
            placeholder="Define criteria for response evaluation"
            style={{ ...styles.input, height: '80px' }}
          />
        </div>

        <button type="submit" style={styles.button}>Upload Audio</button>
      </form>
      {uploadStatus && <p style={styles.status}>{uploadStatus}</p>}
    </div>
  );
}

export default AudioUpload;
