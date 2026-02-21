from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import hashlib
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Default API Keys from env (can be overridden via admin)
DEFAULT_EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
DEFAULT_STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Admin whitelist
ADMIN_EMAILS = ["sevillajames2001@gmail.com"]
DEFAULT_ADMIN_PASSWORD = "RizzAdmin2024!"  # Will be hashed on first setup

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_tier: str = "free"
    credits_used: int = 0
    monthly_credits: int = 5
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_admin: bool = False

class SessionResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_tier: str
    credits_used: int
    monthly_credits: int
    is_admin: bool = False

class ConversationRequest(BaseModel):
    context: str
    tone: str = "playful"
    platform: str = "tinder"

class ChatReplyRequest(BaseModel):
    conversation_context: str
    their_message: str
    tone: str = "witty"

class BioRequest(BaseModel):
    interests: List[str]
    personality: str
    looking_for: str
    age: Optional[int] = None
    image_data: Optional[str] = None  # Base64 encoded image

class ProfileReviewRequest(BaseModel):
    bio: str
    photos_description: Optional[str] = None
    platform: str = "tinder"
    image_data: Optional[str] = None  # Base64 encoded image

class AIResponse(BaseModel):
    content: str
    suggestions: Optional[List[str]] = None
    image_analysis: Optional[str] = None

class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    price: float
    credits_per_month: int
    features: List[str]

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

# Admin Models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class SiteSettings(BaseModel):
    hero_title: str = "Level Up Your Dating Game"
    hero_subtitle: str = "Get AI-powered conversation starters, witty replies, and profile optimization that actually work. Because first impressions matter."
    hero_cta: str = "Start for Free"
    features: List[Dict[str, str]] = []
    testimonials: List[Dict[str, str]] = []
    stats: List[Dict[str, str]] = []

class PricingSettings(BaseModel):
    plans: List[Dict[str, Any]] = []

class AIPromptSettings(BaseModel):
    conversation_starters_prompt: str = ""
    chat_reply_prompt: str = ""
    bio_generator_prompt: str = ""
    profile_review_prompt: str = ""

class APIKeysSettings(BaseModel):
    emergent_llm_key: Optional[str] = None
    stripe_api_key: Optional[str] = None

# Default site settings
DEFAULT_SITE_SETTINGS = {
    "hero_title": "Level Up Your Dating Game",
    "hero_subtitle": "Get AI-powered conversation starters, witty replies, and profile optimization that actually work. Because first impressions matter.",
    "hero_cta": "Start for Free",
    "features": [
        {"icon": "Sparkles", "title": "Conversation Starters", "description": "AI-crafted pickup lines that actually work. Personalized based on their profile.", "color": "from-[#FF0055] to-[#FF6B6B]"},
        {"icon": "MessageCircle", "title": "Chat Reply Suggestions", "description": "Stuck on what to say? Get witty, engaging replies that keep the conversation flowing.", "color": "from-[#7000FF] to-[#A855F7]"},
        {"icon": "User", "title": "Bio Generator", "description": "Stand out from the crowd with a bio that showcases your personality perfectly.", "color": "from-[#00FFFF] to-[#22D3EE]"},
        {"icon": "Zap", "title": "Profile Optimizer", "description": "Get expert feedback on your dating profile to maximize your matches.", "color": "from-[#FF0055] to-[#7000FF]"}
    ],
    "testimonials": [
        {"name": "Alex M.", "avatar": "A", "text": "Finally landed a date with someone way out of my league. RizzAI made me sound charming!", "rating": "5"},
        {"name": "Sarah K.", "avatar": "S", "text": "The bio generator is incredible. Got 3x more matches after updating my profile.", "rating": "5"},
        {"name": "Mike R.", "avatar": "M", "text": "No more awkward silences in chats. The reply suggestions are always on point.", "rating": "5"}
    ],
    "stats": [
        {"value": "10M+", "label": "Messages Generated"},
        {"value": "500K+", "label": "Happy Users"},
        {"value": "89%", "label": "More Matches"},
        {"value": "4.9", "label": "App Store Rating"}
    ]
}

