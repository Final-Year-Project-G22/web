"use client";

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

const fakeCategories = [
  { id: "cat-1", name: "Legal & Compliance", slug: "legal-compliance", active: true },
  { id: "cat-2", name: "Tax", slug: "tax", active: true },
  { id: "cat-3", name: "Licensing", slug: "licensing", active: false },
];

export default function GuideCategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Guide Categories</CardTitle>
          <CardDescription>Manage categories used by the guide module</CardDescription>
          <CardAction>
            <Button>Create Category</Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fakeCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant={category.active ? "default" : "secondary"}>
                        {category.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        Edit
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
