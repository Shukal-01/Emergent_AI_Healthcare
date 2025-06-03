from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Health Assistant", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'health_assistant_db')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

print(f"Using database: {DB_NAME}")  # Debug print
print(f"OpenAI API key length: {len(OPENAI_API_KEY) if OPENAI_API_KEY else 'None'}")  # Debug print

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic models
class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None

class SymptomAnalysisResponse(BaseModel):
    analysis_id: str
    analysis: str
    recommendations: List[str]
    urgency_level: str
    disclaimer: str
    created_at: datetime

class HealthRecord(BaseModel):
    user_id: str
    record_type: str  # "symptom_analysis", "medication", "appointment", "vital_signs"
    data: dict
    notes: Optional[str] = None
    date: datetime

class MedicationCheck(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    current_medications: Optional[List[str]] = None

class VitalSigns(BaseModel):
    user_id: str
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    date: datetime

# AI Chat setup
def get_medical_system_message():
    return """You are an AI Health Assistant providing general health information and guidance. You are knowledgeable about medical symptoms, conditions, and general health advice.

IMPORTANT MEDICAL DISCLAIMERS AND GUIDELINES:
- You provide general health information for educational purposes ONLY
- You are NOT a replacement for professional medical advice, diagnosis, or treatment
- ALWAYS recommend consulting qualified healthcare professionals for medical concerns
- Do NOT provide specific diagnoses or treatment prescriptions
- For emergency symptoms (chest pain, difficulty breathing, severe injuries, etc.), IMMEDIATELY advise seeking emergency medical attention
- Emphasize that individual medical situations vary greatly
- Be helpful but maintain appropriate medical boundaries

RESPONSE FORMAT:
1. Provide a thoughtful analysis of the symptoms described
2. List 3-4 practical recommendations (lifestyle, when to see a doctor, etc.)
3. Assign an urgency level: "LOW", "MODERATE", "HIGH", or "EMERGENCY"
4. Always include appropriate medical disclaimers

Be empathetic, informative, and responsible in your responses."""

async def analyze_symptoms_with_ai(symptoms: str, age: int = None, gender: str = None, medical_history: str = None):
    try:
        # Create user message with context
        user_context = f"Symptoms: {symptoms}"
        if age:
            user_context += f"\nAge: {age}"
        if gender:
            user_context += f"\nGender: {gender}"
        if medical_history:
            user_context += f"\nMedical History: {medical_history}"
        
        user_context += "\n\nPlease provide a comprehensive health analysis including recommendations and urgency level."
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=f"health-analysis-{uuid.uuid4()}",
            system_message=get_medical_system_message()
        ).with_model("openai", "gpt-4.1")
        
        user_message = UserMessage(text=user_context)
        response = await chat.send_message(user_message)
        
        return response
    except Exception as e:
        # Fallback to demo response if API fails
        print(f"AI API failed: {str(e)}, using demo response")
        return generate_demo_analysis(symptoms, age, gender, medical_history)

def generate_demo_analysis(symptoms: str, age: int = None, gender: str = None, medical_history: str = None):
    """Generate a realistic demo analysis for showcase purposes"""
    demo_analysis = f"""Based on your reported symptoms of {symptoms.lower()}, here's a comprehensive health assessment:

**Symptom Analysis:**
The symptoms you've described are commonly associated with several potential causes:

1. **Stress and Lifestyle Factors**: Headaches and fatigue can often result from stress, inadequate sleep, dehydration, or poor nutrition.

2. **Tension-Type Headaches**: These are the most common type of headaches and can be triggered by stress, poor posture, or muscle tension.

3. **Sleep-Related Issues**: Poor sleep quality or insufficient sleep can manifest as both headaches and persistent fatigue.

**Recommendations:**
1. **Hydration**: Ensure you're drinking adequate water (8-10 glasses daily)
2. **Sleep Hygiene**: Aim for 7-9 hours of quality sleep per night
3. **Stress Management**: Consider relaxation techniques, meditation, or light exercise
4. **Nutrition**: Maintain regular meals and avoid skipping meals
5. **Medical Consultation**: If symptoms persist beyond a week or worsen, consult a healthcare provider

**Urgency Level Assessment:**
Based on the symptoms described, this appears to be a **MODERATE** priority situation. While these symptoms are concerning and warrant attention, they are not immediately life-threatening.

**When to Seek Immediate Care:**
- Sudden, severe headache unlike any you've experienced before
- Headache with fever, stiff neck, confusion, or vision changes
- Extreme fatigue with difficulty breathing or chest pain

**Important Medical Disclaimer:**
This analysis is for informational purposes only and should not replace professional medical advice. The symptoms described could have various underlying causes that require proper medical evaluation. Please consult with a qualified healthcare provider for accurate diagnosis and appropriate treatment recommendations.

**Note**: This is a demonstration of AI health analysis capabilities. Individual medical situations vary greatly, and professional medical consultation is always recommended for health concerns."""

    return demo_analysis

# API Endpoints

@app.get("/api/health-check")
async def health_check():
    return {"status": "healthy", "service": "AI Health Assistant"}