DEFAULT_PRICING = {
    "plans": [
        {"plan_id": "free", "name": "Free", "price": 0.0, "credits_per_month": 5, "features": ["5 AI responses/month", "Basic pickup lines", "Standard support"]},
        {"plan_id": "pro", "name": "Pro", "price": 9.99, "credits_per_month": 100, "features": ["100 AI responses/month", "Advanced pickup lines", "Chat screenshot analysis", "Priority support"]},
        {"plan_id": "premium", "name": "Premium", "price": 19.99, "credits_per_month": 500, "features": ["500 AI responses/month", "All features unlocked", "Profile optimization", "24/7 Priority support", "Custom personality tuning"]}
    ]
}

DEFAULT_AI_PROMPTS = {
    "conversation_starters_prompt": """You are a charming dating coach specializing in helping people start engaging conversations on dating apps. 
Your responses should be:
- Witty and clever, not cheesy or cringe
- Personalized based on the context provided
- Respectful and not inappropriate
- Natural sounding, like something a real person would say

Generate 3-5 unique conversation starters based on the context. Format them as a numbered list.""",
    
    "chat_reply_prompt": """You are an expert dating conversation coach. Your job is to suggest witty, engaging replies to continue a dating app conversation.
Your responses should:
- Match the energy and tone of the conversation
- Be engaging and lead to further conversation
- Show genuine interest without being desperate
- Be appropriate and respectful

Provide 3 different reply options with different approaches (playful, sincere, curious).""",
    
    "bio_generator_prompt": """You are a dating profile expert who crafts compelling, authentic bios that attract matches.
Your bios should:
- Be concise (under 500 characters)
- Show personality, not just list traits
- Include a hook or conversation starter
- Be genuine and not try-hard
- Avoid clichés like "love to travel" or "fluent in sarcasm"

Generate 3 different bio options with different styles.""",
    
    "profile_review_prompt": """You are a dating profile optimization expert. Your job is to review profiles and provide actionable feedback.
Your review should cover:
- Bio effectiveness (hook, personality, conversation starters)
- Red flags or turn-offs to remove
- Missing elements that could boost matches
- Platform-specific tips

Be constructive and specific with your feedback."""
}

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def get_api_keys() -> Dict[str, str]:
    """Get API keys from database or fall back to env"""
    keys_doc = await db.api_keys.find_one({"type": "api_keys"}, {"_id": 0})
    return {
        "emergent_llm_key": keys_doc.get("emergent_llm_key") if keys_doc else None or DEFAULT_EMERGENT_LLM_KEY,
        "stripe_api_key": keys_doc.get("stripe_api_key") if keys_doc else None or DEFAULT_STRIPE_API_KEY
    }

async def get_site_settings() -> Dict:
    """Get site settings from database or return defaults"""
    settings = await db.site_settings.find_one({"type": "site"}, {"_id": 0})
    if not settings:
        return DEFAULT_SITE_SETTINGS
    return {**DEFAULT_SITE_SETTINGS, **settings}

async def get_pricing_settings() -> Dict:
    """Get pricing from database or return defaults"""
    settings = await db.site_settings.find_one({"type": "pricing"}, {"_id": 0})
    if not settings:
        return DEFAULT_PRICING
    return settings

async def get_ai_prompts() -> Dict:
    """Get AI prompts from database or return defaults"""
    settings = await db.site_settings.find_one({"type": "ai_prompts"}, {"_id": 0})
    if not settings:
        return DEFAULT_AI_PROMPTS
    return {**DEFAULT_AI_PROMPTS, **settings}

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    # Check if admin
    is_admin = user_doc.get("email") in ADMIN_EMAILS
    user_doc["is_admin"] = is_admin
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    """Require admin user"""
    user = await require_auth(request)
    if user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify admin password session
    admin_session = await db.admin_sessions.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    if not admin_session:
        raise HTTPException(status_code=403, detail="Admin authentication required")
    
    expires_at = admin_session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Admin session expired")
    
    return user

async def check_credits(user: User) -> bool:
    """Check if user has credits remaining"""
    return user.credits_used < user.monthly_credits

async def use_credit(user_id: str):
    """Increment credits used for user"""
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"credits_used": 1}}
    )

