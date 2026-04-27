"use client";

import * as React from "react";
import useSWR from "swr";
import { Search, RefreshCw, Pencil, Trash2, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { USERS_PAGE } from "@/lib/message";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatDate } from "@/lib/date-utils";
import type { UserWithAdmin, UserListResponse } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 20;

function usersFetcher(url: string): Promise<ApiResponse<UserListResponse>> {
  return fetch(url).then((r) => r.json());
}

function UsersTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-[140px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[70px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-[70px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-[120px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function UsersContent() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filter, setFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [editUser, setEditUser] = React.useState<UserWithAdmin | null>(null);
  const [editName, setEditName] = React.useState("");
  const [deleteUser, setDeleteUser] = React.useState<UserWithAdmin | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { user: currentUser, fetchUser, initialized } = useAuthStore();

  React.useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [initialized, fetchUser]);

  const params = new URLSearchParams();
  if (searchQuery.trim()) params.set("search", searchQuery.trim());
  if (filter !== "all") params.set("filter", filter);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const swrKey = `/api/users?${params.toString()}`;

  const { data, isLoading, mutate } = useSWR<ApiResponse<UserListResponse>>(
    swrKey,
    usersFetcher
  );

  const response = data?.success ? data.data : null;
  const users = response?.users ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const handleRefresh = React.useCallback(() => {
    mutate();
  }, [mutate]);

  const handleToggleAdmin = React.useCallback(
    async (user: UserWithAdmin) => {
      if (user.id === currentUser?.id && user.isAdmin) return;
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAdmin: !user.isAdmin }),
        });
        const json = await res.json();
        if (json.success) {
          mutate();
        } else {
          alert(json.error ?? USERS_PAGE.updateError);
        }
      } catch {
        alert(USERS_PAGE.updateError);
      }
    },
    [currentUser?.id, mutate]
  );

  const handleEditOpen = React.useCallback((user: UserWithAdmin) => {
    setEditUser(user);
    setEditName(user.name ?? "");
  }, []);

  const handleEditSubmit = React.useCallback(async () => {
    if (!editUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName || null }),
      });
      const json = await res.json();
      if (json.success) {
        mutate();
        setEditUser(null);
      } else {
        alert(json.error ?? USERS_PAGE.updateError);
      }
    } catch {
      alert(USERS_PAGE.updateError);
    } finally {
      setIsSubmitting(false);
    }
  }, [editUser, editName, mutate]);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        mutate();
        setDeleteUser(null);
      } else {
        alert(json.error ?? USERS_PAGE.deleteError);
      }
    } catch {
      alert(USERS_PAGE.deleteError);
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteUser, mutate]);

  const paginationRangeText = USERS_PAGE.paginationRange
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));

  const searchInputId = "users-search";

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 min-h-0">
      {/* Header: search + filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Label htmlFor={searchInputId} className="sr-only">
            {USERS_PAGE.searchAriaLabel}
          </Label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            id={searchInputId}
            type="search"
            autoComplete="off"
            placeholder={USERS_PAGE.searchPlaceholder}
            value={searchQuery}
            onChange={(e) =>
              React.startTransition(() => setSearchQuery(e.target.value))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") setPage(1);
            }}
            className="pl-9 w-full"
            aria-label={USERS_PAGE.searchAriaLabel}
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={USERS_PAGE.filterLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{USERS_PAGE.filterAll}</SelectItem>
            <SelectItem value="admin">{USERS_PAGE.filterAdmin}</SelectItem>
            <SelectItem value="user">{USERS_PAGE.filterUser}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label={USERS_PAGE.buttonRefreshAria}
        >
          <RefreshCw
            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden
          />
        </Button>
      </div>

      {/* Main: table */}
      <section
        className="flex-1 min-w-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden [&_th]:p-4 [&_td]:p-4"
        aria-label={USERS_PAGE.tableCaption}
      >
        {isLoading ? (
          <Table>
            <TableCaption className="sr-only">
              {USERS_PAGE.tableCaption}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{USERS_PAGE.columnName}</TableHead>
                <TableHead>{USERS_PAGE.columnEmail}</TableHead>
                <TableHead>{USERS_PAGE.columnCreatedAt}</TableHead>
                <TableHead>{USERS_PAGE.columnVerified}</TableHead>
                <TableHead>{USERS_PAGE.columnAdmin}</TableHead>
                <TableHead className="text-right">{USERS_PAGE.columnActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <UsersTableSkeleton />
            </TableBody>
          </Table>
        ) : users.length === 0 ? (
          <div className="py-12 text-center px-4">
            <User
              className="mx-auto size-12 text-muted-foreground/50 mb-4"
              aria-hidden
            />
            <p className="text-muted-foreground font-medium">
              {USERS_PAGE.emptyUsers}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery.trim() || filter !== "all"
                ? USERS_PAGE.emptyHint
                : ""}
            </p>
          </div>
        ) : (
          <Table>
            <TableCaption className="sr-only">
              {USERS_PAGE.tableCaption}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{USERS_PAGE.columnName}</TableHead>
                <TableHead scope="col">{USERS_PAGE.columnEmail}</TableHead>
                <TableHead scope="col">{USERS_PAGE.columnCreatedAt}</TableHead>
                <TableHead scope="col">{USERS_PAGE.columnVerified}</TableHead>
                <TableHead scope="col">{USERS_PAGE.columnAdmin}</TableHead>
                <TableHead scope="col" className="text-right">
                  {USERS_PAGE.columnActions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="truncate max-w-[140px]">
                        {user.name ?? "未設定姓名"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600 dark:text-green-400"
                      >
                        {USERS_PAGE.verified}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      >
                        {USERS_PAGE.unverified}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.isAdmin ? (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          <Shield className="size-3 mr-1" />
                          {USERS_PAGE.adminBadge}
                        </Badge>
                      ) : null}
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={() => handleToggleAdmin(user)}
                        disabled={
                          user.id === currentUser?.id && user.isAdmin
                        }
                        aria-label={USERS_PAGE.toggleAdminAria.replace(
                          "{name}",
                          user.name ?? user.email
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditOpen(user)}
                        aria-label={`${USERS_PAGE.buttonEdit} ${user.name ?? user.email}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {user.id !== currentUser?.id ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(user)}
                          aria-label={`${USERS_PAGE.buttonDelete} ${user.name ?? user.email}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Pagination */}
      {total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {paginationRangeText}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text={USERS_PAGE.paginationPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-full"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text={USERS_PAGE.paginationNext}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="w-full"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{USERS_PAGE.editDialogTitle}</DialogTitle>
            <DialogDescription>
              {USERS_PAGE.editDialogDescription}
            </DialogDescription>
          </DialogHeader>
          {editUser ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{USERS_PAGE.editLabelName}</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={USERS_PAGE.editPlaceholderName}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email: {editUser.email}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={isSubmitting}
            >
              {USERS_PAGE.buttonCancel}
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? "…" : USERS_PAGE.buttonSave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {USERS_PAGE.deleteConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {USERS_PAGE.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {USERS_PAGE.deleteConfirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "…" : USERS_PAGE.deleteConfirmConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