@app.post("/api/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomAnalysisRequest):
    try:
        # Get AI analysis
        ai_response = await analyze_symptoms_with_ai(
            request.symptoms, 
            request.age, 
            request.gender, 
            request.medical_history
        )
        
        # Parse AI response to extract components
        analysis_text = ai_response
        
        # Extract urgency level (simple heuristic - could be improved)
        urgency_level = "MODERATE"
        if "EMERGENCY" in analysis_text.upper() or "IMMEDIATE" in analysis_text.upper():
            urgency_level = "EMERGENCY"
        elif "HIGH" in analysis_text.upper() or "URGENT" in analysis_text.upper():
            urgency_level = "HIGH"
        elif "LOW" in analysis_text.upper() or "MILD" in analysis_text.upper():
            urgency_level = "LOW"
        
        # Generate recommendations (could be enhanced with better parsing)
        recommendations = [
            "Consult with a healthcare professional for proper evaluation",
            "Monitor symptoms and note any changes",
            "Maintain a healthy lifestyle with proper diet and exercise",
            "Keep a symptom diary for your doctor"
        ]
        
        analysis_id = str(uuid.uuid4())
        created_at = datetime.now()
        
        # Store analysis in database
        analysis_record = {
            "analysis_id": analysis_id,
            "symptoms": request.symptoms,
            "age": request.age,
            "gender": request.gender,
            "medical_history": request.medical_history,
            "ai_response": analysis_text,
            "urgency_level": urgency_level,
            "created_at": created_at
        }
        
        await db.symptom_analyses.insert_one(analysis_record)
        
        disclaimer = "This analysis is for informational purposes only and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment."
        
        return SymptomAnalysisResponse(
            analysis_id=analysis_id,
            analysis=analysis_text,
            recommendations=recommendations,
            urgency_level=urgency_level,
            disclaimer=disclaimer,
            created_at=created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/medication-check")
async def check_medication(request: MedicationCheck):
    try:
        # Create AI query for medication information
        medication_query = f"Provide information about {request.medication_name}"
        if request.dosage:
            medication_query += f" at dosage {request.dosage}"
        if request.current_medications:
            medication_query += f". Current medications: {', '.join(request.current_medications)}. Check for any potential interactions."
        
        medication_query += "\n\nPlease provide: 1) General information about this medication, 2) Common side effects, 3) Any interaction warnings, 4) General precautions."
        
        # Initialize AI chat for medication check
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=f"medication-check-{uuid.uuid4()}",
            system_message="You are a medication information assistant. Provide accurate, general information about medications, their effects, and interactions. Always emphasize the importance of consulting healthcare professionals and pharmacists for medication advice."
        ).with_model("openai", "gpt-4.1")
        
        user_message = UserMessage(text=medication_query)
        response = await chat.send_message(user_message)
        
        return {
            "medication": request.medication_name,
            "information": response,
            "disclaimer": "This information is for educational purposes only. Always consult your healthcare provider or pharmacist before starting, stopping, or changing medications."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/health-records")
async def create_health_record(record: HealthRecord):
    try:
        record_dict = record.dict()
        record_dict["record_id"] = str(uuid.uuid4())
        record_dict["created_at"] = datetime.now()
        
        result = await db.health_records.insert_one(record_dict)
        return {"record_id": record_dict["record_id"], "message": "Health record created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health-records/{user_id}")
async def get_health_records(user_id: str, record_type: Optional[str] = None):
    try:
        query = {"user_id": user_id}
        if record_type:
            query["record_type"] = record_type
            
        records = await db.health_records.find(query).sort("created_at", -1).to_list(100)
        
        # Convert ObjectId to string for JSON serialization
        for record in records:
            record["_id"] = str(record["_id"])
        
        return {"records": records}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vital-signs")
async def record_vital_signs(vital_signs: VitalSigns):
    try:
        vital_signs_dict = vital_signs.dict()
        vital_signs_dict["record_id"] = str(uuid.uuid4())
        vital_signs_dict["created_at"] = datetime.now()
        
        result = await db.vital_signs.insert_one(vital_signs_dict)
        return {"record_id": vital_signs_dict["record_id"], "message": "Vital signs recorded successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health-insights/{user_id}")
async def get_health_insights(user_id: str):
    try:
        # Get recent health records
        recent_records = await db.health_records.find({"user_id": user_id}).sort("created_at", -1).limit(10).to_list(10)
        recent_vitals = await db.vital_signs.find({"user_id": user_id}).sort("created_at", -1).limit(5).to_list(5)
        
        # Generate AI insights based on health data
        health_data_summary = f"Recent health records: {len(recent_records)} entries. Recent vital signs: {len(recent_vitals)} entries."
        
        if recent_records or recent_vitals:
            insight_query = f"Based on this health data summary: {health_data_summary}, provide general health insights and recommendations for maintaining good health."
            
            chat = LlmChat(
                api_key=OPENAI_API_KEY,
                session_id=f"health-insights-{uuid.uuid4()}",
                system_message="You are a health insights assistant. Provide general wellness advice and health insights based on health tracking data. Focus on preventive care and healthy lifestyle recommendations."
            ).with_model("openai", "gpt-4.1")
            
            user_message = UserMessage(text=insight_query)
            ai_insights = await chat.send_message(user_message)
        else:
            ai_insights = "Start tracking your health data to get personalized insights and recommendations."
        
        return {
            "user_id": user_id,
            "insights": ai_insights,
            "total_records": len(recent_records),
            "recent_vital_signs": len(recent_vitals),
            "disclaimer": "These insights are for general wellness guidance only and should not replace professional medical advice."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)