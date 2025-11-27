import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDiscordChannels, getDiscordClient, initializeDiscordBot } from "@/lib/discord-service";

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    const ADMIN_EMAILS = ["vaishnav@cloutcareers.com", "romanov360@gmail.com"];

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get channel IDs
    const channels = getDiscordChannels();

    // Check bot status - initialize if not already
    let client = getDiscordClient();
    if (!client) {
      client = await initializeDiscordBot();
    }

    const botStatus = client && client.user ? "online" : "offline";

    return NextResponse.json({
      channels,
      botStatus,
      botUser: client?.user?.tag || null,
    });
  } catch (error) {
    console.error("Error fetching Discord config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
