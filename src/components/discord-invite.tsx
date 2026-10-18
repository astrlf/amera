import { siDiscord } from "simple-icons";

interface DiscordInviteProps {
  href: string;
  text: string;
}

export const DiscordInvite = ({ href, text }: DiscordInviteProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-[#5865F2] py-2 pl-2 pr-5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#4752C4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A5ADFF]"
  >
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4752C4] transition-colors duration-150 group-hover:bg-[#3C47B0]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
        aria-hidden="true"
      >
        <path d={siDiscord.path} />
      </svg>
    </span>

    <span>{text}</span>
  </a>
);
