import uuid
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
from sqlalchemy.dialects.postgresql import JSONB, JSON, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# ==============================================================================
# Core Models (User & Problem)
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True) # Auth0 ID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    demographics = Column(JSONB, nullable=True)

    # Relationships
    sessions = relationship("Session", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"

    problem_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True) # Short description from frontmatter
    difficulty = Column(String)
    author = Column(String)
    file_path = Column(String, nullable=False, unique=True) # Path to markdown file in GCS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tags = Column(JSON, nullable=True)
    update_log = Column(JSON, nullable=True)

    # Relationships
    sessions = relationship("Session", back_populates="problem")
    milestones = relationship("Milestone", back_populates="problem")
    test_cases = relationship("TestCase", back_populates="problem")


# ==============================================================================
# Problem Structure Models
# ==============================================================================

# Join table for many-to-many relationship between Milestones and TestCases
milestone_requirements = Table('milestone_requirements', Base.metadata,
    Column('milestone_id', UUID(as_uuid=True), ForeignKey('milestones.milestone_id'), primary_key=True),
    Column('test_case_id', UUID(as_uuid=True), ForeignKey('test_cases.test_case_id'), primary_key=True)
)

class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(Text, nullable=False)
    order = Column(Integer, nullable=False)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.problem_id"), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="milestones")
    required_tests = relationship("TestCase", secondary=milestone_requirements, back_populates="required_for_milestones")

class TestCase(Base):
    __tablename__ = "test_cases"

    test_case_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.problem_id"), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="test_cases")
    results = relationship("TestCaseResult", back_populates="test_case")
    required_for_milestones = relationship("Milestone", secondary=milestone_requirements, back_populates="required_tests")


# ==============================================================================
# User Activity & Session Models
# ==============================================================================

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.problem_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    problem = relationship("Problem", back_populates="sessions")
    messages = relationship("SessionMessage", back_populates="session", cascade="all, delete-orphan")
    attempts = relationship("Attempt", back_populates="session", cascade="all, delete-orphan")

class MessageType(enum.Enum):
    CHAT = "CHAT"
    CODE = "CODE"
    OUTPUT = "OUTPUT"

class SessionMessage(Base):
    __tablename__ = "session_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.session_id"), nullable=False)
    sender = Column(String) # e.g., "user" or "agent"
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    message_type = Column(Enum(MessageType))

    # Relationships
    session = relationship("Session", back_populates="messages")
    triggered_attempt = relationship("Attempt", back_populates="triggering_message", uselist=False)

class Attempt(Base):
    __tablename__ = "attempts"

    attempt_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.session_id"))
    triggering_message_id = Column(UUID(as_uuid=True), ForeignKey("session_messages.message_id"), nullable=True)
    score = Column(Integer)
    time_taken_seconds = Column(Integer)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="attempts")
    triggering_message = relationship("SessionMessage", back_populates="triggered_attempt")
    results = relationship("TestCaseResult", back_populates="attempt", cascade="all, delete-orphan")

class TestCaseResult(Base):
    __tablename__ = "test_case_results"

    result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("attempts.attempt_id"))
    test_case_id = Column(UUID(as_uuid=True), ForeignKey("test_cases.test_case_id"))
    passed = Column(Boolean)

    # Relationships
    attempt = relationship("Attempt", back_populates="results")
    test_case = relationship("TestCase", back_populates="results")