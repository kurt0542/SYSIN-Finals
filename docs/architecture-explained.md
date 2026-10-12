# PlaylistHub — Team Architecture Guide
### *Everything You Need to Understand, Explain, and Defend on Presentation Day*

> **Audience:** Aquino, Kurt | Gatus, Nicole | Salao, Ronin | Enriquez, Julius | Sy, Faith | Santoyo, Rance  
> **Goal:** Help every team member understand how all the pieces fit together so anyone can answer questions during the **Individual Q&A (15% of your grade)** with zero hesitation.

---

## 1. The 30-Second Elevator Pitch (Memorize This)

If the professor asks: *"Can someone summarize how your system works?"*

> *"PlaylistHub is a containerized music system running **6 Docker containers** coordinated by **Docker Compose**. Instead of a single monolithic app, we decoupled it into two microservices: a **Python FastAPI** service for song management and a **Node.js Express** service for playlist curation. They share an internal **PostgreSQL** database. Everything sits behind an **Nginx reverse proxy** on port 8080 so users only ever see one port. Finally, we have an automated **Jenkins CI/CD pipeline** running in its own container that tests, builds, and deploys code every time we push to GitHub."*

---

## 2. The Big Picture: Our 6 Containers

Here is the entire system in one mental model:

```
[ Client Browser ] 
        │
        │ HTTP (Port 8080)
        ▼
┌────────────────────────────────────────────────────────┐
│ 1. proxy (Nginx 1.27)                                  │  <-- THE FRONT DOOR
│    Listens on host port 8080. Nobody talks to other    │
│    containers directly. Proxy routes traffic internally│
└───────┬──────────────────────┬─────────────────────────┘
        │                      │
        │ (frontend-net)       │ (frontend-net)
        ▼                      ▼
┌─────────────────┐    ┌─────────────────────────────────┐
│ 2. frontend     │    │ 3. songs-api (Python FastAPI)   │  <-- SERVICE A
│    (Nginx static│    │    Manages song catalog, search │
│     port 80)    │    │    and genre filters. Port 8000 │
└─────────────────┘    └───────┬─────────────────────────┘
                               │
                               │ (backend-net)
                               ▼
┌─────────────────┐    ┌─────────────────────────────────┐
│ 4. playlist-api │    │ 5. db (PostgreSQL 16)           │  <-- DATA STORE
│    (Node Express├────►    Relational database with     │      NO HOST PORT!
│     port 3000)  │    │    named volume: pg-data        │
└─────────────────┘    └─────────────────────────────────┘
  (frontend-net &        (backend-net ONLY)
   backend-net)

══════════════════════════════════════════════════════════
SEPARATELY DEPLOYED (Port 8081)
┌────────────────────────────────────────────────────────┐
│ 6. jenkins (Jenkins LTS + Docker CLI)                  │  <-- THE AUTOMATION
│    Runs our CI/CD pipeline using the host Docker engine│
└────────────────────────────────────────────────────────┘
```

---

## 3. The 6 Containers in Plain English

### Container 1: `proxy` (Nginx Gateway)
* **What it does:** It is the **bouncer and receptionist** of the system.
* **Why we have it:** In microservices, you never want users to memorize 4 different ports (`:8000`, `:3000`, `:5432`, `:80`). With `proxy`, users only type `http://localhost:8080`.
* **How it routes:**
  * When a URL starts with `/api/songs/` ➔ Sends it to `songs-api:8000`.
  * When a URL starts with `/api/playlists/` ➔ Sends it to `playlist-api:3000`.
  * Everything else (`/`) ➔ Sends it to `frontend:80`.
  * Probes `/nginx-health` ➔ Instantly returns HTTP 200 `healthy`.

