export const routePermissionMap: Record<string, string | undefined> = {
  "/dashboard": undefined,
  "/guide": "guide.read",
  "/ai/knowledge-base": "ai.read",
  "/ai/ask/debug": "ai.admin.stream",
  "/ai/ask": undefined,
  "/admin": "iam.admin.list",
  "/taxonomy": "iam.read",
  "/library": "library.read",
  "/notifications": "notification.read",
  "/community": "community.read",
  "/moderation": "community.read",
  "/settings": undefined,
};
