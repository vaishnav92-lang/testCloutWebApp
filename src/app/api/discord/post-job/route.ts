import { NextRequest, NextResponse } from "next/server";
import { initializeDiscordBot, postJobToDiscord } from "@/lib/discord-service";

export async function POST(request: NextRequest) {
  try {
    // Initialize Discord bot if not already initialized
    await initializeDiscordBot();

    // Parse request body
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId in request body" },
        { status: 400 }
      );
    }

    // Post job to Discord
    const success = await postJobToDiscord(jobId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to post job to Discord" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Job posted to Discord successfully", jobId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Discord post-job route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
