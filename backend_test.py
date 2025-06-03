import requests
import unittest
import json
import uuid
from datetime import datetime

class AIHealthAssistantAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://580a8206-00b5-40d7-80e4-0ce2a497e941.preview.emergentagent.com/api"
        self.user_id = f"test-user-{uuid.uuid4()}"
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0
        }

    def test_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        self.test_results["total"] += 1
        
        try:
            response = requests.get(f"{self.base_url}/health-check")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["service"], "AI Health Assistant")
            
            print("✅ Health check endpoint test passed")
            self.test_results["passed"] += 1
        except Exception as e:
            print(f"❌ Health check endpoint test failed: {str(e)}")
            self.test_results["failed"] += 1
            raise

    def test_analyze_symptoms(self):
        """Test the symptom analysis endpoint"""
        print("\n🔍 Testing symptom analysis endpoint...")
        self.test_results["total"] += 1
        
        try:
            payload = {
                "symptoms": "I have a headache and feel tired",
                "age": 35,
                "gender": "Female",
                "medical_history": "No significant medical history"
            }
            
            response = requests.post(f"{self.base_url}/analyze-symptoms", json=payload)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertIn("analysis_id", data)
            self.assertIn("analysis", data)
            self.assertIn("recommendations", data)
            self.assertIn("urgency_level", data)
            self.assertIn("disclaimer", data)
            self.assertIn("created_at", data)
            
            # Verify urgency level is one of the expected values
            self.assertIn(data["urgency_level"], ["EMERGENCY", "HIGH", "MODERATE", "LOW"])
            
            print("✅ Symptom analysis endpoint test passed")
            self.test_results["passed"] += 1
        except Exception as e:
            print(f"❌ Symptom analysis endpoint test failed: {str(e)}")
            self.test_results["failed"] += 1
            raise

    def test_medication_check(self):
        """Test the medication check endpoint"""
        print("\n🔍 Testing medication check endpoint...")
        self.test_results["total"] += 1
        
        try:
            payload = {
                "medication_name": "Aspirin",
                "dosage": "100mg",
                "current_medications": ["Lisinopril"]
            }
            
            response = requests.post(f"{self.base_url}/medication-check", json=payload)
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data["medication"], "Aspirin")
            self.assertIn("information", data)
            self.assertIn("disclaimer", data)
            
            print("✅ Medication check endpoint test passed")
            self.test_results["passed"] += 1
        except Exception as e:
            print(f"❌ Medication check endpoint test failed: {str(e)}")
            self.test_results["failed"] += 1
            raise

    def test_health_records(self):
        """Test the health records endpoints"""
        print("\n🔍 Testing health records endpoints...")
        self.test_results["total"] += 1
        
        try:
            # Create a health record
            record_data = {
                "user_id": self.user_id,
                "record_type": "symptom_analysis",
                "data": {
                    "symptoms": "Headache and fatigue",
                    "urgency_level": "MODERATE"
                },
                "date": datetime.now().isoformat()
            }
            
            create_response = requests.post(f"{self.base_url}/health-records", json=record_data)
            self.assertEqual(create_response.status_code, 200)
            create_data = create_response.json()
            self.assertIn("record_id", create_data)
            
            # Get health records for the user
            get_response = requests.get(f"{self.base_url}/health-records/{self.user_id}")
            self.assertEqual(get_response.status_code, 200)
            
            get_data = get_response.json()
            self.assertIn("records", get_data)
            self.assertGreaterEqual(len(get_data["records"]), 1)
            
            # Verify the record we created is in the response
            found = False
            for record in get_data["records"]:
                if record["user_id"] == self.user_id and record["record_type"] == "symptom_analysis":
                    found = True
                    break
            
            self.assertTrue(found, "Created record not found in get records response")
            
            print("✅ Health records endpoints test passed")
            self.test_results["passed"] += 1
        except Exception as e:
            print(f"❌ Health records endpoints test failed: {str(e)}")
            self.test_results["failed"] += 1
            raise

    def test_health_insights(self):
        """Test the health insights endpoint"""
        print("\n🔍 Testing health insights endpoint...")
        self.test_results["total"] += 1
        
        try:
            response = requests.get(f"{self.base_url}/health-insights/{self.user_id}")
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data["user_id"], self.user_id)
            self.assertIn("insights", data)
            self.assertIn("total_records", data)
            self.assertIn("recent_vital_signs", data)
            self.assertIn("disclaimer", data)
            
            print("✅ Health insights endpoint test passed")
            self.test_results["passed"] += 1
        except Exception as e:
            print(f"❌ Health insights endpoint test failed: {str(e)}")
            self.test_results["failed"] += 1
            raise

    def tearDown(self):
        print(f"\n📊 Test Results: {self.test_results['passed']}/{self.test_results['total']} tests passed")

if __name__ == "__main__":
    unittest.main()
