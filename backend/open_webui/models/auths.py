import logging
import uuid
import time
from typing import Optional

from open_webui.internal.db import Base, get_db, JSONField
from open_webui.models.users import UserModel, Users, User
from open_webui.env import SRC_LOG_LEVELS
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, String, Text, BigInteger
from open_webui.utils.auth import verify_password
from open_webui.utils.near_ai_cloud import create_customer_sync
from open_webui.utils.user_encryption import get_user_data_encryption_key

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])

####################
# DB MODEL
####################


class Auth(Base):
    __tablename__ = "auth"

    id = Column(String, primary_key=True)
    email = Column(String)
    password = Column(Text)
    active = Column(Boolean)


class AuthModel(BaseModel):
    id: str
    email: str
    password: str
    active: bool = True


####################
# Forms
####################


class Token(BaseModel):
    token: str
    token_type: str


class ApiKey(BaseModel):
    api_key: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    profile_image_url: str


class SigninResponse(Token, UserResponse):
    pass


class SigninForm(BaseModel):
    email: str
    password: str


class LdapForm(BaseModel):
    user: str
    password: str


class ProfileImageUrlForm(BaseModel):
    profile_image_url: str


class UpdateProfileForm(BaseModel):
    profile_image_url: str
    name: str


class UpdatePasswordForm(BaseModel):
    password: str
    new_password: str


class SignupForm(BaseModel):
    name: str
    email: str
    password: str
    profile_image_url: Optional[str] = "/user.png"


class AddUserForm(SignupForm):
    role: Optional[str] = "pending"


class AuthsTable:
    def insert_new_auth(
        self,
        email: str,
        password: str,
        name: str,
        profile_image_url: str = "/user.png",
        role: str = "pending",
        oauth_sub: Optional[str] = None,
    ) -> Optional[UserModel]:
        with get_db() as db:
            try:
                id = str(uuid.uuid4())

                # Create auth record
                auth = AuthModel(
                    **{"id": id, "email": email, "password": password, "active": True}
                )
                auth_result = Auth(**auth.model_dump())
                db.add(auth_result)

                # Create user record in the same transaction
                user_model = UserModel(
                    **{
                        "id": id,
                        "name": name,
                        "email": email,
                        "role": role,
                        "profile_image_url": profile_image_url,
                        "last_active_at": int(time.time()),
                        "created_at": int(time.time()),
                        "updated_at": int(time.time()),
                        "oauth_sub": oauth_sub,
                    }
                )
                user_result = User(**user_model.model_dump())
                db.add(user_result)

                # Flush to ensure the records are created before calling external services
                db.flush()

                # Generate data encryption key for the new user (within transaction)
                get_user_data_encryption_key(id, db)
                log.info(f"Generated data encryption key for new user: {id}")

                # Call NEAR AI Cloud API to create customer
                create_customer_sync(id)

                # If everything succeeded, commit the transaction
                db.commit()
                db.refresh(auth_result)
                db.refresh(user_result)

                return user_model

            except Exception as e:
                # Ensure rollback on any error
                db.rollback()
                log.exception(f"Error in insert_new_auth: {str(e)}")
                raise

    def authenticate_user(self, email: str, password: str) -> Optional[UserModel]:
        log.info(f"authenticate_user: {email}")
        try:
            with get_db() as db:
                auth = db.query(Auth).filter_by(email=email, active=True).first()
                if auth:
                    if verify_password(password, auth.password):
                        user = Users.get_user_by_id(auth.id)
                        return user
                    else:
                        return None
                else:
                    return None
        except Exception:
            return None

    def authenticate_user_by_api_key(self, api_key: str) -> Optional[UserModel]:
        log.info(f"authenticate_user_by_api_key: {api_key}")
        # if no api_key, return None
        if not api_key:
            return None

        try:
            user = Users.get_user_by_api_key(api_key)
            return user if user else None
        except Exception:
            return False

    def authenticate_user_by_trusted_header(self, email: str) -> Optional[UserModel]:
        log.info(f"authenticate_user_by_trusted_header: {email}")
        try:
            with get_db() as db:
                auth = db.query(Auth).filter_by(email=email, active=True).first()
                if auth:
                    user = Users.get_user_by_id(auth.id)
                    return user
        except Exception:
            return None

    def update_user_password_by_id(self, id: str, new_password: str) -> bool:
        try:
            with get_db() as db:
                result = (
                    db.query(Auth).filter_by(id=id).update({"password": new_password})
                )
                db.commit()
                return True if result == 1 else False
        except Exception:
            return False

    def update_email_by_id(self, id: str, email: str) -> bool:
        try:
            with get_db() as db:
                result = db.query(Auth).filter_by(id=id).update({"email": email})
                db.commit()
                return True if result == 1 else False
        except Exception:
            return False

    def delete_auth_by_id(self, id: str) -> bool:
        try:
            with get_db() as db:
                # Delete User
                result = Users.delete_user_by_id(id)

                if result:
                    db.query(Auth).filter_by(id=id).delete()
                    db.commit()

                    return True
                else:
                    return False
        except Exception:
            return False


Auths = AuthsTable()
