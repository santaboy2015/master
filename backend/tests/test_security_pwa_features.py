"""
Tests for Production Hardening, PWA, and Deep Linking Features
- Security Headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Health Check Endpoint
- Request ID Header
- PWA Assets (manifest.json, logos, service-worker.js)
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://matchmake-ai-tool.preview.emergentagent.com').rstrip('/')

class TestSecurityHeaders:
    """Test security headers are present on API responses"""
    
    def test_x_content_type_options_header(self):
        """Verify X-Content-Type-Options: nosniff header"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert "X-Content-Type-Options" in response.headers or "x-content-type-options" in response.headers
        header_value = response.headers.get("X-Content-Type-Options") or response.headers.get("x-content-type-options")
        assert header_value == "nosniff", f"Expected 'nosniff', got '{header_value}'"
        print("✓ X-Content-Type-Options: nosniff header present")
    
    def test_x_frame_options_header(self):
        """Verify X-Frame-Options: DENY header"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("X-Frame-Options") or response.headers.get("x-frame-options")
        assert header_value == "DENY", f"Expected 'DENY', got '{header_value}'"
        print("✓ X-Frame-Options: DENY header present")
    
    def test_x_xss_protection_header(self):
        """Verify X-XSS-Protection header"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("X-XSS-Protection") or response.headers.get("x-xss-protection")
        assert header_value == "1; mode=block", f"Expected '1; mode=block', got '{header_value}'"
        print("✓ X-XSS-Protection: 1; mode=block header present")
    
    def test_referrer_policy_header(self):
        """Verify Referrer-Policy header"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("Referrer-Policy") or response.headers.get("referrer-policy")
        assert header_value == "strict-origin-when-cross-origin", f"Expected 'strict-origin-when-cross-origin', got '{header_value}'"
        print("✓ Referrer-Policy: strict-origin-when-cross-origin header present")
    
    def test_permissions_policy_header(self):
        """Verify Permissions-Policy header"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("Permissions-Policy") or response.headers.get("permissions-policy")
        assert "geolocation=()" in header_value, f"Expected 'geolocation=()' in header, got '{header_value}'"
        assert "microphone=()" in header_value, f"Expected 'microphone=()' in header"
        assert "camera=()" in header_value, f"Expected 'camera=()' in header"
        print("✓ Permissions-Policy header present with correct restrictions")
    
    def test_cache_control_header_on_api(self):
        """Verify Cache-Control: no-store on API responses"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("Cache-Control") or response.headers.get("cache-control")
        assert "no-store" in header_value, f"Expected 'no-store' in Cache-Control, got '{header_value}'"
        print("✓ Cache-Control: no-store header present on API")


class TestRequestLogging:
    """Test request logging middleware"""
    
    def test_request_id_header(self):
        """Verify X-Request-ID header is present on API responses"""
        response = requests.get(f"{BASE_URL}/api/health")
        header_value = response.headers.get("X-Request-ID") or response.headers.get("x-request-id")
        assert header_value is not None, "X-Request-ID header not found"
        assert len(header_value) >= 6, f"Request ID should be at least 6 chars, got '{header_value}'"
        print(f"✓ X-Request-ID: {header_value}")
    
    def test_unique_request_ids(self):
        """Verify each request gets a unique Request ID"""
        response1 = requests.get(f"{BASE_URL}/api/health")
        response2 = requests.get(f"{BASE_URL}/api/health")
        
        id1 = response1.headers.get("X-Request-ID") or response1.headers.get("x-request-id")
        id2 = response2.headers.get("X-Request-ID") or response2.headers.get("x-request-id")
        
        assert id1 != id2, f"Request IDs should be unique: {id1} vs {id2}"
        print(f"✓ Unique Request IDs: {id1} and {id2}")


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_returns_status(self):
        """Verify health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy", f"Expected 'healthy', got '{data.get('status')}'"
        print("✓ Health check returns status: healthy")
    
    def test_health_check_includes_timestamp(self):
        """Verify health endpoint includes timestamp"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        
        assert "timestamp" in data, "Timestamp not found in health response"
        assert len(data["timestamp"]) > 0, "Timestamp should not be empty"
        print(f"✓ Health check includes timestamp: {data['timestamp']}")
    
    def test_health_check_includes_database_status(self):
        """Verify health endpoint includes database connection status"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        
        assert "database" in data, "Database status not found in health response"
        assert data["database"] == "connected", f"Expected 'connected', got '{data.get('database')}'"
        print("✓ Health check shows database: connected")


