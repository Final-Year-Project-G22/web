// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   useCancelCampaign,
//   useGetCampaign,
//   useScheduleCampaign,
//   useUpdateCampaign,
// } from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { ConfirmDialog } from "@/components/ui/confirm-dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { getErrorMessage } from "@/lib/utils";

// function statusBadgeVariant(status: string) {
//   switch (status) {
//     case "draft":
//       return "secondary";
//     case "scheduled":
//       return "default";
//     case "sending":
//       return "outline";
//     case "completed":
//       return "default";
//     case "cancelled":
//       return "destructive";
//     default:
//       return "outline";
//   }
// }

// export default function CampaignDetailPage() {
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;

//   const campaignQuery = useGetCampaign(id);
//   const updateCampaign = useUpdateCampaign();
//   const scheduleMutation = useScheduleCampaign();
//   const cancelMutation = useCancelCampaign();

//   const [isEditing, setIsEditing] = useState(false);
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [scheduledFor, setScheduledFor] = useState("");

//   const campaign = campaignQuery.data;
//   const isDraft = campaign?.status === "draft";

//   useEffect(() => {
//     if (campaign) {
//       setName(campaign.name);
//       setDescription(campaign.description ?? "");
//       setScheduledFor(
//         campaign.scheduledFor
//           ? new Date(campaign.scheduledFor).toISOString().slice(0, 16)
//           : ""
//       );
//     }
//   }, [campaign]);

//   function handleSave(e: React.FormEvent) {
//     e.preventDefault();
//     updateCampaign.mutate(
//       {
//         id,
//         patch: {
//           name,
//           description: description || undefined,
//           scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
//         },
//       },
//       {
//         onSuccess: () => setIsEditing(false),
//       }
//     );
//   }

//   if (campaignQuery.isLoading) {
//     return (
//       <div className="mx-auto max-w-3xl space-y-6">
//         <p className="text-sm text-muted-foreground">Loading campaign&hellip;</p>
//       </div>
//     );
//   }

//   if (campaignQuery.isError || !campaign) {
//     return (
//       <div className="mx-auto max-w-3xl space-y-6">
//         <p className="text-sm text-destructive">
//           Failed to load: {getErrorMessage(campaignQuery.error)}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-3xl space-y-6">
//       <Card>
//         <CardHeader className="border-b">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>{campaign.name}</CardTitle>
//               <CardDescription>
//                 <Badge variant={statusBadgeVariant(campaign.status)} className="mt-1 capitalize">
//                   {campaign.status}
//                 </Badge>
//               </CardDescription>
//             </div>
//             <div className="flex items-center gap-2">
//               {isDraft && !isEditing && (
//                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
//                   Edit
//                 </Button>
//               )}
//               {campaign.status === "draft" && (
//                 <ConfirmDialog
//                   title="Schedule Campaign"
//                   description={`Schedule "${campaign.name}" for delivery?`}
//                   confirmLabel="Schedule"
//                   onConfirm={() => scheduleMutation.mutate(campaign.id)}
//                 >
//                   <Button size="sm">Schedule</Button>
//                 </ConfirmDialog>
//               )}
//               {(campaign.status === "scheduled" || campaign.status === "sending") && (
//                 <ConfirmDialog
//                   title="Cancel Campaign"
//                   description={`Cancel "${campaign.name}"? This cannot be undone.`}
//                   confirmLabel="Cancel"
//                   variant="destructive"
//                   onConfirm={() => cancelMutation.mutate(campaign.id)}
//                 >
//                   <Button size="sm" variant="destructive">
//                     Cancel
//                   </Button>
//                 </ConfirmDialog>
//               )}
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="pt-4">
//           {isEditing ? (
//             <form className="space-y-4" onSubmit={handleSave}>
//               <div className="space-y-2">
//                 <Label htmlFor="name">Name</Label>
//                 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Input
//                   id="description"
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="scheduledFor">Schedule For (optional)</Label>
//                 <Input
//                   id="scheduledFor"
//                   type="datetime-local"
//                   value={scheduledFor}
//                   onChange={(e) => setScheduledFor(e.target.value)}
//                 />
//               </div>

