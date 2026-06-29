from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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

class FavoriteResponse(BaseModel):
    id: int
    command_id: int
    added_at: datetime
    command: Optional[CommandResponse] = None
    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    id: int
    command_id: Optional[int] = None
    raw_command: str
    executed_at: datetime
    exit_code: Optional[int] = None
    output: Optional[str] = None
    command: Optional[CommandResponse] = None
    class Config:
        from_attributes = True

class SettingResponse(BaseModel):
    key: str
    value: Optional[str] = None
    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    value: str

class AIExplainRequest(BaseModel):
    command_syntax: str

class AIExplainResponseSchema(BaseModel):
    simple_explanation: str
    advanced_explanation: str
    warnings: List[str]
    use_cases: List[str]

class ExecuteRequest(BaseModel):
    command: str
    shell_type: Optional[str] = "powershell"

class ExecuteResponse(BaseModel):
    output: str
    exit_code: int
