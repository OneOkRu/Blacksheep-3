# blacksheep rating

Modern Minecraft PvP Tier List, inspired by mctiers.

## Features
- **Static & Fast**: Built with React, Vite, and Tailwind CSS.
- **No Database Needed**: All data is stored in a single `public/data/rating.json` file.
- **Admin Panel**: Edit players, tiers, and settings directly in the browser.
- **Export/Import**: Save your changes to a JSON file and upload it to your repository.
- **Free Hosting**: Deployable to Vercel for free.

## How to Deploy to Vercel (5 minutes)

1. **Fork or Clone** this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com) and sign in with GitHub.
3. Click **Add New... -> Project**.
4. Select your repository and click **Import**.
5. In the **Environment Variables** section, add:
   - Name: `VITE_ADMIN_PASSWORD`
   - Value: `your_secret_password` (choose a strong password for the admin panel)
6. Click **Deploy**. Wait a minute, and your site is live!

## How to use the Admin Panel

1. Go to `https://your-site-url.vercel.app/admin`.
2. Enter the password you set in `VITE_ADMIN_PASSWORD` (default is `admin` if not set).
3. You will see the Admin Dashboard where you can:
   - Add, edit, or delete players.
   - Modify points, ELO, tiers, and badges.
   - Change site settings (name, description).
4. **Important**: Changes made in the admin panel are saved *locally in your browser*.
5. When you are done editing, click the **Save & Export** button. This will download a `rating.json` file.
6. To make the changes permanent for all users, replace the `public/data/rating.json` file in your GitHub repository with the downloaded file. Vercel will automatically rebuild and deploy the updated site.

## Tech Stack
- React 19
- Vite
- React Router
- Tailwind CSS v4
- Recharts (for graphs)
- Framer Motion (for animations)
- Lucide React (for icons)
