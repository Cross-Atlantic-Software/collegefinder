# ExamFill — Chrome Web Store submission notes

Everything you need to paste into the Developer Dashboard, plus the privacy-policy
text that MUST be added to https://unitracko.com/legal before submitting.

Upload package: `dist/examfill-extension-v1.1.0.zip` (produced by `build-store.ps1`).

---

## 1. Store listing basics

- **Developer account contact email (Settings page — MUST be verified):**
  `communications@crossatlanticsoftware.com`
  (Account Settings → Contact email → enter → click **Verify**. Google sends a
  confirmation link to that inbox. This is the account-level email the publish
  error refers to — required before publishing.)
- **Extension support email (Store listing → Additional fields — shown to users):**
  `contact@unitracko.com`
- **Homepage URL (optional):** `https://unitracko.com`
- **Privacy policy URL:** `https://unitracko.com/legal#privacy-policy`
- **Single purpose (paste verbatim):**
  > ExamFill auto-fills online exam registration forms using the signed-in
  > student's own saved profile data. It activates only on supported exam portals,
  > and the student reviews and confirms every field before it is filled.
  >
  > (Shorter alt: "Auto-fills exam registration forms on supported portals using
  > the user's saved profile data.")
- **Category:** Workflow & Planning  (runner-up: Education — pick this only to
  emphasize the student audience over the auto-fill function)
- **Languages:** English

---

## 2. Permission justifications (paste each into the matching dashboard box)

| Permission | Justification |
|---|---|
| `storage` | Caches the signed-in session token and per-exam fill progress locally so the side panel can restore state. No third-party data. |
| `activeTab` | Lets the user activate ExamFill on the exam-registration tab they are viewing when they pick an exam manually. |
| `scripting` | Injects the bundled form-filling content scripts into the supported exam portal the user is on, on demand. Only extension-packaged files are injected — no remote code. |
| `sidePanel` | The entire ExamFill UI is a side panel shown next to the exam form. |
| `tabs` | Reads the active tab's URL to detect which supported exam portal is open and to open the wallet/portal page when the user clicks a button. |
| `cookies` | Single sign-on: reads the user's own `auth_token` cookie on `unitracko.com` so a student already logged into the website does not have to re-enter an OTP in the extension. The token is sent only to the UniTracko backend. |
| **Host permissions** (exam portals + `unitracko.com`) | Each host is a specific exam-registration portal the extension fills, plus `unitracko.com` for authentication and profile data. No `<all_urls>`; no broad match patterns. |

**Remote code disclaimer (have ready if a reviewer asks):** ExamFill executes no
remote code. Field-mapping "adapters" fetched from the backend are **JSON data**
(CSS-selector → profile-path maps) interpreted by the bundled `filler.js`. All
executable code ships inside the package.

---

## 3. Data-use disclosures (Privacy practices tab)

Check these to match actual behavior:

- **Personally identifiable information** — YES (name, email, phone, address,
  DOB, government IDs the user chooses to fill such as Aadhaar/PAN, education
  records, uploaded documents).
- **Authentication information** — YES (session token).
- **Web history / location / health / financial / personal communications** — NO.

Certify all three "limited use" statements:
1. Data is **not sold** or transferred to third parties (only the user's own
   UniTracko backend receives it).
2. Data is used **only** for the single purpose above.
3. **No** creditworthiness / lending use.

---

## 4. REQUIRED privacy-policy addition (add to unitracko.com/legal)

> ⚠️ Blocker: the current policy says "We do NOT collect Aadhaar, PAN" and does
> not mention the extension. That contradicts the extension auto-filling those
> fields. Add a section like the following so the policy matches behavior.

### ExamFill Browser Extension

> The ExamFill browser extension helps you complete exam-registration forms by
> filling them with information from your UniTracko profile. When you choose to
> fill a form, the extension uses the profile data you have provided — which may
> include your name, contact details, address, date of birth, education records,
> government identifiers such as Aadhaar or PAN, and documents (photo, signature,
> certificates) where you have added them and the exam form requires them.
>
> This information is sent only between your browser and UniTracko's own servers
> to provide the auto-fill feature. The extension does not sell your data, does
> not share it with third parties, and does not transmit it to any exam portal
> except by filling the form fields you review and confirm. The extension reads
> your UniTracko login token solely to sign you in. You can review and edit every
> value before it is filled, and you can sign out of the extension at any time.

---

## 5. Store listing copy (draft)

**Name:** ExamFill — Exam Form Assistant

**Short description (≤132 chars):**
> Auto-fill Indian exam registration forms (JEE, NEET, CUET, NATA & more) in minutes using your saved profile — you review every field.

**Detailed description:**
> Stop retyping the same details into every exam registration form. ExamFill
> fills Indian competitive-exam applications for you — using the profile you
> already saved on UniTracko / CollegeFinder.
>
> ✦ Built for Indian exams — JEE Main, NEET UG, CUET, MHT-CET, BITSAT, VITEEE,
>   NATA, SRMJEEE, SSC CGL and more.
> ✦ Fills in seconds — name, contact, address, education, category and other
>   details mapped to the right fields automatically.
> ✦ You stay in control — review and edit every value before it's filled, section
>   by section. Nothing is submitted for you.
> ✦ Safe by design — passwords, OTPs and CAPTCHAs are always left for you to
>   enter. ExamFill never bypasses portal security.
> ✦ One sign-in — already logged into UniTracko? ExamFill connects automatically.
>
> How it works:
> 1. Open a supported exam's registration page.
> 2. ExamFill opens in the side panel and loads your profile.
> 3. Review each section and click Fill. Done.
>
> Your data is used only to fill the forms you choose and is shared only with
> UniTracko's own servers — never sold or sent to third parties. See our privacy
> policy: https://unitracko.com/legal#privacy-policy

**Screenshot assets — UPLOAD-READY (1280×800):** in `store-assets/`
- `store-1-ready.png` — "Fill exam forms in minutes"
- `store-2-exams.png` — "Built for India's top exams"
- `store-3-signin.png` — "One sign-in, no retyping"

**Promo tile (440×280):** `store-assets/promo-440x280.png`

These were rendered from the live side-panel UI (real markup/CSS, mock data) and
composited onto branded 1280×800 canvases. The raw panel frames (`panel-*.png`)
are kept alongside if you want to recompose. Regenerate via the scratchpad
`make-tiles.ps1`. `store-assets/` lives outside the extension folder, so it never
ships in the package.

---

## 6. Pre-submit checklist

- [ ] Privacy policy updated on unitracko.com with the section above (§4)
- [ ] `dist/examfill-extension-v1.1.0.zip` uploaded
- [ ] All permission justifications pasted (§2)
- [ ] Data-use disclosures + limited-use certs completed (§3)
- [ ] Screenshots (1280×800 or 640×400) + 440×280 small tile uploaded
- [ ] Listing copy uses one consistent brand name (ExamFill / UniTracko)
