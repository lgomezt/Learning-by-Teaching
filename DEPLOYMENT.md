# Deployment Guide for Coolify

This guide walks you through deploying this application to Coolify with Google Cloud SQL (PostgreSQL).

## Prerequisites

1. **Google Cloud Platform Account** with:
   - A Cloud SQL PostgreSQL instance created
   - Service account with Cloud SQL Client permissions
   - Service account key file (`credentials.json`)

2. **Coolify Instance** with:
   - Docker Compose support
   - Ability to set environment variables
   - Ability to upload secret files

## Step 1: Google Cloud Platform Setup

### 1.1 Create Cloud SQL PostgreSQL Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **SQL** → **Create Instance**
3. Choose **PostgreSQL**
4. Configure your instance:
   - **Instance ID**: Choose a unique name (e.g., `teaching-agent-db`)
   - **Root password**: Set a strong password (save this!)
   - **Region**: Choose a region close to your Coolify server
   - **Database version**: PostgreSQL 15 or later recommended
5. Click **Create**

### 1.2 Create Database

1. Once the instance is created, go to **Databases** tab
2. Click **Create Database**
3. Enter database name (e.g., `teaching_agent`)
4. Click **Create**

**Note**: The application can also auto-create the database if the service account has permissions. See Step 1.4.

### 1.3 Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Enter name: `cloud-sql-proxy`
4. Click **Create and Continue**
5. Grant role: **Cloud SQL Client**
6. Click **Continue** → **Done**

### 1.4 Grant Database Creation Permissions (Optional)

If you want the app to auto-create the database:

1. Go to your Cloud SQL instance
2. Click **Users** tab
3. Add a new user with the same username you'll use in environment variables
4. Grant this user permission to create databases

Alternatively, you can create the database manually in the Cloud SQL console (recommended for production).

### 1.5 Create Service Account Key

1. Go to **IAM & Admin** → **Service Accounts**
2. Find your service account (`cloud-sql-proxy`)
3. Click on it → **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON** format
6. Download the file and save it as `credentials.json`

### 1.6 Get Connection Name

1. Go to your Cloud SQL instance
2. Find the **Connection name** (format: `PROJECT_ID:REGION:INSTANCE_NAME`)
3. Copy this value - you'll need it for `DB_INSTANCE_CONNECTION_NAME`

Example: `my-project:us-central1:teaching-agent-db`

## Step 2: Coolify Configuration

### 2.1 Create New Application

1. In Coolify, create a new application
2. Choose **Docker Compose** as the deployment method
3. Connect your Git repository

### 2.2 Upload Credentials File

1. In Coolify, go to your application's **Secrets** section
2. Upload `credentials.json` as a secret file
3. Note the path where Coolify stores it (usually `/data/coolify/secrets/credentials.json`)
4. Ensure this matches the volume mount in `docker-compose.yml`

### 2.3 Set Environment Variables

In Coolify's environment variables section, set the following:

#### Required Backend Variables

```
POSTGRES_USER=<your-database-username>
POSTGRES_PASSWORD=<your-database-password>
POSTGRES_DB=<your-database-name>
DB_HOST=cloud-sql-proxy
DB_PORT=5432
DB_INSTANCE_CONNECTION_NAME=<PROJECT_ID:REGION:INSTANCE_NAME>
CORS_ORIGINS=https://your-frontend-domain.com
```

**Example:**
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=teaching_agent
DB_HOST=cloud-sql-proxy
DB_PORT=5432
DB_INSTANCE_CONNECTION_NAME=my-project:us-central1:teaching-agent-db
CORS_ORIGINS=https://e0gck4occ0co0ksgk8ocgo04.pandora.cs.uwaterloo.ca
```

#### Required Frontend Build Arguments

Set these as build arguments for the frontend service:

```
VITE_API_URL=https://your-backend-domain.com/api
VITE_AUTH0_DOMAIN=<your-auth0-domain>
VITE_AUTH0_CLIENT_ID=<your-auth0-client-id>
VITE_AUTH0_AUDIENCE=<your-auth0-audience>
```

**Example:**
```
VITE_API_URL=https://v0ck8kocoo4c4ok84g84g8go.pandora.cs.uwaterloo.ca/api
VITE_AUTH0_DOMAIN=your-app.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-audience
```

#### Optional Variables

```
OPENAI_API_KEY=<your-openai-key>  # If using OpenAI
GEMINI_API_KEY=<your-gemini-key>  # If using Gemini
```

### 2.4 Configure Domains

1. Set up your frontend domain (e.g., `https://e0gck4occ0co0ksgk8ocgo04.pandora.cs.uwaterloo.ca`)
2. Set up your backend domain (e.g., `https://v0ck8kocoo4c4ok84g84g8go.pandora.cs.uwaterloo.ca`)
3. Ensure `CORS_ORIGINS` includes your frontend domain

