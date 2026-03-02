"use client";

import * as React from "react";
import { useTransition, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROJECT_DETAIL_PAGE,
  CREATE_PROJECT_PAGE,
  PROJECTS_PAGE,
} from "@/lib/message";
import { getSpaceNameById, ALL_SPACES } from "@/lib/config/config";
import {
  PROJECT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusColorClass,
} from "@/lib/config/project-status";
import type {
  ProjectWithRentals,
  UpdateProjectInput,
  ProjectStatus,
} from "@/lib/types/project";
import { updateProject, deleteProject, updateProjectStatus, deleteRental, updateRental } from "./actions";
import { cn } from "@/lib/utils";

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-TW", { dateStyle: "short" });

function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "yyyy/MM/dd HH:mm", { locale: zhTW });
}

function escapeCsvCell(value: string): string {
  const s = String(value);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildProjectDetailCsv(
  project: ProjectWithRentals,
  collaPlayContactDisplayName: string,
): string {
  const rows: string[] = [];

  // Section 1: 專案／客戶摘要（欄位名, 值）
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCustomerName, project.customerName]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelPhone, project.customerPhone]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.company) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelCompany, project.company]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.taxId) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTaxId, project.taxId]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [PROJECT_DETAIL_PAGE.labelEventOrVenueUse, project.eventOrVenueUse]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.totalAttendees != null) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTotalAttendees, String(project.totalAttendees)]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.tables) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelTables, project.tables]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.chairs != null) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelChairs, String(project.chairs)]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.fnbItems) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelFnb, project.fnbItems]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  if (project.projectNotes) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelProjectNotes, project.projectNotes]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCollaPlayContact, collaPlayContactDisplayName]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelStatus, getStatusLabel(project.status)]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelCreatedAt, formatDateTime(project.createdAt)]
      .map(escapeCsvCell)
      .join(","),
  );
  rows.push(
    [PROJECT_DETAIL_PAGE.labelUpdatedAt, formatDateTime(project.updatedAt)]
      .map(escapeCsvCell)
      .join(","),
  );
  if (project.internalNotes) {
    rows.push(
      [PROJECT_DETAIL_PAGE.labelInternalNotes, project.internalNotes]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  rows.push(""); // 空行分隔

  // Section 2: 租借項目表
  const rentalHeaders = [
    PROJECT_DETAIL_PAGE.labelDate,
    PROJECT_DETAIL_PAGE.labelTimeRange,
    PROJECT_DETAIL_PAGE.labelSpaces,
    PROJECT_DETAIL_PAGE.labelRentalAmount,
    PROJECT_DETAIL_PAGE.labelFnbAmount,
    PROJECT_DETAIL_PAGE.labelPaidAmount,
    PROJECT_DETAIL_PAGE.labelPendingAmount,
  ];
  rows.push(rentalHeaders.map(escapeCsvCell).join(","));

  const totalAmount = project.rentals.reduce(
    (sum, r) => sum + r.rentalAmount + r.fnbAmount,
    0,
  );
  for (const r of project.rentals) {
    const dateStr = DATE_FORMATTER.format(new Date(r.date + "T00:00:00"));
    const timeRange = `${r.startTime} – ${r.endTime}`;
    const spaces = r.spaceIds.map((id) => getSpaceNameById(id)).join("、");
    rows.push(
      [
        dateStr,
        timeRange,
        spaces,
        CURRENCY_FORMATTER.format(r.rentalAmount),
        CURRENCY_FORMATTER.format(r.fnbAmount),
        CURRENCY_FORMATTER.format(r.paidAmount),
        CURRENCY_FORMATTER.format(r.pendingAmount),
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  rows.push(
    [
      "",
      "",
      PROJECT_DETAIL_PAGE.totalAmount,
      CURRENCY_FORMATTER.format(totalAmount),
      "",
      "",
      "",
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  const csvContent = rows.join("\r\n");
  return "\uFEFF" + csvContent;
}

// Form schema (aligned with create form)
const rentalItemSchema = z
  .object({
    spaceIds: z.array(z.string()).min(1, CREATE_PROJECT_PAGE.errorRequired),
    date: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    startTime: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    endTime: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    setupMinutesBefore: z.number().min(0).optional(),
    teardownMinutesAfter: z.number().min(0).optional(),
    rentalAmount: z.coerce.number().min(0),
    fnbAmount: z.coerce.number().min(0),
    paidAmount: z.coerce.number().min(0),
    pendingAmount: z.coerce.number().min(0),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: CREATE_PROJECT_PAGE.errorEndBeforeStart,
    path: ["endTime"],
  });

const editProjectSchema = z.object({
  customerName: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
  customerPhone: z
    .string()
    .min(1, CREATE_PROJECT_PAGE.errorRequired)
    .regex(/^[\d\s\-]+$/, CREATE_PROJECT_PAGE.errorPhoneInvalid),
  company: z.string().optional(),
  taxId: z.string().optional(),
  eventOrVenueUse: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
  totalAttendees: z.coerce.number().min(0).optional(),
  tables: z.string().optional(),
  chairs: z.coerce.number().min(0).optional(),
  fnbItems: z.string().optional(),
  projectNotes: z.string().optional(),
  collaPlayContactId: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
  internalNotes: z.string().optional(),
  status: z
    .enum([
      "negotiating",
      "confirmed",
      "deposit_paid",
      "completed",
      "cancelled",
    ])
    .optional(),
  rentals: z.array(rentalItemSchema).min(1, CREATE_PROJECT_PAGE.errorRequired),
});

type EditFormValues = z.infer<typeof editProjectSchema>;

type EditRentalFormValues = z.infer<typeof rentalItemSchema>;

function rentalToEditFormValues(
  r: ProjectWithRentals["rentals"][0],
): EditRentalFormValues {
  return {
    spaceIds: r.spaceIds,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    setupMinutesBefore: r.setupMinutesBefore ?? 30,
    teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
    rentalAmount: r.rentalAmount,
    fnbAmount: r.fnbAmount,
    paidAmount: r.paidAmount,
    pendingAmount: r.pendingAmount,
  };
}

const defaultRental: EditFormValues["rentals"][0] = {
  spaceIds: [],
  date: "",
  startTime: "",
  endTime: "",
  setupMinutesBefore: 30,
  teardownMinutesAfter: 30,
  rentalAmount: 0,
  fnbAmount: 0,
  paidAmount: 0,
  pendingAmount: 0,
};

function projectToFormValues(project: ProjectWithRentals): EditFormValues {
  return {
    customerName: project.customerName,
    customerPhone: project.customerPhone,
    company: project.company ?? "",
    taxId: project.taxId ?? "",
    eventOrVenueUse: project.eventOrVenueUse,
    totalAttendees: project.totalAttendees ?? undefined,
    tables: project.tables ?? "",
    chairs: project.chairs ?? undefined,
    fnbItems: project.fnbItems ?? "",
    projectNotes: project.projectNotes ?? "",
    collaPlayContactId: project.collaPlayContactId,
    internalNotes: project.internalNotes ?? "",
    status: project.status as ProjectStatus,
    rentals:
      project.rentals.length > 0
        ? project.rentals.map((r) => ({
            spaceIds: r.spaceIds,
            date: r.date,
            startTime: r.startTime,
            endTime: r.endTime,
            setupMinutesBefore: r.setupMinutesBefore ?? 30,
            teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
            rentalAmount: r.rentalAmount,
            fnbAmount: r.fnbAmount,
            paidAmount: r.paidAmount,
            pendingAmount: r.pendingAmount,
          }))
        : [{ ...defaultRental }],
  };
}

function formValuesToUpdateInput(values: EditFormValues): UpdateProjectInput {
  return {
    customerName: values.customerName,
    customerPhone: values.customerPhone,
    company: values.company || undefined,
    taxId: values.taxId || undefined,
    eventOrVenueUse: values.eventOrVenueUse,
    totalAttendees: values.totalAttendees,
    tables: values.tables || undefined,
    chairs: values.chairs,
    fnbItems: values.fnbItems || undefined,
    projectNotes: values.projectNotes || undefined,
    collaPlayContactId: values.collaPlayContactId,
    internalNotes: values.internalNotes || undefined,
    status: values.status,
    rentals: values.rentals.map((r) => ({
      ...r,
      setupMinutesBefore: r.setupMinutesBefore ?? 30,
      teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
    })),
  };
}

interface EditRentalFormDialogProps {
  rental: ProjectWithRentals["rentals"][0];
  onClose: () => void;
  onSuccess: () => void;
}

function EditRentalFormDialog({
  rental,
  onClose,
  onSuccess,
}: EditRentalFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EditRentalFormValues>({
    resolver: zodResolver(rentalItemSchema) as Resolver<EditRentalFormValues>,
    defaultValues: rentalToEditFormValues(rental),
  });

  const handleSubmit = form.handleSubmit((data: EditRentalFormValues) => {
    startTransition(async () => {
      const result = await updateRental(rental.id, {
        ...data,
        setupMinutesBefore: data.setupMinutesBefore ?? 30,
        teardownMinutesAfter: data.teardownMinutesAfter ?? 30,
      });
      if (result.success) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{PROJECT_DETAIL_PAGE.editRentalTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="spaceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_PROJECT_PAGE.labelSpacesRequired}</FormLabel>
                  <FormControl>
                    <fieldset className="flex flex-wrap gap-3 rounded-md border border-input bg-background px-3 py-2">
                      {ALL_SPACES.map((space) => {
                        const checked = field.value.includes(space.id);
                        return (
                          <label
                            key={space.id}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? field.value.filter((id) => id !== space.id)
                                  : [...field.value, space.id];
                                field.onChange(next);
                              }}
                              className="rounded border-input"
                            />
                            <span>{space.name}</span>
                          </label>
                        );
                      })}
                    </fieldset>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelDateRequired}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {field.value
                              ? format(
                                  new Date(field.value + "T00:00:00"),
                                  "yyyy / MM / dd",
                                  { locale: zhTW },
                                )
                              : CREATE_PROJECT_PAGE.dateFormat}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? new Date(field.value + "T00:00:00")
                              : undefined
                          }
                          onSelect={(d) =>
                            field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                          }
                          locale={zhTW}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelStartTimeRequired}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="time" step={900} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelEndTimeRequired}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="time" step={900} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="rentalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelRentalAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fnbAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelFnbAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelPaidAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pendingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelPendingAmount}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.root?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {PROJECT_DETAIL_PAGE.buttonCancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {CREATE_PROJECT_PAGE.submitting}
                  </>
                ) : (
                  PROJECT_DETAIL_PAGE.buttonSave
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface AddRentalFormDialogProps {
  project: ProjectWithRentals;
  onClose: () => void;
  onSuccess: () => void;
}

function AddRentalFormDialog({
  project,
  onClose,
  onSuccess,
}: AddRentalFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EditRentalFormValues>({
    resolver: zodResolver(rentalItemSchema) as Resolver<EditRentalFormValues>,
    defaultValues: {
      ...defaultRental,
      spaceIds: [],
      date: "",
      startTime: "",
      endTime: "",
    },
  });

  const handleSubmit = form.handleSubmit((data: EditRentalFormValues) => {
    startTransition(async () => {
      const baseValues = projectToFormValues(project);
      const newRentals = [
        ...project.rentals.map((r) => rentalToEditFormValues(r)),
        {
          ...data,
          setupMinutesBefore: data.setupMinutesBefore ?? 30,
          teardownMinutesAfter: data.teardownMinutesAfter ?? 30,
        },
      ];
      const payload = formValuesToUpdateInput({
        ...baseValues,
        rentals: newRentals,
      });
      const result = await updateProject(project.id, payload);
      if (result.success) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{PROJECT_DETAIL_PAGE.addRentalDialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="spaceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_PROJECT_PAGE.labelSpacesRequired}</FormLabel>
                  <FormControl>
                    <fieldset className="flex flex-wrap gap-3 rounded-md border border-input bg-background px-3 py-2">
                      {ALL_SPACES.map((space) => {
                        const checked = field.value.includes(space.id);
                        return (
                          <label
                            key={space.id}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? field.value.filter((id) => id !== space.id)
                                  : [...field.value, space.id];
                                field.onChange(next);
                              }}
                              className="rounded border-input"
                            />
                            <span>{space.name}</span>
                          </label>
                        );
                      })}
                    </fieldset>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelDateRequired}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {field.value
                              ? format(
                                  new Date(field.value + "T00:00:00"),
                                  "yyyy / MM / dd",
                                  { locale: zhTW },
                                )
                              : CREATE_PROJECT_PAGE.dateFormat}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? new Date(field.value + "T00:00:00")
                              : undefined
                          }
                          onSelect={(d) =>
                            field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                          }
                          locale={zhTW}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelStartTimeRequired}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="time" step={900} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelEndTimeRequired}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="time" step={900} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="rentalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelRentalAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fnbAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelFnbAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelPaidAmount}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pendingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelPendingAmount}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.root?.message ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {PROJECT_DETAIL_PAGE.buttonCancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {CREATE_PROJECT_PAGE.submitting}
                  </>
                ) : (
                  PROJECT_DETAIL_PAGE.buttonSave
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectDetailContentProps {
  project: ProjectWithRentals;
  adminOptions: { id: string; name: string }[];
}

export function ProjectDetailContent({
  project,
  adminOptions,
}: ProjectDetailContentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isPendingUpdate, startUpdateTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [deletingRentalId, setDeletingRentalId] = useState<string | null>(null);
  const [deleteRentalError, setDeleteRentalError] = useState<string | null>(null);
  const [isAddRentalOpen, setIsAddRentalOpen] = useState(false);
  const [isPendingDeleteRental, startDeleteRentalTransition] = useTransition();

  const totalAmount = project.rentals.reduce(
    (sum, r) => sum + r.rentalAmount + r.fnbAmount,
    0,
  );

  const collaPlayContactName =
    adminOptions.find((o) => o.id === project.collaPlayContactId)?.name ??
    project.collaPlayContactId;

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editProjectSchema) as Resolver<EditFormValues>,
    defaultValues: projectToFormValues(project),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rentals",
  });

  const handleEdit = useCallback(() => {
    form.reset(projectToFormValues(project));
    setIsEditing(true);
  }, [project, form]);

  const handleSubmit = form.handleSubmit((data: EditFormValues) => {
    const payload = formValuesToUpdateInput(data);
    startUpdateTransition(async () => {
      const result = await updateProject(project.id, payload);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    });
  });

  const handleDeleteConfirm = useCallback(() => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.success) {
        setDeleteError(result.error);
      }
    });
  }, [project.id]);

  const handleDownloadCsv = useCallback(() => {
    startDownloadTransition(async () => {
      const csv = buildProjectDetailCsv(project, collaPlayContactName);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const safeName = (project.eventOrVenueUse || project.id)
        .replace(/[/\\:*?"<>|]/g, "_")
        .slice(0, 80);
      const dateStr = format(new Date(), "yyyyMMdd", { locale: zhTW });
      const filename = `專案詳情-${safeName}-${dateStr}.csv`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [project]);

  const handleStatusChange = useCallback(
    (newStatus: ProjectStatus) => {
      startStatusTransition(async () => {
        const result = await updateProjectStatus(project.id, newStatus);
        if (result.success) {
          router.refresh();
        }
      });
    },
    [project.id, router],
  );

  const editingRental = editingRentalId
    ? project.rentals.find((r) => r.id === editingRentalId)
    : undefined;

  if (isEditing) {
    return (
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {PROJECT_DETAIL_PAGE.sectionCustomer}
              </h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelCustomerNameRequired}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          CREATE_PROJECT_PAGE.placeholderCustomerName
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelPhoneRequired}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder={CREATE_PROJECT_PAGE.placeholderPhone}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelCompany}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelTaxId}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {PROJECT_DETAIL_PAGE.sectionProject}
              </h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="eventOrVenueUse"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelEventOrVenueUseRequired}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          CREATE_PROJECT_PAGE.placeholderEventOrVenueUse
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelTotalAttendees}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelTables}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chairs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{CREATE_PROJECT_PAGE.labelChairs}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fnbItems"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{CREATE_PROJECT_PAGE.labelFnb}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} className="resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectNotes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelProjectNotes}
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} className="resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collaPlayContactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelCollaPlayContactRequired}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              CREATE_PROJECT_PAGE.placeholderSelectContact
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adminOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{PROJECT_DETAIL_PAGE.labelStatus}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {PROJECTS_PAGE[opt.labelKey]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {PROJECT_DETAIL_PAGE.sectionNotes}
              </h2>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelInternalNotes}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        className="resize-none"
                        placeholder={
                          CREATE_PROJECT_PAGE.placeholderInternalNotes
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {CREATE_PROJECT_PAGE.sectionRentals}
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium tabular-nums">
                      第 {index + 1} 筆
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      aria-label={CREATE_PROJECT_PAGE.removeRentalAria}
                    >
                      <Trash2 className="size-4" />
                      {CREATE_PROJECT_PAGE.removeRental}
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`rentals.${index}.spaceIds`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {CREATE_PROJECT_PAGE.labelSpacesRequired}
                        </FormLabel>
                        <FormControl>
                          <fieldset className="flex flex-wrap gap-3 rounded-md border border-input bg-background px-3 py-2">
                            {ALL_SPACES.map((space) => {
                              const checked = field.value.includes(space.id);
                              return (
                                <label
                                  key={space.id}
                                  className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked
                                        ? field.value.filter(
                                            (id) => id !== space.id,
                                          )
                                        : [...field.value, space.id];
                                      field.onChange(next);
                                    }}
                                    className="rounded border-input"
                                  />
                                  <span>{space.name}</span>
                                </label>
                              );
                            })}
                          </fieldset>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelDateRequired}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                  type="button"
                                >
                                  <CalendarIcon className="mr-2 size-4" />
                                  {field.value
                                    ? format(
                                        new Date(field.value + "T00:00:00"),
                                        "yyyy / MM / dd",
                                        { locale: zhTW },
                                      )
                                    : CREATE_PROJECT_PAGE.dateFormat}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value + "T00:00:00")
                                    : undefined
                                }
                                onSelect={(d) =>
                                  field.onChange(
                                    d ? format(d, "yyyy-MM-dd") : "",
                                  )
                                }
                                locale={zhTW}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelStartTimeRequired}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="time" step={900} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelEndTimeRequired}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="time" step={900} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.rentalAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelRentalAmount}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              className="tabular-nums"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.fnbAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelFnbAmount}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              className="tabular-nums"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.paidAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelPaidAmount}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              className="tabular-nums"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.pendingAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelPendingAmount}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              className="tabular-nums"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ ...defaultRental })}
                className="w-fit gap-2"
              >
                <Plus className="size-4" />
                {CREATE_PROJECT_PAGE.addRental}
              </Button>
            </CardContent>
          </Card>

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isPendingUpdate}
            >
              {PROJECT_DETAIL_PAGE.buttonCancel}
            </Button>
            <Button type="submit" disabled={isPendingUpdate}>
              {isPendingUpdate ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {CREATE_PROJECT_PAGE.submitting}
                </>
              ) : (
                PROJECT_DETAIL_PAGE.buttonSave
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {editingRental ? (
        <EditRentalFormDialog
          key={editingRental.id}
          rental={editingRental}
          onClose={() => setEditingRentalId(null)}
          onSuccess={() => {
            setEditingRentalId(null);
            router.refresh();
          }}
        />
      ) : null}
      {isAddRentalOpen ? (
        <AddRentalFormDialog
          project={project}
          onClose={() => setIsAddRentalOpen(false)}
          onSuccess={() => {
            setIsAddRentalOpen(false);
            router.refresh();
          }}
        />
      ) : null}
      {deleteError ? (
        <p
          className="text-sm text-destructive rounded-md bg-destructive/10 p-3"
          role="alert"
        >
          {PROJECT_DETAIL_PAGE.deleteError}: {deleteError}
        </p>
      ) : null}
      {deleteRentalError ? (
        <p
          className="text-sm text-destructive rounded-md bg-destructive/10 p-3"
          role="alert"
        >
          {PROJECT_DETAIL_PAGE.deleteRentalError}: {deleteRentalError}
        </p>
      ) : null}
      <div className="flex justify-between">
        {/* Status Selector */}
        <div className="flex items-center gap-2">
          <Select
            value={project.status}
            onValueChange={(v) => handleStatusChange(v as ProjectStatus)}
            disabled={isPendingStatus}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span
                    className={cn(
                      "mr-2 inline-block size-2 rounded-full",
                      opt.colorClass,
                    )}
                    aria-hidden
                  />
                  {PROJECTS_PAGE[opt.labelKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPendingStatus ? (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
        {/* Header Buttons */}
        <div className="flex flex-wrap justify-end gap-2">
          {/* Edit Button */}
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleEdit}
          >
            <Pencil className="size-4" />
            <span className="hidden md:block">
              {PROJECT_DETAIL_PAGE.buttonEdit}
            </span>
          </Button>
          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={isPendingDelete}
              >
                {isPendingDelete ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                <span className="hidden md:block">
                  {PROJECT_DETAIL_PAGE.buttonDelete}
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {PROJECT_DETAIL_PAGE.deleteConfirmTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {PROJECT_DETAIL_PAGE.deleteConfirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {PROJECT_DETAIL_PAGE.deleteConfirmCancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={isPendingDelete}
                >
                  {isPendingDelete ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {PROJECT_DETAIL_PAGE.deleteConfirmConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isPendingDownload}
            onClick={handleDownloadCsv}
          >
            {isPendingDownload ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span className="hidden md:block">
              {PROJECT_DETAIL_PAGE.buttonDownloadCsv}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {PROJECT_DETAIL_PAGE.sectionCustomer}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelCustomerName}
              </p>
              <p className="font-medium">{project.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelPhone}
              </p>
              <p className="font-medium">{project.customerPhone}</p>
            </div>
            {project.company ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelCompany}
                </p>
                <p className="font-medium">{project.company}</p>
              </div>
            ) : null}
            {project.taxId ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelTaxId}
                </p>
                <p className="font-medium">{project.taxId}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Project Information Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {PROJECT_DETAIL_PAGE.sectionProject}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelEventOrVenueUse}
              </p>
              <p className="font-medium">{project.eventOrVenueUse}</p>
            </div>
            {project.totalAttendees != null ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelTotalAttendees}
                </p>
                <p className="font-medium">{project.totalAttendees}</p>
              </div>
            ) : null}
            {project.tables ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelTables}
                </p>
                <p className="font-medium">{project.tables}</p>
              </div>
            ) : null}
            {project.chairs != null ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelChairs}
                </p>
                <p className="font-medium">{project.chairs}</p>
              </div>
            ) : null}
            {project.fnbItems ? (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelFnb}
                </p>
                <p className="font-medium whitespace-pre-wrap">
                  {project.fnbItems}
                </p>
              </div>
            ) : null}
            {project.projectNotes ? (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {PROJECT_DETAIL_PAGE.labelProjectNotes}
                </p>
                <p className="font-medium whitespace-pre-wrap">
                  {project.projectNotes}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelCollaPlayContact}
              </p>
              <p className="font-medium">{collaPlayContactName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelStatus}
              </p>
              <p className="font-medium flex items-center gap-2">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    getStatusColorClass(project.status),
                  )}
                  aria-hidden
                />
                {getStatusLabel(project.status)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelCreatedAt}
              </p>
              <p className="font-medium tabular-nums">
                {formatDateTime(project.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelUpdatedAt}
              </p>
              <p className="font-medium tabular-nums">
                {formatDateTime(project.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        {project.internalNotes ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {PROJECT_DETAIL_PAGE.sectionNotes}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {PROJECT_DETAIL_PAGE.labelInternalNotes}
              </p>
              <p className="font-medium whitespace-pre-wrap">
                {project.internalNotes}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Rentals Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {PROJECT_DETAIL_PAGE.sectionRentals}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {PROJECT_DETAIL_PAGE.totalAmount}:{" "}
              {CURRENCY_FORMATTER.format(totalAmount)}
            </p>
          </CardHeader>
          <CardContent>
            {project.rentals.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-muted-foreground text-sm">尚無租借項目</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsAddRentalOpen(true)}
                  aria-label={PROJECT_DETAIL_PAGE.addRentalLabel}
                >
                  <Plus className="size-4" />
                  {PROJECT_DETAIL_PAGE.addRentalLabel}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{PROJECT_DETAIL_PAGE.labelDate}</TableHead>
                    <TableHead>{PROJECT_DETAIL_PAGE.labelTimeRange}</TableHead>
                    <TableHead>{PROJECT_DETAIL_PAGE.labelSpaces}</TableHead>
                    <TableHead className="text-right tabular-nums">
                      {PROJECT_DETAIL_PAGE.labelRentalAmount}
                    </TableHead>
                    <TableHead className="text-right tabular-nums">
                      {PROJECT_DETAIL_PAGE.labelFnbAmount}
                    </TableHead>
                    <TableHead className="text-right tabular-nums">
                      {PROJECT_DETAIL_PAGE.labelPaidAmount}
                    </TableHead>
                    <TableHead className="text-right tabular-nums">
                      {PROJECT_DETAIL_PAGE.labelPendingAmount}
                    </TableHead>
                    <TableHead className="w-[100px]">
                      {PROJECT_DETAIL_PAGE.labelOperations}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.rentals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums">
                        {DATE_FORMATTER.format(new Date(r.date + "T00:00:00"))}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.startTime} – {r.endTime}
                      </TableCell>
                      <TableCell>
                        {r.spaceIds
                          .map((id) => getSpaceNameById(id))
                          .join("、")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {CURRENCY_FORMATTER.format(r.rentalAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {CURRENCY_FORMATTER.format(r.fnbAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {CURRENCY_FORMATTER.format(r.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {CURRENCY_FORMATTER.format(r.pendingAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={PROJECT_DETAIL_PAGE.editRentalTitle}
                            onClick={() => setEditingRentalId(r.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {project.rentals.length > 1 ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:text-destructive"
                                  aria-label={CREATE_PROJECT_PAGE.removeRentalAria}
                                  disabled={deletingRentalId === r.id || isPendingDeleteRental}
                                >
                                  {deletingRentalId === r.id || isPendingDeleteRental ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {PROJECT_DETAIL_PAGE.deleteRentalConfirmTitle}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {PROJECT_DETAIL_PAGE.deleteRentalConfirmDescription}
                                    {` （${DATE_FORMATTER.format(new Date(r.date + "T00:00:00"))} ${r.startTime}–${r.endTime}）`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {PROJECT_DETAIL_PAGE.deleteConfirmCancel}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setDeleteRentalError(null);
                                      setDeletingRentalId(r.id);
                                      startDeleteRentalTransition(async () => {
                                        const result = await deleteRental(r.id);
                                        setDeletingRentalId(null);
                                        if (result.success) {
                                          router.refresh();
                                        } else {
                                          setDeleteRentalError(result.error);
                                        }
                                      });
                                    }}
                                    disabled={isPendingDeleteRental}
                                  >
                                    {isPendingDeleteRental ? (
                                      <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        {PROJECT_DETAIL_PAGE.deleteConfirmConfirm}
                                      </>
                                    ) : (
                                      PROJECT_DETAIL_PAGE.deleteConfirmConfirm
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              disabled
                              aria-label="至少需保留一筆租借"
                              title="至少需保留一筆租借"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-12 border-t border-dashed bg-muted/20"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsAddRentalOpen(true)}
                        aria-label={PROJECT_DETAIL_PAGE.addRentalLabel}
                      >
                        <Plus className="size-4" />
                        {PROJECT_DETAIL_PAGE.addRentalLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
