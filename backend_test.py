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
db.users.deleteMany({email: 'sevillajames2001@gmail.com'});
db.user_sessions.deleteMany({session_token: /test_session/});
db.user_sessions.deleteMany({session_token: /admin_session/});
db.admin_sessions.deleteMany({});
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

    def test_public_settings(self):
        """Test public settings endpoints"""
        self.log("=== Testing Public Settings ===")
        
        # Test public site settings
        success, data, status = self.run_test("Get Site Settings", "GET", "/settings/site", 200)
        if success:
            expected_fields = ['hero_title', 'hero_subtitle', 'features']
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log(f"⚠️  Site settings missing fields: {missing_fields}")
            else:
                self.log(f"✅ Site settings loaded: {data.get('hero_title', 'N/A')}")
        
        # Test public pricing
        success, data, status = self.run_test("Get Public Pricing", "GET", "/settings/pricing", 200)
        if success and isinstance(data, list):
            self.log(f"✅ Pricing plans loaded: {len(data)} plans")
        elif success:
            self.log("⚠️  Pricing response not a list")

    def test_image_upload(self):
        """Test image upload endpoint"""
        self.log("=== Testing Image Upload ===")
        
        # Create a small test image (1x1 PNG)
        import base64
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        test_image = base64.b64decode(test_image_b64)
        
        # Test image upload with multipart form
        try:
            files = {'file': ('test.png', test_image, 'image/png')}
            headers = {}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
            
            response = self.session.post(f"{self.api_url}/upload/image", files=files, headers=headers)
            
            self.tests_run += 1
            if response.status_code == 200:
                self.tests_passed += 1
                self.log("✅ PASSED - Image Upload")
                try:
                    data = response.json()
                    if 'image_data' in data:
                        self.log(f"✅ Image processed successfully")
                    else:
                        self.log("⚠️  Upload response missing image_data")
                except:
                    self.log("⚠️  Upload response not JSON")
            else:
                self.log(f"❌ FAILED - Image Upload (Status: {response.status_code})")
                self.log(f"Response: {response.text[:200]}")
        except Exception as e:
            self.tests_run += 1
            self.log(f"❌ FAILED - Image Upload - Error: {str(e)}")

    def create_admin_user_session(self):
        """Create admin user session for testing admin features"""
        self.log("Creating admin user and session...")
        import subprocess
        
        timestamp = int(datetime.now().timestamp())
        admin_user_id = f"admin-user-{timestamp}"
        admin_session_token = f"admin_session_{timestamp}"
        admin_email = "sevillajames2001@gmail.com"  # Admin email from requirements
        
        mongo_script = f"""
mongosh --eval "
use('test_database');
var userId = '{admin_user_id}';
var sessionToken = '{admin_session_token}';
var email = '{admin_email}';
db.users.insertOne({{
  user_id: userId,
  email: email,
  name: 'Admin Test User',
  picture: 'https://via.placeholder.com/150',
  subscription_tier: 'premium',
  credits_used: 0,
  monthly_credits: 500,
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
db.admin_sessions.insertOne({{
  user_id: userId,
  expires_at: new Date(Date.now() + 8*60*60*1000),
  created_at: new Date()
}});
print('Admin session created successfully');
"
        """
        
        try:
            result = subprocess.run(mongo_script, shell=True, capture_output=True, text=True)
            if "Admin session created successfully" in result.stdout or result.returncode == 0:
                self.admin_token = admin_session_token
                self.admin_user_id = admin_user_id
                self.log(f"✅ Admin user created - User ID: {admin_user_id}")
                return True
            else:
                self.log(f"❌ Failed to create admin user: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Error creating admin user: {e}")
            return False

    def test_admin_login(self):
        """Test admin login functionality"""
        self.log("=== Testing Admin Login ===")
        
        # Use admin token
        original_token = self.token
        self.token = getattr(self, 'admin_token', None)
        
        if not self.token:
            self.log("❌ No admin token available")
            self.token = original_token
            return False
        
        # Test admin login with password
        admin_login_data = {
            "email": "sevillajames2001@gmail.com",
            "password": "RizzAdmin2024!"
        }
        
        success, data, status = self.run_test(
            "Admin Login", 
            "POST", 
            "/admin/login", 
            200, 
            admin_login_data
        )
        
        self.token = original_token
        return success

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        self.log("=== Testing Admin Endpoints ===")
        
        # Use admin token for admin tests
        original_token = self.token
        self.token = getattr(self, 'admin_token', None)
        
        if not self.token:
            self.log("❌ No admin token available, skipping admin tests")
            return False
        
        # Test admin analytics
        success, data, status = self.run_test("Admin Analytics", "GET", "/admin/analytics", 200)
        if success:
            expected_fields = ['total_users', 'subscription_breakdown', 'total_credits_used']
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log(f"⚠️  Analytics missing fields: {missing_fields}")
            else:
                self.log(f"✅ Analytics complete: {data.get('total_users', 0)} total users")
        
        # Test admin site settings
        self.run_test("Admin Get Site Settings", "GET", "/admin/settings/site", 200)
        
        # Test admin pricing settings
        self.run_test("Admin Get Pricing Settings", "GET", "/admin/settings/pricing", 200)
        
        # Test admin AI prompts
        self.run_test("Admin Get AI Prompts", "GET", "/admin/settings/prompts", 200)
        
        # Test admin API keys
        success, data, status = self.run_test("Admin Get API Keys", "GET", "/admin/settings/api-keys", 200)
        if success:
            expected_fields = ['has_emergent_key', 'has_stripe_key']
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log(f"⚠️  API keys response missing fields: {missing_fields}")
            else:
                self.log(f"✅ API keys status: Emergent={data.get('has_emergent_key')}, Stripe={data.get('has_stripe_key')}")
        
        # Test admin users list
        self.run_test("Admin Get Users", "GET", "/admin/users", 200)
        
        # Restore original token
        self.token = original_token
        return True

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
        
        # Should return 403 for admin endpoints
        self.run_test("Unauthorized Admin Analytics", "GET", "/admin/analytics", 401)
        self.run_test("Unauthorized Admin Users", "GET", "/admin/users", 401)
        
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
        
        # Create admin user for admin tests
        admin_created = self.create_admin_user_session()
        
        try:
            # Run all test suites
            self.test_health_endpoints()
            self.test_public_settings()
            
            auth_success = self.test_auth_endpoints()
            if not auth_success:
                self.log("❌ Auth failed, skipping remaining tests")
                return False
                
            self.test_subscription_endpoints()
            self.test_ai_endpoints()
            self.test_user_stats()
            self.test_image_upload()
            
            # Admin tests if admin user was created
            if admin_created:
                self.test_admin_login()
                self.test_admin_endpoints()
            else:
                self.log("⚠️  Skipping admin tests - admin user creation failed")
            
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
            failed_count = self.tests_run - self.tests_passed
            self.log(f"❌ {failed_count} tests failed")
            return False

def main():
    """Main test runner"""
    tester = RizzAITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())