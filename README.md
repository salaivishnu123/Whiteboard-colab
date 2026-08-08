# 🎨 Real-Time Whiteboard Collaboration Tool

A powerful, interactive full-stack real-time whiteboard collaboration platform designed for teams, educators, and creators. Build, sketch, brainstorm, and manage shared workspaces effortlessly.

---

## 🚀 Key Features

* **Interactive Canvas & Drawing Tools:**
  * Freehand drawing, straight lines, rectangles, circles, and custom text.
  * Stroke color picker, brush thickness adjustments, eraser mode, and undo/redo operations.
  * Infinite panning, zoom in/out, and grid snap toggle.
  * Export boards as high-resolution images (PNG/JPEG) or JSON data.

* **Workspaces & Organization:**
  * Organize whiteboards into dedicated workspaces (Personal, Team, Public).
  * Role-based access control (Admin, Editor, Viewer).
  * Pre-built customizable templates (Kanban, Flowcharts, Mindmaps, Brainstorming).

* **Collaboration & Sharing:**
  * Real-time participant tracking and live collaborator list.
  * Invite members via email with role permissions.
  * Invitation acceptance & notification management system.
  * Detailed activity audit logs for board modifications.

* **Admin & User Management:**
  * Dedicated Admin Dashboard with user metrics, active boards, and system statistics.
  * JWT-secured authentication (User registration, login, profile management).

---

## 🛠️ Tech Stack

### Frontend (`reactapp`)
* **Framework:** React.js 18
* **Styling:** Modern Vanilla CSS (Glassmorphic UI, responsive design)
* **Canvas Engine:** HTML5 Canvas API
* **Icons & State:** Lucide / FontAwesome, React Hooks & Context API
* **HTTP Client:** Axios / Fetch API

### Backend (`springapp`)
* **Framework:** Spring Boot 3 / Java 17
* **Security:** Spring Security & JWT Token Authentication
* **ORM / Database:** Spring Data JPA with MySQL / PostgreSQL
* **API Architecture:** RESTful micro-architecture with DTO pattern

---

## 📂 Project Structure

```
├── reactapp/                 # Frontend React Application
│   ├── public/               # Static assets and index.html
│   └── src/
│       ├── components/       # Reusable UI components (Canvas, Toolbar, Sidebar, Navbar)
│       ├── pages/            # Page views (Dashboard, Whiteboard, Login, AdminDashboard)
│       ├── services/         # API integration services
│       └── styles/           # Modular CSS stylesheets
│
├── springapp/                # Backend Spring Boot Application
│   ├── src/main/java/com/examly/springapp/
│   │   ├── controller/       # REST API Endpoints (Auth, Whiteboard, Workspace, Session)
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── model/            # JPA Database Entities
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   └── service/          # Business logic & services
│   └── src/main/resources/   # Application properties & configurations
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
* **Java:** JDK 17 or higher
* **Node.js:** v16 or higher (with npm)
* **Database:** MySQL 8.0+ or PostgreSQL
* **Build Tool:** Maven 3.8+

---

### 1. Database Configuration
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE appDB;
```

Update your database credentials in `springapp/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/appDB?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

---

### 2. Run Backend (Spring Boot)
```powershell
cd springapp
./mvnw spring-boot:run
```
> The backend server will start on **`http://localhost:8080`**.

---

### 3. Run Frontend (React)
```powershell
cd reactapp
npm install
npm start
```
> The React web app will open automatically on **`http://localhost:8081`** (or `http://localhost:3000`).

---

## 📑 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & get JWT |
| `GET` | `/api/workspaces` | Fetch all accessible workspaces |
| `POST` | `/api/workspaces` | Create a new workspace |
| `GET` | `/api/whiteboards/{id}` | Get whiteboard details & canvas data |
| `PUT` | `/api/whiteboards/{id}` | Save whiteboard drawings & canvas state |
| `POST` | `/api/invitations` | Invite collaborator to a board |
| `GET` | `/api/sessions/{boardId}` | Get active collaboration sessions |
| `GET` | `/api/activity-logs/{boardId}` | Fetch audit log history |

---

## 👤 Author

* **GitHub:** [@salaivishnu123](https://github.com/salaivishnu123)
* **Email:** [salaivishnu123@gmail.com](mailto:salaivishnu123@gmail.com)

---

## 📄 License

This project is licensed under the MIT License - feel free to use and customize it for your needs!