### 2.5 Deploy

1. Review your `docker-compose.yml` file
2. Ensure all environment variables are set
3. Deploy the application
4. Monitor the logs for any errors

## Step 3: Verification

### 3.1 Check Backend Logs

After deployment, check the backend logs. You should see:

```
--- Entrypoint Script ---
Waiting for database server to be ready...
--- Wait for DB Script ---
✅ Database server connection successful!
Database server is ready. Ensuring database exists...
--- Database Creation Script ---
✅ Database 'your_db_name' already exists.
Database is ready. Running migrations...
✅ Migrations complete.
Starting Gunicorn server...
```

### 3.2 Test Backend Health

1. Visit `https://your-backend-domain.com/`
2. You should see: `{"message": "Welcome to the API!"}`

### 3.3 Test Frontend

1. Visit your frontend domain
2. Try logging in
3. Check browser console for any CORS errors

## Troubleshooting

### CORS Errors

**Symptoms**: `Origin ... is not allowed by Access-Control-Allow-Origin`

**Solutions**:
1. Verify `CORS_ORIGINS` environment variable is set correctly
2. Ensure frontend URL is included in `CORS_ORIGINS` (comma-separated if multiple)
3. Check that backend is actually running (not returning 503)

### Database Connection Errors

**Symptoms**: `Could not connect to database`, `503 errors`

**Solutions**:
1. Verify `DB_INSTANCE_CONNECTION_NAME` format: `PROJECT_ID:REGION:INSTANCE_NAME`
2. Check that `credentials.json` is uploaded correctly
3. Verify service account has **Cloud SQL Client** role
4. Ensure Cloud SQL instance is running
5. Check that `cloud-sql-proxy` service is running (check logs)
6. Verify database exists OR service account can create databases

### Database Not Found Errors

**Symptoms**: `database "xxx" does not exist`

**Solutions**:
1. Create the database manually in Cloud SQL console, OR
2. Ensure service account has permissions to create databases
3. Check `create_db.py` logs in backend container

### Cloud SQL Proxy Errors

**Symptoms**: Proxy fails to start or connect

**Solutions**:
1. Verify `DB_INSTANCE_CONNECTION_NAME` is correct
2. Check that credentials file path is correct: `/data/coolify/secrets/credentials.json`
3. Verify credentials file has correct format (JSON)
4. Ensure service account has `cloudsql.instances.connect` permission

### Frontend Can't Reach Backend

**Symptoms**: `Failed to load resource`, `Fetch API cannot load`

**Solutions**:
1. Verify `VITE_API_URL` is set correctly in frontend build args
2. Ensure backend domain is accessible
3. Check backend is running (not 503)
4. Verify CORS configuration

## Environment Variables Reference

### Backend Service

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `POSTGRES_USER` | Yes | Database username | `postgres` |
| `POSTGRES_PASSWORD` | Yes | Database password | `secure-password` |
| `POSTGRES_DB` | Yes | Database name | `teaching_agent` |
| `DB_HOST` | Yes | Database host (use `cloud-sql-proxy`) | `cloud-sql-proxy` |
| `DB_PORT` | Yes | Database port | `5432` |
| `DB_INSTANCE_CONNECTION_NAME` | Yes | Cloud SQL connection name | `project:region:instance` |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed origins | `https://app.example.com` |
| `OPENAI_API_KEY` | Optional | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Optional | Gemini API key | `...` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Auto-set | Path to credentials file | `/app/credentials.json` |

### Frontend Build Args

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://api.example.com/api` |
| `VITE_AUTH0_DOMAIN` | Yes | Auth0 domain | `app.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Yes | Auth0 client ID | `...` |
| `VITE_AUTH0_AUDIENCE` | Yes | Auth0 audience | `...` |

## Security Best Practices

1. **Never commit** `credentials.json` to Git
2. Use strong passwords for database
3. Restrict CORS origins to specific domains in production
4. Use environment variables for all secrets
5. Regularly rotate service account keys
6. Enable Cloud SQL SSL connections (if required by your organization)
7. Use least-privilege IAM roles for service accounts

## Additional Resources

- [Cloud SQL Proxy Documentation](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Coolify Documentation](https://coolify.io/docs)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)


