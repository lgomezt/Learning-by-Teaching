import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
    Table
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# --- User & Problem Models ---

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    demographics = Column(JSONB, nullable=True)

    # Relationship to Session
    sessions = relationship("Session", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"

    problem_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String)
    author = Column(String)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships to child tables
    sessions = relationship("Session", back_populates="problem")
    milestones = relationship("Milestone", back_populates="problem")
    test_cases = relationship("TestCase", back_populates="problem")


# --- Problem Structure Models ---

# This is the "join table" for the many-to-many relationship
milestone_requirements = Table('milestone_requirements', Base.metadata,
    Column('milestone_id', Integer, ForeignKey('milestones.milestone_id'), primary_key=True),
    Column('test_case_id', Integer, ForeignKey('test_cases.test_case_id'), primary_key=True)
)

class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    order = Column(Integer, nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.problem_id"))

    # Relationships
    problem = relationship("Problem", back_populates="milestones")
    required_tests = relationship("TestCase", secondary=milestone_requirements, back_populates="required_for_milestones")

class TestCase(Base):
    __tablename__ = "test_cases"

    test_case_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    problem_id = Column(Integer, ForeignKey("problems.problem_id"))

    # Relationships
    problem = relationship("Problem", back_populates="test_cases")
    results = relationship("TestCaseResult", back_populates="test_case")
    required_for_milestones = relationship("Milestone", secondary=milestone_requirements, back_populates="required_tests")


# --- User Activity & Result Models ---

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    problem_id = Column(Integer, ForeignKey("problems.problem_id"))

    # Relationships
    user = relationship("User", back_populates="sessions")
    problem = relationship("Problem", back_populates="sessions")
    messages = relationship("SessionMessage", back_populates="session")
    attempts = relationship("Attempt", back_populates="session")

class MessageType(enum.Enum):
    CHAT = "CHAT"
    CODE = "CODE"
    OUTPUT = "OUTPUT"

class SessionMessage(Base):
    __tablename__ = "session_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    sender = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    message_type = Column(Enum(MessageType))
    session_id = Column(Integer, ForeignKey("sessions.session_id"))

    # Relationship
    session = relationship("Session", back_populates="messages")
    triggered_attempt = relationship("Attempt", back_populates="triggering_message", uselist=False)

class Attempt(Base):
    __tablename__ = "attempts"

    attempt_id = Column(Integer, primary_key=True, index=True)
    score = Column(Integer)
    time_taken_seconds = Column(Integer)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    session_id = Column(Integer, ForeignKey("sessions.session_id"))
    triggering_message_id = Column(Integer, ForeignKey("session_messages.message_id"))

    # Relationships
    session = relationship("Session", back_populates="attempts")
    triggering_message = relationship("SessionMessage", back_populates="triggered_attempt")
    results = relationship("TestCaseResult", back_populates="attempt")

class TestCaseResult(Base):
    __tablename__ = "test_case_results"

    result_id = Column(Integer, primary_key=True, index=True)
    passed = Column(Boolean)
    attempt_id = Column(Integer, ForeignKey("attempts.attempt_id"))
    test_case_id = Column(Integer, ForeignKey("test_cases.test_case_id"))

    # Relationships
    attempt = relationship("Attempt", back_populates="results")
    test_case = relationship("TestCase", back_populates="results")