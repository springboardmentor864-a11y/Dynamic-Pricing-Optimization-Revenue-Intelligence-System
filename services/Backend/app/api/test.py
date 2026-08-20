from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/test",
    tags=["Test"]
)


@router.get("/protected")
def protected_route(
    user=Depends(get_current_user)
):

    return {
        "message": "You are authenticated",
        "user": user
    }