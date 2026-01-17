"""
User API Endpoints
Read-only access to collegefinder users table for automation.
Users are managed by collegefinder backend - this just reads them.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, date

from app.services.database import fetch_one, fetch_all


router = APIRouter()


# ============= Response Schemas =============

class UserProfileResponse(BaseModel):
    """User profile data for automation."""
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    
    # Extended from other tables
    father_full_name: Optional[str] = None
    mother_full_name: Optional[str] = None
    guardian_name: Optional[str] = None
    alternate_mobile_number: Optional[str] = None
    nationality: Optional[str] = None
    automation_password: Optional[str] = None  # UUID password for form automation
    
    created_at: datetime
    updated_at: datetime


class UserAcademicData(BaseModel):
    """Academic data for a user."""
    # 10th (Matric)
    matric_board: Optional[str] = None
    matric_percentage: Optional[float] = None
    matric_passing_year: Optional[int] = None
    matric_roll_number: Optional[str] = None
    matric_school_name: Optional[str] = None
    
    # 12th (Post-matric)
    postmatric_board: Optional[str] = None
    postmatric_percentage: Optional[float] = None
    postmatric_passing_year: Optional[int] = None
    postmatric_stream: Optional[str] = None
    postmatric_subjects: list[dict] = []


class UserAddressData(BaseModel):
    """Address data for a user."""
    correspondence_address_line1: Optional[str] = None
    correspondence_address_line2: Optional[str] = None
    city_town_village: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class UserDocuments(BaseModel):
    """Document URLs for a user."""
    passport_size_photograph: Optional[str] = None
    signature_image: Optional[str] = None


class UserCategoryData(BaseModel):
    """Category and reservation data."""
    category_name: Optional[str] = None
    ews_status: Optional[bool] = None
    pwbd_status: Optional[bool] = None


class UserCompleteResponse(BaseModel):
    """Complete user data including all related tables."""
    user: UserProfileResponse
    academics: Optional[UserAcademicData] = None
    address: Optional[UserAddressData] = None
    documents: Optional[UserDocuments] = None
    category: Optional[UserCategoryData] = None


class UserFlatData(BaseModel):
    """Flattened user data for form filling."""
    id: int
    data: dict[str, Any]


# ============= Helper Functions =============

def format_date(d: Optional[date]) -> Optional[str]:
    """Format date as DD/MM/YYYY for form filling."""
    if d:
        return d.strftime("%d/%m/%Y")
    return None


async def get_user_academics(user_id: int) -> Optional[dict]:
    """Fetch user academics from user_academics table."""
    return await fetch_one("""
        SELECT 
            matric_board, matric_percentage, matric_passing_year, 
            matric_roll_number, matric_school_name,
            postmatric_board, postmatric_percentage, postmatric_passing_year,
            stream as postmatric_stream
        FROM user_academics 
        WHERE user_id = $1
    """, user_id)


async def get_user_address(user_id: int) -> Optional[dict]:
    """Fetch user address from user_address table."""
    # Try user_address table first
    row = await fetch_one("""
        SELECT 
            correspondence_address_line1, correspondence_address_line2,
            city_town_village, state, district, pincode
        FROM user_address 
        WHERE user_id = $1
    """, user_id)
    
    if row:
        return row
    
    # Fallback to users table
    user = await fetch_one("SELECT state, district FROM users WHERE id = $1", user_id)
    if user:
        return {
            "state": user.get("state"),
            "city_town_village": user.get("district"),
        }
    return None


async def get_user_documents(user_id: int) -> Optional[dict]:
    """Fetch user documents from user_document_vault."""
    try:
        return await fetch_one("""
            SELECT passport_size_photograph, signature_image
            FROM user_document_vault 
            WHERE user_id = $1
        """, user_id)
    except Exception:
        return None  # Table may not exist


async def get_user_category(user_id: int) -> Optional[dict]:
    """Fetch user category from category_and_reservation with category name."""
    return await fetch_one("""
        SELECT 
            c.name as category_name,
            cr.ews_status,
            cr.pwbd_status
        FROM category_and_reservation cr
        LEFT JOIN categories c ON cr.category_id = c.id
        WHERE cr.user_id = $1
    """, user_id)


# ============= Endpoints =============

@router.get("/", response_model=list[UserProfileResponse])
async def list_users(limit: int = 100, offset: int = 0):
    """List all users with basic profile info."""
    rows = await fetch_all("""
        SELECT id, email, name, first_name, last_name, phone_number,
               date_of_birth, gender, state, district,
               father_full_name, mother_full_name, guardian_name,
               alternate_mobile_number, nationality, automation_password,
               created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    """, limit, offset)
    
    return [UserProfileResponse(**row) for row in rows]


@router.get("/{user_id}", response_model=UserCompleteResponse)
async def get_user(user_id: int):
    """Get complete user data including all related tables."""
    # Fetch base user
    user_row = await fetch_one("""
        SELECT id, email, name, first_name, last_name, phone_number,
               date_of_birth, gender, state, district,
               father_full_name, mother_full_name, guardian_name,
               alternate_mobile_number, nationality, automation_password,
               created_at, updated_at
        FROM users WHERE id = $1
    """, user_id)
    
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch related data
    academics = await get_user_academics(user_id)
    address = await get_user_address(user_id)
    documents = await get_user_documents(user_id)
    category = await get_user_category(user_id)
    
    return UserCompleteResponse(
        user=UserProfileResponse(**user_row),
        academics=UserAcademicData(**academics) if academics else None,
        address=UserAddressData(**address) if address else None,
        documents=UserDocuments(**documents) if documents else None,
        category=UserCategoryData(**category) if category else None,
    )


@router.get("/{user_id}/flat", response_model=UserFlatData)
async def get_user_flat(user_id: int):
    """Get flattened user data for form filling."""
    # Get complete user data
    complete = await get_user(user_id)
    user = complete.user
    
    # Build flat data dictionary for form filling
    flat = {}
    
    # Profile fields
    full_name = user.name or f"{user.first_name or ''} {user.last_name or ''}".strip()
    flat["fullName"] = full_name
    flat["email"] = user.email
    flat["phone"] = user.phone_number
    flat["mobileNumber"] = user.phone_number
    flat["alternatePhone"] = user.alternate_mobile_number
    flat["dateOfBirth"] = format_date(user.date_of_birth)
    flat["gender"] = user.gender
    flat["fatherName"] = user.father_full_name
    flat["motherName"] = user.mother_full_name
    flat["guardianName"] = user.guardian_name
    flat["guardianPhone"] = user.alternate_mobile_number
    flat["nationality"] = user.nationality
    flat["password"] = user.automation_password  # UUID password for form automation
    
    # Academic fields
    if complete.academics:
        acad = complete.academics
        flat["matricBoard"] = acad.matric_board
        flat["matricPercentage"] = acad.matric_percentage
        flat["matricYear"] = acad.matric_passing_year
        flat["matricRollNumber"] = acad.matric_roll_number
        flat["schoolName"] = acad.matric_school_name
        flat["postmatricBoard"] = acad.postmatric_board
        flat["postmatricPercentage"] = acad.postmatric_percentage
        flat["postmatricYear"] = acad.postmatric_passing_year
        flat["stream"] = acad.postmatric_stream
        flat["board"] = acad.postmatric_board or acad.matric_board
        flat["currentClass"] = "12" if acad.postmatric_board else "10"
    
    # Address fields
    if complete.address:
        addr = complete.address
        flat["address"] = addr.correspondence_address_line1
        flat["addressLine2"] = addr.correspondence_address_line2
        flat["city"] = addr.city_town_village
        flat["state"] = addr.state
        flat["pincode"] = addr.pincode
    
    # Category fields
    if complete.category:
        cat = complete.category
        flat["category"] = cat.category_name
        flat["ewsStatus"] = cat.ews_status
        flat["pwbdStatus"] = cat.pwbd_status
    
    # Government identification - fetch with error handling
    try:
        govt_id = await fetch_one("""
            SELECT aadhar_number, apaar_id
            FROM government_identification
            WHERE user_id = $1
        """, user_id)
        if govt_id:
            flat["aadharNumber"] = govt_id.get("aadhar_number")
            flat["apaarId"] = govt_id.get("apaar_id")
    except Exception:
        pass  # Table may not exist yet
    
    # Other personal details - fetch with error handling
    try:
        other_details = await fetch_one("""
            SELECT religion, mother_tongue, annual_family_income, 
                   occupation_of_father, occupation_of_mother
            FROM other_personal_details
            WHERE user_id = $1
        """, user_id)
        if other_details:
            flat["religion"] = other_details.get("religion")
            flat["motherTongue"] = other_details.get("mother_tongue")
            flat["annualFamilyIncome"] = other_details.get("annual_family_income")
            flat["fatherOccupation"] = other_details.get("occupation_of_father")
            flat["motherOccupation"] = other_details.get("occupation_of_mother")
    except Exception:
        pass  # Table may not exist yet
    
    # District from user or address (fallback)
    if not flat.get("district"):
        flat["district"] = user.district
    
    # Country default
    flat["country"] = "India"
    
    # Document URLs
    if complete.documents:
        docs = complete.documents
        flat["passportPhoto"] = docs.passport_size_photograph
        flat["signature"] = docs.signature_image
    
    return UserFlatData(id=user_id, data=flat)
