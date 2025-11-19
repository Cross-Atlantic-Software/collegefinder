import { AuthShell, LoginStepOneForm } from "@/components/auth";
import { MascotBubble } from "@/components/auth";

export default function LoginStepOnePage() {
  return (
    <AuthShell>
      <div className="mx-auto flex w-full flex-col px-6 pb-10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <LoginStepOneForm />
          <MascotBubble
            variant="one"
            message={
              <>
                Go no, Click on the button and start the learning progress.
              </>
            }
          />

      </div>
    </AuthShell>
  );
}
