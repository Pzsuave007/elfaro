"""JWT authentication + role-based access control."""
import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

from core import db, now_iso, new_id, clean, ROLE_LEVEL, ROLES

JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "writer"


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(creds.credentials, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    user = clean(user)
    user.pop("password_hash", None)
    return user


def require_role(min_role: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if ROLE_LEVEL.get(user.get("role", ""), -1) < ROLE_LEVEL[min_role]:
            raise HTTPException(status_code=403, detail="Permisos insuficientes")
        return user
    return checker


@auth_router.post("/login")
async def login(data: LoginInput):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = create_access_token(user["id"], user["email"], user["role"])
    out = clean(dict(user))
    out.pop("password_hash", None)
    return {"token": token, "user": out}


@auth_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@auth_router.get("/users")
async def list_users(user: dict = Depends(require_role("admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users


@auth_router.post("/users")
async def create_user(data: RegisterInput, user: dict = Depends(require_role("admin"))):
    email = data.email.lower().strip()
    if data.role not in ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="El correo ya existe")
    doc = {
        "id": new_id(), "email": email, "name": data.name, "role": data.role,
        "password_hash": hash_password(data.password), "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    out = clean(dict(doc))
    out.pop("password_hash", None)
    return out


@auth_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_role("super_admin"))):
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    await db.users.delete_one({"id": user_id})
    return {"ok": True}


async def seed_admin():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@elforo.org").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": new_id(), "email": admin_email, "name": "Super Admin",
            "role": "super_admin", "password_hash": hash_password(admin_password),
            "created_at": now_iso(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
