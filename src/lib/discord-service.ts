import { prisma } from "./prisma";

let discordClient: any = null;
let initialized = false;

export async function initializeDiscordBot() {
  if (initialized && discordClient) return discordClient;

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("[Discord] Bot token not configured. Skipping initialization.");
    initialized = true; // Mark as initialized to avoid repeated warnings
    return null;
  }

  try {
    // Dynamically import discord.js only when needed
    const { Client, GatewayIntentBits } = await import("discord.js");

    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    // Handle ready event
    discordClient.on("ready", () => {
      console.log(`[Discord] Bot logged in as ${discordClient?.user?.tag}`);
    });

    // Handle reaction add events
    discordClient.on("messageReactionAdd", async (reaction: any, user: any) => {
      if (user.bot) return; // Ignore bot reactions

      try {
        // Fetch full reaction if needed
        if (reaction.partial) {
          await reaction.fetch();
        }

        // Get the message data from metadata
        const jobId = reaction.message.embeds[0]?.footer?.text?.split(":")[1]?.trim();
        if (!jobId) return;

        const reactionEmoji = reaction.emoji.name;
        let responseText = "";

        switch (reactionEmoji) {
          case "1️⃣":
            // Get more info - send full JD
            responseText = await handleMoreInfoReaction(jobId);
            break;
          case "2️⃣":
            // Apply - send hiring manager email
            responseText = await handleApplyReaction(jobId);
            break;
          case "3️⃣":
            // Forward - send email template
            responseText = await handleForwardReaction(jobId);
            break;
        }

        if (responseText) {
          await user.send(responseText);
        }
      } catch (error) {
        console.error("[Discord] Error handling reaction:", error);
      }
    });

    // Handle errors
    discordClient.on("error", (error: any) => {
      console.error("[Discord] Client error:", error);
    });

    // Login to Discord
    await discordClient.login(token);
    initialized = true;
    console.log("[Discord] Bot initialized successfully");
    return discordClient;
  } catch (error) {
    console.error("[Discord] Failed to initialize bot:", error);
    initialized = true; // Mark as initialized to avoid repeated initialization attempts
    return null;
  }
}

export function getDiscordClient() {
  return discordClient;
}

// Handler for [1] reaction - send full job description
async function handleMoreInfoReaction(jobId: string): Promise<string> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: true,
        company: true,
      },
    });

    if (!job) {
      return "❌ Job not found.";
    }

    const ownerName = job.owner ? `${job.owner.firstName || ""} ${job.owner.lastName || ""}`.trim() : "N/A";

    return `
📋 **Full Job Description for ${job.title}**

**Company:** ${job.company?.name || "N/A"}
**Location:** ${job.location || "Remote"}
**Salary:** ${job.salaryMin ? `$${job.salaryMin} - $${job.salaryMax} ${job.currency}` : "Not specified"}

**Description:**
${job.description}

**Requirements:**
${job.requirements?.join("\n") || "Not specified"}

${job.dayToDayDescription ? `**Day-to-Day:**\n${job.dayToDayDescription}` : ""}

${job.mustHaves ? `**Must Haves:**\n${job.mustHaves}` : ""}

${job.flexibleRequirements ? `**Flexible Requirements:**\n${job.flexibleRequirements}` : ""}

${job.growthPath ? `**Growth Path:**\n${job.growthPath}` : ""}

**Hiring Manager:** ${ownerName} (${job.owner?.email || "N/A"})
    `;
  } catch (error) {
    console.error("[Discord] Error in handleMoreInfoReaction:", error);
    return "❌ Error retrieving job details.";
  }
}

// Handler for [2] reaction - send hiring manager email for application
async function handleApplyReaction(jobId: string): Promise<string> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: true,
        company: true,
      },
    });

    if (!job || !job.owner?.email) {
      return "❌ Job or hiring manager email not found.";
    }

    return `
✉️ **How to Apply for ${job.title} at ${job.company?.name}**

Send an email to:
\`${job.owner.email}\`

Make sure to **CC** the bot:
\`bot@cloutcareers.com\`

This helps us track your application and ensure proper credit for referrals.

**Subject suggestion:**
\`Application for ${job.title}\`

Good luck! 🚀
    `;
  } catch (error) {
    console.error("[Discord] Error in handleApplyReaction:", error);
    return "❌ Error retrieving application details.";
  }
}

