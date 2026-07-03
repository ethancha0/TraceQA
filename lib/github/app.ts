export interface GitHubAppConfig {
  slug: string | undefined;
  appId: string | undefined;
  name: string;
  installUrl: string | null;
}

export function getGitHubAppConfig(): GitHubAppConfig {
  const slug = normalizeGitHubAppSlug(process.env.GITHUB_APP_SLUG);
  const appId = process.env.GITHUB_APP_ID?.trim();
  const name =
    process.env.GITHUB_APP_NAME?.trim() ??
    formatAppNameFromSlug(slug) ??
    "QA Tester Bot";

  return {
    slug,
    appId,
    name,
    installUrl: getGitHubAppInstallUrl({ slug, appId }),
  };
}

function normalizeGitHubAppSlug(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  // Accept full URLs or paths like github.com/apps/trace-qa
  const fromUrl = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/apps\/([^/?#]+)/i);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }

  // Accept accidental leading/trailing slashes or "apps/" prefix
  return trimmed.replace(/^\/+|\/+$/g, "").replace(/^apps\//i, "") || undefined;
}

function getGitHubAppInstallUrl({
  slug,
  appId,
}: {
  slug: string | undefined;
  appId: string | undefined;
}): string | null {
  if (slug) {
    return `https://github.com/apps/${slug}/installations/new`;
  }

  if (appId) {
    return `https://github.com/settings/installations/new?app_id=${encodeURIComponent(appId)}`;
  }

  return null;
}

function formatAppNameFromSlug(slug: string | undefined): string | undefined {
  if (!slug) {
    return undefined;
  }

  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
