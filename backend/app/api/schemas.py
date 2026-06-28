from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class CommandBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[str] = None
    syntax: str
    examples: Optional[str] = None
    risk_level: Optional[str] = "green"
    requirements: Optional[str] = None
    docs_url: Optional[str] = None
    is_custom: Optional[bool] = False

class CommandResponse(CommandBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class AIExplainRequest(BaseModel):
    command_syntax: str

class AIExplainResponseSchema(BaseModel):
    simple_explanation: str
    advanced_explanation: str
    warnings: List[str]
    use_cases: List[str]