class TestPWAAssets:
    """Test PWA assets are accessible"""
    
    def test_manifest_json_accessible(self):
        """Verify manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json returned {response.status_code}"
        
        data = response.json()
        assert data["short_name"] == "LOVE-AI", f"Expected short_name 'LOVE-AI', got '{data.get('short_name')}'"
        assert data["name"] == "LOVE-AI Dating Assistant", f"Unexpected name: {data.get('name')}"
        assert data["display"] == "standalone", f"Expected display 'standalone', got '{data.get('display')}'"
        print("✓ manifest.json accessible and valid")
    
    def test_manifest_has_icons(self):
        """Verify manifest has proper icon definitions"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        assert "icons" in data, "Icons not defined in manifest"
        assert len(data["icons"]) >= 2, f"Expected at least 2 icons, got {len(data.get('icons', []))}"
        
        icon_sizes = [icon.get("sizes") for icon in data["icons"]]
        assert "192x192" in icon_sizes, "192x192 icon not defined"
        assert "512x512" in icon_sizes, "512x512 icon not defined"
        print("✓ Manifest has 192x192 and 512x512 icons")
    
    def test_manifest_has_shortcuts(self):
        """Verify manifest has PWA shortcuts"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        assert "shortcuts" in data, "Shortcuts not defined in manifest"
        shortcut_urls = [s.get("url") for s in data.get("shortcuts", [])]
        assert "/dashboard" in shortcut_urls, "Dashboard shortcut not defined"
        assert "/chat-reply" in shortcut_urls, "Chat-reply shortcut not defined"
        print("✓ Manifest has shortcuts for dashboard and chat-reply")
    
    def test_logo192_accessible(self):
        """Verify logo192.png is accessible"""
        response = requests.get(f"{BASE_URL}/logo192.png")
        assert response.status_code == 200, f"logo192.png returned {response.status_code}"
        assert response.headers.get("content-type") == "image/png", "Content-type should be image/png"
        assert int(response.headers.get("content-length", 0)) > 1000, "logo192.png seems too small"
        print("✓ logo192.png accessible (image/png)")
    
    def test_logo512_accessible(self):
        """Verify logo512.png is accessible"""
        response = requests.get(f"{BASE_URL}/logo512.png")
        assert response.status_code == 200, f"logo512.png returned {response.status_code}"
        assert response.headers.get("content-type") == "image/png", "Content-type should be image/png"
        assert int(response.headers.get("content-length", 0)) > 10000, "logo512.png seems too small"
        print("✓ logo512.png accessible (image/png)")
    
    def test_service_worker_accessible(self):
        """Verify service-worker.js is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"service-worker.js returned {response.status_code}"
        content_type = response.headers.get("content-type", "")
        assert "javascript" in content_type, f"Expected javascript content-type, got '{content_type}'"
        assert int(response.headers.get("content-length", 0)) > 500, "service-worker.js seems too small"
        print("✓ service-worker.js accessible")


class TestIndexHTMLPWA:
    """Test PWA elements in index.html"""
    
    def test_index_html_loads(self):
        """Verify index.html loads"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✓ index.html loads successfully")
    
    def test_manifest_link_in_html(self):
        """Verify manifest link is present in HTML"""
        response = requests.get(BASE_URL)
        assert 'rel="manifest"' in response.text or "rel='manifest'" in response.text, "Manifest link not found in HTML"
        assert "manifest.json" in response.text, "manifest.json not referenced in HTML"
        print("✓ Manifest link present in index.html")
    
    def test_apple_touch_icon_in_html(self):
        """Verify apple-touch-icon is present in HTML"""
        response = requests.get(BASE_URL)
        assert "apple-touch-icon" in response.text, "apple-touch-icon not found in HTML"
        print("✓ Apple-touch-icon present in index.html")
    
    def test_apple_mobile_web_app_capable(self):
        """Verify apple-mobile-web-app-capable meta tag"""
        response = requests.get(BASE_URL)
        assert "apple-mobile-web-app-capable" in response.text, "apple-mobile-web-app-capable meta not found"
        print("✓ Apple-mobile-web-app-capable meta present")


class TestDeepLinkingPrerequisites:
    """Test deep linking related functionality"""
    
    def test_protected_route_without_auth_returns_html(self):
        """Verify protected route without auth returns HTML (not 401)
        This allows client-side to handle the redirect to OAuth"""
        response = requests.get(f"{BASE_URL}/chat-reply")
        # Should return 200 with HTML (SPA handles auth redirection)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/html" in response.headers.get("content-type", ""), "Should return HTML"
        print("✓ Protected route returns HTML for client-side auth handling")
    
    def test_auth_me_without_session(self):
        """Verify /api/auth/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/auth/me returns 401 without session")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
