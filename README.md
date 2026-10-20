# Student Attendance System

A web application for managing university courses, lecture sessions, and student attendance using QR codes and browser geolocation. It provides separate dashboards for administrators, lecturers, and students.

## Features

| Role | Capabilities |
| --- | --- |
| Administrator | Create users, manage courses and lecturer assignments, manage enrollments, and review attendance reports. |
| Lecturer | Manage courses and enrolled students, create and close attendance sessions, display attendance QR codes, and view attendance statistics. |
| Student | View enrolled courses, open attendance QR links, submit location-based attendance, and review attendance history and summaries. |

Attendance sessions use randomly generated QR tokens that expire after 15 minutes. The API checks session status, enrollment at the time the session was created, duplicate submissions, and the student's distance from the lecturer's recorded location. New sessions use an allowed radius of 50 meters. Lecturers can also capture their location through a mobile location request.

## System design diagrams

See the [system sequence diagram, use case diagram, UML class diagram, and domain model](docs/diagrams/README.md) for the system's interactions, user capabilities, and domain relationships. Each includes a rendered image and editable PlantUML source.

## Technology stack

- **Frontend:** React 19, React Router 7, Axios, and Vite 8.
- **Backend:** Node.js, Express 5, JWT authentication, bcrypt password hashing, and QR code generation.
- **Database:** MySQL, accessed through `mysql2`.
- **Development tools:** Nodemon and ESLint.

## Repository structure

```text
student-attendance-system/
├── Backend/
│   ├── config/          # Database connection pool
│   ├── controllers/     # Authentication, courses, sessions, and attendance
│   ├── middleware/      # JWT authentication and role checks
│   ├── routes/          # API routes
│   ├── server.js        # Express entry point
│   └── test_db.js       # Manual database connection diagnostic
└── Frontend/
    ├── public/          # Public assets
    ├── src/
    │   ├── components/  # Shared components and protected routes
    │   ├── layouts/     # Role-specific layouts
    │   ├── pages/       # Dashboards, login, scanning, and mobile location
    │   └── styles/      # Page styles
    └── vite.config.js   # HTTPS development server and API proxy
```

## Prerequisites

- Node.js 24 LTS and npm; cloud setup was validated with Node.js 24.19.0.
- A running MySQL database with the application's schema and appropriate development accounts.
- OpenSSL for generating local development certificates.
- A browser with geolocation support and location permission enabled.

**Database setup is required separately.** This repository does not include SQL schema files, migrations, seed data, or default login credentials. Obtain the authoritative schema or a populated development database from the project maintainer before testing database-backed features. An empty database is insufficient. Controllers reference tables including `users`, `courses`, `course_enrollments`, `lecture_sessions`, and `attendance`.

## Local setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/salimupashi20-ai/student-attendance-system.git
cd student-attendance-system
(cd Backend && npm ci)
(cd Frontend && npm ci)
```

### 2. Configure the backend

Create `Backend/.env` with the following settings, replacing the placeholder values with your own development configuration:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
FRONTEND_URL=https://localhost:5173
```

`JWT_SECRET` signs and verifies authentication tokens. `FRONTEND_URL` is the frontend origin used to construct attendance and mobile location QR links. The default database port is `3306`, and the default API port is `5000`.

Keep `.env` files and credentials out of Git; `.env` is already ignored. There is no bundled administrator account, so obtain or provision accounts through your development database setup.

### 3. Create the local HTTPS certificate

The Vite development configuration requires `Frontend/certs/dev-key.pem` and `Frontend/certs/dev-cert.pem`. From the repository root, run the following once if those files do not already exist:

```bash
mkdir -p Frontend/certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout Frontend/certs/dev-key.pem \
  -out Frontend/certs/dev-cert.pem \
  -days 365 -subj '/CN=localhost' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
chmod 600 Frontend/certs/dev-key.pem
```

The certificate directory is ignored by Git. Configure your browser or operating system to trust this development certificate for local testing. Geolocation requires a secure context and user permission.

