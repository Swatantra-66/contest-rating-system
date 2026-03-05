import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Orbitron } from "next/font/google";

const futuristicFont = Orbitron({
  subsets: ["latin"],
  weight: ["700"],
});

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 w-full absolute inset-0 z-50">
      <div className="flex flex-col items-center gap-8 z-10">
        <h1
          className={`${futuristicFont.className} text-xl text-white tracking-widest uppercase`}
        >
          ELO<span className="text-zinc-600">NODE</span>
        </h1>
        <SignUp appearance={{ baseTheme: dark }} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
