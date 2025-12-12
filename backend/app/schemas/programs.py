from pydantic import BaseModel


class ProgramRead(BaseModel):
    id: str
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}
