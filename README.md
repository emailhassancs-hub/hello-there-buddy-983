# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e6a8dbd4-bc7b-424f-8c6e-b31bb6b7ca47

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e6a8dbd4-bc7b-424f-8c6e-b31bb6b7ca47) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.  
npm i

# Step 4: Create a .env file with your environment variables (see Environment Variables section below)
# Copy .env.example to .env and update the values if needed

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev   
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Variables

This project uses environment variables for API configuration. Create a `.env` file in the root directory with the following variables:

```env
# Main API URL (Middleware/Agentic) - used for chat, sessions, video list, etc.
VITE_API_BASE_URL=https://games-ai-studio-middleware-agentic-main-347148155332.us-central1.run.app

# Backend API URL (Nest) - used for image generation history, model optimization, etc.
VITE_API_BACKEND_URL=https://games-ai-studio-be-nest-347148155332.us-central1.run.app

# Video Streaming URL - used for video playback
VITE_VIDEO_STREAM_URL=http://35.209.183.202:8000  
```

**Note**: All environment variables in Vite must be prefixed with `VITE_` to be exposed to the client code.

If these variables are not set, the application will use the default production URLs as fallbacks.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e6a8dbd4-bc7b-424f-8c6e-b31bb6b7ca47) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
