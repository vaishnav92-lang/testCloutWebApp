/**
 * Next.js Instrumentation Hook
 * This runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Discord bot on server startup
    const { initializeDiscordBot } = await import('./lib/discord-service')

    console.log('[Instrumentation] Initializing Discord bot...')
    try {
      await initializeDiscordBot()
      console.log('[Instrumentation] Discord bot initialized successfully')
    } catch (error) {
      console.error('[Instrumentation] Failed to initialize Discord bot:', error)
    }
  }
}
