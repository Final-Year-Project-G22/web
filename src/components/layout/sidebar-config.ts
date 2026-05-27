export interface SidebarSection {
  id: string;
  labelKey: string;
  items: SidebarItem[];
}

export interface SidebarLink {
  kind: "link";
  href: string;
  labelKey: string;
  iconName: string;
  permissionCode?: string;
}

export interface SidebarCollapsible {
  kind: "collapsible";
  labelKey: string;
  iconName: string;
  permissionCode?: string;
  children: { href: string; labelKey: string }[];
}

export interface SidebarDropdown {
  kind: "dropdown";
  labelKey: string;
  iconName: string;
  permissionCode?: string;
  children: { href: string; labelKey: string; iconName: string }[];
}

export type SidebarItem = SidebarLink | SidebarCollapsible | SidebarDropdown;

export const sidebarConfig: SidebarSection[] = [
  {
    id: "main",
    labelKey: "sections.main",
    items: [
      {
        kind: "link",
        href: "/dashboard",
        labelKey: "links.dashboard",
        iconName: "LayoutDashboard",
      },
      {
        kind: "link",
        href: "#",
        labelKey: "links.msme_users",
        iconName: "Users",
      },
      {
        kind: "collapsible",
        labelKey: "links.guide",
        iconName: "BookOpen",
        permissionCode: "guide.read",
        children: [{ href: "/guide", labelKey: "links.guides" }],
      },
      {
        kind: "collapsible",
        labelKey: "links.ai_knowledge",
        iconName: "BrainCircuit",
        permissionCode: "ai.read",
        children: [
          { href: "/ai/knowledge-base", labelKey: "links.knowledge_base" },
          { href: "/ai/ask", labelKey: "links.ask_ai" },
        ],
      },
      {
        kind: "link",
        href: "/admin/admins",
        labelKey: "links.admin_hub",
        iconName: "Shield",
        permissionCode: "iam.admin.list",
      },
      {
        kind: "collapsible",
        labelKey: "links.taxonomy",
        iconName: "Tags",
        permissionCode: "iam.read",
        children: [
          { href: "/taxonomy/sectors", labelKey: "links.sectors" },
          { href: "/taxonomy/tags", labelKey: "links.tags" },
        ],
      },
      {
        kind: "collapsible",
        labelKey: "links.library",
        iconName: "Folders",
        permissionCode: "library.read",
        children: [
          { href: "/library/categories", labelKey: "links.categories" },
          { href: "/library/template-groups", labelKey: "links.template_groups" },
          { href: "/library/downloads", labelKey: "links.download_logs" },
        ],
      },
    ],
  },
  {
    id: "community",
    labelKey: "sections.community",
    items: [
      {
        kind: "link",
        href: "/community/categories",
        labelKey: "links.community_categories",
        iconName: "Folder",
        permissionCode: "community.read",
      },
      {
        kind: "dropdown",
        labelKey: "links.moderation",
        iconName: "TriangleAlert",
        permissionCode: "community.read",
        children: [
          {
            href: "/moderation/blocked-users",
            labelKey: "links.blocked_users",
            iconName: "ShieldAlert",
          },
          {
            href: "/moderation/reported-content",
            labelKey: "links.reported_content",
            iconName: "TriangleAlert",
          },
          {
            href: "/moderation/reported-users",
            labelKey: "links.reported_users",
            iconName: "TriangleAlert",
          },
        ],
      },
    ],
  },
  {
    id: "system",
    labelKey: "sections.system",
    items: [
      {
        kind: "collapsible",
        labelKey: "links.notifications",
        iconName: "Bell",
        permissionCode: "notification.read",
        children: [
          { href: "/notifications/campaign-templates", labelKey: "links.campaign_templates" },
          { href: "/notifications/campaigns", labelKey: "links.campaigns" },
          { href: "/notifications/queue", labelKey: "links.queue" },
        ],
      },
    ],
  },
];
