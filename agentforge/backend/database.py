import os, uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON, Integer

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./gitcode.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def utcnow():
    return datetime.now(timezone.utc)

def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id            : Mapped[str]       = mapped_column(String, primary_key=True, default=new_id)
    github_id     : Mapped[int]       = mapped_column(Integer, unique=True)
    login         : Mapped[str]       = mapped_column(String(100))
    name          : Mapped[str | None]= mapped_column(String(200))
    avatar_url    : Mapped[str | None]= mapped_column(Text)
    github_token  : Mapped[str | None]= mapped_column(Text)
    created_at    : Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow)
    sessions      : Mapped[list["Session"]]     = relationship(back_populates="user", cascade="all, delete-orphan")
    repos         : Mapped[list["Repo"]]        = relationship(back_populates="user", cascade="all, delete-orphan")
    api_settings  : Mapped["ApiSettings | None"]= relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    permissions   : Mapped[list["Permission"]]  = relationship(back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"
    id          : Mapped[str]       = mapped_column(String, primary_key=True, default=new_id)
    user_id     : Mapped[str]       = mapped_column(ForeignKey("users.id"))
    title       : Mapped[str]       = mapped_column(String(200), default="New session")
    model       : Mapped[str]       = mapped_column(String(100), default="groq/llama-3.3-70b")
    repo_id     : Mapped[str | None]= mapped_column(ForeignKey("repos.id"), nullable=True)
    status      : Mapped[str]       = mapped_column(String(20), default="idle")
    # Multi-agent config
    agent_config: Mapped[dict | None]= mapped_column(JSON) # Map of role -> model_id

    created_at  : Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at  : Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    user        : Mapped["User"]            = relationship(back_populates="sessions")
    messages    : Mapped[list["Message"]]   = relationship(back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
    repo        : Mapped["Repo | None"]     = relationship()


class Message(Base):
    __tablename__ = "messages"
    id          : Mapped[str]       = mapped_column(String, primary_key=True, default=new_id)
    session_id  : Mapped[str]       = mapped_column(ForeignKey("sessions.id"))
    role        : Mapped[str]       = mapped_column(String(20)) # user, assistant, tool_call, tool_result, info
    agent_role  : Mapped[str | None]= mapped_column(String(50)) # planner, coder, etc.
    content     : Mapped[str | None]= mapped_column(Text)
    tool_name   : Mapped[str | None]= mapped_column(String(100))
    tool_call_id: Mapped[str | None]= mapped_column(String(100))
    tool_input  : Mapped[dict | None]= mapped_column(JSON)
    tool_output : Mapped[str | None]= mapped_column(Text)

    # State for approvals
    approval_status: Mapped[str | None]= mapped_column(String(20)) # pending, approved, rejected

    created_at  : Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow)
    session     : Mapped["Session"] = relationship(back_populates="messages")


class Permission(Base):
    __tablename__ = "permissions"
    id          : Mapped[str]       = mapped_column(String, primary_key=True, default=new_id)
    user_id     : Mapped[str]       = mapped_column(ForeignKey("users.id"))
    workspace_id: Mapped[str | None]= mapped_column(String(100))
    repo_id     : Mapped[str | None]= mapped_column(String(100))
    tool_name   : Mapped[str]       = mapped_column(String(100))
    allowed     : Mapped[bool]      = mapped_column(Boolean, default=True)
    user        : Mapped["User"]    = relationship(back_populates="permissions")


class Repo(Base):
    __tablename__ = "repos"
    id             : Mapped[str]        = mapped_column(String, primary_key=True, default=new_id)
    user_id        : Mapped[str]        = mapped_column(ForeignKey("users.id"))
    full_name      : Mapped[str]        = mapped_column(String(200))
    name           : Mapped[str]        = mapped_column(String(100))
    private        : Mapped[bool]       = mapped_column(Boolean, default=False)
    default_branch : Mapped[str]        = mapped_column(String(100), default="main")
    language       : Mapped[str | None] = mapped_column(String(50))
    description    : Mapped[str | None] = mapped_column(Text)
    imported_at    : Mapped[datetime]   = mapped_column(DateTime(timezone=True), default=utcnow)
    user           : Mapped["User"]     = relationship(back_populates="repos")


class ApiSettings(Base):
    __tablename__ = "api_settings"
    id                  : Mapped[str]       = mapped_column(String, primary_key=True, default=new_id)
    user_id             : Mapped[str]       = mapped_column(ForeignKey("users.id"), unique=True)
    groq_api_key        : Mapped[str | None]= mapped_column(Text)
    openrouter_api_key  : Mapped[str | None]= mapped_column(Text)
    xai_api_key         : Mapped[str | None]= mapped_column(Text)
    user                : Mapped["User"]    = relationship(back_populates="api_settings")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with SessionLocal() as session:
        yield session
