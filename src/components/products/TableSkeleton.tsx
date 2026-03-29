import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const WIDTHS = ["w-16", "w-20", "w-24"] as const;

export default function TableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className={`h-4 ${WIDTHS[index % WIDTHS.length]}`} />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton
              className={`h-4 ${WIDTHS[(index + 1) % WIDTHS.length]}`}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className={`h-4 ${WIDTHS[(index + 2) % WIDTHS.length]}`}
            />
          </TableCell>
          <TableCell>
            <Skeleton className={`h-4 ${WIDTHS[index % WIDTHS.length]}`} />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
