from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database import get_db
from app.models import User, Recipe, Tag, Category, Ingredient, Step, Family, family_members
from app.models import User, Recipe, Tag, Category, Ingredient, Step
from app.schemas.schemas import (
    RecipeCreate, RecipeUpdate, RecipeOut, RecipeListOut, RecipeImport,
    CategoryCreate, CategoryOut, TagCreate, TagOut,
)
from app.utils.auth import get_current_user
from app.services.recipe_scraper import import_recipe_from_url

router = APIRouter(prefix="/api/recipes", tags=["食谱"])


# ─── Categories & Tags ───────────────────────────────────────────────────
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        return existing
    cat = Category(name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()


@router.post("/tags", response_model=TagOut, status_code=201)
def create_tag(data: TagCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    existing = db.query(Tag).filter(Tag.name == data.name).first()
    if existing:
        return existing
    tag = Tag(name=data.name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


# ─── Recipe CRUD ─────────────────────────────────────────────────────────
def _visible_author_ids(user: User, db: Session) -> list[int]:
    """Return user IDs whose recipes are visible: self + all family members."""
    ids = {user.id}
    for family in user.families:
        for member in family.members:
            ids.add(member.id)
    return list(ids)


@router.get("", response_model=list[RecipeListOut])
def list_recipes(
    search: str = Query(None),
    category_id: int = Query(None),
    tag_id: int = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    visible_ids = _visible_author_ids(current_user, db)
    q = db.query(Recipe).options(joinedload(Recipe.category), joinedload(Recipe.tags))
    q = q.filter(Recipe.author_id.in_(visible_ids))

    if search:
        q = q.filter(or_(Recipe.title.ilike(f"%{search}%"), Recipe.description.ilike(f"%{search}%")))
    if category_id:
        q = q.filter(Recipe.category_id == category_id)
    if tag_id:
        q = q.filter(Recipe.tags.any(Tag.id == tag_id))

    return q.order_by(Recipe.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).options(
        joinedload(Recipe.ingredients),
        joinedload(Recipe.steps),
        joinedload(Recipe.tags),
        joinedload(Recipe.category),
        joinedload(Recipe.author),
    ).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    visible_ids = _visible_author_ids(current_user, db)
    if recipe.author_id not in visible_ids:
        raise HTTPException(status_code=403, detail="无权查看此食谱")
    return recipe


@router.post("", response_model=RecipeOut, status_code=201)
def create_recipe(data: RecipeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = Recipe(
        title=data.title,
        description=data.description,
        source_url=data.source_url,
        prep_time=data.prep_time,
        cook_time=data.cook_time,
        servings=data.servings,
        image_url=data.image_url,
        author_id=current_user.id,
        category_id=data.category_id,
    )

    if data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(data.tag_ids)).all()
        recipe.tags = tags

    for ing in data.ingredients:
        recipe.ingredients.append(Ingredient(name=ing.name, amount=ing.amount, unit=ing.unit))

    for step in data.steps:
        recipe.steps.append(Step(order=step.order, description=step.description))

    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return db.query(Recipe).options(
        joinedload(Recipe.ingredients),
        joinedload(Recipe.steps),
        joinedload(Recipe.tags),
        joinedload(Recipe.category),
        joinedload(Recipe.author),
    ).filter(Recipe.id == recipe.id).first()


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: int, data: RecipeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    if recipe.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此食谱")

    for field in ["title", "description", "prep_time", "cook_time", "servings", "image_url", "category_id"]:
        val = getattr(data, field, None)
        if val is not None:
            setattr(recipe, field, val)

    if data.tag_ids is not None:
        recipe.tags = db.query(Tag).filter(Tag.id.in_(data.tag_ids)).all()

    if data.ingredients is not None:
        recipe.ingredients.clear()
        for ing in data.ingredients:
            recipe.ingredients.append(Ingredient(name=ing.name, amount=ing.amount, unit=ing.unit))

    if data.steps is not None:
        recipe.steps.clear()
        for step in data.steps:
            recipe.steps.append(Step(order=step.order, description=step.description))

    db.commit()
    return db.query(Recipe).options(
        joinedload(Recipe.ingredients),
        joinedload(Recipe.steps),
        joinedload(Recipe.tags),
        joinedload(Recipe.category),
        joinedload(Recipe.author),
    ).filter(Recipe.id == recipe.id).first()


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    if recipe.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此食谱")
    db.delete(recipe)
    db.commit()


# ─── Import ──────────────────────────────────────────────────────────────
@router.post("/import", response_model=RecipeOut, status_code=201)
async def import_recipe(data: RecipeImport, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        parsed = await import_recipe_from_url(data.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无法解析该网页: {str(e)}")

    recipe = Recipe(
        title=parsed["title"],
        description=parsed.get("description"),
        source_url=parsed["source_url"],
        prep_time=parsed.get("prep_time"),
        cook_time=parsed.get("cook_time"),
        servings=parsed.get("servings"),
        image_url=parsed.get("image_url"),
        author_id=current_user.id,
    )

    for ing in parsed.get("ingredients", []):
        recipe.ingredients.append(Ingredient(name=ing["name"], amount=ing.get("amount"), unit=ing.get("unit")))

    for step in parsed.get("steps", []):
        recipe.steps.append(Step(order=step["order"], description=step["description"]))

    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return db.query(Recipe).options(
        joinedload(Recipe.ingredients),
        joinedload(Recipe.steps),
        joinedload(Recipe.tags),
        joinedload(Recipe.category),
        joinedload(Recipe.author),
    ).filter(Recipe.id == recipe.id).first()
