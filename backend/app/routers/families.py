import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Family
from app.schemas.schemas import FamilyCreate, FamilyOut, FamilyJoin
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/families", tags=["家庭群组"])


@router.post("", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
def create_family(data: FamilyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    family = Family(
        name=data.name,
        invite_code=secrets.token_urlsafe(8),
        owner_id=current_user.id,
    )
    family.members.append(current_user)
    db.add(family)
    db.commit()
    db.refresh(family)
    return family


@router.get("", response_model=list[FamilyOut])
def list_families(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return current_user.families


@router.post("/join", response_model=FamilyOut)
def join_family(data: FamilyJoin, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    family = db.query(Family).filter(Family.invite_code == data.invite_code).first()
    if not family:
        raise HTTPException(status_code=404, detail="邀请码无效")
    if current_user in family.members:
        raise HTTPException(status_code=400, detail="您已是该家庭成员")
    family.members.append(current_user)
    db.commit()
    db.refresh(family)
    return family


@router.get("/{family_id}", response_model=FamilyOut)
def get_family(family_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="家庭不存在")
    if current_user not in family.members:
        raise HTTPException(status_code=403, detail="无权限访问")
    return family
