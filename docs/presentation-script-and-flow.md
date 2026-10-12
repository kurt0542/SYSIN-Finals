# PlaylistHub — Final Presentation Flow & Speaker Script

> **Target Time:** 10 to 12 Minutes Total (+ 3 to 5 Minutes Q&A)  
> **Structure:** 6 Minutes Slide Deck ➔ 4 Minutes Live CI/CD Demo ➔ Q&A Defense  
> **Key Rule:** Every team member has an assigned, distinct speaking role.

---

## 1. Presentation Timeline & Agenda

| Phase | Time Allotted | Lead Speaker(s) | Focus |
| :--- | :--- | :--- | :--- |
| **Phase 1: Slide Deck Presentation** | **6 Minutes** | All 6 Members | Architecture, infrastructure, polyglot APIs, database, and CI/CD design. |
| **Phase 2: Live Demo** | **4 Minutes** | Kurt (Coordinator) + Team | Baseline app, automated push trigger, Quality Gate rejection, and rollback. |
| **Phase 3: Q&A Defense** | **3–5 Minutes** | Individual Answers | Technical questions from the professor. |

---

## 2. Phase 1: Slide Presentation Script (Slide by Slide)

### Slide 1 & 2: Title, Problem Statement & Team (0:00 – 1:00)
**Speaker: Aquino, Kurt Justin (Project Lead / Scrum Master)**

> *"Good morning, Professor and classmates. We are presenting **PlaylistHub: Automated Multi-Module Music Infrastructure & CI/CD Pipeline**.  
> In modern software engineering, writing code is only half the battle. The real challenge is ensuring that code can be tested, packaged, and deployed automatically without human error or service downtime.  
> Over a 3-sprint Agile cycle with 16 distinct Pull Requests on GitHub, our team built a containerized microservice platform orchestrated by Docker Compose and guarded by an automated Jenkins pipeline.  
> Here is our team: I am Kurt, the Project Lead. Ronin is our Infrastructure Engineer; Nicole and Rance are our Backend and Database Engineers; Faith is our DevOps Engineer; and Julius is our Frontend and QA Lead.  
> I will now hand over to Ronin to walk us through our system architecture."*

---

### Slide 3: System Architecture & Ingress Gateway (1:00 – 2:00)
**Speaker: Salao, Ronin Charles (Infrastructure Engineer)**

> *"Thank you, Kurt. Looking at our architecture diagram, our system consists of 6 Docker containers.  
> To prevent exposing multiple service ports to the user, we implemented an **Nginx 1.27 Reverse Proxy** on port 8080 as our single public ingress point. The proxy routes traffic based on URI paths: `/` goes to the frontend, `/api/songs/` routes to our FastAPI service, and `/api/playlists/` routes to Express.  
> To adhere to enterprise security and the Principle of Least Privilege, we implemented **dual network segmentation**:
> - `frontend-net` handles public web traffic between the proxy, UI, and APIs.
> - `backend-net` is completely isolated for database operations.  
> Notice that our PostgreSQL container has **zero host port exposure**—port 5432 is strictly internal, protecting it from external network scanners.  
> I will now pass the floor to Nicole to explain our microservice design."*

---

### Slide 4 & 5: Polyglot Microservices & Dockerfile Engineering (2:00 – 3:00)
**Speaker: Gatus, Nicole Ann (Backend & Database Engineer)**

> *"Thank you, Ronin. We chose a **polyglot microservice architecture** to showcase Docker's ability to seamlessly unify disparate tech stacks:
> 1. **`songs-api`** is written in **Python 3.12 FastAPI**. It is an asynchronous REST service with Pydantic validation that handles song catalog lookups, search filters, and full CRUD operations.
> 2. **`playlist-api`** is written in **Node.js 20 Express**. It handles playlist curation and track aggregation.  
> For container security and performance:
> - We used lightweight Alpine and Slim base images.
> - We engineered **multi-stage Dockerfiles** separating our dependencies into `base`, `test`, and `production` stages.
> - Production containers run under dedicated non-root users (`appuser` and `node`).
> - Every container features built-in Docker health checks.  
> Rance will now present our database schema and volume persistence."*