For testing QR links on a phone, set `FRONTEND_URL` to an HTTPS origin reachable from that phone. A phone's `localhost` points to the phone itself. Use a certificate trusted by the device and valid for that hostname or address; the certificate above covers local computer testing only.

### 4. Start both services

Run the backend in one terminal:

```bash
cd Backend
npm run dev
```

Run the frontend in a second terminal:

```bash
cd Frontend
npm run dev -- --strictPort
```

The API listens on port `5000`, and the HTTPS frontend listens on port `5173`. Open the frontend's `/login` page in your browser. During development, relative `/api` requests are proxied by Vite to the backend on port `5000`. If you change the backend port, the proxy target must also match.

Students sign in with their student number; lecturers and administrators sign in with their staff ID.

## Attendance workflow

1. An administrator creates users, assigns lecturers to courses, and manages enrollments; lecturers can also create courses and enroll students.
2. A lecturer records their location and creates a lecture session for one of their courses.
3. The lecturer displays the session's attendance QR code.
4. An enrolled student opens the QR link, signs in if needed, and permits location access.
5. The API validates the session, token, enrollment, location, and duplicate attendance before recording the submission.
6. Lecturers and administrators review attendance reports; students review their own attendance history.

## API overview

| Base path | Purpose |
| --- | --- |
| `/api/auth` | Registration, login, and authenticated profile access |
| `/api/admin` | User, course, enrollment, and attendance administration |
| `/api/courses` | Lecturer course management |
| `/api/enrollments` | Course enrollment and student course lists |
| `/api/sessions` | Create, list, restore active, and close lecture sessions |
| `/api/attendance` | Submit attendance and retrieve histories and statistics |
| `/api/location-requests` | Lecturer mobile location setup |

Protected endpoints expect `Authorization: Bearer <token>` and enforce the roles defined in the route files. Login tokens expire after 24 hours. See [Backend/routes](Backend/routes) for exact methods, paths, and access rules.

## Build and validation

From the repository root:

```bash
(cd Frontend && npm run build)
(cd Frontend && npm run lint)
```

The production build is written to `Frontend/dist`. For a frontend hosted separately from the API, set `VITE_API_BASE_URL` to the backend origin before building. Otherwise, the deployed frontend host must route `/api` to the backend; the Vite development proxy is not part of the production bundle. Set the backend's `FRONTEND_URL` to the deployed frontend origin as well.

For simple transport checks while both development servers are running:

```bash
curl --fail http://localhost:5000/
curl --fail --cacert Frontend/certs/dev-cert.pem https://localhost:5173/
```

The API root returns `Student Attendance System API is running!`. This response verifies the HTTP server only; it does not verify database connectivity or attendance behavior.

You can run `node test_db.js` from `Backend` as a manual database diagnostic. Inspect its output: it catches connection errors without returning a failing exit status and does not read `DB_PORT`, so it is not a reliable automated readiness check for non-default database ports.

### Current validation status

- Dependency installation, frontend production build, HTTPS frontend serving, and API proxy transport checks passed during cloud onboarding.
- The onboarding lint run reported 8 errors and 8 warnings in existing frontend source files.
- Full login and attendance workflows remain unverified until an authoritative database and runtime configuration are available.
- Neither package currently defines an automated `test` script.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Vite cannot find certificate files | Generate the certificate pair under `Frontend/certs` and start Vite from `Frontend`. |
| Database connection fails | Confirm MySQL is reachable, the `DB_*` settings are correct, and the schema exists. |
| Login or protected requests fail | Confirm the account exists, the identifier matches its role, and `JWT_SECRET` is configured. |
| QR links open the wrong host | Set `FRONTEND_URL` to the frontend origin reachable by the scanning device, then restart the backend. |
| Location access fails | Use trusted HTTPS, enable browser location permission, and check device location services. |
| Attendance is rejected | Check token expiry, active session status, enrollment date, prior submissions, and distance from the lecturer. |
