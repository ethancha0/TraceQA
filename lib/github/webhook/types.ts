export type GitHubWebhookEvent =
  | "installation"
  | "pull_request"
  | "push"
  | "issue_comment"
  | (string & {});

export interface GitHubRepository {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  html_url: string;
  default_branch: string;
}

export interface GitHubWebhookContext {
  event: GitHubWebhookEvent;
  deliveryId: string;
  payload: GitHubWebhookPayload;
}

export interface GitHubWebhookPayload {
  action?: string;
  installation?: {
    id: number;
    account?: {
      login: string;
      type: string;
    };
  };
  repository?: GitHubRepository;
  sender?: {
    login: string;
    type: string;
  };
  pull_request?: {
    number: number;
    title: string;
    html_url: string;
    state: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
    user?: {
      login: string;
    };
  };
  ref?: string;
  before?: string;
  after?: string;
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  }>;
  pusher?: {
    name: string;
    email: string;
  };
  issue?: {
    number: number;
    title: string;
    html_url: string;
    user?: {
      login: string;
    };
  };
  comment?: {
    id: number;
    body: string;
    html_url: string;
    user?: {
      login: string;
    };
  };
  repositories?: Array<{
    id: number;
    full_name: string;
  }>;
}
