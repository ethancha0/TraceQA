import Link from "next/link";
import { getGitHubAppConfig } from "@/lib/github/app";

interface InstallPageProps {
  searchParams: Promise<{
    installation_id?: string;
    setup_action?: string;
  }>;
}

export default async function InstallPage({ searchParams }: InstallPageProps) {
  const { installation_id: installationId, setup_action: setupAction } =
    await searchParams;
  const { name } = getGitHubAppConfig();

  const isInstall = setupAction === "install" || Boolean(installationId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
          {isInstall ? "Installation complete" : "Setup"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {isInstall
            ? `${name} is connected`
            : `Finish setting up ${name}`}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {isInstall
            ? "Your GitHub App installation was received. The bot will start handling webhook events for the repositories you selected."
            : "Return to the home page to install the bot on a repository."}
        </p>

        {installationId ? (
          <p className="mt-6 rounded-xl bg-zinc-100 px-4 py-3 font-mono text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Installation ID: {installationId}
          </p>
        ) : null}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
