"""Offline authentication helpers for Nritya.ai."""

import hashlib
import hmac
import json
import os
import re
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any


AUTH_DATA_DIR = Path("admin_data")
USERS_FILE = AUTH_DATA_DIR / "users.json"
ROLES = {"student", "teacher", "admin"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _hash_password(password: str, salt: str | None = None) -> dict[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000)
    return {"salt": salt, "password_hash": digest.hex()}


def _verify_password(password: str, user: dict[str, Any]) -> bool:
    if "password_hash" in user and "salt" in user:
        hashed = _hash_password(password, user["salt"])
        return hmac.compare_digest(hashed["password_hash"], user["password_hash"])
    return hmac.compare_digest(user.get("password", ""), password)


def _default_users() -> dict[str, dict[str, Any]]:
    defaults = {
        "student": {
            "full_name": "Demo Student",
            "email": "student@nritya.ai",
            "password": os.getenv("NRITYA_STUDENT_PASSWORD", "student123"),
            "role": "student",
        },
        "teacher": {
            "full_name": "Demo Teacher",
            "email": "teacher@nritya.ai",
            "password": os.getenv("NRITYA_TEACHER_PASSWORD", "teacher123"),
            "role": "teacher",
        },
        "admin": {
            "full_name": "Demo Admin",
            "email": "admin@nritya.ai",
            "password": os.getenv("NRITYA_ADMIN_PASSWORD", "admin123"),
            "role": "admin",
        },
    }
    users = {}
    for username, data in defaults.items():
        password_data = _hash_password(data.pop("password"))
        users[username] = {
            **data,
            **password_data,
            "username": username,
            "student_profile": {},
            "created_at": datetime.now().isoformat(timespec="seconds"),
        }
    return users


def load_users() -> dict[str, dict[str, Any]]:
    AUTH_DATA_DIR.mkdir(exist_ok=True)
    if not USERS_FILE.exists():
        users = _default_users()
        save_users(users)
        return users
    try:
        users = json.loads(USERS_FILE.read_text(encoding="utf-8"))
        return users if isinstance(users, dict) else {}
    except json.JSONDecodeError:
        return {}


def save_users(users: dict[str, dict[str, Any]]) -> None:
    AUTH_DATA_DIR.mkdir(exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    user = load_users().get(username.strip().lower())
    if not user or not _verify_password(password, user):
        return None
    return user


def register_user(data: dict[str, Any]) -> dict[str, Any]:
    users = load_users()
    username = str(data.get("username", "")).strip().lower()
    email = str(data.get("email", "")).strip().lower()
    full_name = str(data.get("full_name", "")).strip()
    password = str(data.get("password", ""))
    role = str(data.get("role", "")).strip().lower()
    student_profile = data.get("student_profile") or {}

    if not all([full_name, email, username, password, role]):
        raise ValueError("All required fields must be completed.")
    if role not in ROLES:
        raise ValueError("Choose a valid role.")
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    if username in users:
        raise ValueError("Username already exists.")
    if any(user.get("email", "").lower() == email for user in users.values()):
        raise ValueError("Email address is already registered.")
    if role == "student":
        if not student_profile.get("exam_level") or not student_profile.get("exam_board"):
            raise ValueError("Student examination level and board are required.")
    else:
        student_profile = {}

    password_data = _hash_password(password)
    users[username] = {
        "username": username,
        "full_name": full_name,
        "email": email,
        "role": role,
        "student_profile": student_profile,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        **password_data,
    }
    save_users(users)
    return public_user(users[username])


def find_recovery_account(identifier: str) -> dict[str, Any] | None:
    identifier = identifier.strip().lower()
    for user in load_users().values():
        if user.get("username", "").lower() == identifier or user.get("email", "").lower() == identifier:
            return public_user(user)
    return None


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "username": user.get("username", ""),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "student_profile": user.get("student_profile", {}),
    }
