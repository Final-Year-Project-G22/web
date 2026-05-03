"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fakeGuides = [
  {
    id: "guide-local-1",
    title: "How to Register a Sole Proprietorship",
    category: "Legal & Compliance",
    status: "Draft",
    updatedAt: "2m ago",
  },
  {
    id: "guide-local-2",
    title: "How to Apply for a TIN Certificate",
    category: "Tax",
    status: "Published",
    updatedAt: "1 day ago",
  },
];

export default function GuideListPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Guides</CardTitle>
          <CardDescription>Manage admin guides and their publishing state</CardDescription>
          <CardAction className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/guide/categories">Categories</Link>
            </Button>
            <Button asChild>
              <Link href="/guide/create">Create Guide</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fakeGuides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell className="font-medium">{guide.title}</TableCell>
                    <TableCell>{guide.category}</TableCell>
                    <TableCell>
                      <Badge variant={guide.status === "Published" ? "default" : "secondary"}>
                        {guide.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{guide.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/guide/${guide.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