---

### Slide 6: Database Architecture & Catalog Scaling (3:00 – 4:00)
**Speaker: Santoyo, Rance Jyle (Backend & Database Engineer)**

> *"Thank you, Nicole. Our data layer runs on **PostgreSQL 16**.  
> We designed a clean relational schema with three tables: `songs`, `playlists`, and a junction table `playlist_songs` with cascading foreign keys.  
> Two critical engineering highlights of our database:
> 1. **Data Volume & Integrity:** We pre-seeded our catalog with **over 340 songs across 14 genres** and 6 curated playlists. We implemented unique composite keys so duplicate song additions are caught and returned as **HTTP 409 Conflict**.
> 2. **Named Volume Persistence:** We mounted `/var/lib/postgresql/data` to a named volume: **`pg-data`**. Even when our containers are completely stopped or deleted with `docker compose down`, our database files remain intact on disk.  
> Faith will now walk us through our CI/CD pipeline."*

---

### Slide 7 & 8: Jenkins CI/CD, Quality Gate & Rollback (4:00 – 5:00)
**Speaker: Sy, Jim Ellen Faith (DevOps / CI-CD Engineer)**

> *"Thank you, Rance. Our CI/CD pipeline is written in Declarative syntax inside [`Jenkinsfile`](file:///e:/systens%20integration%20final%20project/Jenkinsfile).  
> Jenkins runs in its own isolated Docker container on port **8081**. We mounted the host Docker socket (`/var/run/docker.sock`), allowing Jenkins to build and deploy containers directly on the host machine without recreating itself.  
> Our pipeline features 5 automated stages:
> 1. **Checkout:** Clones the latest commit triggered automatically via GitHub webhook.
> 2. **Quality Gate (Parallel Testing):** Runs PyTest and Jest concurrently inside Docker test targets. If ANY test fails, the pipeline aborts immediately. Broken code NEVER reaches production.
> 3. **Build Images:** Bakes new images tagged with the Jenkins `BUILD_NUMBER`.
> 4. **Deploy:** Injects credentials securely and executes `docker compose up -d`.
> 5. **Smoke Test:** Runs automated HTTP health probes against all microservices.  
> We also implemented an automated rollback pipeline in [`Jenkinsfile.rollback`](file:///e:/systens%20integration%20final%20project/Jenkinsfile.rollback) allowing 1-click redeployment of any healthy previous build tag.  
> Julius will now present our testing and UI verification."*

---

### Slide 9 & 10: Web Dashboard & Quality Verification (5:00 – 6:00)
**Speaker: Enriquez, Julius (Frontend, QA & Documentation Lead)**

> *"Thank you, Faith. On the frontend, we built an ultra-responsive web dashboard served via Nginx. It features dynamic song searching, genre filtering, a target playlist modal selector, and real-time conflict alert banners.  
> Crucially for our demonstration, the UI displays a live **`Build #` badge** in the header. This badge is dynamically injected by Jenkins at build time, giving visual proof of continuous deployment.  
> For testing, we wrote:
> - 7 unit tests in PyTest for API validation.
> - 9 unit tests in Jest for duration math and duplicate conflict handling.
> - Cross-platform automated smoke test scripts (`smoke-test.sh` and `smoke-test.ps1`).  
> I will now turn the screen back to Kurt for our live demonstration."*

---

## 3. Phase 2: The 4-Minute Live Demonstration Script

Follow these **5 exact steps** on screen:

### Step 1: Baseline Demonstration (30 Seconds)
* **What to show on screen:** Browser tab open to **`http://localhost:8080`**.
* **What Kurt says:**
  > *"Here is PlaylistHub running live on port 8080. Notice the header displays **Build #latest**. Our database currently holds 347 songs across 14 genres and 6 playlists. Let's create a new playlist called 'Demo Playlist' and add a track to prove our baseline works."*
* **Action:** Type "Demo Playlist" ➔ Click Create ➔ Add a song to it.

---

### Step 2: Automated Webhook Trigger & Deployment (60 Seconds)
* **What to show on screen:** VS Code open to [`frontend/src/index.html`](file:///e:/systens%20integration%20final%20project/frontend/src/index.html).
* **What Kurt says:**
  > *"Now let's demonstrate automated deployment. I am changing the header title from 'PlaylistHub' to 'PlaylistHub - Live CI/CD Demo'. Watch how I do not touch Jenkins at all."*
* **Action:**
  1. Change line 11 of `frontend/src/index.html`:
     ```html
     <h1 id="app-title">PlaylistHub - Live CI/CD Demo</h1>
     ```
  2. In terminal, run:
     ```bash
     git commit -am "feat: update header for live presentation demo"
     git push origin main
     ```
  3. Switch browser tab to Jenkins (**`http://localhost:8081`**).
* **What Faith says:**
  > *"GitHub automatically pinged our webhook. Jenkins is now running Checkout, parallel PyTest and Jest Quality Gates, building images with build number tag, and executing health checks."*
* **Action:** Once Jenkins turns blue/green:
  1. Refresh `http://localhost:8080`.
  2. Point out: The title is updated, the badge increments, and "Demo Playlist" is still there!

---

### Step 3: The Quality Gate in Action (Failing Test Rejection) (60 Seconds)
* **What to show on screen:** VS Code open to [`playlist-api/src/duration.js`](file:///e:/systens%20integration%20final%20project/playlist-api/src/duration.js).
* **What Kurt says:**
  > *"Now let's simulate a developer accidentally pushing a bug into production."*
* **Action:**
  1. In `playlist-api/src/duration.js`, change:
     ```javascript
     return total + sec;
     ```
     to:
     ```javascript
     return sec; // BROKEN MATH BUG
     ```
  2. Commit and push:
     ```bash
     git commit -am "bug: break duration calculation"
     git push origin main
     ```
  3. Switch to Jenkins tab.
* **What Faith says:**
  > *"Notice Jenkins caught the broken code at Stage 2 (Quality Gate)! Jest failed because total duration math returned incorrect seconds. The pipeline terminated and deployment was blocked."*
* **Action:** Refresh `http://localhost:8080`.
* **What Nicole says:**
  > *"As you can see, our live website is completely unaffected and continues serving users on the previous healthy build. Zero downtime."*

---

### Step 4: Restoring the Green Pipeline (30 Seconds)
* **Action:**
  1. In `playlist-api/src/duration.js`, revert back to `return total + sec;`.
  2. Commit and push:
     ```bash
     git commit -am "fix: restore duration calculation math"
     git push origin main
     ```
* **What Kurt says:**
  > *"The bug is fixed, the pipeline turns green, and deployment completes automatically."*

---

### Step 5: Data Persistence Proof (30 Seconds)
* **What Kurt says:**
  > *"Finally, to prove database persistence, we will run `docker compose down` to completely destroy all application containers."*
* **Action:**
  1. Run `docker compose down` in terminal.
  2. Run `docker compose up -d`.
  3. Refresh `http://localhost:8080`.
* **What Rance says:**
  > *"All 347 songs and our newly created 'Demo Playlist' are completely preserved because our data is safely stored in the named volume `pg-data`."*

---

## 4. Phase 3: Transition to Q&A

**Speaker: Aquino, Kurt Justin (Project Lead)**

> *"That concludes our live demonstration of PlaylistHub. We demonstrated multi-container Docker orchestration, reverse proxy routing, polyglot microservices, persistent database volume storage, declarative Jenkins pipelines, and automated Quality Gates.  
> We are now open for any questions. Thank you!"*

---

## 5. Emergency Troubleshooting Tips (Just in Case)

1. **If Webhook Lags on Campus Wi-Fi:**
   * Don't panic! Simply say: *"While the webhook is traversing our tunnel, we can also trigger the build directly in Jenkins."* Click **Build Now** in Jenkins.
2. **If Internet Drops Completely:**
   * All 6 containers are already running locally on `localhost:8080` and `localhost:8081`. You don't need internet to show the running app, PostgreSQL data, or run `./scripts/smoke-test.ps1`.
