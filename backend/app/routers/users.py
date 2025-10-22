from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter()

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users/", response_model=schemas.User)
def create_or_get_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    This endpoint is called by the frontend after a user logs in.
    It checks if the user exists in our database. If so, it returns the user.
    If not, it creates the user and then returns them.
    """
    db_user = crud.get_user(db, user_id=user.user_id)
    if db_user:
        return db_user
    return crud.create_user(db=db, user=user)