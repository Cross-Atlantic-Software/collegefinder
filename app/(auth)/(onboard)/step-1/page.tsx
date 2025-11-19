import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";

export default function StepOne() {

  return (
    <WelcomeLayout progress={33}>
      <div className="flex gap-6 items-center justify-center w-full">
        <Robot variant="three" />

        <div className="flex flex-col gap-4">
          <Bubble>
            Welcome!, I’m Support Agent<br />
            I’ll be your companion throughout your Learning journey.
          </Bubble>

          <Bubble>
            Exam Preparation is one of the best expertise that we have.
          </Bubble>

            <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-full mt-2"
                href="/step-2"
            >
                Continue
            </Button>
        </div>
      </div>
    </WelcomeLayout>
  );
}