async def generate_ai_response(system_prompt: str, user_prompt: str, image_data: Optional[str] = None) -> str:
    """Generate AI response using GPT-5.2 or GPT-4o for vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        keys = await get_api_keys()
        api_key = keys.get("emergent_llm_key") or DEFAULT_EMERGENT_LLM_KEY
        
        # Use GPT-4o for vision tasks, GPT-5.2 for text
        model = "gpt-4o" if image_data else "gpt-5.2"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"rizz_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", model)
        
        if image_data:
            # For vision, include image in the message
            user_message = UserMessage(
                text=user_prompt,
                image_url=f"data:image/jpeg;base64,{image_data}"
            )
        else:
            user_message = UserMessage(text=user_prompt)
        
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/session")
async def exchange_session(request: Request):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user_data = response.json()
    email = user_data.get("email")
    name = user_data.get("name")
    picture = user_data.get("picture")
    session_token = user_data.get("session_token")
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "subscription_tier": "free",
            "credits_used": 0,
            "monthly_credits": 5,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "session_token": session_token,
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    is_admin = email in ADMIN_EMAILS
    
    response_data = SessionResponse(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        subscription_tier=user_doc.get("subscription_tier", "free"),
        credits_used=user_doc.get("credits_used", 0),
        monthly_credits=user_doc.get("monthly_credits", 5),
        is_admin=is_admin
    )
    
    from starlette.responses import JSONResponse
    json_response = JSONResponse(content=response_data.model_dump())
    json_response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return json_response

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user info"""
    is_admin = user.email in ADMIN_EMAILS
    
    # Check if has valid admin session
    has_admin_session = False
    if is_admin:
        admin_session = await db.admin_sessions.find_one(
            {"user_id": user.user_id},
            {"_id": 0}
        )
        if admin_session:
            expires_at = admin_session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            has_admin_session = expires_at > datetime.now(timezone.utc)
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "subscription_tier": user.subscription_tier,
        "credits_used": user.credits_used,
        "monthly_credits": user.monthly_credits,
        "is_admin": is_admin,
        "has_admin_session": has_admin_session
    }

@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    from starlette.responses import JSONResponse
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response

# ============== ADMIN AUTH ==============

