# models.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    scans = relationship("Scan", back_populates="user")

class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    url = Column(String, index=True)
    status = Column(String, default="running")  # running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    findings_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    user = relationship("User", back_populates="scans")
    findings = relationship("Finding", back_populates="scan")

class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id"))
    type = Column(String)  # SQL Injection, XSS, etc
    severity = Column(String)  # CRITICAL, HIGH, MEDIUM, LOW
    endpoint = Column(String, nullable=True)
    payload = Column(Text, nullable=True)
    cvss_score = Column(Integer)
    remediation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    scan = relationship("Scan", back_populates="findings")