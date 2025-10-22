from sqlalchemy.orm import Session
from . import models, schemas

def get_user(db: Session, user_id: str):
    """
    Retrieve a user by their unique user_id (Auth0 sub).
    """
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """
    Create a new user in the database.
    """
    db_user = models.User(
        user_id=user.user_id,
        email=user.email,
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user