@api_router.post("/admin/login")
async def admin_login(req: AdminLoginRequest, request: Request):
    """Admin password verification"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized as admin")
    
    # Check admin password
    admin_doc = await db.admin_config.find_one({"type": "admin_auth"}, {"_id": 0})
    
    if not admin_doc:
        # First time setup - create default password
        hashed = hash_password(DEFAULT_ADMIN_PASSWORD)
        await db.admin_config.insert_one({
            "type": "admin_auth",
            "password_hash": hashed,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        admin_doc = {"password_hash": hashed}
    
    if hash_password(req.password) != admin_doc["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    # Create admin session
    expires_at = datetime.now(timezone.utc) + timedelta(hours=8)
    await db.admin_sessions.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": "Admin authenticated", "expires_at": expires_at.isoformat()}

@api_router.post("/admin/change-password")
async def change_admin_password(request: Request, user: User = Depends(require_admin)):
    """Change admin password"""
    body = await request.json()
    current_password = body.get("current_password")
    new_password = body.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both passwords required")
    
    admin_doc = await db.admin_config.find_one({"type": "admin_auth"}, {"_id": 0})
    
    if not admin_doc or hash_password(current_password) != admin_doc["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid current password")
    
    await db.admin_config.update_one(
        {"type": "admin_auth"},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    
    return {"message": "Password updated successfully"}

@api_router.post("/admin/logout")
async def admin_logout(user: User = Depends(require_auth)):
    """Logout from admin session"""
    await db.admin_sessions.delete_one({"user_id": user.user_id})
    return {"message": "Admin session ended"}

# ============== ADMIN SETTINGS ==============

@api_router.get("/admin/settings/site")
async def get_admin_site_settings(user: User = Depends(require_admin)):
    """Get site settings"""
    return await get_site_settings()

@api_router.put("/admin/settings/site")
async def update_site_settings(request: Request, user: User = Depends(require_admin)):
    """Update site settings"""
    body = await request.json()
    body["type"] = "site"
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    body["updated_by"] = user.email
    
    await db.site_settings.update_one(
        {"type": "site"},
        {"$set": body},
        upsert=True
    )
    
    return {"message": "Site settings updated"}

@api_router.get("/admin/settings/pricing")
async def get_admin_pricing_settings(user: User = Depends(require_admin)):
    """Get pricing settings"""
    return await get_pricing_settings()

@api_router.put("/admin/settings/pricing")
async def update_pricing_settings(request: Request, user: User = Depends(require_admin)):
    """Update pricing settings"""
    body = await request.json()
    body["type"] = "pricing"
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    body["updated_by"] = user.email
    
    await db.site_settings.update_one(
        {"type": "pricing"},
        {"$set": body},
        upsert=True
    )
    
    return {"message": "Pricing settings updated"}

@api_router.get("/admin/settings/prompts")
async def get_admin_prompts(user: User = Depends(require_admin)):
    """Get AI prompts"""
    return await get_ai_prompts()

@api_router.put("/admin/settings/prompts")
async def update_prompts(request: Request, user: User = Depends(require_admin)):
    """Update AI prompts"""
    body = await request.json()
    body["type"] = "ai_prompts"
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    body["updated_by"] = user.email
    
    await db.site_settings.update_one(
        {"type": "ai_prompts"},
        {"$set": body},
        upsert=True
    )
    
    return {"message": "AI prompts updated"}

@api_router.get("/admin/settings/api-keys")
async def get_admin_api_keys(user: User = Depends(require_admin)):
    """Get API keys (masked)"""
    keys = await get_api_keys()
    return {
        "emergent_llm_key": "***" + keys["emergent_llm_key"][-8:] if keys.get("emergent_llm_key") else None,
        "stripe_api_key": "***" + keys["stripe_api_key"][-8:] if keys.get("stripe_api_key") else None,
        "has_emergent_key": bool(keys.get("emergent_llm_key")),
        "has_stripe_key": bool(keys.get("stripe_api_key"))
    }

@api_router.put("/admin/settings/api-keys")
async def update_api_keys(request: Request, user: User = Depends(require_admin)):
    """Update API keys"""
    body = await request.json()
    
    update_data = {"type": "api_keys", "updated_at": datetime.now(timezone.utc).isoformat()}
    
    if body.get("emergent_llm_key"):
        update_data["emergent_llm_key"] = body["emergent_llm_key"]
    if body.get("stripe_api_key"):
        update_data["stripe_api_key"] = body["stripe_api_key"]
    
    await db.api_keys.update_one(
        {"type": "api_keys"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "API keys updated"}

# ============== ADMIN USER MANAGEMENT ==============

@api_router.get("/admin/users")
async def get_all_users(user: User = Depends(require_admin), skip: int = 0, limit: int = 50):
    """Get all users"""
    users = await db.users.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.get("/admin/users/{user_id}")
async def get_user_details(user_id: str, user: User = Depends(require_admin)):
    """Get user details"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, request: Request, user: User = Depends(require_admin)):
    """Update user details"""
    body = await request.json()
    
    allowed_fields = ["subscription_tier", "monthly_credits", "credits_used"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, user: User = Depends(require_admin)):
    """Delete user"""
    result = await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

# ============== ADMIN ANALYTICS ==============

@api_router.get("/admin/analytics")
async def get_analytics(user: User = Depends(require_admin)):
    """Get platform analytics"""
    total_users = await db.users.count_documents({})
    
    # Subscription breakdown
    free_users = await db.users.count_documents({"subscription_tier": "free"})
    pro_users = await db.users.count_documents({"subscription_tier": "pro"})
    premium_users = await db.users.count_documents({"subscription_tier": "premium"})
    
    # Total credits used
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}]
    credits_result = await db.users.aggregate(pipeline).to_list(1)
    total_credits_used = credits_result[0]["total"] if credits_result else 0
    
    # Recent signups (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_signups = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    
    # Total payments
    total_payments = await db.payment_transactions.count_documents({"status": "paid"})
    
    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "subscription_breakdown": {
            "free": free_users,
            "pro": pro_users,
            "premium": premium_users
        },
        "total_credits_used": total_credits_used,
        "recent_signups": recent_signups,
        "total_payments": total_payments,
        "total_revenue": total_revenue
    }

# ============== PUBLIC SETTINGS ENDPOINTS ==============

@api_router.get("/settings/site")
async def get_public_site_settings():
    """Get public site settings"""
    return await get_site_settings()

@api_router.get("/settings/pricing")
async def get_public_pricing():
    """Get public pricing"""
    settings = await get_pricing_settings()
    return settings.get("plans", DEFAULT_PRICING["plans"])

