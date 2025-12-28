# COMPLETE FILE: backend/routers/scans.py

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Scan, Finding, User
from security_scanner import eWPTXScanner
from routers.auth import get_current_user
import asyncio
from datetime import datetime

router = APIRouter()

class ScanRequest(BaseModel):
    url: str

class ScanResponse(BaseModel):
    scan_id: str
    status: str

@router.post("/create")
async def create_scan(
    scan_req: ScanRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Start a new security scan"""
    
    # Verify user
    user = get_current_user(authorization, db)
    
    # Validate URL
    if not scan_req.url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Invalid URL format")
    
    # Create scan record
    scan = Scan(
        user_id=user.id,
        url=scan_req.url,
        status="running"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Run scan in background
    asyncio.create_task(run_scan_background(scan.id, scan_req.url, db))
    
    return {"scan_id": scan.id, "status": "running"}

async def run_scan_background(scan_id: str, url: str, db: Session):
    """Background task to run scanner"""
    try:
        scanner = eWPTXScanner(url)
        findings = scanner.run_all_tests()
        
        # Store findings
        for finding in findings:
            db_finding = Finding(
                scan_id=scan_id,
                type=finding['type'],
                severity=finding['severity'],
                endpoint=finding.get('endpoint'),
                payload=finding.get('payload'),
                cvss_score=finding.get('cvss'),
                remediation=finding.get('remediation')
            )
            db.add(db_finding)
        
        # Update scan
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        scan.status = "completed"
        scan.findings_count = len(findings)
        scan.critical_count = len([f for f in findings if f['severity'] == 'CRITICAL'])
        scan.completed_at = datetime.utcnow()
        db.commit()
    
    except Exception as e:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        scan.status = "failed"
        db.commit()

@router.get("/status/{scan_id}")
def get_scan_status(
    scan_id: str,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Get scan status and findings"""
    
    # Verify user
    user = get_current_user(authorization, db)
    
    # Get scan
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or scan.user_id != user.id:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Get findings
    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    
    return {
        "scan_id": scan_id,
        "url": scan.url,
        "status": scan.status,
        "findings_count": len(findings),
        "critical_count": scan.critical_count,
        "findings": [
            {
                "type": f.type,
                "severity": f.severity,
                "cvss_score": f.cvss_score,
                "endpoint": f.endpoint,
                "payload": f.payload,
                "remediation": f.remediation
            }
            for f in findings
        ]
    }