### Container 2: `frontend` (Web Dashboard)
* **What it does:** Serves the HTML, CSS, and JavaScript interface to the browser.
* **Why it's lightweight:** It doesn't use heavy frameworks like React or Angular that require 500 MB of `node_modules`. It is pure HTML/CSS/JS served directly via an Alpine Nginx web server.
* **Special feature:** Displays the **`Build #__BUILD_NUMBER__`** badge in the header, which Jenkins dynamically injects at build time to prove automated deployment.

### Container 3: `songs-api` (Microservice A — Python FastAPI)
* **What it does:** Handles the music catalog: listing songs, filtering by genre, search queries, adding new songs, and updating tracks (`PUT /{id}`).
* **Why FastAPI:** Python is great for data processing, and FastAPI is one of the fastest asynchronous Python frameworks available.
* **Testing:** Uses **PyTest** with 7 unit tests that run in under 2 seconds.

### Container 4: `playlist-api` (Microservice B — Node.js Express)
* **What it does:** Handles user playlists: creating playlists, calculating total playtime, adding songs, and deleting tracks.
* **Why Express:** Demonstrates a **polyglot architecture** (showing we can connect different programming languages in one stack).
* **Key business logic:**
  * Uses a pure math module `duration.js` to compute total playlist minutes and seconds.
  * **Duplicate Prevention:** If a user tries to add a track already in that playlist, it stops them and responds with **`409 Conflict`**.
* **Testing:** Uses **Jest** with 9 unit tests.

### Container 5: `db` (PostgreSQL 16)
* **What it does:** The persistent relational database storing all songs and playlists.
* **Tables:**
  1. `songs` (id, title, artist, genre, duration)
  2. `playlists` (id, name, created_at)
  3. `playlist_songs` (junction table linking songs to playlists with cascade delete)
* **Seed data:** Automatically pre-loaded with tracks on initial startup via `db/init.sql`.

### Container 6: `jenkins` (CI/CD Automation Engine)
* **What it does:** Watches GitHub. When someone pushes code, Jenkins wakes up, tests the code, builds new container images, and deploys them.
* **Where it runs:** On port **`8081`** in its own separate compose file (`infra/jenkins/`).

---

## 4. The 3 Architectural Questions Professors ALWAYS Ask

### Question 1: *"Why is the database port (5432) NOT exposed to the host?"*
* **The Answer:**  
  > *"For security (Principle of Least Privilege). In production, you never expose a database port to the public internet or host network. Only our two microservices (`songs-api` and `playlist-api`) need database access, so we placed `db` exclusively on the internal `backend-net` network. The proxy and the outside world cannot touch the database directly."*

### Question 2: *"What happens to your data if you run `docker compose down`?"*
* **The Answer:**  
  > *"The data is 100% safe because of our named volume: `pg-data`. Running `docker compose down` deletes the container instances, but named Docker volumes persist on disk. When we run `docker compose up -d` again, the new Postgres container re-mounts `pg-data` and all our playlists and songs are still there."*

### Question 3: *"Why is Jenkins in a separate docker-compose.yml file instead of the main one?"*
* **The Answer:**  
  > *"Because Jenkins deploys the application stack! If Jenkins was defined inside the same `docker-compose.yml` as the app, every time Jenkins redeployed the app (`docker compose up -d`), it would kill and recreate itself mid-pipeline! By placing Jenkins in `infra/jenkins/`, Jenkins runs in complete isolation and never restarts itself during application deployments."*

---

## 5. The Journey of a Click (Example: Adding a Song to a Playlist)

When an instructor asks: *"Walk me through what happens when I click a button on the UI:"*

1. **In the Browser:** The user clicks **"+ Add to Playlist"** next to "Bohemian Rhapsody" and selects the playlist "Roadtrip".
2. **The Request:** The browser sends `POST http://localhost:8080/api/playlists/1/songs` with `{ "song_id": 3 }`.
3. **Nginx Proxy (:8080):** Catches the request. It strips `/api/playlists/` and forwards it over the internal `frontend-net` bridge to `http://playlist-api:3000/1/songs`.
4. **Node.js Express (:3000):** Receives the request:
   * First, it asks PostgreSQL over `backend-net`: *"Is song #3 already in playlist #1?"*
   * If yes ➔ Returns **`409 Conflict`**. The frontend pops up a warning: *"Song is already in this playlist!"*
   * If no ➔ Inserts the song into the `playlist_songs` table with the next position number.
