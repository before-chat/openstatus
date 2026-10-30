"use client";

import type { RouterOutputs } from "@openstatus/api";
import { buildStatusPageUrl } from "@openstatus/utils";
import type { ColumnDef } from "@tanstack/react-table";

import { Link } from "@/components/common/link";
import { TableCellLink } from "@/components/data-table/table-cell-link";

import { TableCellEmpty } from "../table-cell-empty";
import { DataTableRowActions } from "./data-table-row-actions";

type StatusPage = RouterOutputs["page"]["list"][number];

export function getColumns(
  statusPageBaseUrl: string | null,
): ColumnDef<StatusPage>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return (
          <TableCellLink
            href={`/status-pages/${row.original.id}/status-reports`}
            value={row.getValue("title")}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        cellClassName: "max-w-[150px] min-w-max",
      },
    },
    {
      accessorKey: "icon",
      header: "Favicon",
      cell: ({ row }) => {
        const value = row.getValue("icon");
        if (!value || typeof value !== "string")
          return <TableCellEmpty>No favicon</TableCellEmpty>;
        return (
          <img
            src={`${value}`}
            alt={`Favicon for ${row.getValue("title")}`}
            className="bg-muted h-4 w-4 rounded border"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => {
        const domain = row.getValue("domain");
        const slug = row.getValue("slug");
        return (
          <TableCellLink
            href={buildStatusPageUrl({
              slug: String(slug),
              customDomain: typeof domain === "string" ? domain : null,
              baseUrl: statusPageBaseUrl,
            })}
            value={slug}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        cellClassName: "font-mono",
      },
    },
    {
      accessorKey: "domain",
      accessorFn: (row) => row.customDomain,
      header: "Domain",
      cell: ({ row }) => {
        const value = row.getValue("domain");
        if (typeof value !== "string")
          return <TableCellEmpty>No domain</TableCellEmpty>;
        return (
          <Link href={"#"} className="font-mono">
            {value}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} />,
      meta: {
        cellClassName: "w-8",
      },
    },
  ];
}
