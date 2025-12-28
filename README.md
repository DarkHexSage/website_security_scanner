# 🛡️ Web Application Security Audit Platform

**A full-stack eWPTX-level web application security scanner built with FastAPI, React, and PostgreSQL.**

---

## 🎯 **Overview**

This platform automates security scanning of web applications to identify vulnerabilities including:
- Missing security headers (HSTS, CSP, X-Frame-Options)
- Server information disclosure
- Unencrypted connections (HTTP vs HTTPS)
- Authentication & authorization flaws
- And more...

**Real-world ready with Docker containerization, JWT authentication, and input validation.**

---

## ✨ **Features**

✅ **User Authentication** - JWT-based login/registration system  
✅ **Security Scanning** - eWPTX-level vulnerability detection  
✅ **Real-time Results** - Live scanning status and findings display  
✅ **Professional Dashboard** - Beautiful, responsive UI  
✅ **Input Validation** - Email, password, and URL format validation  
✅ **Docker Support** - Complete containerization with docker-compose  
✅ **CORS Enabled** - Full frontend-backend communication  
✅ **Database Persistence** - PostgreSQL for secure data storage  

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────┐
│          React Frontend (Port 3000)          │
│  - Login/Register Forms                     │
│  - Scan Dashboard                           │
│  - Real-time Results Display                │
└──────────────┬──────────────────────────────┘
               │ HTTP/JSON (CORS Enabled)
┌──────────────▼──────────────────────────────┐
│      FastAPI Backend (Port 8000)            │
│  - JWT Authentication                       │
│  - Security Scanner Engine                  │
│  - Vulnerability Detection                  │
└──────────────┬──────────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────────┐
│    PostgreSQL Database (Port 5432)          │
│  - Users                                    │
│  - Scans                                    │
│  - Findings                                 │
└─────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start with Docker Compose**

**Prerequisites:**
- Docker and Docker Compose installed
- Port 3000, 5432, 8000 available

**Run the entire stack in one command:**

```bash
docker-compose up --build
```

Wait for all services to start:
```
security_db | database system is ready to accept connections
security_backend | INFO:     Uvicorn running on http://0.0.0.0:8000
security_frontend |  INFO  Accepting connections at http://localhost:3000
```

**Open browser:** http://localhost:3000

---

## 📋 **Usage**

### **1. Register**
- Email: `user@example.com` (valid format required)
- Password: `password123` (8+ characters required)
- Click "Register New Account"

### **2. Login**
- Same credentials
- Click "Login"

### **3. Scan Website**
- Enter URL: `https://example.com` (http:// or https:// required)
- Click "Start Scan"
- View real-time results

### **4. View Results**
- Critical, High, Medium, Low severity counts
- Detailed finding descriptions
- CVSS scores and remediation steps

---

## 🔧 **Technical Details**

### **Backend Stack**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Production database
- **PyJWT** - JWT token management
- **Passlib + bcrypt** - Password hashing

### **Frontend Stack**
- **React 18** - UI framework
- **Axios** - HTTP client
- **CSS-in-JS** - Inline styling

### **Database Schema**
```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    created_at TIMESTAMP
);

-- Scans
CREATE TABLE scans (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY,
    url VARCHAR,
    status VARCHAR,
    findings_count INT,
    critical_count INT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Findings
CREATE TABLE findings (
    id UUID PRIMARY KEY,
    scan_id UUID FOREIGN KEY,
    type VARCHAR,
    severity VARCHAR,
    cvss_score FLOAT,
    endpoint VARCHAR,
    payload VARCHAR,
    remediation TEXT
);
```

---

## 🔐 **Security Features**

### **JWT Authentication**
- Tokens issued on registration/login
- Valid for 24 hours
- Required for all scan operations
- Stored securely in browser localStorage

### **Password Security**
- Hashed with bcrypt (10 rounds)
- Minimum 8 characters enforced
- Frontend validation before submission

### **CORS Configuration**
- Frontend can communicate with backend
- All HTTP methods allowed
- Credentials supported
- Preflight requests handled

```python
# Backend CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ **Input Validation**

### **Frontend Validation**
All user input is validated before submission:

#### **Email Validation**
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```
- Must match: `user@domain.com`
- Rejects: `abc`, `user@`, invalid formats

#### **Password Validation**
```javascript
const validatePassword = (password) => {
  return password.length >= 8;
};
```
- Minimum 8 characters
- Enforced on register and login

#### **URL Validation**
```javascript
const validateUrl = (url) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};
```
- Must be valid URL format
- Must start with http:// or https://
- Rejects: `google.com`, `example`, malformed URLs

### **Error Messages**
Users see clear feedback:
```
❌ Invalid email format. Example: user@example.com
❌ Password must be at least 8 characters long
❌ Invalid URL. Use: https://example.com or http://example.com
```

---

## 📡 **API Endpoints**

### **Authentication**
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123"
}
→ Response: { "access_token": "...", "token_type": "bearer" }

POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
→ Response: { "access_token": "...", "token_type": "bearer" }
```

### **Scanning**
```
POST /api/scans/create
Headers: Authorization: Bearer <token>
{
  "url": "https://example.com"
}
→ Response: { "scan_id": "...", "status": "running" }

