# ExamFill — How It Works

## What is ExamFill?

ExamFill is a Chrome browser extension that **automatically fills exam registration forms** for students. Instead of manually typing the same name, DOB, address, documents, etc. on every exam portal, a student clicks one button and the form fills itself in seconds.

---

## How a Student Uses It

1. Student logs into our platform and fills their profile once (name, DOB, marks, uploads documents, etc.).
2. Student clicks **"Apply Now"** on an exam — this opens the exam portal (e.g. NATA registration page).
3. The ExamFill sidebar appears on the right side of the screen.
4. Student logs in with their email + OTP.
5. The sidebar shows which page they're on (e.g. "Basic Information", "Documents", "Education Details").
6. Student clicks **"Fill Basic Info"** → all fields on that page fill automatically.
7. Student moves to the next page, clicks the next fill button, repeat.
8. After each fill, the sidebar shows a green/yellow/red report — what got filled, what needs a manual check.

**That's it.** The student just reviews and clicks "Next" on each page.

---

## How It Works Behind the Scenes

There are 3 pieces:

| Piece | What it does |
|---|---|
| **Our Backend (API)** | Stores student data (name, marks, documents on S3). Sends it to the extension when asked. |
| **Adapter File (JSON config)** | A recipe file for each exam portal — tells the extension *which form fields exist* and *where to find them* on the page. |
| **Chrome Extension** | Sits in the browser. Reads the adapter, fetches student data, and fills the form fields on the portal. |

### The Adapter File (the recipe)

Each exam portal is different — different field names, different page layouts. The adapter is a simple JSON file that maps our student data to the portal's form fields.

Example — one field entry:
```
Field: "Father's Name"
Our data: student.father_name  →  "Rajesh Sharma"
Find it on portal by: label = "Father's Name" or id = "fatherName"
Type: text
```

The adapter also knows which page each section is on (page 1 = Basic Info, page 2 = Documents, etc.).

**Key point:** To support a new exam portal, we only need to create a new adapter JSON — no code changes needed.

---

## Adding a New Exam Portal (Adapter Creation Process)

This is a **mostly automated** process. The extension itself scans the portal and builds the adapter config — a human just reviews and tweaks it.

### Step 1 — Open the portal

Go to the exam's registration page with the ExamFill extension active.

### Step 2 — Auto-scan the form (automated)

The extension automatically:
- Detects how many pages/steps the portal has
- Scans every form field on each page (label, type, HTML id/name)
- Takes a screenshot of each page for reference
- Generates a draft adapter JSON with all the fields pre-mapped

**The person doing this does NOT need to inspect HTML or write any code.** The extension does the heavy lifting.

### Step 3 — Review & tweak (manual, ~10 min)

A developer reviews the auto-generated adapter:
- Confirms the field-to-data mappings are correct (e.g. "Father's Name" → `student.father_name`)
- Fixes any fields the scanner couldn't identify (rare edge cases)
- Adds value maps for dropdowns if the portal uses different labels than our data (e.g. our data says "ST" but the portal option says "Scheduled Tribe")

### Step 4 — Take screenshots of each page

Take a screenshot of each page of the registration form. This helps as a reference when building the adapter and for QA later.

### Step 5 — Map fields to our student data

For each field, decide where the data comes from in our database:
- Name → `student.full_name`
- DOB → `student.dob`
- 10th Marks → `education.class_10.obtained_marks`
- Passport Photo → `documents.photo` (S3 link)
- etc.

### Step 6 — Seed it to the database

Run the seed script to upload the adapter JSON to our database so the extension can fetch it.

### Step 7 — Test and tweak

Load the extension, go to the portal, and try filling. Check what the sidebar reports — fix any fields that show yellow (check) or red (failed) by adjusting the selectors in the adapter.

---

## What the Extension Handles Automatically

- **Text fields** — types the value, works with React-based portals
- **Dropdowns** — selects the right option, handles custom styled dropdowns
- **Date fields** — handles masked/segmented date inputs (DD/MM/YYYY boxes)
- **File uploads** — downloads the document from S3 and injects it into the file input, compresses images to stay under size limits
- **Radio buttons & checkboxes** — selects the right option
- **Dependent dropdowns** — waits for options to load after a parent dropdown changes (e.g. State → City)

---

## Known Limitations

| Limitation | Impact |
|---|---|
| **CAPTCHAs** | If a portal has a CAPTCHA on login or form submission, the student must solve it manually |
| **Live camera photo** | Fields that require a live webcam capture (e.g. "Capture Live Photo") cannot be automated — student must do this manually |
| **OTP on phone** | The extension cannot read OTPs sent to the student's phone — student types it themselves |
| **Masked date inputs** | Some portals use unusual segmented date pickers (individual boxes per digit) that may not fill reliably depending on how the portal is built |
| **Portal HTML changes** | If an exam portal redesigns their form, the adapter breaks and needs to be updated before it works again |
| **Custom styled dropdowns** | Most custom dropdowns work, but rare edge cases (deeply nested or non-standard UI libraries) may not get selected correctly |
| **One portal at a time** | The extension fills one exam portal at a time — there is no batch apply across multiple portals simultaneously |


---

## Summary

| | |
|---|---|
| **For the student** | Fill profile once → auto-fill every exam form with one click per page |
| **For us (to add a new exam)** | Open the portal → extension auto-scans the form → review the generated config → done |
| **No code changes needed** | Each new exam is just a new JSON config file |

