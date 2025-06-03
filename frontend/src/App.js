import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState('');
  const [medicationInfo, setMedicationInfo] = useState(null);
  const [userId] = useState('demo-user-' + Math.random().toString(36).substr(2, 9));
  const [healthRecords, setHealthRecords] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (currentView === 'records') {
      fetchHealthRecords();
    } else if (currentView === 'insights') {
      fetchHealthInsights();
    }
  }, [currentView]);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      alert('Please enter your symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          medical_history: medicalHistory || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
      
      // Save to health records
      await saveHealthRecord('symptom_analysis', {
        symptoms,
        analysis_id: result.analysis_id,
        urgency_level: result.urgency_level
      });
      
    } catch (error) {
      alert('Error analyzing symptoms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkMedication = async () => {
    if (!medication.trim()) {
      alert('Please enter a medication name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/medication-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication_name: medication,
        }),
      });

      if (!response.ok) {
        throw new Error('Medication check failed');
      }

      const result = await response.json();
      setMedicationInfo(result);
      
    } catch (error) {
      alert('Error checking medication: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveHealthRecord = async (recordType, data) => {
    try {
      await fetch(`${BACKEND_URL}/api/health-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          record_type: recordType,
          data: data,
          date: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error saving health record:', error);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health-records/${userId}`);
      if (response.ok) {
        const result = await response.json();
        setHealthRecords(result.records || []);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
    }
  };

  const fetchHealthInsights = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health-insights/${userId}`);
      if (response.ok) {
        const result = await response.json();
        setInsights(result);
      }
    } catch (error) {
      console.error('Error fetching health insights:', error);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'EMERGENCY': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Health Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get intelligent health insights, symptom analysis, and personalized health recommendations powered by advanced AI
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setCurrentView('symptoms')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="text-3xl mb-3">🩺</div>
          <h3 className="text-xl font-semibold mb-2">Symptom Analysis</h3>
          <p className="text-blue-100">AI-powered symptom checker and health guidance</p>
        </div>

        <div 
          onClick={() => setCurrentView('medication')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="text-3xl mb-3">💊</div>
          <h3 className="text-xl font-semibold mb-2">Medication Info</h3>
          <p className="text-green-100">Check medications and potential interactions</p>
        </div>

        <div 
          onClick={() => setCurrentView('records')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-xl font-semibold mb-2">Health Records</h3>
          <p className="text-purple-100">Track and manage your health history</p>
        </div>

        <div 
          onClick={() => setCurrentView('insights')}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-xl font-semibold mb-2">Health Insights</h3>
          <p className="text-orange-100">AI-generated health insights and trends</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
              <span className="text-blue-600 text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">AI Symptom Analysis</h4>
              <p className="text-gray-600 text-sm">Get intelligent analysis of your symptoms with urgency assessment</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Medication Information</h4>
              <p className="text-gray-600 text-sm">Check drug interactions and get medication guidance</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
              <span className="text-purple-600 text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Health Tracking</h4>
              <p className="text-gray-600 text-sm">Maintain comprehensive health records and history</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
              <span className="text-orange-600 text-sm">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Personalized Insights</h4>
              <p className="text-gray-600 text-sm">AI-generated health insights based on your data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSymptoms = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Symptom Analysis</h2>
        <p className="text-gray-600">Describe your symptoms for AI-powered health guidance</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your symptoms *
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age (optional)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender (optional)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical history (optional)
            </label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Any relevant medical conditions, allergies, or medications..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          <button
            onClick={analyzeSymptoms}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.urgency_level)}`}>
              {analysis.urgency_level}
            </span>
          </div>
          
          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">AI Analysis:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{analysis.analysis}</p>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Medical Disclaimer</h4>
                  <p className="text-sm text-yellow-700 mt-1">{analysis.disclaimer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMedication = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Medication Information</h2>
        <p className="text-gray-600">Get information about medications and potential interactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication name *
            </label>
            <input
              type="text"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="Enter medication name (e.g., Aspirin, Ibuprofen)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={checkMedication}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Checking...' : 'Get Medication Info'}
          </button>
        </div>
      </div>

      {medicationInfo && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Medication Information: {medicationInfo.medication}</h3>
          
          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Information:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{medicationInfo.information}</p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Important</h4>
                  <p className="text-sm text-blue-700 mt-1">{medicationInfo.disclaimer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecords = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Health Records</h2>
        <p className="text-gray-600">Your health history and recorded data</p>
      </div>

      <div className="space-y-4">
        {healthRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No health records yet</h3>
            <p className="text-gray-600">Start using the symptom analyzer to build your health history</p>
          </div>
        ) : (
          healthRecords.map((record, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  {new Date(record.date).toLocaleDateString()}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {record.record_type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-gray-700">
                {record.record_type === 'symptom_analysis' && (
                  <div>
                    <p className="font-medium mb-1">Symptoms analyzed: {record.data.symptoms}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(record.data.urgency_level)}`}>
                      {record.data.urgency_level}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Health Insights</h2>
        <p className="text-gray-600">AI-generated insights based on your health data</p>
      </div>

      {insights ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{insights.total_records}</div>
                <div className="text-sm text-blue-700">Health Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{insights.recent_vital_signs}</div>
                <div className="text-sm text-green-700">Vital Signs</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-purple-600">AI</div>
                <div className="text-sm text-purple-700">Powered</div>
              </div>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Health Insights</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{insights.insights}</p>
            </div>
            
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mt-4">
              <p className="text-sm text-gray-600">{insights.disclaimer}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading insights...</h3>
          <p className="text-gray-600">Generating your personalized health insights</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">🏥 HealthAI</span>
            </div>
            
            <div className="flex space-x-4">
              {['dashboard', 'symptoms', 'medication', 'records', 'insights'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'symptoms' && renderSymptoms()}
        {currentView === 'medication' && renderMedication()}
        {currentView === 'records' && renderRecords()}
        {currentView === 'insights' && renderInsights()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">🏥 AI Health Assistant - Your Personal Health Companion</p>
            <p className="text-sm">This tool provides general health information for educational purposes only. Always consult qualified healthcare professionals for medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;