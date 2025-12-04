# Cloudflare D1 & Workers Setup Guide[wrangler.toml](wrangler.toml)

This guide will help you set up Cloudflare D1 database and Workers for SOCIATE.

## Prerequisites

1. A Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Cloudflare account logged in: `wrangler login`

## Step 1: Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create sociate-db
```

This will output something like:
```
✅ Successfully created DB 'sociate-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "sociate-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 2: Update wrangler.toml

Copy the `database_id` from the output above and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sociate-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with the ID from step 1
```

## Step 3: Create Database Schema

Run the SQL schema to create all tables:

```bash
wrangler d1 execute sociate-db --file=./schema.sql
```

Or manually execute the SQL in `schema.sql` using:
```bash
wrangler d1 execute sociate-db --command="$(cat schema.sql)"
```

## Step 4: Deploy Cloudflare Worker

Deploy the Worker API:

```bash
wrangler deploy
```

This will deploy your Worker and give you a URL like:
```
https://sociate-api.your-subdomain.workers.dev
```

## Step 5: Update Frontend API URL

Update `src/services/cloudflareApi.ts` with your Worker URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sociate-api.your-subdomain.workers.dev';
```

Or set it as an environment variable in your `.env` file:
```
VITE_API_URL=https://sociate-api.your-subdomain.workers.dev
```

## Step 6: Test the Setup

1. Start your frontend: `npm run dev`
2. Register a new user
3. The user should be synced to Cloudflare D1 automatically
4. Check your database: `wrangler d1 execute sociate-db --command="SELECT * FROM users LIMIT 5"`

## Troubleshooting

### Database not found
- Make sure you've created the database and updated `wrangler.toml` with the correct `database_id`
- Verify with: `wrangler d1 list`

### Worker deployment fails
- Check that `src/worker.ts` exists and is valid TypeScript
- Make sure you're logged in: `wrangler whoami`

### API calls failing
- Check the Worker logs: `wrangler tail`
- Verify CORS headers are set correctly in the Worker
- Make sure the API_BASE_URL is correct in your frontend

## Development

### Local Development

Run Worker locally:
```bash
wrangler dev
```

This will start a local server that connects to your D1 database.

### Database Queries

Query your database:
```bash
wrangler d1 execute sociate-db --command="SELECT * FROM users"
```

### View Logs

View Worker logs:
```bash
wrangler tail
```

## Production Considerations

1. **Authentication**: Currently using user ID as token. In production, verify Firebase tokens on the backend
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Error Handling**: Improve error messages and logging
4. **Media Storage**: Currently using base64. Consider using Cloudflare R2 or similar for media files
5. **Pagination**: Add proper pagination for large datasets
6. **Caching**: Add caching for frequently accessed data

## Environment Variables

You can set environment variables in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
```

Access them in your Worker:
```typescript
const env = request.env.ENVIRONMENT;
```

## Next Steps

1. Set up Firebase token verification in the Worker
2. Implement media upload to Cloudflare R2
3. Add rate limiting
4. Set up monitoring and alerts
5. Add database backups

