# NextGen Research and Innovation Press
### Academic Journal Publishing Platform

**NextGen Research and Innovation Press** is a modern, full-stack scholarly journal publishing platform following established academic editorial workflows, peer-review standards, and role-based access control, designed with an academic light aesthetic, deep navy and blue accents, and full integration with **PostgreSQL (Supabase)** and **Crossref DOI** services.

---

## 🌟 Key Features

### 1. Multi-Journal Publishing Portfolio
- Support for multiple independent journals under one publishing press.
- Pre-seeded with three multidisciplinary journals:
  - **Journal of Science, Technology & AI (JSTAI)**
  - **NextGen Engineering & Computing Review (NECR)**
  - **Interdisciplinary Health & Life Sciences (IHLS)**
- Independent mastheads, editorial boards, ISSNs, aims & scopes, and volume/issue schedules.

### 2. Rigorous 14-Stage Editorial Workflow
Strictly models the academic publication lifecycle:
$$\text{Draft} \rightarrow \text{Submitted} \rightarrow \text{Desk Screening} \rightarrow \text{Under Review} \rightarrow \text{Revisions Requested} \rightarrow \text{Revision Submitted} \rightarrow \text{Accepted} \rightarrow \text{Production} \rightarrow \text{Published}$$

- **Double-Anonymous Peer Review**: Automatically redacts author names, affiliations, and identifying data from reviewer views.
- **Immutable Revision History**: Authors upload revised Word documents alongside point-by-point response letters without overwriting previous versions.
- **Structured Peer Review**: Reviewers evaluate submissions with overall recommendations (`ACCEPT`, `MINOR_REVISION`, `MAJOR_REVISION`, `REJECT`), technical quality rating (1–5), comments for authors, and confidential comments for editors.

### 3. Persistent Crossref DOI Integration
- Standardized suffix generation (`10.5555/jstai.2026.001`).
- Generates schema-compliant **Crossref 5.3.1 XML** batch deposits containing volume, issue, journal ISSNs, author ORCID iDs, abstract, publication date, and structured citation lists.
- Real-time status tracking (`NOT_GENERATED`, `DRAFT`, `PENDING`, `DEPOSITED`, `REGISTERED`, `FAILED`).
- One-click retry and XML diagnostic inspection for editorial administrators.

### 4. Public Scholarly Research Library
- Instant full-text search across titles, abstracts, authors, disciplines, and registered DOIs.
- Full article landing pages with author affiliations, ORCIDs, abstracts, verified Crossref DOI links, and open-access PDF downloads.
- Interactive Citation Export in **APA 7th Edition**, **BibTeX**, and **RIS** formats (compatible with Zotero, Mendeley, and EndNote).

### 5. Role-Based Access Control (RBAC)
- **Master Administrator**: Global publisher governance, account creation and suspension, journal management, DOI registry oversight, and immutable platform audit logs.
- **Editor / Journal Manager**: Assigned journal queues, reviewer invitation with custom response deadlines, editorial decisions, and issue publication.
- **Reviewer**: Assigned manuscripts only, blinded DOCX download, and structured review report submission.
- **Author**: Multi-step submission wizard (DOC/DOCX uploads), tracking portal, and revision submission.
- **Visitor / Reader**: Browse journals, search open-access articles, read abstracts, download PDFs, and export citations.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router, Server Actions, React 18, TypeScript)
- **UI & Styling**: Tailwind CSS, Lucide React, Academic Typography
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: NextAuth (Auth.js) with Google OAuth & Credentials
- **File Storage**: Supabase Storage with local secure streaming fallback
- **Metadata**: Crossref 5.3.1 XML batch deposits
- **Testing**: Vitest automated unit and integration test suite

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Chukseo/nextGen.git
cd nextGen
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

```env
# PostgreSQL Database (Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# NextAuth Secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-byte-secret"

# Master Administrator First-Run Bootstrap
MASTER_ADMIN_EMAIL="admin@nextgen-press.org"

# Supabase Storage Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_MANUSCRIPTS_BUCKET="manuscripts-private"
SUPABASE_PUBLIC_BUCKET="published-articles"

# Crossref Configuration
CROSSREF_DEPOSIT_MODE="test"
CROSSREF_DOI_PREFIX="10.5555"
```

### 3. Sync Database Schema & Seed Data
```bash
# Push Prisma schema to your PostgreSQL database
npx prisma db push

# Seed initial journals, volumes, reviewer pool, and master administrator
npm run prisma:seed
```

### 4. Run Automated Test Suite
```bash
npm run test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seed Demonstration Accounts

For local evaluation, you can sign in using these accounts (password: `NextGen2026!`) or use the 1-click persona buttons on `/login`:

| Name | Role | Email | Scope |
|---|---|---|---|
| **Dr. Evelyn Vance** | Master Administrator | `admin@nextgen-press.org` | Global Platform Governance |
| **Prof. Marcus Chen** | Editor-in-Chief | `editor.chen@nextgen-press.org` | *Journal of Science, Technology & AI* |
| **Dr. Elena Alvarez** | Senior Editor | `editor.alvarez@nextgen-press.org` | *NextGen Engineering & Computing Review* |
| **Dr. Alan Turing** | Peer Reviewer | `reviewer.turing@univ.edu` | Computational Verification |
| **Dr. David Lewis** | Author | `author.lewis@research.org` | Stanford University |

---

## 📄 License & Scholarly Standards

All published research articles are openly available under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Platform source code is distributed under the MIT License.
