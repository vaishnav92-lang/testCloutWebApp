C# Discord Bot Setup Guide

This guide explains how to set up the Clout Careers Discord bot from scratch, including creating the bot, configuring permissions, and installing it into a Discord server.

## Prerequisites

- A Discord account
- Admin access to a Discord server (or permission to add bots)
- Node.js and npm installed locally

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** in the top right
3. Give your application a name (e.g., "Clout Careers Bot")
4. Click **"Create"**

## Step 2: Create a Bot User

1. In your application settings, navigate to the **"Bot"** section in the left sidebar
2. Click **"Add Bot"**
3. Confirm by clicking **"Yes, do it!"**
4. Customize your bot:
   - Set a username (e.g., "Clout bot")
   - Upload a profile picture (optional)

## Step 3: Configure Bot Permissions & Intents

### Required Intents

In the **"Bot"** section, scroll down to **"Privileged Gateway Intents"** and enable:

- ✅ **Presence Intent** (optional, for online status)
- ✅ **Server Members Intent** (if you need member information)
- ✅ **Message Content Intent** (required for reading message content)

These intents allow your bot to:
- Read messages in channels
- Detect reactions on messages
- Send direct messages to users

### Bot Token

1. In the **"Bot"** section, find the **"Token"** section
2. Click **"Reset Token"** (or "Copy" if this is a new bot)
3. **Copy the token** - you'll need this for your `.env` file
4. ⚠️ **IMPORTANT**: Never share this token publicly! It's like a password for your bot.

## Step 4: Set Bot Permissions

1. Go to the **"OAuth2"** section in the left sidebar
2. Click on **"URL Generator"**
3. Under **"Scopes"**, select:
   - ✅ `bot`
4. Under **"Bot Permissions"**, select:
   - ✅ **View Channels** - See channels in the server
   - ✅ **Send Messages** - Post job listings
   - ✅ **Embed Links** - Send rich embeds with job details
   - ✅ **Read Message History** - Required for reaction handling
   - ✅ **Add Reactions** - Add 1️⃣ 2️⃣ 3️⃣ reactions to job posts
   - ✅ **Use External Emojis** - Use custom emojis (optional)
   - ✅ **Send Messages in Threads** - If you want thread support
   - ✅ **Send Direct Messages** - Send DMs when users react

This generates a permission integer (e.g., `274877990976`)

## Step 5: Generate Invite Link

1. Still in the **"URL Generator"** section, scroll down
2. Copy the generated URL (should look like):
   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877990976&integration_type=0&scope=bot
   ```
3. Save this URL - you'll use it to invite the bot to servers

## Step 6: Invite Bot to Your Server

1. Open the invite URL you generated in Step 5
2. Select the server where you want to add the bot
3. Click **"Authorize"**
4. Complete the CAPTCHA if prompted
5. The bot should now appear in your server's member list (offline until you start it)

## Step 7: Get Channel ID

You need to tell the bot which channel to post jobs to:

1. In Discord, enable **Developer Mode**:
   - User Settings → Advanced → Developer Mode (toggle ON)
2. Right-click the channel where you want job posts to appear
3. Click **"Copy Channel ID"**
4. Save this ID - you'll need it for your `.env` file

## Step 8: Configure Environment Variables

Create or update your `.env` file with:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_STEP_3"
DISCORD_CHANNEL_ID="YOUR_CHANNEL_ID_FROM_STEP_7"
```

Replace:
- `YOUR_BOT_TOKEN_FROM_STEP_3` with the token you copied in Step 3
- `YOUR_CHANNEL_ID_FROM_STEP_7` with the channel ID you copied in Step 7

## Step 9: Start the Bot

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. You should see in the console:
   ```
   [Discord] Bot initialized successfully
   [Discord] Bot logged in as Clout bot#9715
   ```

4. The bot should now appear **online** in your Discord server

## Step 10: Test the Bot

Post a test job to Discord:

```bash
curl -X POST http://localhost:3000/api/discord/post-job \
  -H "Content-Type: application/json" \
  -d '{"jobId": "YOUR_JOB_ID"}'
```

Replace `YOUR_JOB_ID` with a valid job ID from your database.

### What Should Happen:

1. A job embed appears in your configured Discord channel
2. The bot automatically adds three reactions: 1️⃣ 2️⃣ 3️⃣
3. When users click reactions:
   - **1️⃣** - Bot sends them the full job description via DM
   - **2️⃣** - Bot sends them how to apply (hiring manager email)
   - **3️⃣** - Bot sends them an email template to forward the job

## Troubleshooting

### Bot appears offline
- Check that `npm run dev` is running
- Verify your `DISCORD_BOT_TOKEN` is correct
- Check console for error messages

### "Used disallowed intents" error
- Go to Discord Developer Portal → Bot section
- Enable required intents (see Step 3)

### Bot can't send messages
- Check bot permissions in your Discord server
- Verify the bot role has "Send Messages" permission
- Make sure the bot isn't rate-limited

### "Invalid channel" error
- Verify `DISCORD_CHANNEL_ID` is correct
- Make sure the bot has access to that channel
- Check the channel is a text channel (not voice/forum)

### Database connection errors
- Verify your `DATABASE_URL` is correct in `.env`
- Check that Prisma client is generated: `npx prisma generate`

## Architecture Notes

### How the Bot Works

The bot operates in two modes:

1. **Job Posting** (HTTP trigger):
   - Your app calls `/api/discord/post-job` with a job ID
   - Bot fetches job from database
   - Bot posts formatted embed to Discord channel

2. **Reaction Handling** (WebSocket events):
   - Bot maintains persistent WebSocket connection to Discord
   - When users react with 1️⃣ 2️⃣ 3️⃣, Discord pushes events to bot
   - Bot processes reactions and sends DMs automatically
   - No HTTP requests needed - runs in background

### Production Deployment

For production use:
- Deploy to a server that runs 24/7 (Vercel, Railway, AWS, etc.)
- The bot must be running continuously to handle reactions
- Consider using a process manager like PM2 for Node.js apps
- Set up monitoring to restart the bot if it crashes

## Relevant Files

- `src/lib/discord-service.ts` - Bot initialization and reaction handlers
- `src/app/api/discord/post-job/route.ts` - API endpoint to post jobs
- `.env` - Environment configuration (not committed to git)

## Security Notes

- **Never commit your bot token to git** - Keep it in `.env` only
- Add `.env` to your `.gitignore`
- Regenerate your token if it's accidentally exposed
- Use different tokens for development and production
- Restrict bot permissions to only what's needed

## Additional Resources

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Discord Bot Best Practices](https://discord.com/developers/docs/topics/community-resources#bots-and-apps)
