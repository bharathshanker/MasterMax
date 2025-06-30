import React, { useState, useRef, useEffect } from 'react';

function CustomerCalls() {
  const [language, setLanguage] = useState("English");
  const [cxTouchPoint, setCxTouchPoint] = useState("");
  const [step, setStep] = useState("setup"); // setup | playing | countdown | recording | recorded | ...
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const audioRef = useRef(null); // For the initial customer audio
  const countdownRef = useRef(null); // For setInterval
  const [countdown, setCountdown] = useState(5); // Countdown timer
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunks = useRef([]);
  const [userAudioUrl, setUserAudioUrl] = useState(null);

  const handleChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (!cxTouchPoint) {
      setError('Please select the Cx touch point.');
      return;
    }
    e.preventDefault();
    setLoading(true);
    setAudioUrl(''); // Clear previous audio
    setError(null); // Clear previous errors
    setStep('playing');

    try {
      const response = await fetch(`/api/customer-calls/random-audio?language=${encodeURIComponent(language)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.audioUrl && data.audioId) {
        // Prepend backend server address if data.audioUrl is a relative path
        const fullAudioUrl = data.audioUrl.startsWith('http') 
                             ? data.audioUrl 
                             : `http://localhost:5002${data.audioUrl.startsWith('/') ? data.audioUrl : '/' + data.audioUrl}`;
        setAudioUrl(fullAudioUrl);
        setSession(prev => ({ ...prev, audioId: data.audioId }));
      } else {
        throw new Error('No audio URL or audioId received from server.');
      }
    } catch (err) {
      console.error("Error fetching customer call audio:", err);
      setError(`Failed to load audio: ${err.message}`);
      setStep('setup'); // Go back to selection on error
    } finally {
      setLoading(false);
    }
  };

  // Play the audio, then move to countdown
  useEffect(() => {
    if (step === 'playing' && audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setStep('countdown'); // Move to countdown step
      };
      audio.play();
    }
  }, [step, audioUrl]);

  // Handle countdown
  useEffect(() => {
    if (step === 'countdown') {
      setCountdown(5); // Reset countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(countdownRef.current);
            setStep('readyToRecord'); // Ready to start recording
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    // Cleanup interval on unmount or step change
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [step]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    chunks.current = []; // Clear previous chunks

    recorder.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setUserAudioUrl(url); // Set the recorded audio URL for playback

      // Prepare data for evaluation
      const formData = new FormData();
      formData.append('audio', blob, `response-${Date.now()}.webm`);
      if (session?.audioId) {
        formData.append('audioId', session.audioId);
      }

      // Send for evaluation
      setLoading(true); // Show loading indicator for feedback
      setError(null);
      setStep('evaluating'); // New step for waiting on feedback

      try {
        const evalResponse = await fetch('/api/customer-calls/evaluate', {
          method: 'POST',
          body: formData,
        });
        if (!evalResponse.ok) {
          const errorData = await evalResponse.json();
          throw new Error(errorData.message || `Evaluation failed: ${evalResponse.statusText}`);
        }
        const feedbackData = await evalResponse.json();
        setFeedback(feedbackData); // Store the feedback
        setStep('feedback'); // Move to feedback display step
      } catch (err) {
        console.error("Error evaluating response:", err);
        setError(`Failed to get feedback: ${err.message}`);
        setStep('recorded'); // Revert to recorded state on error, allowing retry?
      } finally {
        setLoading(false);
      }

      // Reset recorder state
      setMediaRecorder(null);
      stream.getTracks().forEach(track => track.stop()); // Stop microphone access
    };

    recorder.start();
    setRecording(true);
    setStep('recording'); // Update step to 'recording'
  };

  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    setRecording(false);
  };

  const renderFeedback = () => {
    if (!feedback) return <p>Loading feedback...</p>;

    // If Gemini returned plain text feedback, show that
    if (typeof feedback.feedback === 'string') {
      return (
        <div style={{ marginTop: 20, background: '#e8f5e9', padding: 15, borderRadius: 8 }}>
          <h4>Feedback</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{feedback.feedback}</pre>
          <button onClick={() => setStep('setup')} style={{ marginTop: 15, padding: "8px 16px" }}>Start New Call</button>
        </div>
      );
    }

    // Friendly UI for structured Gemini JSON
    const delivery = feedback.delivery_evaluation;
    const content = feedback.content_evaluation;

    return (
      <div style={{ marginTop: 20, background: '#e8f5e9', padding: 15, borderRadius: 8 }}>
        <h4 style={{ marginBottom: 8 }}>Delivery Evaluation</h4>
        {delivery && (
          <>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{delivery.commentary}</div>
            <div style={{ marginBottom: 16 }}>Rating: <b>{delivery.delivery_rating ?? '-'}/5</b></div>
          </>
        )}
        <h4 style={{ marginBottom: 8 }}>Content Evaluation</h4>
        {content && (
          <>
            <ul style={{ marginLeft: 16, marginBottom: 8 }}>
              {(content.bullets || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div>Rating: <b>{content.content_rating ?? '-'}/5</b></div>
          </>
        )}
        <button onClick={() => setStep('setup')} style={{ marginTop: 20, padding: "8px 16px" }}>Start New Call</button>
      </div>
    );
  };

  return (
    <div style={{ padding: 32, background: "#fff5f8", borderRadius: 12, maxWidth: 480, margin: "40px auto", boxShadow: '0 0 20px #0001', fontFamily: "'Nunito Sans', sans-serif" }}>
      <h2 style={{ marginBottom: 16, color: '#e44210', textAlign: 'center', fontWeight: 700 }}>Customer Calls</h2>
      {step === "setup" && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Select your language:</label>
            <select name="language" value={language} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 6, border: '1px solid #e44210', fontSize: 16 }}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Telugu</option>
              <option>Kannada</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Cx touch point <span style={{ color: '#e44210' }}>*</span>:</label>
            <select name="cxTouchPoint" value={cxTouchPoint} onChange={e => setCxTouchPoint(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: '1px solid #e44210', fontSize: 16 }}>
              <option value="">-- Select --</option>
              <option value="before">Before transaction</option>
              <option value="after">After transaction</option>
            </select>
          </div>
          <button type="submit" style={{ padding: "10px 24px", background: "#e44210", color: "white", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: "pointer", marginTop: 8 }}>
            Start Call
          </button>
          <div style={{ marginTop: 14, fontStyle: 'italic', color: '#444', fontSize: 15, textAlign: 'center' }}>
            Once you choose your language and start call, you will listen to a customer query or objection - pls respond to the customer as you will do in a real pitch
          </div>
        </form>
      )}
      {step === "playing" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          {loading ? (
            <>
              <div className="loader" style={{ margin: "32px auto" }} />
              <p style={{ marginTop: 16 }}>Loading customer query...</p>
            </>
          ) : (
            <>
              <audio controls autoPlay src={audioUrl} style={{ width: "100%", marginBottom: 16 }} />
              <p style={{ marginTop: 12 }}>Listen to the customer call above. (Next: recording UI)</p>
            </>
          )}
        </div>
      )}
      {step === "countdown" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <h2>Get Ready!</h2>
          <p style={{ fontSize: 48, margin: 16 }}>{countdown}</p>
        </div>
      )}
      {step === "readyToRecord" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={startRecording} style={{ padding: "12px 28px", background: "#e44210", color: "white", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 18, cursor: "pointer" }}>
            Start Recording Your Response
          </button>
        </div>
      )}
      {step === "recording" && (
        <div>
          <h3 style={{ textAlign: "center", color: "#e44210" }}> <span role="img" aria-label="mic">&#127908;</span> Recording...</h3>
          <button onClick={stopRecording} style={{ display: "block", margin: "16px auto", padding: "10px 24px", background: "#e44210", color: "white", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
            Stop Recording
          </button>
        </div>
      )}
      {step === "recorded" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <h4>Your Response:</h4>
          {userAudioUrl && <audio controls src={userAudioUrl} style={{ width: "100%", marginBottom: 16 }} />}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          <p>(Click Stop Recording again to send for feedback - This needs adjustment, should auto-send)</p>
        </div>
      )}
      {step === "evaluating" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <div className="loader" style={{ margin: "32px auto" }} />
          <p style={{ marginTop: 16 }}>Evaluating your response...</p>
        </div>
      )}
      {step === "feedback" && (
        renderFeedback()
      )}
      {error && step !== 'recorded' && <p style={{ color: 'red', marginTop: 16 }}>Error: {error}</p>}
    </div>
  );
}

export default CustomerCalls;
