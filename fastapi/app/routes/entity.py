from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependency import get_auth_user, get_db
from app.models import Entity, User
from app.schemas.entity import EntityCreate, EntityDetail, EntityList, EntityUpdate

router = APIRouter()


def _get_entity(db: Session, user_id: int, entity_id: int | None = None):
    stmt = select(Entity).where(Entity.user_id == user_id)
    if entity_id:
        stmt = stmt.where(Entity.id == entity_id)
        return db.execute(stmt).scalar_one_or_none()
    return db.execute(stmt).scalars().all()


@router.post("/", response_model=EntityDetail, status_code=status.HTTP_201_CREATED)
def create_entity(
    entity_data: EntityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_auth_user),
):
    new_entity = Entity(**entity_data.model_dump(), user_id=user.id)
    db.add(new_entity)
    db.commit()
    db.refresh(new_entity)
    return new_entity


@router.get("/", response_model=list[EntityList])
def list_entity(db: Session = Depends(get_db), user: User = Depends(get_auth_user)):
    return _get_entity(db, user.id)


@router.get("/{entity_id}", response_model=EntityDetail)
def detail_entity(
    entity_id: int, db: Session = Depends(get_db), user: User = Depends(get_auth_user)
):
    entity = _get_entity(db, user.id, entity_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found"
        )
    return entity


@router.put("/{entity_id}", response_model=EntityDetail)
def update_entity(
    entity_id: int,
    update_data: EntityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_auth_user),
):
    entity = _get_entity(db, user.id, entity_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found"
        )

    for key, value in update_data.model_dump().items():
        setattr(entity, key, value)

    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entity(
    entity_id: int, db: Session = Depends(get_db), user: User = Depends(get_auth_user)
):
    entity = _get_entity(db, user.id, entity_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found"
        )

    db.delete(entity)
    db.commit()
