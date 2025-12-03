'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";

export default function StepTwo() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      return;
    }

    // Navigate to next step
    router.push("/step-3");
  };

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        background:
          "linear-gradient(90deg, #140E27 0%, #240F3C 50%, #341050 100%)",
      }}
    >
      <WelcomeLayout progress={66}>
        <div className="flex items-center justify-center gap-20 w-full max-w-6xl mx-auto">
          {/* Robot */}
          <div className="flex-shrink-0">
            <Robot variant="five" />
          </div>

          {/* Input + Button */}
          <div className="flex flex-col gap-5 w-full max-w-xl">
            <Bubble>I am curious. What shall I call you?</Bubble>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Type your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-pink focus:outline-none transition duration-500"
                required
                minLength={1}
                maxLength={255}
              />

              <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-40 rounded-full"
                disabled={!name}
              >
                Sounds Good
              </Button>
            </form>
          </div>
        </div>
      </WelcomeLayout>
    </div>
  );
}
