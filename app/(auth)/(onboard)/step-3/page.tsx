import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";

export default function StepThree() {
  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <WelcomeLayout progress={100}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="four" />
          </div>

          {/* Bubbles + Button */}
          <div className="flex flex-col gap-4 w-[500px]">
            <Bubble>
              Hey, Dinesh!<br />
              I’ll guide you step by step through theory and practice.
            </Bubble>

            <Bubble>I’ll also help you build a reading habit.</Bubble>

            <div className="flex justify-end mt-2">
              <Button
                variant="DarkGradient"
                size="lg"
                href="/dashboard"
                className="px-10 rounded-full"
              >
                Lets go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
