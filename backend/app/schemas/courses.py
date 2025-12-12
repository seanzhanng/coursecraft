from pydantic import BaseModel


class CourseRead(BaseModel):
    code: str
    name: str
    credits: float
    description: str | None = None

    model_config = {"from_attributes": True}
