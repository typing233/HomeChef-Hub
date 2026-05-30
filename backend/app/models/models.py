from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Text, Boolean, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base

recipe_tags = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", Integer, ForeignKey("recipes.id", ondelete="CASCADE")),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE")),
)

family_members = Table(
    "family_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("family_id", Integer, ForeignKey("families.id", ondelete="CASCADE")),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recipes = relationship("Recipe", back_populates="author")
    families = relationship("Family", secondary=family_members, back_populates="members")
    owned_families = relationship("Family", back_populates="owner")


class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(20), unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="owned_families")
    members = relationship("User", secondary=family_members, back_populates="families")
    meal_plans = relationship("MealPlan", back_populates="family")
    shopping_lists = relationship("ShoppingList", back_populates="family")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    recipes = relationship("Recipe", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    recipes = relationship("Recipe", secondary=recipe_tags, back_populates="tags")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    source_url = Column(String(500))
    prep_time = Column(Integer)
    cook_time = Column(Integer)
    servings = Column(Integer)
    image_url = Column(String(500))
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", back_populates="recipes")
    category = relationship("Category", back_populates="recipes")
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    steps = relationship("Step", back_populates="recipe", cascade="all, delete-orphan", order_by="Step.order")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(String(50))
    unit = Column(String(50))

    recipe = relationship("Recipe", back_populates="ingredients")


class Step(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)

    recipe = relationship("Recipe", back_populates="steps")


class MealType(enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    family = relationship("Family", back_populates="meal_plans")
    meals = relationship("Meal", back_populates="meal_plan", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    date = Column(Date, nullable=False)
    meal_type = Column(SAEnum(MealType), nullable=False)

    meal_plan = relationship("MealPlan", back_populates="meals")
    recipe = relationship("Recipe")


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"))
    title = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    family = relationship("Family", back_populates="shopping_lists")
    meal_plan = relationship("MealPlan")
    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, index=True)
    shopping_list_id = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(String(50))
    unit = Column(String(50))
    checked = Column(Boolean, default=False)

    shopping_list = relationship("ShoppingList", back_populates="items")