# ============== AI ENDPOINTS ==============

@api_router.post("/ai/conversation-starters", response_model=AIResponse)
async def generate_conversation_starters(
    req: ConversationRequest,
    user: User = Depends(require_auth)
):
    """Generate conversation starters/pickup lines"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    prompts = await get_ai_prompts()
    system_prompt = prompts.get("conversation_starters_prompt", DEFAULT_AI_PROMPTS["conversation_starters_prompt"])
    
    user_prompt = f"""Generate conversation starters for {req.platform}.
    Context about the match: {req.context}
    Desired tone: {req.tone}
    
    Make them specific to the context and platform."""
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    lines = [l.strip() for l in response.split('\n') if l.strip() and not l.strip().startswith('#')]
    suggestions = [l.lstrip('0123456789.-) ') for l in lines if l][:5]
    
    return AIResponse(content=response, suggestions=suggestions)

@api_router.post("/ai/chat-reply", response_model=AIResponse)
async def generate_chat_reply(
    req: ChatReplyRequest,
    user: User = Depends(require_auth)
):
    """Generate reply suggestions for ongoing conversation"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    prompts = await get_ai_prompts()
    system_prompt = prompts.get("chat_reply_prompt", DEFAULT_AI_PROMPTS["chat_reply_prompt"])
    
    user_prompt = f"""Conversation context: {req.conversation_context}
    Their last message: "{req.their_message}"
    Desired tone: {req.tone}
    
    Suggest 3 different reply options."""
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    lines = [l.strip() for l in response.split('\n') if l.strip() and not l.strip().startswith('#')]
    suggestions = [l.lstrip('0123456789.-) ') for l in lines if l][:3]
    
    return AIResponse(content=response, suggestions=suggestions)

@api_router.post("/ai/bio-generator", response_model=AIResponse)
async def generate_bio(
    req: BioRequest,
    user: User = Depends(require_auth)
):
    """Generate dating profile bio with optional image analysis"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    prompts = await get_ai_prompts()
    system_prompt = prompts.get("bio_generator_prompt", DEFAULT_AI_PROMPTS["bio_generator_prompt"])
    
    interests_str = ", ".join(req.interests)
    user_prompt = f"""Create a dating profile bio with these details:
    Interests: {interests_str}
    Personality: {req.personality}
    Looking for: {req.looking_for}
    {f"Age: {req.age}" if req.age else ""}
    
    Generate 3 unique bio options."""
    
    image_analysis = None
    if req.image_data:
        # Analyze the profile image
        image_prompt = """Analyze this dating profile photo. Provide feedback on:
        1. Photo quality and lighting
        2. Expression and approachability
        3. Background and setting
        4. Suggestions for improvement
        5. What this photo conveys about the person
        
        Be constructive and specific."""
        
        image_analysis = await generate_ai_response(
            "You are a dating profile photo expert.",
            image_prompt,
            req.image_data
        )
        
        # Add image insights to bio generation
        user_prompt += f"\n\nProfile photo analysis: {image_analysis}\nIncorporate insights from the photo into the bio suggestions."
    
    response = await generate_ai_response(system_prompt, user_prompt, req.image_data if req.image_data else None)
    await use_credit(user.user_id)
    
    return AIResponse(content=response, image_analysis=image_analysis)

@api_router.post("/ai/profile-review", response_model=AIResponse)
async def review_profile(
    req: ProfileReviewRequest,
    user: User = Depends(require_auth)
):
    """Review and optimize dating profile with optional image analysis"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    prompts = await get_ai_prompts()
    system_prompt = prompts.get("profile_review_prompt", DEFAULT_AI_PROMPTS["profile_review_prompt"])
    
    user_prompt = f"""Review this {req.platform} profile:
    
    Bio: "{req.bio}"
    {f"Photos description: {req.photos_description}" if req.photos_description else ""}
    
    Provide detailed feedback with specific suggestions for improvement."""
    
    image_analysis = None
    if req.image_data:
        # Analyze the profile image
        image_prompt = """Analyze this dating profile photo in detail. Evaluate:
        1. First impression and attractiveness factors
        2. Photo composition and quality
        3. Body language and expression
        4. Background appropriateness
        5. Clothing and grooming
        6. What's working well
        7. Specific improvements needed
        8. Photo order suggestions (if this were part of a set)
        
        Be honest but constructive."""
        
        image_analysis = await generate_ai_response(
            "You are an expert dating profile consultant who analyzes photos.",
            image_prompt,
            req.image_data
        )
        
        # Include image analysis in the main review
        user_prompt += f"\n\nProfile photo analysis to incorporate:\n{image_analysis}"
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    return AIResponse(content=response, image_analysis=image_analysis)

