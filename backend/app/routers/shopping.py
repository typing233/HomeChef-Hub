from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import re

from app.database import get_db
from app.models import User, Family, MealPlan, Meal, ShoppingList, ShoppingItem, Ingredient
from app.schemas.schemas import ShoppingListCreate, ShoppingListOut, ShoppingItemCreate, ShoppingItemUpdate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/shopping-lists", tags=["购物清单"])


def _parse_number(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r"[\d.]+", s)
    return float(m.group()) if m else None


def _sum_amounts(a: str | None, b: str | None) -> str | None:
    na, nb = _parse_number(a), _parse_number(b)
    if na is not None and nb is not None:
        total = na + nb
        return str(int(total)) if total == int(total) else str(total)
    if na is not None:
        return a
    if nb is not None:
        return b
    return a or b


def _check_family_access(family_id: int, user: User, db: Session):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="家庭不存在")
    if user not in family.members:
        raise HTTPException(status_code=403, detail="无权限访问")


@router.post("", response_model=ShoppingListOut, status_code=201)
def create_shopping_list(data: ShoppingListCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_family_access(data.family_id, current_user, db)

    sl = ShoppingList(
        family_id=data.family_id,
        meal_plan_id=data.meal_plan_id,
        title=data.title or "购物清单",
    )
    db.add(sl)
    db.flush()

    if data.meal_plan_id:
        meals = db.query(Meal).filter(Meal.meal_plan_id == data.meal_plan_id).all()
        aggregated: dict[tuple, dict] = {}
        for meal in meals:
            recipe_ingredients = db.query(Ingredient).filter(Ingredient.recipe_id == meal.recipe_id).all()
            for ing in recipe_ingredients:
                key = (ing.name.lower().strip(), (ing.unit or "").lower().strip())
                if key in aggregated:
                    aggregated[key]["amount"] = _sum_amounts(aggregated[key]["amount"], ing.amount)
                else:
                    aggregated[key] = {"name": ing.name, "amount": ing.amount, "unit": ing.unit}

        for item_data in aggregated.values():
            sl.items.append(ShoppingItem(
                name=item_data["name"],
                amount=item_data["amount"],
                unit=item_data["unit"],
            ))

    db.commit()
    db.refresh(sl)
    return sl


@router.get("/family/{family_id}", response_model=list[ShoppingListOut])
def list_shopping_lists(family_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_family_access(family_id, current_user, db)
    return db.query(ShoppingList).options(
        joinedload(ShoppingList.items)
    ).filter(ShoppingList.family_id == family_id).order_by(ShoppingList.created_at.desc()).all()


@router.get("/{list_id}", response_model=ShoppingListOut)
def get_shopping_list(list_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sl = db.query(ShoppingList).options(joinedload(ShoppingList.items)).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="购物清单不存在")
    _check_family_access(sl.family_id, current_user, db)
    return sl


@router.post("/{list_id}/items", response_model=ShoppingListOut)
def add_item(list_id: int, data: ShoppingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sl = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="购物清单不存在")
    _check_family_access(sl.family_id, current_user, db)

    item = ShoppingItem(shopping_list_id=list_id, name=data.name, amount=data.amount, unit=data.unit)
    db.add(item)
    db.commit()
    db.refresh(sl)
    return db.query(ShoppingList).options(joinedload(ShoppingList.items)).filter(ShoppingList.id == list_id).first()


@router.put("/items/{item_id}", response_model=ShoppingListOut)
def update_item(item_id: int, data: ShoppingItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="清单项不存在")

    sl = db.query(ShoppingList).filter(ShoppingList.id == item.shopping_list_id).first()
    _check_family_access(sl.family_id, current_user, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    db.commit()
    return db.query(ShoppingList).options(joinedload(ShoppingList.items)).filter(ShoppingList.id == sl.id).first()


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="清单项不存在")

    sl = db.query(ShoppingList).filter(ShoppingList.id == item.shopping_list_id).first()
    _check_family_access(sl.family_id, current_user, db)
    db.delete(item)
    db.commit()


@router.delete("/{list_id}", status_code=204)
def delete_shopping_list(list_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sl = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="购物清单不存在")
    _check_family_access(sl.family_id, current_user, db)
    db.delete(sl)
    db.commit()
