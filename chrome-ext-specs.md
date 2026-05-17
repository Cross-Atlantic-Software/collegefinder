![1775638734481](image/chrome-ext-specs/1775638734481.png)# ExamFill Chrome Extension — Complete Technical Specification
**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Pre-Development Specification  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [System Architecture](#3-system-architecture)
4. [Database Schema (PostgreSQL)](#4-database-schema-postgresql)
5. [Backend API Specification](#5-backend-api-specification)
6. [Chrome Extension Structure](#6-chrome-extension-structure)
7. [Adapter System — The Core of Scalability](#7-adapter-system--the-core-of-scalability)
8. [Field Detection Engine](#8-field-detection-engine)
9. [Field Filling Engine](#9-field-filling-engine)
10. [Accuracy & Stability Guarantees](#10-accuracy--stability-guarantees)
11. [Sidebar UI Specification](#11-sidebar-ui-specification)
12. [Authentication Flow](#12-authentication-flow)
13. [Error Handling & Recovery](#13-error-handling--recovery)
14. [Exam Adapter Specifications](#14-exam-adapter-specifications)
15. [Pre-Season Dry Run Protocol](#15-pre-season-dry-run-protocol)
16. [Build Phases & Timeline](#16-build-phases--timeline)
17. [File & Folder Structure](#17-file--folder-structure)
18. [Tech Stack Summary](#18-tech-stack-summary)
19. [Known Limitations & Mitigations](#19-known-limitations--mitigations)

---

## 1. Project Overview

### What is ExamFill?

ExamFill is a Chrome browser extension that assists students in filling Indian competitive exam registration forms (JEE Main, NEET, CUET, MHT-CET, BITSAT, VITEEE, SRMJEEE, and others). It connects to a PostgreSQL database containing the student's complete profile and intelligently fills form fields on exam portals — reducing a 45–60 minute process to under 5 minutes.

### The Core Promise

```
Student opens exam portal
       ↓
Extension detects the portal automatically
       ↓
Sidebar opens with student's pre-loaded data
       ↓
Student clicks "Fill This Section"
       ↓
Fields fill instantly with verified, accurate data
       ↓
Student visually confirms → handles OTP, CAPTCHA, payment → submits
```

### What Makes This Different from Full Automation

This is an **assisted filling** tool, not a bot. The student:
- Stays in the browser watching everything happen
- Must handle OTP, CAPTCHA, and payment themselves
- Can override any filled value before submitting
- Sees a detailed report of what filled and what needs checking

This design choice is intentional — it avoids legal grey areas, keeps the student in control, and is far more stable than attempting full automation.

---

## 2. Goals & Non-Goals

### Goals

- Fill 85–92% of form fields automatically with verified accuracy
- Work across JEE Main, NEET UG, CUET, and 10+ more exams
- Adding a new exam portal must take less than 3 hours
- A broken selector due to portal UI change must be fixable in under 10 minutes without republishing the extension
- Every filled field must be verified — silent wrong fills are unacceptable
- The student must always know what filled, what needs checking, and what failed

### Non-Goals

- Solving CAPTCHAs automatically (user does this)
- Handling OTP entry (user does this)
- Processing payments (user does this always)
- Uploading photos and signatures (browser security prevents this)
- Submitting the form on behalf of the student (user does this)
- Working on portals that are not in the adapter registry

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        STUDENT'S BROWSER                             │
│                                                                      │
│  ┌─────────────────────────────┐   ┌───────────────────────────────┐│
│  │    EXAM PORTAL TAB          │   │    EXTENSION SIDEBAR          ││
│  │  (jeemain.nta.nic.in etc.)  │   │                               ││
│  │                             │   │  ┌─────────────────────────┐  ││
│  │  ┌──────────────────────┐   │   │  │  Student Profile        │  ││
│  │  │  Form Fields         │◄──┼───┼──│  Rahul Sharma           │  ││
│  │  │  [Rahul Sharma    ]  │   │   │  │  JEE Main 2025          │  ││
│  │  │  [15/03/2005      ]  │   │   │  │                         │  ││
│  │  │  [Delhi           ]  │   │   │  │  [Fill Personal] ✅     │  ││
│  │  └──────────────────────┘   │   │  │  [Fill Address ] ⏳     │  ││
│  │                             │   │  │  [Fill Education] ⬜    │  ││
│  │  content_script.js          │   │  └─────────────────────────┘  ││
│  │  (injected, fills the DOM)  │   │                               ││
│  └─────────────────────────────┘   └───────────────────────────────┘│
│                │                               │                     │
│                └──────────── chrome.runtime ───┘                     │
│                                     │                                │
│                              background.js                           │
│                              (service worker)                        │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                                  HTTPS fetch()
                                  Bearer Token Auth
                                       │
┌──────────────────────────────────────▼───────────────────────────────┐
│                         YOUR BACKEND                                 │
│                                                                      │
│   GET  /api/v1/user/fill-profile     → Returns student profile JSON  │
│   GET  /api/v1/adapters/:examId      → Returns adapter config JSON   │
│   POST /api/v1/fill-report           → Logs fill result for analytics│
│                                                                      │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                                       │
┌──────────────────────────────────────▼───────────────────────────────┐
│                      POSTGRESQL DATABASE                              │
│                                                                      │
│   students table          │  exam_adapters table                     │
│   student_addresses       │  fill_reports table                      │
│   student_education       │  supported_exams table                   │
│   student_documents       │                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Step by Step

```
Step 1: Student visits exam portal
        → background.js detects URL matches a known exam pattern
        → background.js fetches adapter config from your backend API
        → background.js fetches student profile from your backend API

Step 2: Sidebar opens automatically
        → Shows student's name, photo, exam name
        → Shows list of fillable sections for this exam

Step 3: Student clicks "Fill Personal Details"
        → sidebar.js sends message to background.js
        → background.js sends message to content_script.js with:
           { section: "personal", fields: [...], userData: {...} }

Step 4: content_script.js runs the fill pipeline on each field
        → Tries multiple selectors per field (fallback chain)
        → Fills using correct strategy per field type
        → Verifies fill by reading the value back
        → Highlights filled fields (green) and failed fields (yellow)

Step 5: content_script.js sends fill report back to sidebar
        → Sidebar displays: ✅ filled / ⚠️ check / ❌ not found
        → Report is also sent to backend for analytics

Step 6: Student reviews, fixes any flagged fields, clicks Next on portal
        → Repeat for next section
```

---

## 4. Database Schema (PostgreSQL)

### students table
```sql
CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    
    -- Personal
    full_name           VARCHAR(100) NOT NULL,
    father_name         VARCHAR(100),
    mother_name         VARCHAR(100),
    guardian_name       VARCHAR(100),
    dob                 DATE NOT NULL,              -- stored as YYYY-MM-DD always
    gender              VARCHAR(10),               -- 'Male', 'Female', 'Other'
    category            VARCHAR(20),               -- 'General', 'OBC', 'SC', 'ST', 'EWS'
    sub_category        VARCHAR(30),               -- 'OBC-NCL', 'GEN-EWS' etc
    nationality         VARCHAR(30) DEFAULT 'Indian',
    religion            VARCHAR(30),
    
    -- Identity
    aadhar_no           VARCHAR(20),               -- stored without dashes
    pan_no              VARCHAR(10),
    
    -- Contact
    mobile              VARCHAR(15) NOT NULL,
    alternate_mobile    VARCHAR(15),
    email               VARCHAR(100) NOT NULL,
    
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### student_addresses table
```sql
CREATE TABLE student_addresses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id),
    address_type        VARCHAR(20) DEFAULT 'permanent', -- 'permanent', 'correspondence'
    
    address_line1       VARCHAR(200),
    address_line2       VARCHAR(200),
    city                VARCHAR(100),
    district            VARCHAR(100),
    state               VARCHAR(100),               -- full name e.g. 'Uttar Pradesh'
    state_code          VARCHAR(5),                 -- e.g. 'UP'
    pincode             VARCHAR(10),
    country             VARCHAR(50) DEFAULT 'India'
);
```

### student_education table
```sql
CREATE TABLE student_education (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id),
    level               VARCHAR(20),               -- 'class_10', 'class_12'
    
    board               VARCHAR(50),               -- 'CBSE', 'ICSE', 'UP Board' etc
    school_name         VARCHAR(200),
    passing_year        INTEGER,
    roll_no             VARCHAR(30),
    
    -- Marks
    total_marks         INTEGER,
    obtained_marks      INTEGER,
    percentage          DECIMAL(5,2),
    
    -- Subjects (stored as JSONB for flexibility)
    subjects            JSONB,
    -- Example: [{"name": "Physics", "marks": 95}, {"name": "Chemistry", "marks": 88}]
    
    is_appearing        BOOLEAN DEFAULT FALSE      -- appearing this year?
);
```

### student_documents table
```sql
CREATE TABLE student_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id),
    document_type       VARCHAR(30),               -- 'photo', 'signature', 'aadhar', 'certificate'
    
    file_url            VARCHAR(500),              -- S3 or storage URL
    file_name           VARCHAR(200),
    file_size_kb        INTEGER,
    uploaded_at         TIMESTAMP DEFAULT NOW(),
    
    -- Validation flags
    width_px            INTEGER,
    height_px           INTEGER,
    size_kb             INTEGER,
    is_valid            BOOLEAN DEFAULT FALSE
);
```

### exam_adapters table
```sql
CREATE TABLE exam_adapters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id             VARCHAR(50) UNIQUE NOT NULL,  -- 'jee_main', 'neet_ug', 'cuet'
    exam_name           VARCHAR(100) NOT NULL,
    portal_url_pattern  VARCHAR(200) NOT NULL,        -- 'jeemain.nta.nic.in'
    
    adapter_config      JSONB NOT NULL,               -- the full adapter JSON
    
    version             INTEGER DEFAULT 1,
    is_active           BOOLEAN DEFAULT TRUE,
    last_verified_at    TIMESTAMP,                    -- when last dry-run was done
    last_verified_by    VARCHAR(100),
    
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### fill_reports table
```sql
CREATE TABLE fill_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID REFERENCES students(id),
    exam_id             VARCHAR(50),
    section_name        VARCHAR(100),
    
    total_fields        INTEGER,
    filled_count        INTEGER,
    check_count         INTEGER,
    failed_count        INTEGER,
    
    field_results       JSONB,    -- detailed per-field result
    adapter_version     INTEGER,
    
    created_at          TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Backend API Specification

### All endpoints require Authorization header:
```
Authorization: Bearer <student_token>
```

---

### GET /api/v1/user/fill-profile

Returns the complete student profile structured for the extension.

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "full_name": "Rahul Sharma",
      "father_name": "Rajesh Kumar Sharma",
      "mother_name": "Priya Sharma",
      "dob": "2005-03-15",
      "gender": "Male",
      "category": "General",
      "sub_category": "GEN-EWS",
      "nationality": "Indian",
      "religion": "Hindu",
      "aadhar_no": "123456789012",
      "mobile": "9876543210",
      "email": "rahul@example.com"
    },
    "address": {
      "line1": "123 Main Street, Sector 5",
      "line2": "Near City Mall",
      "city": "New Delhi",
      "district": "New Delhi",
      "state": "Delhi",
      "state_code": "DL",
      "pincode": "110001",
      "country": "India"
    },
    "education": {
      "class_12": {
        "board": "CBSE",
        "school": "DPS New Delhi",
        "passing_year": "2024",
        "roll_no": "1234567",
        "percentage": "92.40",
        "subjects": [
          { "name": "Physics", "marks": 95 },
          { "name": "Chemistry", "marks": 88 },
          { "name": "Mathematics", "marks": 97 },
          { "name": "English", "marks": 89 },
          { "name": "Physical Education", "marks": 92 }
        ]
      },
      "class_10": {
        "board": "CBSE",
        "passing_year": "2022",
        "percentage": "95.20"
      }
    },
    "documents": {
      "photo_url": "https://your-storage.com/photos/rahul_photo.jpg",
      "signature_url": "https://your-storage.com/signatures/rahul_sig.jpg"
    }
  }
}
```

---

### GET /api/v1/adapters/:examId

Returns the adapter config for a specific exam.

```
GET /api/v1/adapters/jee_main
```

**Response:** Full adapter JSON (see Section 7)

---

### GET /api/v1/adapters/detect?url=jeemain.nta.nic.in

Detects which exam an open URL belongs to.

**Response:**
```json
{
  "success": true,
  "exam_id": "jee_main",
  "exam_name": "JEE Main 2025",
  "is_active": true,
  "adapter_version": 4
}
```

---

### POST /api/v1/fill-report

Logs the result of a fill attempt for analytics and debugging.

**Request body:**
```json
{
  "exam_id": "jee_main",
  "section": "personal_details",
  "adapter_version": 4,
  "results": [
    { "field": "full_name",   "status": "filled",    "value": "Rahul Sharma" },
    { "field": "dob",         "status": "filled",    "value": "15/03/2005" },
    { "field": "state",       "status": "check",     "note": "Matched 'NCT of Delhi' for 'Delhi'" },
    { "field": "aadhar",      "status": "not_found", "note": "No selector matched" }
  ]
}
```

---

## 6. Chrome Extension Structure

### manifest.json — Key Declarations

```
Manifest Version: 3

Permissions needed:
  - storage          → to store auth token and cached user data
  - activeTab        → to read current tab URL
  - scripting        → to inject content_script into exam portals
  - sidePanel        → to show the sidebar

Host Permissions (exam portals):
  - https://jeemain.nta.nic.in/*
  - https://neet.nta.nic.in/*
  - https://cuet.samarth.ac.in/*
  - https://mhtcet2025.mahacet.org/*
  - https://www.bitsadmission.com/*
  - (add more as adapters are built)

Content Security Policy:
  - Only allow fetch() calls to your own backend domain
  - No eval(), no inline scripts

Service Worker: background.js
Side Panel: sidebar.html
Content Scripts: content_script.js (injected on matching URLs)
```

### How the 3 Scripts Communicate

```
sidebar.js ──── sendMessage("GET_PROFILE") ────► background.js
               ◄─── response: { userData } ─────

sidebar.js ──── sendMessage("FILL_SECTION",     ► background.js
                { section, userData, adapter })   │
                                                  │── sendMessage ──► content_script.js
                                                                       (fills the DOM)
                                                  ◄── sendMessage ─── content_script.js
sidebar.js ◄─── response: { fillReport } ────────                     (sends back results)
```

No script ever directly accesses the DOM of the exam portal except `content_script.js`. This is a hard rule.

---

## 7. Adapter System — The Core of Scalability

The adapter is a **JSON configuration file** that describes everything the extension needs to know about one exam portal. No code changes are needed to add a new exam — only a new adapter JSON.

### Full Adapter JSON Structure

```json
{
  "exam_id": "jee_main",
  "exam_name": "JEE Main",
  "portal_url_pattern": "jeemain.nta.nic.in",
  "version": 4,
  
  "sections": [
    {
      "section_id": "personal_details",
      "section_name": "Personal Details",
      "page_indicator": {
        "type": "url_contains",
        "value": "personal"
      },
      "fields": [
        {
          "field_id": "full_name",
          "label": "Candidate's Full Name",
          "source": "student.full_name",
          "type": "text",
          "selectors": {
            "by_id":    ["candidateName", "fullName", "candidate_name", "applicantName"],
            "by_name":  ["name", "candidateName", "fullname"],
            "by_label": ["Candidate's Full Name", "Candidate Name", "Full Name"],
            "by_placeholder": ["Enter your full name", "Full Name"]
          },
          "format": null,
          "required": true
        },
        {
          "field_id": "dob",
          "label": "Date of Birth",
          "source": "student.dob",
          "type": "date",
          "date_config": {
            "variant": "text",
            "format": "DD/MM/YYYY"
          },
          "selectors": {
            "by_id":    ["dob", "dateOfBirth", "date_of_birth", "birthDate"],
            "by_name":  ["dob", "dateOfBirth"],
            "by_label": ["Date of Birth", "DOB", "Birth Date"]
          },
          "required": true
        },
        {
          "field_id": "gender",
          "label": "Gender",
          "source": "student.gender",
          "type": "radio",
          "selectors": {
            "by_name":  ["gender", "Gender", "sex"],
            "by_label": ["Gender", "Sex"]
          },
          "value_map": {
            "Male":   ["Male", "M", "MALE", "1"],
            "Female": ["Female", "F", "FEMALE", "2"],
            "Other":  ["Other", "O", "OTHER", "3", "Transgender"]
          },
          "required": true
        },
        {
          "field_id": "category",
          "label": "Category",
          "source": "student.category",
          "type": "select",
          "selectors": {
            "by_id":    ["category", "caste", "castCategory", "reservationCategory"],
            "by_label": ["Category", "Caste Category", "Reservation Category"]
          },
          "value_map": {
            "General": ["General", "GEN", "UR", "GENERAL", "Open"],
            "OBC":     ["OBC", "OBC-NCL", "Other Backward Class"],
            "SC":      ["SC", "Scheduled Caste"],
            "ST":      ["ST", "Scheduled Tribe"],
            "EWS":     ["EWS", "GEN-EWS", "Economically Weaker Section"]
          },
          "required": true
        },
        {
          "field_id": "aadhar",
          "label": "Aadhaar Number",
          "source": "student.aadhar_no",
          "type": "text",
          "format": "MASKED",
          "mask_pattern": "XXXX-XXXX-XXXX",
          "selectors": {
            "by_id":    ["aadhar", "aadhaarNo", "aadharNo", "uid", "uidNo"],
            "by_label": ["Aadhaar Number", "Aadhaar No", "Aadhar Number", "UID"]
          },
          "required": false
        }
      ]
    },
    {
      "section_id": "address",
      "section_name": "Address Details",
      "fields": [
        {
          "field_id": "address_line1",
          "source": "address.line1",
          "type": "text",
          "selectors": {
            "by_id":    ["address1", "addressLine1", "address_line1", "houseNo"],
            "by_label": ["Address Line 1", "House No / Street", "Permanent Address"]
          }
        },
        {
          "field_id": "state",
          "source": "address.state",
          "type": "select",
          "selectors": {
            "by_id":    ["state", "stateId", "permanentState", "state_id"],
            "by_label": ["State", "Permanent State", "State of Residence"]
          },
          "cascade_dependency": null
        },
        {
          "field_id": "city",
          "source": "address.city",
          "type": "text_or_select",
          "selectors": {
            "by_id":    ["city", "cityName", "district", "permanentCity"],
            "by_label": ["City", "District", "Town / City"]
          },
          "cascade_dependency": "state",
          "cascade_wait_ms": 1500
        },
        {
          "field_id": "pincode",
          "source": "address.pincode",
          "type": "text",
          "selectors": {
            "by_id":    ["pincode", "pin", "zipCode", "postalCode"],
            "by_label": ["PIN Code", "Pincode", "Postal Code", "ZIP"]
          }
        }
      ]
    },
    {
      "section_id": "education",
      "section_name": "Academic Details",
      "fields": [
        {
          "field_id": "board",
          "source": "education.class_12.board",
          "type": "select",
          "selectors": {
            "by_id":    ["board", "boardId", "class12Board", "examBoard"],
            "by_label": ["Board", "Exam Board", "12th Board", "Qualifying Exam Board"]
          },
          "value_map": {
            "CBSE":    ["CBSE", "Central Board of Secondary Education"],
            "ICSE":    ["ICSE", "ISC", "CISCE"],
            "UP Board": ["UPMSP", "UP Board", "Uttar Pradesh Madhyamik Shiksha Parishad"],
            "Maharashtra": ["Maharashtra State Board", "MSBSHSE"]
          }
        },
        {
          "field_id": "passing_year",
          "source": "education.class_12.passing_year",
          "type": "select_or_text",
          "selectors": {
            "by_id":    ["passingYear", "passYear", "yearOfPassing", "examYear"],
            "by_label": ["Year of Passing", "Passing Year", "Year"]
          }
        },
        {
          "field_id": "percentage",
          "source": "education.class_12.percentage",
          "type": "text",
          "selectors": {
            "by_id":    ["percentage", "aggPercentage", "totalPercentage", "marks"],
            "by_label": ["Percentage", "Aggregate Percentage", "Total Percentage"]
          }
        }
      ]
    }
  ]
}
```

### Adding a New Exam — Checklist

```
1. Open the exam's registration form on a test account
2. For every field, note down:
   - The label text visible on screen (most important)
   - The field's HTML id attribute (inspect element)
   - The field's name attribute
   - The field type (text / select / radio / date)
   - For dropdowns: what are the actual option values?
3. Create a new JSON file following the structure above
4. Push to your backend database (exam_adapters table)
5. Extension picks it up immediately — no republish needed
6. Do a full dry run (see Section 15)
```

---

## 8. Field Detection Engine

### The Fallback Chain (Priority Order)

For every field, the engine tries 4 strategies in order. First success wins.

```
STRATEGY 1: Find by ID
   Try each id in adapter's by_id array in order
   document.querySelector("#candidateName")
   → Found? → Validate it's visible and editable → Use it
   → Not found? → Try next id → Eventually move to Strategy 2

STRATEGY 2: Find by name attribute
   document.querySelector('[name="candidateName"]')
   → Same validation logic

STRATEGY 3: Find by placeholder text
   document.querySelector('[placeholder="Enter your full name"]')

STRATEGY 4: Find by label text (most reliable long-term)
   4a. Find the <label> element whose text matches
   4b. Read the label's "for" attribute
   4c. Find the input with that id
   4d. If no "for" attribute: find the nearest input sibling

STRATEGY 5: Fuzzy label match (last resort)
   If exact label match fails, try partial match
   e.g. "Candidate's Full Name" matches search for "Full Name"
```

### Element Validation (After Finding)

Before filling any element, verify:

```
Is it visible on screen?          (offsetParent !== null)
Is it enabled?                    (not disabled, not readonly)
Is it the right type?             (input / select / textarea)
Is it in the viewport or reachable? (not inside a hidden tab)
```

If validation fails → mark as "not_found" → move on.

### Waiting for Dynamic Fields

Many exam portal fields load dynamically (after API calls, after another field is filled). The engine waits using MutationObserver:

```
Max wait time:     5 seconds per field
Polling interval:  every 200ms check if element appeared
Timeout behavior:  after 5 seconds, report as "not_found" and continue
                   (do NOT hang the entire fill process)
```

---

## 9. Field Filling Engine

### Text Input Strategy

```
Step 1: Focus the element
Step 2: Use native HTMLInputElement prototype setter
        (bypasses React's synthetic event wrapper correctly)
Step 3: Dispatch events in order:
        input event → change event → blur event
Step 4: Read back el.value to verify
Step 5: If el.value doesn't match what we set → flag as "check"
```

**Why native prototype setter:** React's virtual DOM tracks inputs using an internal fiber. If you use el.value = "x" directly, React's reconciler may not pick up the change. Using Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value) bypasses this and forces React to reconcile correctly when followed by the input event.

---

### Select / Dropdown Strategy

The portal's option values are unpredictable. Match by text using 3 strategies:

```
Match 1: Exact text match (case insensitive)
         "Delhi" matches option text "Delhi" or "DELHI" or "delhi"

Match 2: Value attribute match (case insensitive)
         "Delhi" matches option value "delhi" or "DL"

Match 3: Check value_map in adapter
         "General" → also try "GEN", "UR", "GENERAL", "Open"

Match 4: Partial text match (last resort)
         "Delhi" matches "NCT of Delhi" or "Delhi (NCT)"
         → Flag as "check" even if filled (user should verify partial matches)
```

After matching, use native HTMLSelectElement setter + dispatch change event.

---

### Radio Button Strategy

```
Step 1: Get all radio inputs with the matching name attribute
Step 2: Try to match by value attribute (case insensitive)
Step 3: If no match: find the label for each radio → match label text
Step 4: Also check value_map in adapter
        (e.g. "Male" also matches "M", "1", "MALE")
Step 5: Set .checked = true on matched radio
Step 6: Dispatch click event + change event
```

---

### Date Field Strategy

Dates are stored as ISO `YYYY-MM-DD` in your PostgreSQL. The adapter declares the variant:

```
Variant A: type="date" HTML input
           → Use ISO format directly: "2005-03-15"

Variant B: type="text" input with format mask
           → Convert per adapter format: "15/03/2005" or "03-15-2005"
           → Use native setter + dispatch events

Variant C: Three separate selects (day / month / year)
           → Split the date string
           → Fill day select, wait 200ms, fill month select, wait 200ms, fill year
           → Each one uses the dropdown strategy above

Variant D: Date picker calendar widget
           → Attempt text input on the visible input field
           → If that fails: flag as "check" — calendar widgets are too
              portal-specific to handle generically
```

---

### Masked Input Strategy (Aadhaar etc.)

Some fields use input mask libraries that intercept keystrokes. Direct value setting fails.

```
Detection: Check if the field has a data-mask attribute,
           or if its value doesn't update after direct set

Strategy: Character-by-character simulation
          For each character in the value:
            → Dispatch keydown event
            → Append character manually
            → Dispatch input event
            → Dispatch keyup event
            → Wait 30ms
          
          This is slow (intentionally) — mask libraries
          process one character at a time just like real typing
```

---

### Cascade Dropdown Strategy

For fields like State → City → Locality where each loads after the previous:

```
Fill State first
↓
Wait for City dropdown to have options (check every 200ms, max 3 seconds)
↓
Fill City
↓
Wait for Locality dropdown to have options (if applicable)
↓
Fill Locality
```

The adapter declares cascade dependencies:
```json
{
  "field_id": "city",
  "cascade_dependency": "state",
  "cascade_wait_ms": 1500
}
```

---

### Verification After Every Fill

After every single field fill:

```javascript
Read back current value
Compare with what we tried to set

Result outcomes:
  "filled"    → Values match exactly
  "check"     → Values match but via partial match (user should verify)
  "check"     → Value was transformed (e.g. auto-capitalised — acceptable)
  "failed"    → Value is empty or completely different from what we set
  "not_found" → Element was never found on the page
```

Never proceed silently. Every field gets a status.

---

## 10. Accuracy & Stability Guarantees

### How We Achieve 85–92% Fill Accuracy

| Mechanism | What It Prevents |
|---|---|
| 4-strategy fallback selector chain | Broken IDs after portal redesign |
| Label-text anchoring | Survives all ID/name changes |
| Value maps in adapters | Dropdown option format variations |
| Native prototype setters | React/Angular not registering values |
| MutationObserver waiting | Fields not in DOM yet |
| Cascade dependency handling | Empty dropdowns due to ordering |
| Character-by-character typing | Masked input failures |
| Read-back verification | Silent wrong fills |
| Pre-season dry runs | Catches all of the above before students use it |

### Stability Per Field Type

| Field Type | Expected Accuracy | Main Risk | Mitigation |
|---|---|---|---|
| Plain text inputs | 95% | Masked inputs | Char-by-char fallback |
| Native date inputs | 93% | Format mismatch | Adapter format config |
| Checkboxes | 93% | None major | Click simulation |
| Radio buttons | 88% | Missing labels | value_map in adapter |
| Text date (DD/MM/YYYY) | 87% | Format config wrong | Pre-season verification |
| Simple dropdowns | 83% | Option text variation | 4-strategy match + value_map |
| Masked inputs | 80% | Mask library variations | Char-by-char typing |
| Split date dropdowns | 68% | Cascade timing | Wait + retry logic |
| Cascading dropdowns | 68% | API load timing | Dependency declarations |
| File uploads | 0% | Browser security | Always manual |
| CAPTCHA | 0% | By design | Always manual |
| OTP fields | 0% | By design | Always manual |

### What Happens When a Fill Fails

The extension NEVER:
- Leaves a field blank without telling the user
- Fills the wrong value without flagging it
- Hangs or crashes the page
- Blocks the user from proceeding

The extension ALWAYS:
- Reports every failed field clearly
- Highlights it on the page in yellow
- Tells the user exactly what value was expected
- Lets the user type the correct value manually

---

## 11. Sidebar UI Specification

### States

```
State 1: NOT ON EXAM PORTAL
  "Open an exam registration portal to get started"
  Shows list of supported exams with their portal links

State 2: ON EXAM PORTAL, NOT LOGGED IN
  Extension detected portal but student token missing
  "Please log in to ExamFill to use assisted filling"
  → Login button

State 3: ON EXAM PORTAL, LOADING
  Fetching user profile and adapter config from API
  Spinner with "Loading your profile..."

State 4: READY TO FILL
  Shows:
  - Student name and photo thumbnail
  - Exam name and session
  - List of fillable sections with Fill buttons
  - "Fill All Sections" button at top

State 5: FILLING IN PROGRESS
  Section being filled shows spinner
  Other sections disabled during fill

State 6: FILL COMPLETE
  Per section shows:
  ✅ X fields filled
  ⚠️ Y fields need your check
  ❌ Z fields not found

  Detailed list expandable per section
```

### Fill Report Display (Per Field)

```
✅  Candidate's Name      →  Rahul Sharma
✅  Date of Birth         →  15/03/2005
✅  Gender                →  Male
⚠️  Category              →  Matched "GEN-EWS" for "General" — please verify
⚠️  State                 →  Matched "NCT of Delhi" for "Delhi" — please verify  
❌  Aadhaar Number        →  Field not found on this page
```

Color coding on the actual form fields:
- Green border + light green background = filled and verified
- Yellow border + light yellow background = filled but needs check
- Red border = failed/not found (user must fill manually)

---

## 12. Authentication Flow

```
Step 1: First time setup
        → Student opens extension popup
        → Enters their ExamFill account credentials (email + password)
        → Extension calls POST /api/v1/auth/extension-token
        → Receives a long-lived token (valid 90 days)
        → Stores token in chrome.storage.local (encrypted)

Step 2: Every session
        → background.js reads token from storage
        → Attaches as Bearer token to all API calls
        → If token expired: redirect to login state

Step 3: Token refresh
        → If API returns 401, clear stored token
        → Show login state in sidebar
        → Student logs in again

Security notes:
  - Token stored in chrome.storage.local (not localStorage — more secure)
  - API calls only to your own backend domain
  - Content Security Policy blocks all other fetch destinations
  - Student data is fetched fresh on every portal visit (not cached long-term)
  - User profile data is never stored in extension storage (only in memory)
```

---

## 13. Error Handling & Recovery

### Network Errors

```
API call fails (timeout / no internet)
  → Show "Unable to load profile. Check your connection."
  → Retry button
  → Last successfully fetched profile cached in memory for 10 minutes
     (do NOT cache to disk — privacy)
```

### Portal Changes (Selector Not Found)

```
A field in adapter is not found on page
  → Report it as "not_found" for that field
  → Continue filling other fields
  → Never crash or stop the fill process
  → User fills that field manually
  → Fill report is sent to your backend (for you to diagnose which selector broke)
```

### Portal JavaScript Errors

```
content_script runs inside the portal page
  → Any error in content_script is caught and reported back to sidebar
  → Never propagates as an unhandled exception on the portal page
  → Portal page remains unaffected — student can still use it normally
```

### Wrong Value Filled (Verification Failed)

```
We set a value but read-back shows something different
  → Mark field as "failed"
  → Clear the field (set it back to empty)
  → Do not leave a wrong value in a field silently
  → Report to user: "Could not fill [field name] reliably — please fill manually"
```

### Session / Login Issues on Portal

```
Student has not logged into the exam portal yet
  → Extension detects portal URL but no form fields present
  → Show: "Please log in to the exam portal first, then return to this sidebar"
```

---

## 14. Exam Adapter Specifications

### Supported Exams — Phase 1

| Exam | Portal Domain | Fields | Status |
|---|---|---|---|
| JEE Main | jeemain.nta.nic.in | ~35 | Build first |
| NEET UG | neet.nta.nic.in | ~32 | Build second |

### Supported Exams — Phase 2

| Exam | Portal Domain | Fields | Status |
|---|---|---|---|
| CUET UG | cuet.samarth.ac.in | ~28 | Phase 2 |
| MHT-CET | mhtcet2025.mahacet.org | ~25 | Phase 2 |
| BITSAT | www.bitsadmission.com | ~30 | Phase 2 |
| VITEEE | viteee.vit.ac.in | ~22 | Phase 2 |

### Common Fields Across All Exams (Shared Adapter Core)

These fields appear on virtually every exam and can share selector logic:

```
Personal:    full_name, father_name, mother_name, dob, gender, category
Contact:     mobile, email, aadhar_no
Address:     line1, city, state, pincode
Education:   board, passing_year, percentage, roll_no
Identity:    nationality, religion, sub_category
```

The per-exam adapter only needs to declare which selectors that exam's portal uses for these common fields. The fill logic is shared.

---

## 15. Pre-Season Dry Run Protocol

This is the most important operational process. Every exam registration cycle, before students use the extension:

### Step 1 — Create a Test Account
Register a dummy student on the exam portal. Use test credentials that cannot accidentally submit.

### Step 2 — Navigate to the Registration Form
Open every page of the form.

### Step 3 — Run Section Fill
Click each "Fill Section" button in the extension sidebar.

### Step 4 — Record Results
For every field note:
- Did it fill correctly?
- Did the selector find the right field?
- Did the dropdown match correctly?
- Did the verification pass?

### Step 5 — Fix Broken Selectors
Any field that failed:
- Open Chrome DevTools
- Inspect the field
- Note the new id / name / label
- Add to the adapter JSON in your backend database
- The extension picks up the new adapter immediately (no republish)

### Step 6 — Retest
Run the fill again. All previously broken fields should now work.

### Timeline
This entire process takes 30–60 minutes per exam. It must be done within 48 hours of the registration window opening. Put it in your team calendar as a mandatory task every exam season.

---

## 16. Build Phases & Timeline

### Phase 1 — Foundation (Weeks 1–2)

```
Goal: End-to-end fill working for JEE Main with hardcoded test data

Tasks:
  ✦ Chrome extension shell (manifest.json, background.js, content_script.js, sidebar)
  ✦ Field detection engine (all 4 strategies)
  ✦ Field fill engine (text, select, radio, date, masked)
  ✦ Verification system (read-back after fill)
  ✦ JEE Main adapter JSON (all sections)
  ✦ Sidebar UI (states: loading, ready, filling, complete)
  ✦ Fill report display

Deliverable: Can fill a JEE Main test form in under 5 minutes
```

### Phase 2 — Backend Integration (Weeks 3–4)

```
Goal: Extension reads from real PostgreSQL database via API

Tasks:
  ✦ Backend API endpoints (fill-profile, adapter fetch, fill-report)
  ✦ Auth token flow (login, storage, refresh)
  ✦ Adapter served from backend (not bundled in extension)
  ✦ Fill report logging to database
  ✦ Error states in sidebar

Deliverable: Real student data filling JEE Main form correctly
```

### Phase 3 — Second Exam + Scalability Proof (Week 5)

```
Goal: Prove that adding NEET takes less than 3 hours

Tasks:
  ✦ NEET UG adapter JSON
  ✦ URL detection for multiple exams
  ✦ Adapter registry (extension auto-loads correct adapter per portal)
  ✦ Shared common fields logic

Deliverable: Both JEE Main and NEET working from same extension
```

### Phase 4 — Polish & Reliability (Week 6)

```
Goal: Production-ready reliability and UX

Tasks:
  ✦ Cascade dropdown handling
  ✦ MutationObserver for dynamic fields
  ✦ Character-by-character fallback for masked inputs
  ✦ Field highlighting (green/yellow/red)
  ✦ Manual override (user can edit any filled field from sidebar)
  ✦ Pre-season dry run tooling (internal dashboard to log broken selectors)

Deliverable: Ready for real students in registration season
```

---

## 17. File & Folder Structure

```
examfill-extension/
│
├── manifest.json                    # Extension config, permissions, URL patterns
│
├── background/
│   └── background.js                # Service worker: API calls, message routing
│
├── content/
│   ├── content_script.js            # Main: orchestrates fill pipeline
│   ├── detector.js                  # Field detection (4 strategies)
│   ├── filler.js                    # Fill engine (per field type)
│   ├── verifier.js                  # Read-back verification
│   └── highlighter.js               # Visual feedback on filled fields
│
├── sidebar/
│   ├── sidebar.html                 # Sidebar markup
│   ├── sidebar.js                   # Sidebar logic and state management
│   └── sidebar.css                  # Sidebar styles
│
├── utils/
│   ├── resolver.js                  # "user.address.state" → "Delhi" path resolver
│   ├── formatter.js                 # Date formats, capitalisation, masking
│   └── waiter.js                    # MutationObserver + timeout helpers
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── README.md


examfill-backend/ (additions to your existing backend)
│
├── routes/
│   ├── fillProfile.js               # GET /api/v1/user/fill-profile
│   ├── adapters.js                  # GET /api/v1/adapters/:examId
│   └── fillReport.js                # POST /api/v1/fill-report
│
├── services/
│   └── profileBuilder.js            # Queries PostgreSQL, builds profile JSON
│
└── db/
    └── migrations/
        ├── exam_adapters.sql        # exam_adapters table
        └── fill_reports.sql         # fill_reports table
```

---

## 18. Tech Stack Summary

| Layer | Technology | Reason |
|---|---|---|
| Extension scripts | Vanilla JavaScript (ES2022) | No framework conflicts with portal JS |
| Extension UI | HTML5 + CSS3 | Lightweight, no React needed |
| Extension APIs | Chrome Extension Manifest V3 | Current standard, future-proof |
| API calls | fetch() native | No axios dependency needed |
| Token storage | chrome.storage.local | More secure than localStorage |
| Field detection | document.querySelector native | Already inside the page DOM |
| Dynamic field waiting | MutationObserver native | Zero dependency |
| React/Angular compat | HTMLInputElement prototype setter | Forces framework reconciliation |
| Backend language | Whatever you already use | Just add 3 new endpoints |
| Database | PostgreSQL (existing) | Just add 2 new tables |
| Adapter storage | PostgreSQL JSONB column | Update without republishing extension |

**Total new npm packages required for extension: Zero.**  
**Total new backend packages required: Zero.**  
Everything runs on native browser APIs and your existing stack.

---

## 19. Known Limitations & Mitigations

| Limitation | Impact | Mitigation |
|---|---|---|
| Portal UI changes each season | Selectors break | Server-side adapters + pre-season dry run |
| NTA servers being slow / down | Extension can't fill if form doesn't load | User waits — not the extension's problem |
| Portal uses custom web components | Our querySelector may miss fields | Flag as not_found, user fills manually |
| Calendar-style date pickers | Cannot interact with popup calendar | Attempt text input on visible field; flag if fails |
| File uploads (photo/signature) | Cannot be automated | Always manual — clearly communicated to user |
| Extension not published on Chrome Store yet | Users must install manually in developer mode | Publish before first registration season |
| New Chrome Manifest V3 restrictions | Service worker sleeps after inactivity | Keep critical data in memory, refetch if needed |

---

## Final Accuracy Target

```
Text fields:              95% accurate
Standard dropdowns:       83% accurate  
Radio buttons:            88% accurate
Date fields:              87% accurate
Masked fields:            80% accurate
Cascade dropdowns:        68% accurate (flagged for user check)

Overall weighted average: 85–92% of fields fill automatically

Remaining 8–15%:          Clearly flagged → user fills in < 60 seconds

Net result:               45–60 minute form → under 5 minutes
```

---

*This specification covers the complete design of the ExamFill Chrome Extension. Every section above maps directly to implementation tasks. Start with Phase 1 — get JEE Main working end-to-end — before anything else.*