//               {updateCampaign.isError && (
//                 <p className="text-sm text-destructive">
//                   Failed to save: {getErrorMessage(updateCampaign.error)}
//                 </p>
//               )}

//               <div className="flex items-center justify-end gap-2">
//                 <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={updateCampaign.isPending}>
//                   {updateCampaign.isPending ? "Saving..." : "Save"}
//                 </Button>
//               </div>
//             </form>
//           ) : (
//             <dl className="space-y-3 text-sm">
//               <div>
//                 <dt className="text-muted-foreground">ID</dt>
//                 <dd className="font-mono">{campaign.id}</dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Description</dt>
//                 <dd>{campaign.description || "—"}</dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Type</dt>
//                 <dd className="capitalize">{campaign.campaignType}</dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Template ID</dt>
//                 <dd className="font-mono">{campaign.campaignTemplateId}</dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Created By</dt>
//                 <dd className="font-mono">{campaign.createdBy}</dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Created At</dt>
//                 <dd>
//                 {new Intl.DateTimeFormat("en-US", {
//                   month: "short",
//                   day: "numeric",
//                   year: "numeric",
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 }).format(new Date(campaign.createdAt))}
//               </dd>
//               </div>
//               <div>
//                 <dt className="text-muted-foreground">Scheduled For</dt>
//                 <dd>
//                   {campaign.scheduledFor
//                     ? new Intl.DateTimeFormat("en-US", {
//                         month: "short",
//                         day: "numeric",
//                         year: "numeric",
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       }).format(new Date(campaign.scheduledFor))
//                     : "—"}
//                 </dd>
//               </div>
//               {campaign.sentAt && (
//                 <div>
//                   <dt className="text-muted-foreground">Sent At</dt>
//                   <dd>
//                     {new Intl.DateTimeFormat("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       year: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     }).format(new Date(campaign.sentAt))}
//                   </dd>
//                 </div>
//               )}
//               {campaign.targetSegment && (
//                 <div>
//                   <dt className="text-muted-foreground">Target Segment</dt>
//                   <dd>
//                     <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
//                       {JSON.stringify(campaign.targetSegment, null, 2)}
//                     </pre>
//                   </dd>
//                 </div>
//               )}
//             </dl>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";

// import {
//   useCancelCampaign,
//   useGetCampaign,
//   useScheduleCampaign,
//   useUpdateCampaign,
// } from "@/app/[locale]/(modules)/notifications/_services/notification.hook";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// import { ConfirmDialog } from "@/components/ui/confirm-dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import { getErrorMessage } from "@/lib/utils";

// function statusBadgeVariant(status: string) {
//   switch (status) {
//     case "draft":
//       return "secondary";
//     case "scheduled":
//       return "default";
//     case "sending":
//       return "outline";
//     case "completed":
//       return "default";
//     case "cancelled":
//       return "destructive";
//     default:
//       return "outline";
//   }
// }

// export default function CampaignDetailPage() {
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;

//   const campaignQuery = useGetCampaign(id);
//   const updateCampaign = useUpdateCampaign();
//   const scheduleMutation = useScheduleCampaign();
//   const cancelMutation = useCancelCampaign();

//   const [isEditing, setIsEditing] = useState(false);

//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [scheduledFor, setScheduledFor] = useState("");

//   const campaign = campaignQuery.data;
//   const isDraft = campaign?.status === "draft";

//   useEffect(() => {
//     if (campaign) {
//       setName(campaign.name);
//       setDescription(campaign.description ?? "");
//       setScheduledFor(
//         campaign.scheduledFor
//           ? new Date(campaign.scheduledFor).toISOString().slice(0, 16)
//           : ""
//       );
//     }
//   }, [campaign]);

