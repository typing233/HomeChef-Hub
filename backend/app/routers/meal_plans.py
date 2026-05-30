from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, Family, MealPlan, Meal, MealType
from app.schemas.schemas import MealPlanCreate, MealPlanOut, MealCreate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/meal-plans", tags=["餐食计划"])


def _check_family_access(family_id: int, user: User, db: Session) -> Family:
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="家庭不存在")
    if user not in family.members:
        raise HTTPException(status_code=403, detail="无权限访问该家庭")
    return family


@router.post("", response_model=MealPlanOut, status_code=201)
def create_meal_plan(data: MealPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_family_access(data.family_id, current_user, db)

    plan = MealPlan(
        family_id=data.family_id,
        title=data.title or f"{data.start_date} ~ {data.end_date} 餐食计划",
        start_date=data.start_date,
        end_date=data.end_date,
    )

    for m in data.meals:
        plan.meals.append(Meal(
            recipe_id=m.recipe_id,
            date=m.date,
            meal_type=MealType(m.meal_type.value),
        ))

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _load_plan(plan.id, db)


@router.get("/family/{family_id}", response_model=list[MealPlanOut])
def list_meal_plans(family_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_family_access(family_id, current_user, db)
    plans = db.query(MealPlan).filter(MealPlan.family_id == family_id).order_by(MealPlan.start_date.desc()).all()
    return plans


@router.get("/{plan_id}", response_model=MealPlanOut)
def get_meal_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = _load_plan(plan_id, db)
    if not plan:
        raise HTTPException(status_code=404, detail="餐食计划不存在")
    _check_family_access(plan.family_id, current_user, db)
    return plan


@router.post("/{plan_id}/meals", response_model=MealPlanOut)
def add_meal(plan_id: int, data: MealCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(MealPlan).filter(MealPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="餐食计划不存在")
    _check_family_access(plan.family_id, current_user, db)

    meal = Meal(
        meal_plan_id=plan.id,
        recipe_id=data.recipe_id,
        date=data.date,
        meal_type=MealType(data.meal_type.value),
    )
    db.add(meal)
    db.commit()
    return _load_plan(plan_id, db)


@router.delete("/{plan_id}", status_code=204)
def delete_meal_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(MealPlan).filter(MealPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="餐食计划不存在")
    _check_family_access(plan.family_id, current_user, db)
    db.delete(plan)
    db.commit()


@router.delete("/meals/{meal_id}", status_code=204)
def delete_meal(meal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="餐次不存在")
    plan = db.query(MealPlan).filter(MealPlan.id == meal.meal_plan_id).first()
    _check_family_access(plan.family_id, current_user, db)
    db.delete(meal)
    db.commit()


def _load_plan(plan_id: int, db: Session):
    return db.query(MealPlan).options(
        joinedload(MealPlan.meals).joinedload(Meal.recipe),
    ).filter(MealPlan.id == plan_id).first()
