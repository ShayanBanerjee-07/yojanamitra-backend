import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Reference for MediaRecorder and audio chunks
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // NEW VOICE RECORDING LOGIC
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
      const response = await axios.post('http://localhost:8000/api/transcribe', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Directly enter the text received from the backend into the textbox
      setInputText(response.data.transcribed_text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Audio samajhne mein error aayi.");
    }
    setLoading(false);
  };
  // ------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/search-schemes', {
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
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a365d', textAlign: 'center' }}>YojanaMitra AI 🇮🇳</h1>
      <p style={{ textAlign: 'center', color: '#555' }}>Apni problem likhein ya mic daba kar baat bolein.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          rows="4"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Example: Main Bhilai se hu, meri umar 20 saal hai, main ek student hu..."
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        
        {/* New Buttons Layout */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onTouchStart={startRecording} 
            onTouchEnd={stopRecording}
            style={{ flex: 1, padding: '10px', backgroundColor: isRecording ? '#e53e3e' : '#4a5568', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {isRecording ? '🔴 Sun raha hu... (Chhodne par stop hoga)' : '🎤 Hold to Speak'}
          </button>
          
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Sahi Yojana Dhundo'}
          </button>
        </div>
      </form>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3>AI Extracted Profile:</h3>
          <p style={{ backgroundColor: '#edf2f7', padding: '10px', borderRadius: '5px' }}>
            Age: {results.extracted_profile.age} | Occupation: {results.extracted_profile.occupation} | Income: ₹{results.extracted_profile.annual_income}
          </p>

          <h3>Aapke Liye Relevant Schemes:</h3>
          {results.matched_schemes.length === 0 ? <p>Koi scheme nahi mili.</p> : (
            results.matched_schemes.map((scheme) => (
              <div key={scheme.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '5px', marginBottom: '10px', backgroundColor: '#fff' }}>
                <h4>{scheme.scheme_name}</h4>
                <p>{scheme.description}</p>
                <p><strong>Zaroori Documents:</strong> {scheme.required_documents.join(', ')}</p>
                <a href={scheme.official_link} target="_blank" rel="noreferrer" style={{ color: '#3182ce' }}>Official Link pe jayein</a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;