//   function handleSave(e: React.FormEvent) {
//     e.preventDefault();

//     updateCampaign.mutate(
//       {
//         id,
//         patch: {
//           name,
//           description: description || undefined,
//           scheduledFor: scheduledFor
//             ? new Date(scheduledFor).toISOString()
//             : undefined,
//         },
//       },
//       {
//         onSuccess: () => setIsEditing(false),
//       }
//     );
//   }

//   if (campaignQuery.isLoading) {
//     return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
//   }

//   if (campaignQuery.isError || !campaign) {
//     return (
//       <p className="p-6 text-sm text-destructive">
//         {getErrorMessage(campaignQuery.error)}
//       </p>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

//       {/* HEADER */}
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-semibold">{campaign.name}</h1>
//           <div className="mt-2 flex items-center gap-2">
//             <Badge variant={statusBadgeVariant(campaign.status)} className="capitalize">
//               {campaign.status}
//             </Badge>
//           </div>
//         </div>

//         <div className="flex gap-2">
//           {isDraft && !isEditing && (
//             <Button variant="outline" onClick={() => setIsEditing(true)}>
//               Edit
//             </Button>
//           )}

//           {campaign.status === "draft" && (
//             <ConfirmDialog
//               title="Schedule Campaign"
//               description={`Schedule "${campaign.name}"?`}
//               confirmLabel="Schedule"
//               onConfirm={() => scheduleMutation.mutate(campaign.id)}
//             >
//               <Button>Schedule</Button>
//             </ConfirmDialog>
//           )}

//           {(campaign.status === "scheduled" || campaign.status === "sending") && (
//             <ConfirmDialog
//               title="Cancel Campaign"
//               description={`Cancel "${campaign.name}"?`}
//               confirmLabel="Cancel"
//               variant="destructive"
//               onConfirm={() => cancelMutation.mutate(campaign.id)}
//             >
//               <Button variant="destructive">Cancel</Button>
//             </ConfirmDialog>
//           )}
//         </div>
//       </div>

//       {/* MAIN GRID */}
//       <div className="grid grid-cols-3 gap-6">

//         {/* MAIN CONTENT */}
//         <div className="col-span-2 space-y-6">

//           <Card className="rounded-2xl shadow-sm">
//             <CardHeader>
//               <CardTitle>Details</CardTitle>
//             </CardHeader>

//             <CardContent>
//               {isEditing ? (
//                 <motion.form
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   onSubmit={handleSave}
//                   className="space-y-6"
//                 >
//                   <div className="grid grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label>Name</Label>
//                       <Input
//                         className="h-11"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label>Schedule</Label>
//                       <Input
//                         className="h-11"
//                         type="datetime-local"
//                         value={scheduledFor}
//                         onChange={(e) => setScheduledFor(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label>Description</Label>
//                     <Input
//                       className="h-11"
//                       value={description}
//                       onChange={(e) => setDescription(e.target.value)}
//                     />
//                   </div>

//                   <div className="flex justify-end gap-2 pt-4">
//                     <Button variant="outline" onClick={() => setIsEditing(false)}>
//                       Cancel
//                     </Button>
//                     <Button type="submit">
//                       {updateCampaign.isPending ? "Saving..." : "Save"}
//                     </Button>
//                   </div>
//                 </motion.form>
//               ) : (
//                 <div className="grid grid-cols-2 gap-6 text-sm">
//                   <div>
//                     <p className="text-muted-foreground">Description</p>
//                     <p>{campaign.description || "—"}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Type</p>
//                     <p className="capitalize">{campaign.campaignType}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Created At</p>
//                     <p>{new Date(campaign.createdAt).toLocaleString()}</p>
//                   </div>

//                   <div>
//                     <p className="text-muted-foreground">Scheduled For</p>
//                     <p>
//                       {campaign.scheduledFor
//                         ? new Date(campaign.scheduledFor).toLocaleString()
//                         : "—"}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* SIDE PANEL */}
//         <div className="space-y-6">
//           <Card className="rounded-2xl shadow-sm">
//             <CardHeader>
//               <CardTitle>Meta</CardTitle>
//             </CardHeader>