# ============== IMAGE UPLOAD ENDPOINT ==============

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(require_auth)
):
    """Upload and process image for analysis"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and encode image
    contents = await file.read()
    
    # Check file size (max 10MB)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 10MB")
    
    # Encode to base64
    base64_image = base64.b64encode(contents).decode("utf-8")
    
    return {"image_data": base64_image, "filename": file.filename}

# ============== SUBSCRIPTION ENDPOINTS ==============

@api_router.get("/subscriptions/plans")
async def get_plans():
    """Get available subscription plans"""
    settings = await get_pricing_settings()
    plans = settings.get("plans", DEFAULT_PRICING["plans"])
    return [SubscriptionPlan(**p) for p in plans]

@api_router.post("/subscriptions/checkout")
async def create_checkout(
    req: CheckoutRequest,
    user: User = Depends(require_auth)
):
    """Create Stripe checkout session"""
    settings = await get_pricing_settings()
    plans = {p["plan_id"]: p for p in settings.get("plans", DEFAULT_PRICING["plans"])}
    
    if req.plan_id not in plans or req.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = plans[req.plan_id]
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    keys = await get_api_keys()
    stripe_key = keys.get("stripe_api_key") or DEFAULT_STRIPE_API_KEY
    
    success_url = f"{req.origin_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/pricing"
    
    webhook_url = f"{req.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "plan_id": req.plan_id,
            "email": user.email
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "session_id": session.session_id,
        "plan_id": req.plan_id,
        "amount": float(plan["price"]),
        "currency": "usd",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscriptions/status/{session_id}")
async def check_payment_status(session_id: str, user: User = Depends(require_auth)):
    """Check payment status and update subscription"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    keys = await get_api_keys()
    stripe_key = keys.get("stripe_api_key") or DEFAULT_STRIPE_API_KEY
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id, "user_id": user.user_id},
            {"_id": 0}
        )
        
        if transaction and transaction.get("status") != "paid" and status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "payment_status": status.payment_status}}
            )
            
            plan_id = status.metadata.get("plan_id", "pro")
            settings = await get_pricing_settings()
            plans = {p["plan_id"]: p for p in settings.get("plans", DEFAULT_PRICING["plans"])}
            plan = plans.get(plan_id, plans.get("pro"))
            
            await db.users.update_one(
                {"user_id": user.user_id},
                {
                    "$set": {
                        "subscription_tier": plan_id,
                        "monthly_credits": plan["credits_per_month"],
                        "credits_used": 0
                    }
                }
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100
        }
    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        raise HTTPException(status_code=400, detail="Unable to check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        keys = await get_api_keys()
        stripe_key = keys.get("stripe_api_key") or DEFAULT_STRIPE_API_KEY
        
        stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            user_id = webhook_response.metadata.get("user_id")
            plan_id = webhook_response.metadata.get("plan_id", "pro")
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "payment_status": "paid"}}
            )
            
            settings = await get_pricing_settings()
            plans = {p["plan_id"]: p for p in settings.get("plans", DEFAULT_PRICING["plans"])}
            plan = plans.get(plan_id, plans.get("pro"))
            
            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "subscription_tier": plan_id,
                        "monthly_credits": plan["credits_per_month"],
                        "credits_used": 0
                    }
                }
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== USAGE STATS ==============

@api_router.get("/stats")
async def get_user_stats(user: User = Depends(require_auth)):
    """Get user usage statistics"""
    return {
        "credits_used": user.credits_used,
        "credits_remaining": user.monthly_credits - user.credits_used,
        "monthly_credits": user.monthly_credits,
        "subscription_tier": user.subscription_tier,
        "usage_percentage": round((user.credits_used / user.monthly_credits) * 100, 1) if user.monthly_credits > 0 else 0
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Rizz AI API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