5. **PostgreSQL (:5432):** Writes the record to disk via named volume `pg-data` and confirms success.
6. **Express responds:** Returns HTTP 201 `{ message: "Song added successfully" }`.
7. **Frontend updates:** The web dashboard recalculates the total playlist length and shows the updated duration badge in real-time.

---

## 6. How the CI/CD Pipeline Works (The Jenkins Story)

```
[ Git Push to GitHub ]
         │
         ▼ (Instant ngrok Webhook or SCM Poll)
┌────────────────────────────────────────────────────────┐
│ 1. CHECKOUT       ➔ Clones latest branch from GitHub   │
├────────────────────────────────────────────────────────┤
│ 2. QUALITY GATE   ➔ Parallel Testing                   │
│    - PyTest runs inside `songs-api` test stage         │
│    - Jest runs inside `playlist-api` test stage        │
│    * If ANY test fails, pipeline STOPS immediately!   │
├────────────────────────────────────────────────────────┤
│ 3. BUILD IMAGES   ➔ Bakes new Docker images            │
│    - Injects Build # into frontend header              │
│    - Tags: playlisthub-frontend:${BUILD_NUMBER}        │
├────────────────────────────────────────────────────────┤
│ 4. DEPLOY         ➔ `docker compose up -d --no-build`  │
│    - Injects credentials safely from Jenkins           │
├────────────────────────────────────────────────────────┤
│ 5. SMOKE TEST     ➔ Automated health checks            │
│    - Hits /nginx-health, /api/songs/, /api/playlists/  │
│    - Confirms live build badge matches BUILD_NUMBER    │
└────────────────────────────────────────────────────────┘
```

### The "Docker-out-of-Docker" (DooD) Trick:
If the prof asks: *"How can Jenkins run `docker compose` if Jenkins itself is inside a container?"*
* **The Answer:**  
  > *"We mounted the host Docker socket: `/var/run/docker.sock` into the Jenkins container. When Jenkins runs `docker build` or `docker compose`, it isn't running Docker inside Docker—it is talking directly to the host machine's Docker engine."*

---

## 7. Member Role Responsibilities (Who Speaks for What)

| Member | Role | What You Should Speak Up About During the Defense |
| :--- | :--- | :--- |
| **Aquino, Kurt Justin** | **Project Lead** | Introduction, Agile sprints, 16 Pull Requests on GitHub, peer review process, demo coordination. |
| **Salao, Ronin Charles** | **Infrastructure** | System architecture diagram, Nginx reverse proxy routing (`proxy/nginx.conf`), dual networks (`frontend-net`/`backend-net`), named volume `pg-data`. |
| **Gatus, Nicole Ann** | **Backend & DB** | PostgreSQL relational schema (`db/init.sql`), foreign keys, FastAPI music catalog (`songs-api`), Pydantic validation models. |
| **Santoyo, Rance Jyle** | **Backend & DB** | The `409 Conflict` duplicate prevention bugfix, `PUT /{id}` song update CRUD route, PyTest and Jest unit test coverage. |
| **Enriquez, Julius** | **Frontend & QA** | Responsive web dashboard, modal playlist picker, live build badge display, automated smoke test scripts (`smoke-test.sh`/`.ps1`). |
| **Sy, Jim Ellen Faith** | **DevOps / CI-CD** | Jenkins containerization, Declarative `Jenkinsfile`, parallel Quality Gates, secret management, 1-click rollback pipeline (`Jenkinsfile.rollback`). |

---

> [!TIP]
> Keep this document open on your phone or laptop while preparing for presentation day! If you know the concepts in this guide, you will easily ace the technical defense.
