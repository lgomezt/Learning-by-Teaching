from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    demographics: Optional[Dict[str, Any]] = None

# Properties to receive on user creation
class UserCreate(UserBase):
    user_id: str # This will be the Auth0 sub

# Properties to return to client
class User(UserBase):
    user_id: str

    class Config:
        from_attributes = True # Formerly orm_mode