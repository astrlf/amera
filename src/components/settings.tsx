import { useState } from "preact/hooks";
import type { Run } from "../runs";
import { encode, HASH_PREFIX } from "../share";
import { DiscordInvite } from "./discord-invite";

interface SettingsProps {
  runs: Run[];
  onClear: () => void;
}

export function Settings({ runs, onClear }: SettingsProps) {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("");

  // NOTE: I fear this can't be any prettier :/ maybe we should use a Result monad
  async function share() {
    try {
      const url = `${location.origin}${location.pathname}${HASH_PREFIX}${await encode(runs)}`;
      setLink(url);

      try {
        await navigator.clipboard.writeText(url);
        setStatus("Copied to clipboard.");
      } catch {
        setStatus("Copy the link below.");
      }
    } catch {
      setStatus("Could not create a link in this browser.");
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-7 p-5 text-lg">
      <div className="flex flex-col gap-1.5">
        <span>Share your stats</span>
        <button
          type="button"
          className="btn btn-primary btn-md self-start"
          disabled={runs.length === 0}
          onClick={share}
        >
          Create share link
        </button>
        {link && (
          <input
            type="text"
            readOnly
            className="input input-lg w-full text-sm"
            value={link}
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
        <span className="text-sm opacity-60">
          {status ||
            "Your runs are packed into the link itself. Nothing is uploaded or stored anywhere."}
          {link.length > 8000 &&
            " This link is quite long; some apps may cut it off."}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span>Danger zone</span>
        <button
          type="button"
          className="btn btn-error btn-soft btn-md self-start"
          disabled={runs.length === 0}
          onClick={() => {
            if (confirm("Delete all of your runs? This can't be undone."))
              onClear();
          }}
        >
          Delete all runs
        </button>
      </div>

      <div>
        <h1>Giveaways</h1>
        <p className="mb-4 text-base opacity-60">
          Looking to win some trochus, find a Crypt gang, or win supers? join{" "}
          <a href="https://www.youtube.com/@TheGraalian" className="link">
            The Graalian's
          </a>{" "}
          server on Discord, with giveaways hosted frequently and more than +20m
          G$ being given away on Christmas!
        </p>

        <DiscordInvite
          href="https://discord.gg/FE2ZtuvSyM"
          text="Join The Graalian's Server"
        />
      </div>

      <div class="divider py-0! my-0!"></div>

      <footer className="flex flex-col gap-3 text-sm opacity-60 ">
        <p>
          All game assets and related intellectual property are owned by their
          respective copyright holders, including Toonslab and the original
          creators of GraalOnline Era. This project does not claim ownership of
          any third-party assets.
        </p>
        <p>
          Amera is made by @matroska_container_format using{" "}
          <a className="link" href="https://daisyui.com/">
            DaisyUI
          </a>{" "}
          and{" "}
          <a className="link" href="https://preactjs.com/">
            Preact
          </a>
          . <br />
          For any complaints, bug reports, or feature requests, DM me on
          Discord.
        </p>
      </footer>
    </div>
  );
}
