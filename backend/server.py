from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

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

class SessionResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_tier: str
    credits_used: int
    monthly_credits: int

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

class ProfileReviewRequest(BaseModel):
    bio: str
    photos_description: Optional[str] = None
    platform: str = "tinder"

class AIResponse(BaseModel):
    content: str
    suggestions: Optional[List[str]] = None

class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    price: float
    credits_per_month: int
    features: List[str]

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class PaymentTransaction(BaseModel):
    transaction_id: str
    user_id: str
    session_id: str
    plan_id: str
    amount: float
    currency: str = "usd"
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subscription plans
SUBSCRIPTION_PLANS = {
    "free": SubscriptionPlan(
        plan_id="free",
        name="Free",
        price=0.0,
        credits_per_month=5,
        features=["5 AI responses/month", "Basic pickup lines", "Standard support"]
    ),
    "pro": SubscriptionPlan(
        plan_id="pro",
        name="Pro",
        price=9.99,
        credits_per_month=100,
        features=["100 AI responses/month", "Advanced pickup lines", "Chat screenshot analysis", "Priority support"]
    ),
    "premium": SubscriptionPlan(
        plan_id="premium",
        name="Premium",
        price=19.99,
        credits_per_month=500,
        features=["500 AI responses/month", "All features unlocked", "Profile optimization", "24/7 Priority support", "Custom personality tuning"]
    )
}

# ============== HELPERS ==============

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
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
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

async def generate_ai_response(system_prompt: str, user_prompt: str) -> str:
    """Generate AI response using GPT-5.2"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"rizz_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
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
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        response = await client.get(
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
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
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
    
    # Store session
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
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response = SessionResponse(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        subscription_tier=user_doc.get("subscription_tier", "free"),
        credits_used=user_doc.get("credits_used", 0),
        monthly_credits=user_doc.get("monthly_credits", 5)
    )
    
    from starlette.responses import JSONResponse
    json_response = JSONResponse(content=response.model_dump())
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
    return SessionResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        subscription_tier=user.subscription_tier,
        credits_used=user.credits_used,
        monthly_credits=user.monthly_credits
    )

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

# ============== AI ENDPOINTS ==============

@api_router.post("/ai/conversation-starters", response_model=AIResponse)
async def generate_conversation_starters(
    req: ConversationRequest,
    user: User = Depends(require_auth)
):
    """Generate conversation starters/pickup lines"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    system_prompt = """You are a charming dating coach specializing in helping people start engaging conversations on dating apps. 
    Your responses should be:
    - Witty and clever, not cheesy or cringe
    - Personalized based on the context provided
    - Respectful and not inappropriate
    - Natural sounding, like something a real person would say
    
    Generate 3-5 unique conversation starters based on the context. Format them as a numbered list."""
    
    user_prompt = f"""Generate conversation starters for {req.platform}.
    Context about the match: {req.context}
    Desired tone: {req.tone}
    
    Make them specific to the context and platform."""
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    # Parse response into list
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
    
    system_prompt = """You are an expert dating conversation coach. Your job is to suggest witty, engaging replies to continue a dating app conversation.
    Your responses should:
    - Match the energy and tone of the conversation
    - Be engaging and lead to further conversation
    - Show genuine interest without being desperate
    - Be appropriate and respectful
    
    Provide 3 different reply options with different approaches (playful, sincere, curious)."""
    
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
    """Generate dating profile bio"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    system_prompt = """You are a dating profile expert who crafts compelling, authentic bios that attract matches.
    Your bios should:
    - Be concise (under 500 characters)
    - Show personality, not just list traits
    - Include a hook or conversation starter
    - Be genuine and not try-hard
    - Avoid clichés like "love to travel" or "fluent in sarcasm"
    
    Generate 3 different bio options with different styles."""
    
    interests_str = ", ".join(req.interests)
    user_prompt = f"""Create a dating profile bio with these details:
    Interests: {interests_str}
    Personality: {req.personality}
    Looking for: {req.looking_for}
    {f"Age: {req.age}" if req.age else ""}
    
    Generate 3 unique bio options."""
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    return AIResponse(content=response)

@api_router.post("/ai/profile-review", response_model=AIResponse)
async def review_profile(
    req: ProfileReviewRequest,
    user: User = Depends(require_auth)
):
    """Review and optimize dating profile"""
    if not await check_credits(user):
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade your plan!")
    
    system_prompt = """You are a dating profile optimization expert. Your job is to review profiles and provide actionable feedback.
    Your review should cover:
    - Bio effectiveness (hook, personality, conversation starters)
    - Red flags or turn-offs to remove
    - Missing elements that could boost matches
    - Platform-specific tips
    
    Be constructive and specific with your feedback."""
    
    user_prompt = f"""Review this {req.platform} profile:
    
    Bio: "{req.bio}"
    {f"Photos description: {req.photos_description}" if req.photos_description else ""}
    
    Provide detailed feedback with specific suggestions for improvement."""
    
    response = await generate_ai_response(system_prompt, user_prompt)
    await use_credit(user.user_id)
    
    return AIResponse(content=response)

# ============== SUBSCRIPTION ENDPOINTS ==============

@api_router.get("/subscriptions/plans")
async def get_plans():
    """Get available subscription plans"""
    return list(SUBSCRIPTION_PLANS.values())

@api_router.post("/subscriptions/checkout")
async def create_checkout(
    req: CheckoutRequest,
    user: User = Depends(require_auth)
):
    """Create Stripe checkout session"""
    if req.plan_id not in SUBSCRIPTION_PLANS or req.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[req.plan_id]
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    success_url = f"{req.origin_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/pricing"
    
    webhook_url = f"{req.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=plan.price,
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
    
    # Create payment transaction record
    transaction = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "session_id": session.session_id,
        "plan_id": req.plan_id,
        "amount": plan.price,
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
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id, "user_id": user.user_id},
            {"_id": 0}
        )
        
        if transaction and transaction.get("status") != "paid" and status.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "payment_status": status.payment_status}}
            )
            
            # Update user subscription
            plan_id = status.metadata.get("plan_id", "pro")
            plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["pro"])
            
            await db.users.update_one(
                {"user_id": user.user_id},
                {
                    "$set": {
                        "subscription_tier": plan_id,
                        "monthly_credits": plan.credits_per_month,
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
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            user_id = webhook_response.metadata.get("user_id")
            plan_id = webhook_response.metadata.get("plan_id", "pro")
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "payment_status": "paid"}}
            )
            
            # Update user subscription
            plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["pro"])
            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "subscription_tier": plan_id,
                        "monthly_credits": plan.credits_per_month,
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
