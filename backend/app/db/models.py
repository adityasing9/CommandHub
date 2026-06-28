from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(200))
    icon = Column(String(50))

    commands = relationship("Command", back_populates="category")

class Command(Base):
    __tablename__ = "commands"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True, nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    tags = Column(String(200)) # Stored as comma-separated
    syntax = Column(String(200), nullable=False)
    examples = Column(Text) # JSON string array
    risk_level = Column(String(20), default="green") # green, yellow, red
    requirements = Column(String(200))
    docs_url = Column(String(200))
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="commands")
    history = relationship("History", back_populates="command")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"))
    raw_command = Column(Text, nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)
    exit_code = Column(Integer)
    output_log_path = Column(String(200))

    command = relationship("Command", back_populates="history")
