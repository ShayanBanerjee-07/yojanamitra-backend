import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Mic access denied:", error);
      alert("Please microphone access allow karein browser mein.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "voice_input.webm");

    try {
      const response = await axios.post('https://yojanamitra-backend-xvwl.onrender.com/api/transcribe', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setInputText(response.data.transcribed_text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Audio samajhne mein error aayi.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText) return;
    setLoading(true);
    try {
      const response = await axios.post('https://yojanamitra-backend-xvwl.onrender.com/api/search-schemes', {
        text: inputText
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching schemes:", error);
      alert("Kuch error hua, backend check karo!");
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <h1 className="header-title">Yojana<span>Mitra</span> AI 🇮🇳</h1>
      <p className="header-subtitle">Apni pareshani ya profile natural language mein likhein ya bolein.</p>
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="input-box"
          rows="4"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Example: Main Bhilai se hu, meri umar 20 saal hai, main ek student hu aur mere ghar ki aay 1.5 lakh hai."
        />
        
        <div className="button-group">
          <button 
            type="button" 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onTouchStart={startRecording} 
            onTouchEnd={stopRecording}
            className={`btn-voice ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? '🔴 Sun raha hu...' : '🎤 Hold to Speak'}
          </button>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'AI Processing...' : 'Sahi Yojana Dhundo'}
          </button>
        </div>
      </form>

      {results && (
        <div>
          <div className="profile-card">
            <strong>AI Extracted Profile:</strong><br/>
            Age: {results.extracted_profile.age} | Occupation: {results.extracted_profile.occupation} | Income: ₹{results.extracted_profile.annual_income}
          </div>

          <h3 style={{color: '#2d3748', marginTop: '30px'}}>Aapke Liye Relevant Schemes:</h3>
          {results.matched_schemes.length === 0 ? (
            <p style={{color: '#718096'}}>Koi scheme nahi mili. Kripya apni details badal kar try karein.</p>
          ) : (
            results.matched_schemes.map((scheme) => (
              <div key={scheme.id} className="scheme-card">
                <h4 className="scheme-title">{scheme.scheme_name}</h4>
                <p className="scheme-desc">{scheme.description}</p>
                <div className="scheme-docs">
                  <strong>Zaroori Documents:</strong> {scheme.required_documents.join(', ')}
                </div>
                <a href={scheme.official_link} target="_blank" rel="noreferrer" className="apply-link">
                  Official Website Par Jayein →
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;