# Individual Q&A Preparation Cheat Sheet
> **Individual Q&A Weight:** 15% of your final grade.  
> **Rule:** Any student can be asked about *any* part of the project. Review all questions below.

---

## 1. Questions on Docker & Infrastructure (Common for All Members)

### Q1: What is the difference between a Container and a Virtual Machine?
* **Answer:** A VM virtualizes hardware and runs a complete guest operating system on top of a hypervisor, consuming significant memory and CPU. A container virtualizes the operating system kernel, sharing the host OS kernel and running as an isolated process with cgroups and namespaces, making it lightweight, fast to boot, and small in image size.

### Q2: Why did we use Multi-Stage builds in our Dockerfiles?
* **Answer:** Multi-stage builds allow us to run tests in an isolated intermediate stage (`test`) with dev dependencies installed, while producing a lightweight, secure production image (`production`) that only contains runtime code and excludes compilers, test runners, and dev dependencies (`--omit=dev`).

### Q3: Why is only the Nginx Proxy port published, and not PostgreSQL?
* **Answer:** For defense-in-depth security. Publicly exposing database ports (like 5432) creates vulnerability to brute force and unauthorized access. By placing the database on a private Docker bridge network (`backend-net`) accessible only by backend APIs, we isolate it from the public internet.

### Q4: How is data persistence achieved in this project?
* **Answer:** By using a named Docker volume (`pg-data`) mapped to `/var/lib/postgresql/data`. Named volumes exist independently of container lifecycles. When containers are stopped or removed via `docker compose down`, the named volume remains intact on the host storage and reattaches automatically upon `docker compose up`.

---

## 2. Questions on Jenkins & CI/CD

### Q5: How does the Quality Gate work in your Jenkinsfile?
* **Answer:** In the `Test` stage, Jenkins executes `docker build --target test` for our microservices. If any unit test in PyTest or Jest fails, Docker returns a non-zero exit code. Jenkins treats this as a stage failure and immediately halts the pipeline before reaching the `Deploy` stage. Thus, broken code never reaches running containers.

### Q6: How do we prevent passwords from being committed to Git or leaked in Jenkins logs?
* **Answer:** We commit `.env.example` with placeholder values and add `.env` to `.gitignore`. In Jenkins, we store the production `.env` as a **Secret File credential** (`playlisthub-env`). The pipeline injects this file dynamically during the `Deploy` stage using `withCredentials()` and deletes it immediately in the `post { always { ... } }` block.

### Q7: Why is Jenkins running in a separate Docker Compose file from the app?
* **Answer:** To prevent circular dependency and self-termination. If Jenkins were inside the same compose file as the application, running `docker compose up -d` would cause Jenkins to redeploy or restart itself in the middle of its own pipeline run.

### Q8: What are the security risks of mounting `/var/run/docker.sock` into Jenkins?
* **Answer:** Mounting the Docker socket gives the Jenkins container root-level control over the host's Docker daemon. A compromised Jenkins container could manipulate or compromise the host system. In enterprise production, safer alternatives include dedicated ephemeral build agents, rootless Docker, Docker-in-Docker (DinD) with mTLS, or rootless build tools like Kaniko.

---

## 3. Questions on Microservices & Architecture

### Q9: What happens if the database container starts slower than the API containers?
* **Answer:** We solved this using Docker healthchecks. In `docker-compose.yml`, the database runs a health check using `pg_isready`. Both API services specify `depends_on: { db: { condition: service_healthy } }`. Docker will not start the APIs until PostgreSQL passes its health probe.

### Q10: How does the Rollback procedure work?
* **Answer:** Because Jenkins tags each built Docker image with the build number (`${BUILD_NUMBER}`), historical images remain in the local Docker image cache. If a release has an issue, our parameterized rollback job accepts a target tag (e.g., `TAG=1`) and runs `docker compose up -d --no-build`, instantaneously switching containers to the previous version without recompiling.
