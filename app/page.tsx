import { InstallGitHubAppButton } from "@/components/install-github-app-button";
import { getGitHubAppConfig } from "@/lib/github/app";

export default function Home() {
  const { name, installUrl } = getGitHubAppConfig();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          GitHub App
        </p>
        <p>testing3</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Install {name}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Connect this bot to your GitHub account or organization. You&apos;ll
          be taken to GitHub to choose which repositories the bot can access.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-3">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>Responds to pull requests, pushes, and issue comments</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>You choose which repos to grant access to</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>Install or uninstall anytime from GitHub settings</span>
          </li>
        </ul>

        <div className="mt-10">
          {installUrl ? (
            <InstallGitHubAppButton installUrl={installUrl} appName={name} />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-medium">GitHub App not configured</p>
              <p className="mt-1">
                Add <code className="font-mono">GITHUB_APP_SLUG</code> (e.g.{" "}
                <code className="font-mono">trace-qa</code>) or{" "}
                <code className="font-mono">GITHUB_APP_ID</code> to your{" "}
                <code className="font-mono">.env</code> file. The slug is the
                last part of{" "}
                <code className="font-mono">
                  github.com/apps/your-app-slug
                </code>
                .
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs leading-5 text-zinc-500">
          Clicking install opens GitHub&apos;s official app installation flow.
          You&apos;ll be asked to confirm repository access before anything is
          connected.
        </p>
      </main>
    </div>
  );
}
