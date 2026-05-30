from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional
from enum import Enum


# ─── Auth ────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Family ─────────────────────────────────────────────────────────────
class FamilyCreate(BaseModel):
    name: str


class FamilyOut(BaseModel):
    id: int
    name: str
    invite_code: str
    owner_id: int
    members: list[UserOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class FamilyJoin(BaseModel):
    invite_code: str


# ─── Category & Tag ──────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ─── Ingredient & Step ───────────────────────────────────────────────────
class IngredientCreate(BaseModel):
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None


class IngredientOut(BaseModel):
    id: int
    name: str
    amount: Optional[str]
    unit: Optional[str]

    class Config:
        from_attributes = True


class StepCreate(BaseModel):
    order: int
    description: str


class StepOut(BaseModel):
    id: int
    order: int
    description: str

    class Config:
        from_attributes = True


# ─── Recipe ──────────────────────────────────────────────────────────────
class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    source_url: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: list[int] = []
    ingredients: list[IngredientCreate] = []
    steps: list[StepCreate] = []


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[list[int]] = None
    ingredients: Optional[list[IngredientCreate]] = None
    steps: Optional[list[StepCreate]] = None


class RecipeOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    source_url: Optional[str]
    prep_time: Optional[int]
    cook_time: Optional[int]
    servings: Optional[int]
    image_url: Optional[str]
    author: UserOut
    category: Optional[CategoryOut]
    tags: list[TagOut] = []
    ingredients: list[IngredientOut] = []
    steps: list[StepOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecipeListOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    image_url: Optional[str]
    category: Optional[CategoryOut]
    tags: list[TagOut] = []
    prep_time: Optional[int]
    cook_time: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class RecipeImport(BaseModel):
    url: str


# ─── Meal Plan ───────────────────────────────────────────────────────────
class MealTypeEnum(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class MealCreate(BaseModel):
    recipe_id: int
    date: date
    meal_type: MealTypeEnum


class MealOut(BaseModel):
    id: int
    recipe_id: int
    date: date
    meal_type: MealTypeEnum
    recipe: RecipeListOut

    class Config:
        from_attributes = True


class MealPlanCreate(BaseModel):
    family_id: int
    title: Optional[str] = None
    start_date: date
    end_date: date
    meals: list[MealCreate] = []


class MealPlanOut(BaseModel):
    id: int
    family_id: int
    title: Optional[str]
    start_date: date
    end_date: date
    meals: list[MealOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Shopping List ───────────────────────────────────────────────────────
class ShoppingItemCreate(BaseModel):
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None


class ShoppingItemOut(BaseModel):
    id: int
    name: str
    amount: Optional[str]
    unit: Optional[str]
    checked: bool

    class Config:
        from_attributes = True


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[str] = None
    unit: Optional[str] = None
    checked: Optional[bool] = None


class ShoppingListCreate(BaseModel):
    family_id: int
    title: Optional[str] = None
    meal_plan_id: Optional[int] = None


class ShoppingListOut(BaseModel):
    id: int
    family_id: int
    title: Optional[str]
    meal_plan_id: Optional[int]
    items: list[ShoppingItemOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