// Handler for [3] reaction - send email template for forwarding job
async function handleForwardReaction(jobId: string): Promise<string> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: true,
        company: true,
      },
    });

    if (!job) {
      return "❌ Job not found.";
    }

    const emailTemplate = `
From: Your Email
To: [Recipient Email]
CC: bot@cloutcareers.com
Subject: Potential opportunity at ${job.company?.name} - ${job.title}

Hi [Recipient Name],

I came across an interesting opportunity that I thought might be a great fit for you:

**Position:** ${job.title}
**Company:** ${job.company?.name}
**Location:** ${job.location || "Remote"}

[Optional: Add a personal note about why you think this is a good fit for them]

I'm sharing this through Clout Careers, which helps track referrals and ensure everyone gets proper credit. By CC'ing bot@cloutcareers.com, we're building a transparent referral network.

Let me know if you'd like more details!

Best,
[Your Name]
    `;

    return `
📤 **Email Template to Forward ${job.title}**

Here's a template you can use to forward this job to someone:

\`\`\`
${emailTemplate}
\`\`\`

**Key points:**
✅ Make sure to CC \`bot@cloutcareers.com\`
✅ Personalize the email with recipient details
✅ Add a note about why you think they're a good fit

This helps us track referrals and ensure you get proper credit!
    `;
  } catch (error) {
    console.error("[Discord] Error in handleForwardReaction:", error);
    return "❌ Error retrieving job details.";
  }
}

// Get Discord channel IDs from environment variable
export function getDiscordChannels(): string[] {
  try {
    // Try DISCORD_CHANNEL_IDS (JSON array or comma-separated)
    const channelIds = process.env.DISCORD_CHANNEL_IDS;
    if (channelIds) {
      try {
        const parsed = JSON.parse(channelIds);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If not JSON, try comma-separated
        return channelIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    // Backward compatibility with single channel
    const singleChannelId = process.env.DISCORD_CHANNEL_ID;
    if (singleChannelId) {
      return [singleChannelId];
    }

    return [];
  } catch (error) {
    console.error("[Discord] Error getting channel IDs:", error);
    return [];
  }
}

export async function postJobToDiscord(jobId: string): Promise<boolean> {
  const client = getDiscordClient();
  if (!client) {
    console.error("[Discord] Client not initialized");
    return false;
  }

  try {
    // Dynamically import discord.js modules
    const { EmbedBuilder, ChannelType } = await import("discord.js");

    const channelIds = getDiscordChannels();
    if (channelIds.length === 0) {
      console.error("[Discord] No channel IDs configured");
      return false;
    }

    // Fetch the job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        owner: true,
        company: true,
      },
    });

    if (!job) {
      console.error(`[Discord] Job ${jobId} not found`);
      return false;
    }

    // Create embed message
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`🎯 ${job.title}`)
      .setDescription(
        job.description?.substring(0, 200) + (job.description && job.description.length > 200 ? "..." : "")
      )
      .addFields(
        { name: "Company", value: job.company?.name || "N/A", inline: true },
        { name: "Location", value: job.location || "Remote", inline: true },
        {
          name: "Salary",
          value:
            job.salaryMin && job.salaryMax
              ? `$${job.salaryMin} - $${job.salaryMax} ${job.currency}`
              : "Not specified",
          inline: true,
        },
        { name: "Remote", value: job.remote ? "Yes" : "No", inline: true },
        {
          name: "How to Respond",
          value: "React with:\n1️⃣ - Get more info\n2️⃣ - Apply\n3️⃣ - Forward to someone",
        }
      )
      .setFooter({ text: `Job ID: ${jobId}` })
      .setTimestamp();

    if (job.company?.logoUrl) {
      embed.setThumbnail(job.company.logoUrl);
    }

    // Post to all configured channels
    let successCount = 0;
    let failCount = 0;

    for (const channelId of channelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
          console.error(`[Discord] Invalid channel: ${channelId}`);
          failCount++;
          continue;
        }

        // Send message and add reactions
        const message = await channel.send({ embeds: [embed] });
        await message.react("1️⃣");
        await message.react("2️⃣");
        await message.react("3️⃣");

        console.log(`[Discord] Job ${jobId} posted successfully to channel ${channelId}`);
        successCount++;
      } catch (error) {
        console.error(`[Discord] Error posting to channel ${channelId}:`, error);
        failCount++;
      }
    }

    console.log(`[Discord] Job ${jobId} posted to ${successCount}/${channelIds.length} channels`);
    return successCount > 0;
  } catch (error) {
    console.error("[Discord] Error posting job:", error);
    return false;
  }
}
