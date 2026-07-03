import { GitHubMark } from "@/components/github-mark";

interface InstallGitHubAppButtonProps {
  installUrl: string;
  appName: string;
}

export function InstallGitHubAppButton({
  installUrl,
  appName,
}: InstallGitHubAppButtonProps) {
  return (
    <a
      href={installUrl}
      className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#24292f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#32383f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292f] dark:bg-white dark:text-[#24292f] dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
    >
      <GitHubMark className="h-5 w-5" />
      Install {appName}
    </a>
  );
}
