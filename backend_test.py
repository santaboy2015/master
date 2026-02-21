#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class RizzAITester:
    def __init__(self, base_url="https://charm-assist-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def log(self, message, status="INFO"):
        print(f"[{status}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "TEST")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            self.log(f"Status: {response.status_code}, Expected: {expected_status}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name}")
            else:
                self.log(f"❌ FAILED - {name} (Status: {response.status_code})")
                try:
                    self.log(f"Response: {response.text[:200]}")
                except:
                    pass

            try:
                response_data = response.json() if response.content else {}
                return success, response_data, response.status_code
            except:
                return success, {"raw_response": response.text}, response.status_code

        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}")
            return False, {"error": str(e)}, 0

    def create_test_user_session(self):
        """Create test user and session in MongoDB"""
        self.log("Creating test user and session...")
        import subprocess
        
        timestamp = int(datetime.now().timestamp())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        email = f"test.user.{timestamp}@example.com"
        
        mongo_script = f"""
mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
var email = '{email}';
db.users.insertOne({{
  user_id: userId,
  email: email,
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  subscription_tier: 'pro',
  credits_used: 0,
  monthly_credits: 100,
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Session created successfully');
"
        """
        
        try:
            result = subprocess.run(mongo_script, shell=True, capture_output=True, text=True)
            if "Session created successfully" in result.stdout or result.returncode == 0:
                self.token = session_token
                self.user_id = user_id
                self.log(f"✅ Test user created - User ID: {user_id}")
                self.log(f"✅ Session token: {session_token}")
                return True
            else:
                self.log(f"❌ Failed to create test user: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Error creating test user: {e}")
            return False

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        self.log("Cleaning up test data...")
        import subprocess
        
        mongo_script = """
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\\.user\\./});
db.user_sessions.deleteMany({session_token: /test_session/});
print('Cleanup completed');
"
        """
        
        try:
            subprocess.run(mongo_script, shell=True)
            self.log("✅ Test data cleaned up")
        except Exception as e:
            self.log(f"❌ Cleanup error: {e}")

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        self.log("=== Testing Health Endpoints ===")
        
        # Test root API endpoint
        success, data, status = self.run_test("API Root", "GET", "/", 200)
        if success and "Rizz AI API is running" not in str(data):
            self.log("⚠️  API root message unexpected")
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "/health", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        self.log("=== Testing Auth Endpoints ===")
        
        # Test /auth/me with valid token
        success, data, status = self.run_test("Get User Info", "GET", "/auth/me", 200)
        if success:
            if "user_id" not in data or "email" not in data:
                self.log("⚠️  Auth response missing required fields")
                return False
            self.log(f"✅ User authenticated: {data.get('email', 'N/A')}")
            return True
        return False

    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        self.log("=== Testing Subscription Endpoints ===")
        
        # Test get subscription plans
        success, data, status = self.run_test("Get Subscription Plans", "GET", "/subscriptions/plans", 200)
        if success:
            if not isinstance(data, list) or len(data) < 3:
                self.log("⚠️  Expected at least 3 subscription plans")
            else:
                plan_ids = [plan.get('plan_id') for plan in data if isinstance(plan, dict)]
                if 'free' not in plan_ids or 'pro' not in plan_ids:
                    self.log("⚠️  Missing expected plan types")
                self.log(f"✅ Found {len(data)} subscription plans")

    def test_ai_endpoints(self):
        """Test AI-powered endpoints"""
        self.log("=== Testing AI Endpoints ===")
        
        # Test conversation starters
        conversation_data = {
            "context": "They love hiking and have a golden retriever named Max",
            "tone": "playful",
            "platform": "tinder"
        }
        success, data, status = self.run_test(
            "Generate Conversation Starters", 
            "POST", 
            "/ai/conversation-starters", 
            200, 
            conversation_data
        )
        if success and "content" not in data:
            self.log("⚠️  AI response missing content field")

        # Test chat reply
        chat_data = {
            "conversation_context": "We matched yesterday and talked about coffee",
            "their_message": "What's your favorite coffee shop?",
            "tone": "witty"
        }
        success, data, status = self.run_test(
            "Generate Chat Reply", 
            "POST", 
            "/ai/chat-reply", 
            200, 
            chat_data
        )
        if success and "content" not in data:
            self.log("⚠️  AI response missing content field")

        # Test bio generator
        bio_data = {
            "interests": ["hiking", "photography", "cooking"],
            "personality": "funny",
            "looking_for": "relationship",
            "age": 28
        }
        success, data, status = self.run_test(
            "Generate Bio", 
            "POST", 
            "/ai/bio-generator", 
            200, 
            bio_data
        )
        if success and "content" not in data:
            self.log("⚠️  AI response missing content field")

        # Test profile review
        review_data = {
            "bio": "Love to travel and try new foods. Dog lover and adventure seeker.",
            "photos_description": "Main photo hiking, second with friends",
            "platform": "tinder"
        }
        success, data, status = self.run_test(
            "Profile Review", 
            "POST", 
            "/ai/profile-review", 
            200, 
            review_data
        )
        if success and "content" not in data:
            self.log("⚠️  AI response missing content field")

    def test_user_stats(self):
        """Test user statistics endpoint"""
        self.log("=== Testing User Stats ===")
        
        success, data, status = self.run_test("Get User Stats", "GET", "/stats", 200)
        if success:
            expected_fields = ['credits_used', 'credits_remaining', 'monthly_credits', 'subscription_tier']
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log(f"⚠️  Stats missing fields: {missing_fields}")
            else:
                self.log(f"✅ Stats complete: {data.get('credits_remaining', 0)} credits remaining")

    def test_without_auth(self):
        """Test endpoints without authentication"""
        self.log("=== Testing Unauthorized Access ===")
        
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        # Should return 401 for protected endpoints
        self.run_test("Unauthorized Auth Check", "GET", "/auth/me", 401)
        self.run_test("Unauthorized Stats", "GET", "/stats", 401)
        self.run_test("Unauthorized AI Request", "POST", "/ai/conversation-starters", 401, {"context": "test"})
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        self.log("🚀 Starting Rizz AI Backend API Tests")
        self.log(f"Testing against: {self.api_url}")
        
        # Create test user and session
        if not self.create_test_user_session():
            self.log("❌ Failed to create test user, stopping tests")
            return False
        
        try:
            # Run all test suites
            self.test_health_endpoints()
            
            auth_success = self.test_auth_endpoints()
            if not auth_success:
                self.log("❌ Auth failed, skipping remaining tests")
                return False
                
            self.test_subscription_endpoints()
            self.test_ai_endpoints()
            self.test_user_stats()
            self.test_without_auth()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print final results
        self.log("=" * 50)
        self.log(f"📊 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("❌ Some tests failed")
            return False

def main():
    """Main test runner"""
    tester = RizzAITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())