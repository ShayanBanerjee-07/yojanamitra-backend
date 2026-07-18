from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from supabase import create_client, Client
from openai import OpenAI
import json
from dotenv import load_dotenv

# Environment variables load karna
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to YojanaMitra AI Backend! The API is running successfully."}

# Frontend se connect karne ke liye CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# 2 Groq keys in one list
groq_keys = [os.getenv("GROQ_API_KEY_1"), os.getenv("GROQ_API_KEY_2")]

class UserInput(BaseModel):
    text: str

# ----------------- ROUTE 1: Search Schemes (LLaMA 3.) -----------------
@app.post("/api/search-schemes")
async def search_schemes(user_input: UserInput):
    try:
        system_prompt = """
        You are an expert AI data extractor. Extract the user details from the text and return ONLY a valid JSON object.
        Do not include any markdown formatting like ```json ... ```. Just return the raw JSON.
        Fields to extract:
        - age (integer, default 25 if not mentioned)
        - occupation (string: 'Farmer', 'Student', 'Daily Wager', etc.)
        - state (string: e.g. 'Chhattisgarh')
        - annual_income (integer)
        """
        
        ai_response_text = None
        
        # API Key Rotation Logic
        for key in groq_keys:
            if not key: continue # skip if key is None or empty
            try:
                client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant", # new upgraded model
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_input.text}
                    ],
                    temperature=0
                )
                ai_response_text = response.choices[0].message.content.strip()
                break # if one key works, break the loop and don't try the next key
            
            except Exception as e:
                if "429" in str(e) or "insufficient_quota" in str(e):
                    print("Rate limit reached for current key, switching to next key...")
                    continue # If limit is exceeded, continue to the next key
                else:
                    raise e # If any other error occurs, raise it normally
        
        if not ai_response_text:
            raise Exception("Donon API keys ki limit exhaust ho chuki hai!")

        extracted_data = json.loads(ai_response_text)
        
        # Step B: Database Query
        age = extracted_data.get("age", 25)
        occupation = extracted_data.get("occupation", "Student")
        income = extracted_data.get("annual_income", 500000)
        state = extracted_data.get("state", "All India")

        query = supabase.table("government_schemes").select("*")\
            .lte("min_age", age)\
            .gte("max_age", age)\
            .gte("max_annual_income", income)
            
        result = query.execute()
        
        return {
            "extracted_profile": extracted_data,
            "matched_schemes": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- ROUTE 2: Voice to Text (Whisper-Large-v3) -----------------
@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        transcribed_text = None
        
        # API Key Rotation Logic for Audio
        for key in groq_keys:
            if not key: continue
            try:
                client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
                with open(temp_file_path, "rb") as audio_file:
                    transcript = client.audio.transcriptions.create(
                        model="whisper-large-v3", 
                        file=audio_file,
                        language="hi"
                    )
                transcribed_text = transcript.text
                break
                
            except Exception as e:
                if "429" in str(e) or "insufficient_quota" in str(e):
                    print("Audio limits reached for current key, switching to next...")
                    continue
                else:
                    raise e
        
        os.remove(temp_file_path) # delete the temp file after processing
        
        if not transcribed_text:
            raise Exception("Donon API keys ki limit exhaust ho chuki hai!")
            
        return {"transcribed_text": transcribed_text}
        
    except Exception as e:
        # cleanup temp file in case of error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- RUN SERVER -----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)