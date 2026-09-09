# Student Management Microservices

A microservices-based evolution of the original **StudentManagementAPI** monolith — split into independently deployable services with service discovery, inter-service communication, and a single public API gateway.

Built as a hands-on exercise in the microservices pattern: understanding *why* and *when* to split a system, not just how to wire the tools together.

---

## Architecture

```
                        ┌─────────────────┐
                        │  Eureka Server   │
                        │   (port 8761)    │
                        │  Service Registry│
                        └────────▲─────────┘
                                 │ registers
                 ┌───────────────┼───────────────┐
                 │               │               │
        ┌────────▼───────┐ ┌─────▼──────┐ ┌──────▼───────┐
        │  API Gateway   │ │  Student   │ │   Course     │
        │  (port 8080)   │ │  Service   │ │   Service    │
        │  Public entry  │ │(port 8081) │ │ (port 8082)  │
        └────────────────┘ └─────┬──────┘ └──────┬───────┘
                                  │               │
                            ┌─────▼─────┐   ┌─────▼─────┐
                            │ studentdb │   │ coursedb  │
                            │  (MySQL)  │   │  (MySQL)  │
                            └───────────┘   └───────────┘
```

Course Service does **not** query Student Service's database directly. It calls Student Service's REST API (via OpenFeign, resolved through Eureka) whenever it needs to confirm a student exists — each service owns its own data.

---

## Services

| Service | Port | Responsibility | Database |
|---|---|---|---|
| **eureka-server** | 8761 | Service registry — every other service registers here so they can find each other by name instead of hardcoded addresses | none |
| **student-service** | 8081 | Student CRUD, JWT authentication, OAuth 2.0 (Authorization Server, Resource Server, Client), email verification, password management | `studentdb` |
| **course-service** | 8082 | Course/enrollment management; validates student IDs by calling Student Service over the network before saving an enrollment | `coursedb` |
| **api-gateway** | 8080 | Single public entry point; routes `/students/**` → Student Service, `/courses/**` → Course Service | none |

---

## Tech Stack

- **Java 17**, **Spring Boot 3.5.13**, **Spring Cloud 2025.0.0**
- **Spring Data JPA** + **MySQL** — persistence
- **Spring Security** — JWT (custom) + OAuth 2.0 / OIDC (Authorization Server, Resource Server, Client)
- **Netflix Eureka** — service discovery
- **OpenFeign** — declarative inter-service HTTP calls
- **Spring Cloud Gateway (MVC/servlet variant)** — API gateway
- **springdoc-openapi (Swagger)** — interactive API docs on Student Service
- **Docker + Docker Compose** — containerization
- **GitHub Actions** — CI/CD, automatic build & push to Docker Hub on every commit
- **Railway** — cloud deployment (Student Service, standalone)

---

## Prerequisites

- Java 17
- Maven
- MySQL (running locally, or adjust connection details)
- IntelliJ IDEA (or any IDE) — each service is a separate project

---

## Setup

### 1. Create the databases

```sql
CREATE DATABASE studentdb;
CREATE DATABASE coursedb;
```

### 2. Configure secrets

Each service that touches the database uses environment-variable placeholders rather than hardcoded credentials:

```yaml
spring:
  datasource:
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD}
```

Create a `.env` file in each service's root (already excluded via `.gitignore`):

```
DB_USERNAME=root
DB_PASSWORD=your_actual_password
```

Both `student-service` and `course-service` include the `spring-dotenv` dependency, which loads this automatically at startup.

### 3. Install dependencies

Open each project (`eureka-server`, `student-service`, `course-service`, `api-gateway`) in your IDE and let Maven resolve dependencies.

---

## Running the System

**Startup order matters** — each service depends on Eureka being available to register itself:

1. **eureka-server** — start first
2. **student-service** and **course-service** — any order, but both need Eureka already running
3. **api-gateway** — start last, so it can discover the other two on startup

Confirm all four are registered by visiting the Eureka dashboard:

```
http://localhost:8761
```

You should see `STUDENT-SERVICE`, `COURSE-SERVICE`, and `API-GATEWAY` listed as registered instances.

---

## Testing the Full Flow

All requests go through the **Gateway** (port 8080) — never call Student Service or Course Service directly in normal use.

### Register & log in (Student Service, via Gateway)

```
POST http://localhost:8080/students/register
POST http://localhost:8080/students/login
```

### Enroll a student in a course — the cross-service call

```
POST http://localhost:8080/courses/enroll
Content-Type: application/json

{
  "courseName": "Data Structures",
  "courseDescription": "Intro to DS",
  "enrolledStudentId": 1
}
```

**What happens under the hood:**
1. Gateway routes the request to Course Service
2. Course Service calls Student Service (via Feign + Eureka) to confirm student `1` exists
3. If found → course is saved, `201 Created`
4. If not found → `400 Bad Request` with a clear error message, nothing is saved

Try it once with a real student ID, and once with a nonexistent one (e.g. `99999`) to see the validation actually reject it.

### View API docs

```
http://localhost:8081/swagger-ui/index.html
```

(Swagger runs on Student Service directly, not routed through the Gateway.)

---

## Security Notes

- JWT-protected endpoints require `Authorization: Bearer <token>` after logging in
- Database credentials are never committed — see [Setup](#setup) for the `.env` pattern
- Full OAuth 2.0 Authorization Server / Resource Server / Client implementation lives in Student Service, built from scratch as a learning exercise in the protocol itself

---

## Deployment

### Run the full stack locally with Docker Compose

Every service (`eureka-server`, `student-service`, `course-service`, `api-gateway`) has its own multi-stage `Dockerfile`, and `docker-compose.yml` at the project root orchestrates all four plus two separate MySQL databases (`student-mysql`, `course-mysql`) — one per service that owns data, matching the same data-ownership rule the services follow at the code level.

**1. Create a `.env` file** at the project root (same level as `docker-compose.yml`):
```
DB_PASSWORD=your_actual_mysql_password
```

**2. Build and start everything:**
```bash
docker compose up --build
```

This builds all four images, starts both databases (waiting for them to report healthy before the dependent services start), then brings up Eureka, Student Service, Course Service, and the Gateway in that order.

**3. Verify:**
- Eureka dashboard: `http://localhost:8761` — should show `STUDENT-SERVICE`, `COURSE-SERVICE`, and `API-GATEWAY` all registered
- Test the full enrollment flow through the Gateway exactly as described in [Testing the Full Flow](#testing-the-full-flow) — confirmed working end to end, including the cross-service Feign validation, entirely inside Docker's network (services reach each other by container name, e.g. `student-mysql`, `eureka-server`, not `localhost`)

### Cloud deployment

Student Service is also deployed independently to Railway, containerized with its own Dockerfile, with automatic builds via GitHub Actions on every push to `main`.

---

## Project Structure

```
student-management-microservices/
├── eureka-server/
├── student-service/     (formerly StudentManagementAPI)
├── course-service/
├── api-gateway/
└── README.md
```

---

## Author

Built by Pooja — Final-year BSCS student, University of Karachi (DCS-UBIT), specializing in backend development and AI/ML.