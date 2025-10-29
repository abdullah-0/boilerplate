from pydantic import BaseModel


class EntityBase(BaseModel):
    name: str
    description: str | None = None


class EntityCreate(EntityBase):
    pass


class EntityUpdate(EntityBase):
    pass


class EntityDetail(EntityBase):
    id: int

    class Config:
        from_attributes = True


class EntityList(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