GET /api/scans/status/{scan_id}
Headers: Authorization: Bearer <token>
→ Response: { "status": "completed", "findings": [...], ... }
```

---

## 🐳 **Docker Compose Services**

### **Service 1: PostgreSQL Database**
```yaml
db:
  image: postgres:15
  ports: 5432:5432
  volumes: postgres_data
```
- Persistent data storage
- Health checks enabled
- Auto-creates security_scanner database

### **Service 2: FastAPI Backend**
```yaml
backend:
  build: ./backend
  ports: 8000:8000
  depends_on: db (health check)
  environment:
    DATABASE_URL: postgresql://...
    SECRET_KEY: sk_dev_...
```
- Auto-builds from Dockerfile
- Waits for database to be healthy
- Environment variables configured

### **Service 3: React Frontend**
```yaml
frontend:
  build: ./frontend
  ports: 3000:3000
  environment:
    REACT_APP_API_URL: http://backend:8000
```
- Multi-stage build (optimized)
- Served with `serve` package
- Uses internal network name for backend URL

---

## 🛑 **Stopping Services**

```bash
# Stop all containers
docker-compose down

# Stop and remove everything (including data)
docker-compose down -v

# Stop specific service
docker-compose stop backend

# Restart specific service
docker-compose restart frontend
```

---

## 📊 **Useful Commands**

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# View running containers
docker ps

# Access backend shell
docker exec -it security_backend bash

# Access database
docker exec -it security_db psql -U postgres -d security_scanner

# Rebuild without cache
docker-compose down && docker system prune -f && docker-compose up --build
```

---

## 🧪 **Test URLs**

### **Critical (Has vulnerabilities)**
```
http://testphp.vulnweb.com/
```
Expected: Multiple CRITICAL/HIGH findings

### **Secure (Minimal issues)**
```
https://www.google.com
https://www.wikipedia.org
```
Expected: Few or no findings

---

## 🔄 **CORS Fix Explanation**

**Problem:** Frontend requests were getting 400 Bad Request on OPTIONS preflight.

**Solution:** Added CORS middleware to handle preflight requests:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What this does:**
- ✅ Allows preflight OPTIONS requests (required before POST/PUT)
- ✅ Allows all HTTP methods
- ✅ Allows all headers
- ✅ Credentials (cookies, tokens) supported

**Must be added BEFORE other middleware and routes.**

---

## 🔐 **Input Validation Fix Explanation**

**Problem:** Users could register/scan with invalid input (no validation).

**Solution:** Added frontend validation functions:

```javascript
// Email: Must be valid format
if (!validateEmail(email)) {
  setError('Invalid email format. Example: user@example.com');
  return;
}

// Password: Must be 8+ characters
if (!validatePassword(password)) {
  setError('Password must be at least 8 characters long');
  return;
}

// URL: Must be http:// or https://
if (!validateUrl(url)) {
  setError('Invalid URL. Use: https://example.com or http://example.com');
  return;
}
```

**Benefits:**
- ✅ Better UX (instant feedback)
- ✅ Fewer invalid backend requests
- ✅ Clear error messages
- ✅ Professional appearance

**Note:** Frontend validation is NOT security. Backend validates too.

---

## 📁 **Project Structure**

```
web-app-security-audit-platform/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── models.py              # Database models
│   ├── database.py            # Database config
│   ├── config.py              # Settings
│   ├── security_scanner.py    # Scanning logic
│   ├── routers/
│   │   ├── auth.py            # Login/register endpoints
│   │   └── scans.py           # Scan endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Environment variables
│   └── Dockerfile             # Container definition
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── App.css            # Styles
│   │   └── index.js           # Entry point
│   ├── public/
│   ├── package.json           # Node dependencies
│   ├── .env                   # Frontend config
│   └── Dockerfile             # Container definition
│
└── docker-compose.yml         # Multi-container orchestration
```

---

## 🚀 **Deployment**

### **Local Development**
```bash
docker-compose up --build
# Open http://localhost:3000
```

### **Production Deployment**
```bash
# On server with Docker installed:
docker-compose -f docker-compose.prod.yml up -d

# Or use cloud: AWS ECS, Azure Container Instances, etc.
```

---

## 🤝 **Contributing**

This is a learning/portfolio project. Feel free to:
- Add more vulnerability checks
- Improve the scanner engine
- Enhance the UI
- Add more test cases

---

## ⚖️ **Legal Notice**

**Educational Use Only**
- For learning and demonstration purposes
- Test only on sites you own or have permission to test
- Results may contain false positives/negatives
- Use professional tools (Burp Suite, OWASP ZAP) for production assessments

---

## 📚 **Technologies Used**

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI | 0.104.1 |
| Frontend | React | 18 |
| Database | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.0.23 |
| Auth | PyJWT + bcrypt | 2.10.1 / 4.0.1 |
| Container | Docker | Latest |
| Orchestration | Docker Compose | 3.8 |

---

## 🎓 **Learning Resources**

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Docker Docs](https://docs.docker.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## ✅ **Checklist**

- [x] Backend API with JWT auth
- [x] React frontend with validation
- [x] PostgreSQL database
- [x] Docker containerization
- [x] CORS enabled
- [x] Input validation
- [x] Security scanning engine
- [x] Real-time results
- [x] Professional UI
- [x] Error handling


## 📄 **License**

Educational project - Use freely for learning.

---

**Built with ❤️ for eWPTX-level security engineering.** 🛡️

Happy scanning! 💪