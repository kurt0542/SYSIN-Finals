# Presentation Slide Outline: PlaylistHub
> **Time Limit:** 10 Minutes Total (+ 5 Minutes Q&A)  
> **Rule:** All 6 team members speak on their designated specialty.

---

### Slide 1: Title Slide (Speaker: Kurt Justin Aquino)
- **Title:** PlaylistHub: Containerized Infrastructure and Automated CI/CD
- **Subtitle:** System Architecture and Integration Final Project
- **Group Members & Roles:**
  1. **Aquino, Kurt Justin** — Project Lead / Scrum Master
  2. **Sy, Jim Ellen Faith** — DevOps / CI-CD Engineer
  3. **Salao, Ronin Charles** — Infrastructure Engineer
  4. **Gatus, Nicole Ann** — Backend and Database Engineer (Catalog & Polyglot APIs)
  5. **Santoyo, Rance Jyle** — Backend and Database Engineer (Schema, Persistence & Validation)
  6. **Enriquez, Julius** — Frontend, QA, and Documentation Lead

---

### Slide 2: Project Overview & Objectives (Speaker: Kurt Justin Aquino)
- **The Challenge:** Building a fully automated pipeline where code changes self-test, build, and deploy without manual intervention.
- **The Core Focus:** DevOps engineering over UI complexity (Infrastructure as Code, Docker orchestration, Quality Gates, Rollback mechanisms).

---

### Slide 3: System Architecture & Topology (Speaker: Ronin Charles Salao)
- **Diagram:** Display the architecture diagram (Proxy, Frontend, Songs API, Playlist API, PostgreSQL).
- **Network Segmentation:**
  - `frontend-net`: Exposed reverse proxy (port 8080) and web UI.
  - `backend-net`: Database and API services.
- **Security Rule:** PostgreSQL has no public ports exposed.

---

### Slide 4: Microservices & Polyglot Design (Speaker: Nicole Ann Gatus)
- **`songs-api`:** Python 3.12 + FastAPI for catalog management and validation.
- **`playlist-api`:** Node.js 20 + Express for playlist relationships and duration math.
- **Why Polyglot?** Demonstrates Docker's strength in harmonizing different language runtimes side-by-side.

---

### Slide 5: Dockerfile Engineering & Best Practices (Speaker: Ronin Charles Salao)
- Pinned, slim base images (`alpine`, `slim`).
- Multi-stage builds: `base`, `test`, `production`.
- Running as non-root users (`appuser`, `node`).
- Layer caching efficiency (copying `requirements.txt` / `package.json` first).
- Container healthchecks on all services.

---

### Slide 6: Database Architecture & Persistence (Speaker: Rance Jyle Santoyo)
- **`db`:** PostgreSQL 16 Alpine with relational schemas and seeded data.
- **Named Volume `pg-data`:** Ensuring zero data loss across container lifecycle.
- **Service Dependencies:** Conditioned on database readiness (`condition: service_healthy`).
- **Data Integrity:** Cascading foreign keys on junction table (`playlist_songs`) and duplicate prevention.

---

### Slide 7: CI/CD Pipeline Architecture (Speaker: DevOps Engineer)
- Jenkins deployed in an isolated Docker container with persistent volume.
- Docker socket binding (`/var/run/docker.sock`) to execute host container builds.
- Webhook trigger via ngrok + Poll SCM backup every 2 minutes.
- Image tagging mapped to Jenkins `BUILD_NUMBER`.

---

### Slide 8: Declarative Pipeline Stages (Speaker: DevOps Engineer)
- **Checkout:** Pulls latest Git revision.
- **Test (Parallel):** Executes containerized tests before building production images.
- **Build Images:** Tags images with `${BUILD_NUMBER}`.
- **Deploy:** Injects Jenkins credentials securely and runs `--no-build`.
- **Smoke Test:** Validates `/health` endpoints and verifies live build badge in browser.
- **Post:** Guarantees deletion of temporary `.env` file.

---

### Slide 9: Quality Gate & Rollback Strategy (Speaker: DevOps Engineer)
- **Quality Gate:** Failing test in PyTest or Jest aborts the pipeline at stage 2; zero broken code reaches production.
- **Rollback Mechanism:** Parameterized Jenkins job (`Jenkinsfile.rollback`) allows immediate rollback to any historical build tag.

---

### Slide 10: Testing Strategy & Smoke Verification (Speaker: Frontend & QA Lead)
- Unit tests: Pydantic constraints in Python and duration calculation in Node.js.
- Automated smoke testing: Loop querying container health and verifying DOM build badge.

---

### Slide 11: Live Demonstration Plan (Speaker: Project Lead / All)
- Walk the evaluators through the 7-step demo script:
  1. Show running baseline app & version.
  2. Push a code change to `index.html`.
  3. Show Jenkins auto-triggering and running stages.
  4. Verify updated version and persisted data.
  5. Push a broken test, verify build failure and zero-downtime on prior build.
  6. Revert test and restore green pipeline.
  7. Demonstrate rollback to earlier tag.

---

### Slide 12: Challenges Encountered & Lessons Learned (Speaker: All Members)
- Windows CRLF line endings solved with `.gitattributes`.
- Jenkins secret management solved with Jenkins Credentials Store.
- Startup race conditions solved with Docker healthcheck conditions.

---

### Slide 13: Conclusion & Q&A (Speaker: Project Lead)
- Summary of outcomes: 100% automated, containerized, test-gated, and reproducible infrastructure.
- Open floor for instructor questions.
