import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";

export default function StepTwo() {

  return (
    <WelcomeLayout progress={100}>
      <div className="flex gap-6 items-center justify-center w-full">
        <Robot variant="four" />

        <div className="flex flex-col gap-4">
          <Bubble>
            Hey, Dinesh!<br />
            I’ll guide you step by step through theory and practice.
          </Bubble>

          <Bubble>
            I’ll also help you build a reading habit.
          </Bubble>

          <Button
            type="submit"
            variant="DarkGradient"
            size="lg"
            className="w-full mt-2"
            href="/dashboard"
        >
            Lets go to Dashboard
        </Button>
        </div>
      </div>
    </WelcomeLayout>
  );
}