//             <CardContent className="text-sm space-y-3">
//               <div>
//                 <p className="text-muted-foreground">Campaign ID</p>
//                 <p className="font-mono">{campaign.id}</p>
//               </div>

//               <div>
//                 <p className="text-muted-foreground">Template</p>
//                 <p className="font-mono">{campaign.campaignTemplateId}</p>
//               </div>

//               <div>
//                 <p className="text-muted-foreground">Created By</p>
//                 <p className="font-mono">{campaign.createdBy}</p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//       </div>
//     </div>
//   );
// }

"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useCancelCampaign,
  useGetCampaign,
  useScheduleCampaign,
  useUpdateCampaign,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getErrorMessage } from "@/lib/utils";

/* -----------------------------
   STATUS STYLE (FIXED UX)
------------------------------ */
function statusBadgeClass(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border border-gray-200";

    case "scheduled":
      return "bg-blue-50 text-blue-700 border border-blue-200";

    case "sending":
      return "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse";

    case "completed":
      return "bg-green-50 text-green-700 border border-green-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-200";

    default:
      return "bg-muted text-muted-foreground border";
  }
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const campaignQuery = useGetCampaign(id);
  const updateCampaign = useUpdateCampaign();
  const scheduleMutation = useScheduleCampaign();
  const cancelMutation = useCancelCampaign();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const campaign = campaignQuery.data;
  const isDraft = campaign?.status === "draft";

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description ?? "");
      setScheduledFor(
        campaign.scheduledFor ? new Date(campaign.scheduledFor).toISOString().slice(0, 16) : ""
      );
    }
  }, [campaign]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    updateCampaign.mutate(
      {
        id,
        patch: {
          name,
          description: description || undefined,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }

  if (campaignQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading campaign…</p>
      </div>
    );
  }

  if (campaignQuery.isError || !campaign) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-destructive">{getErrorMessage(campaignQuery.error)}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>

          <div className="mt-2">
            <Badge
              className={`capitalize text-xs px-2.5 py-1 ${statusBadgeClass(campaign.status)}`}
            >
              {campaign.status}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}

          {campaign.status === "draft" && (
            <ConfirmDialog
              title="Schedule Campaign"
              description={`Schedule "${campaign.name}"?`}
              confirmLabel="Schedule"
              onConfirm={() => scheduleMutation.mutate(campaign.id)}
            >
              <Button>Schedule</Button>
            </ConfirmDialog>
          )}

          {(campaign.status === "scheduled" || campaign.status === "sending") && (
            <ConfirmDialog
              title="Cancel Campaign"
              description={`Cancel "${campaign.name}"?`}
              confirmLabel="Cancel"
              variant="destructive"
              onConfirm={() => cancelMutation.mutate(campaign.id)}
            >
              <Button variant="destructive">Cancel</Button>
            </ConfirmDialog>
          )}
        </div>
      </div>

      {/* MAIN CARD */}
      <Card className="rounded-2xl shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSave}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Input
                    className="h-11"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  className="h-11"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>

                <Button type="submit" disabled={updateCampaign.isPending}>
                  {updateCampaign.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.form>
          ) : (
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Description</p>
                <p>{campaign.description || "—"}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="capitalize">{campaign.campaignType}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Template Name</p>
                <p className="font-mono">{campaign.campaignTemplate?.name}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-mono">{campaign.createdBy.name}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Created At</p>
                <p>{new Date(campaign.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Scheduled For</p>
                <p>
                  {campaign.scheduledFor ? new Date(campaign.scheduledFor).toLocaleString() : "—"}
                </p>
              </div>

              {campaign.sentAt && (
                <div>
                  <p className="text-muted-foreground">Sent At</p>
                  <p>{new Date(campaign.sentAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
