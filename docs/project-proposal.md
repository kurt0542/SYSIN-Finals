# Appendix A: Project Proposal

| Item | Details |
| :--- | :--- |
| **Group Name** | [Insert Group Name] |
| **Project Title** | **PlaylistHub: Automated Multi-Module Playlist & Music Infrastructure** |
| **Short Description** | PlaylistHub is a containerized microservice-based music management system engineered to showcase enterprise-grade CI/CD and DevOps automation. The system decouples song catalog management (FastAPI) and playlist computation (Express) behind an Nginx reverse proxy, persisting data in an isolated PostgreSQL instance. Every code change automatically triggers a declarative Jenkins pipeline in Docker that executes multi-stage container tests, bakes version-tagged images, deploys the stack, and runs automated health smoke tests. |
| **Repository URL** | [Insert GitHub Repository URL] |
| **Project Lead / Scrum Master** | Aquino, Kurt Justin |
| **DevOps / CI-CD Engineer** | Sy, Jim Ellen Faith |
| **Infrastructure Engineer** | Salao, Ronin Charles |
| **Backend and Database Engineer** | Gatus, Nicole Ann & Santoyo, Rance Jyle |
| **Frontend, QA, and Documentation Lead** | Enriquez, Julius |

---

### Module / Container Breakdown

| Module / Container | Technology | Purpose | Justification |
| :--- | :--- | :--- | :--- |
| **`proxy`** | Nginx 1.27-Alpine | Single public entry point and reverse proxy | Centralizes routing on port 8080, prevents public database exposure, and provides high-throughput request dispatching. |
| **`frontend`** | Nginx 1.27-Alpine (Static HTML/CSS/JS) | Responsive user interface and build release display | Eliminates bulky client build dependencies, guarantees instant container build times, and prominently renders build version tags. |
| **`songs-api`** | Python 3.12 + FastAPI + Uvicorn | Song catalog REST API and metadata validation | Provides high-speed asynchronous endpoints with Pydantic schema validation and isolated PyTest suites. |
| **`playlist-api`** | Node.js 20-Alpine + Express | Playlist curation and total duration computation | Demonstrates a polyglot microservice architecture; computes cumulative track duration; tested with Jest. |
| **`db`** | PostgreSQL 16-Alpine | Persistent relational data store | Robust relational schema with foreign key cascades; persistent across redeployments via named Docker volume `pg-data`. |
| **`jenkins`** | Jenkins LTS + Docker CLI | Automated CI/CD server | Deployed in an isolated compose environment; drives container build, testing, and deployment via the host Docker daemon. |

---

### Pipeline Plan Details

| Item | Details |
| :--- | :--- |
| **Git Hosting** | GitHub |
| **Trigger (Webhook / Polling)** | Primary: GitHub Webhook via `ngrok` tunnel (`githubPush()`).<br>Fallback: Automated SCM Polling every 2 minutes (`pollSCM('H/2 * * * *')`). |
| **Planned Stages** | 1. Checkout<br>2. Test (`docker build --target test` in parallel)<br>3. Build Images (`docker compose build` tagged with `BUILD_NUMBER`)<br>4. Deploy (Credentials injection & `docker compose up -d --no-build`)<br>5. Smoke Test (HTTP `/health` checks and build badge verification) |
| **Tests to be Run** | • PyTest suite & Ruff linter in `songs-api` (catalog constraints, `/health`)<br>• Jest suite in `playlist-api` (duration summation logic, API routes) |
| **Planned Bonus Features** | • Automated parameterized rollback pipeline (`Jenkinsfile.rollback`)<br>• Zero-downtime healthcheck condition gates |
