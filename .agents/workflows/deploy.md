---
description: Deploy the Future Finance Planner to Vercel
---

There are two ways to deploy this project:

### Option 1: Automatic (GitHub/GitLab)
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **"Add New"** → **"Project"**.
3. Import your repository.
4. Vercel will automatically detect **Vite** and set the:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **"Deploy"**.

### Option 2: CLI (Local)
// turbo
1. Install the Vercel CLI:
   `npm install -g vercel`
2. Run the deployment command:
   `vercel --prod`

### Important Configuration
The project includes a `vercel.json` file which handles **SPA routing**. This ensures that if you refresh the page on a specific route, it won't 404, but will instead load the app correctly.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
