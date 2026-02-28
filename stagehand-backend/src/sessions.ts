/**
 * Stagehand Session Manager - v3 Compatible
 * Manages browser sessions with proper lifecycle
 */
import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";

interface Session {
    stagehand: Stagehand;
    createdAt: Date;
    lastActivity: Date;
}

class SessionManager {
    private sessions = new Map<string, Session>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up stale sessions every 10 minutes (increased for long form fills)
        this.cleanupInterval = setInterval(() => this.cleanupStaleSessions(), 10 * 60 * 1000);
    }

    async create(sessionId: string): Promise<Stagehand> {
        // Close existing session if any
        if (this.sessions.has(sessionId)) {
            await this.close(sessionId);
        }

        console.log(`[Session ${sessionId}] Creating new Stagehand v3 instance...`);

        // Check for API key
        const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!geminiKey && !openaiKey) {
            console.warn("[Warning] No API key found. Add OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to .env");
        }

        // Stagehand v3 – use Gemini Pro for best quality (override with STAGEHAND_MODEL env var)
        const headless = process.env.BROWSER_HEADLESS !== "false";
        const model = process.env.STAGEHAND_MODEL
            || (geminiKey ? "google/gemini-2.5-pro" : "openai/gpt-4o");
        const stagehand = new Stagehand({
            env: "LOCAL",
            model,
            localBrowserLaunchOptions: {
                headless,
                args: [
                    "--start-maximized",
                    "--window-size=1920,1080",
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                ],
            },
            verbose: 1,
        });

        await stagehand.init();
        
        // Additional anti-detection: Override navigator.webdriver and other automation markers
        const page = stagehand.context.pages()[0];
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            (window as any).chrome = {
                runtime: {},
            };
        });
        
        console.log(`[Session ${sessionId}] Stagehand v3 initialized successfully`);

        this.sessions.set(sessionId, {
            stagehand,
            createdAt: new Date(),
            lastActivity: new Date(),
        });

        return stagehand;
    }

    get(sessionId: string): Stagehand | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            return session.stagehand;
        }
        return undefined;
    }

    async close(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            console.log(`[Session ${sessionId}] Closing...`);
            try {
                await session.stagehand.close();
            } catch (error) {
                console.error(`[Session ${sessionId}] Error closing:`, error);
            }
            this.sessions.delete(sessionId);
        }
    }

    async closeAll(): Promise<void> {
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            await this.close(sessionId);
        }
    }

    private async cleanupStaleSessions(): Promise<void> {
        const now = new Date();
        const maxAge = 60 * 60 * 1000; // 60 minutes (increased for long automation flows)

        for (const [sessionId, session] of this.sessions) {
            const age = now.getTime() - session.lastActivity.getTime();
            if (age > maxAge) {
                console.log(`[Session ${sessionId}] Cleaning up stale session`);
                await this.close(sessionId);
            }
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.closeAll();
    }
}

// Singleton instance
export const sessionManager = new SessionManager();
