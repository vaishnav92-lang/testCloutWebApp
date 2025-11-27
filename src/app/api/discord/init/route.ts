import { NextRequest, NextResponse } from "next/server";
import { initializeDiscordBot } from "@/lib/discord-service";

export async function POST(request: NextRequest) {
  try {
    const client = await initializeDiscordBot();

    if (!client) {
      return NextResponse.json(
        { warning: "Discord bot not initialized. Check your environment variables." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Discord bot initialized successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initializing Discord bot:", error);
    return NextResponse.json(
      { error: "Failed to initialize Discord bot" },
      { status: 500 }
    );
  }
}
