'use client'
import { Bubble, Robot, WelcomeLayout } from "@/components/auth/onboard";
import { Button } from "@/components/shared";
import { useState } from "react";

export default function StepThree() {
  const [name, setName] = useState("");

  return (
    <WelcomeLayout progress={66}>
      <div className="flex gap-6 items-center justify-center w-full">
        <Robot variant="five" />

        <div className="flex flex-col gap-5 w-full max-w-xl">
          <Bubble>I am curious. What shall I call you?</Bubble>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Type your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-pink focus:outline-none transition duration-500"
            />
            
            <Button
                type="submit"
                variant="DarkGradient"
                size="lg"
                className="w-full"
                href="/step-3"
            >
                Sounds Good
            </Button>
          </div>
        </div>
      </div>
    </WelcomeLayout>
  );
}
