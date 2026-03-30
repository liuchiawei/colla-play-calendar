"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { CREATE_PROJECT_PAGE } from "@/lib/message";
import { ALL_SPACES } from "@/lib/config/config";
import type { CreateProjectInput } from "@/lib/types/project";
import { cn } from "@/lib/utils";
import { computeProjectRentalPendingAmount } from "@/lib/utils/project-rental-pending";
import {
  PROJECT_ACTIVITY_CUSTOM_SENTINEL,
  PROJECT_ACTIVITY_TYPE_OPTIONS,
  PROJECT_ACTIVITY_TYPE_OTHER,
  isActivityTypePresetFieldValue,
  resolveEventOrVenueUseFromForm,
} from "@/lib/constants/project-form";
import { defaultEquipmentNeedsForm } from "@/lib/utils/project-equipment-needs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  intervalsOverlap,
  isValidRentalTimeWindow,
  rentalBoundsMs,
  spaceIdsIntersect,
} from "@/lib/utils/project-rental-interval";

const SHOW_SETUP_TEARDOWN_FIELDS = false;

const rentalItemSchema = z
  .object({
    spaceIds: z.array(z.string()).min(1, CREATE_PROJECT_PAGE.errorRequired),
    date: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    endDate: z.string().optional().default(""),
    startTime: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    endTime: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    setupMinutesBefore: z.number().min(0).optional(),
    teardownMinutesAfter: z.number().min(0).optional(),
    rentalAmount: z.coerce.number().min(0),
    fnbAmount: z.coerce.number().min(0),
    paidAmount: z.coerce.number().min(0),
  })
  .refine(
    (data) =>
      isValidRentalTimeWindow({
        date: data.date,
        endDate: data.endDate?.trim() || null,
        startTime: data.startTime,
        endTime: data.endTime,
      }),
    {
      message: CREATE_PROJECT_PAGE.errorInvalidRentalWindow,
      path: ["endTime"],
    },
  );

const equipmentNeedsFormSchema = z.object({
  microphone: z.boolean(),
  extensionCord: z.boolean(),
  projector: z.boolean(),
  whiteboard: z.boolean(),
});

const createProjectSchema = z
  .object({
    customerName: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    customerPhone: z
      .string()
      .optional()
      .refine((val) => !val || /^[\d\s\-]+$/.test(val), {
        message: CREATE_PROJECT_PAGE.errorPhoneInvalid,
      }),
    company: z.string().optional(),
    taxId: z.string().optional(),
    activityTypePreset: z
      .string()
      .min(1, CREATE_PROJECT_PAGE.errorActivityTypeRequired)
      .refine((s) => isActivityTypePresetFieldValue(s), {
        message: CREATE_PROJECT_PAGE.errorActivityTypeRequired,
      }),
    activityCustomDetail: z.string().optional().default(""),
    totalAttendees: z.coerce.number().min(0).optional(),
    tables: z.string().optional(),
    chairs: z.coerce.number().min(0).optional(),
    equipmentNeeds: equipmentNeedsFormSchema.default(() =>
      defaultEquipmentNeedsForm(),
    ),
    fnbItems: z.string().optional(),
    projectNotes: z.string().optional(),
    collaPlayContactId: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    internalNotes: z.string().optional(),
    rentals: z
      .array(rentalItemSchema)
      .min(1, CREATE_PROJECT_PAGE.errorRequired),
  })
  .superRefine((data, ctx) => {
    const needsCustom =
      data.activityTypePreset === PROJECT_ACTIVITY_CUSTOM_SENTINEL ||
      data.activityTypePreset === PROJECT_ACTIVITY_TYPE_OTHER;
    if (needsCustom && !data.activityCustomDetail.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: CREATE_PROJECT_PAGE.errorActivityTypeOtherRequired,
        path: ["activityCustomDetail"],
      });
    }
    const rentals = data.rentals;
    for (let i = 0; i < rentals.length; i++) {
      const a = rentals[i];
      const boundsA = rentalBoundsMs({
        date: a.date,
        endDate: a.endDate?.trim() || null,
        startTime: a.startTime,
        endTime: a.endTime,
      });
      if (!boundsA) continue;
      for (let j = i + 1; j < rentals.length; j++) {
        const b = rentals[j];
        if (!spaceIdsIntersect(a.spaceIds, b.spaceIds)) continue;
        const boundsB = rentalBoundsMs({
          date: b.date,
          endDate: b.endDate?.trim() || null,
          startTime: b.startTime,
          endTime: b.endTime,
        });
        if (!boundsB) continue;
        if (intervalsOverlap(boundsA, boundsB)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: CREATE_PROJECT_PAGE.errorRentalOverlapInternal,
            path: ["rentals", i, "spaceIds"],
          });
          return;
        }
      }
    }
  });

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const defaultRental: CreateProjectFormValues["rentals"][0] = {
  spaceIds: [],
  date: "",
  endDate: "",
  startTime: "",
  endTime: "",
  setupMinutesBefore: 0,
  teardownMinutesAfter: 0,
  rentalAmount: 0,
  fnbAmount: 0,
  paidAmount: 0,
};

export function CreateProjectForm({
  adminOptions,
}: {
  adminOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(
      createProjectSchema,
    ) as Resolver<CreateProjectFormValues>,
    defaultValues: {
      customerName: "",
      customerPhone: "",
      company: "",
      taxId: "",
      activityTypePreset: "",
      activityCustomDetail: "",
      totalAttendees: undefined,
      tables: "",
      chairs: undefined,
      equipmentNeeds: defaultEquipmentNeedsForm(),
      fnbItems: "",
      projectNotes: "",
      collaPlayContactId: "",
      internalNotes: "",
      rentals: [{ ...defaultRental }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rentals",
  });

  const watchedRentals = useWatch({ control: form.control, name: "rentals" });
  const watchedActivityPreset = useWatch({
    control: form.control,
    name: "activityTypePreset",
  });
  const showActivityCustomDetail =
    watchedActivityPreset === PROJECT_ACTIVITY_CUSTOM_SENTINEL ||
    watchedActivityPreset === PROJECT_ACTIVITY_TYPE_OTHER;

  const onSubmit = form.handleSubmit((data: CreateProjectFormValues) => {
    const {
      activityTypePreset,
      activityCustomDetail,
      equipmentNeeds,
      ...rest
    } = data;
    const payload: CreateProjectInput = {
      ...rest,
      eventOrVenueUse: resolveEventOrVenueUseFromForm(
        activityTypePreset,
        activityCustomDetail ?? "",
      ),
      customerPhone: data.customerPhone ?? "",
      equipmentNeeds,
      rentals: data.rentals.map((r) => {
        const endDateTrim = r.endDate?.trim() ?? "";
        return {
          ...r,
          endDate: endDateTrim ? endDateTrim : undefined,
          setupMinutesBefore: r.setupMinutesBefore ?? 0,
          teardownMinutesAfter: r.teardownMinutesAfter ?? 0,
          pendingAmount: computeProjectRentalPendingAmount(r),
        };
      }),
    };
    startTransition(async () => {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!response.ok) {
          form.setError("root", {
            message: json?.error ?? "提交失敗，請稍後再試",
          });
          return;
        }
        router.push("/dashboard-new/projects");
      } catch {
        form.setError("root", { message: "網路錯誤，請稍後再試" });
      }
    });
  });

  const onError = React.useCallback(() => {
    const err = form.formState.errors as Record<string, unknown>;
    const getFirstPath = (
      obj: Record<string, unknown>,
      prefix = "",
    ): string | null => {
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        const path = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && "message" in v) return path;
        if (v && typeof v === "object" && !Array.isArray(v))
          return getFirstPath(v as Record<string, unknown>, path);
        if (Array.isArray(v)) {
          for (let i = 0; i < v.length; i++) {
            const el = v[i];
            if (el && typeof el === "object") {
              const next = getFirstPath(
                el as Record<string, unknown>,
                `${path}.${i}`,
              );
              if (next) return next;
            }
          }
        }
      }
      return null;
    };
    const first = getFirstPath(err);
    if (first) form.setFocus(first as Parameters<typeof form.setFocus>[0]);
  }, [form]);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e).catch(onError);
        }}
        className="flex-1 flex flex-col gap-6 p-6"
        noValidate
      >
        {/* 客戶資訊 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {CREATE_PROJECT_PAGE.sectionCustomer}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelCustomerNameRequired}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      name={field.name}
                      placeholder={CREATE_PROJECT_PAGE.placeholderCustomerName}
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
                    {CREATE_PROJECT_PAGE.labelPhone}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({CREATE_PROJECT_PAGE.optional})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      name={field.name}
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
                  <FormLabel>
                    {CREATE_PROJECT_PAGE.labelCompany}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({CREATE_PROJECT_PAGE.optional})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} name={field.name} />
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
                  <FormLabel>
                    {CREATE_PROJECT_PAGE.labelTaxId}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({CREATE_PROJECT_PAGE.optional})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" name={field.name} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 專案資訊 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {CREATE_PROJECT_PAGE.sectionProject}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="activityTypePreset"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelActivityType}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    name={field.name}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="w-full"
                        aria-label={CREATE_PROJECT_PAGE.labelActivityType}
                      >
                        <SelectValue
                          placeholder={
                            CREATE_PROJECT_PAGE.placeholderSelectActivityType
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_ACTIVITY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                      <SelectItem value={PROJECT_ACTIVITY_CUSTOM_SENTINEL}>
                        自訂（不在上列）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showActivityCustomDetail ? (
              <FormField
                control={form.control}
                name="activityCustomDetail"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel aria-required>
                      {CREATE_PROJECT_PAGE.labelActivityTypeOtherDetail}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        name={field.name}
                        placeholder={
                          CREATE_PROJECT_PAGE.placeholderActivityTypeOtherDetail
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="fnbItems"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{CREATE_PROJECT_PAGE.labelFnb}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      name={field.name}
                      rows={2}
                      className="resize-none"
                    />
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
                  <FormLabel>{CREATE_PROJECT_PAGE.labelProjectNotes}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      name={field.name}
                      rows={2}
                      className="resize-none"
                    />
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
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelCollaPlayContactRequired}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    name={field.name}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="w-full"
                        aria-label={
                          CREATE_PROJECT_PAGE.labelCollaPlayContactRequired
                        }
                      >
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
          </CardContent>
        </Card>

        {/* 設備需求 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {CREATE_PROJECT_PAGE.sectionEquipment}
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
                      {...field}
                      type="number"
                      min={0}
                      name={field.name}
                      placeholder={CREATE_PROJECT_PAGE.placeholderAttendees}
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
                  <FormLabel>
                    {CREATE_PROJECT_PAGE.labelTables}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({CREATE_PROJECT_PAGE.optional})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} name={field.name} />
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
                      {...field}
                      type="number"
                      min={0}
                      name={field.name}
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
            <div className="sm:col-span-2 space-y-3">
              <p className="text-sm font-medium leading-none">
                {CREATE_PROJECT_PAGE.labelEquipmentExtras}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <FormField
                  control={form.control}
                  name="equipmentNeeds.microphone"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                          aria-label={
                            CREATE_PROJECT_PAGE.labelEquipmentMicrophone
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-none">
                        {CREATE_PROJECT_PAGE.labelEquipmentMicrophone}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equipmentNeeds.extensionCord"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                          aria-label={
                            CREATE_PROJECT_PAGE.labelEquipmentExtensionCord
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-none">
                        {CREATE_PROJECT_PAGE.labelEquipmentExtensionCord}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equipmentNeeds.projector"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                          aria-label={
                            CREATE_PROJECT_PAGE.labelEquipmentProjector
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-none">
                        {CREATE_PROJECT_PAGE.labelEquipmentProjector}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equipmentNeeds.whiteboard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                          aria-label={
                            CREATE_PROJECT_PAGE.labelEquipmentWhiteboard
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-none">
                        {CREATE_PROJECT_PAGE.labelEquipmentWhiteboard}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 專案備註 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {CREATE_PROJECT_PAGE.sectionNotes}
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
                      name={field.name}
                      placeholder={CREATE_PROJECT_PAGE.placeholderInternalNotes}
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 租借項目 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {CREATE_PROJECT_PAGE.sectionRentals}
            </h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
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
                    <Trash2 className="size-4" aria-hidden />
                    {CREATE_PROJECT_PAGE.removeRental}
                  </Button>
                </div>

                {/* 場域多選 */}
                <FormField
                  control={form.control}
                  name={`rentals.${index}.spaceIds`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>
                        {CREATE_PROJECT_PAGE.labelSpacesRequired}
                      </FormLabel>
                      <FormControl>
                        <fieldset
                          className="flex flex-wrap gap-3 rounded-md border border-input bg-background px-3 py-2"
                          role="group"
                          aria-label={CREATE_PROJECT_PAGE.labelSpacesRequired}
                        >
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
                                  aria-describedby={
                                    form.formState.errors.rentals?.[index]
                                      ?.spaceIds
                                      ? `${field.name}-error`
                                      : undefined
                                  }
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
                    name={`rentals.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>
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
                                aria-label={CREATE_PROJECT_PAGE.labelDate}
                              >
                                <CalendarIcon
                                  className="mr-2 size-4"
                                  aria-hidden
                                />
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
                              onSelect={(d) => {
                                const next = d ? format(d, "yyyy-MM-dd") : "";
                                field.onChange(next);
                                const endPath =
                                  `rentals.${index}.endDate` as const;
                                const curEnd = form.getValues(endPath);
                                if (!String(curEnd ?? "").trim()) {
                                  form.setValue(endPath, next, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
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
                    name={`rentals.${index}.endDate`}
                    render={({ field }) => (
                      // 結束日期
                      <FormItem>
                        <FormLabel>
                          {CREATE_PROJECT_PAGE.labelEndDate}
                        </FormLabel>
                        {/* <FormDescription className="text-xs">
                          {CREATE_PROJECT_PAGE.labelEndDateHint}
                        </FormDescription> */}
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
                                aria-label={CREATE_PROJECT_PAGE.labelEndDate}
                              >
                                <CalendarIcon
                                  className="mr-2 size-4"
                                  aria-hidden
                                />
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
                    name={`rentals.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>
                          {CREATE_PROJECT_PAGE.labelStartTimeRequired}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            step={900}
                            name={field.name}
                            aria-label={
                              CREATE_PROJECT_PAGE.labelStartTimeRequired
                            }
                          />
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
                        <FormLabel aria-required>
                          {CREATE_PROJECT_PAGE.labelEndTimeRequired}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            step={900}
                            name={field.name}
                            aria-label={
                              CREATE_PROJECT_PAGE.labelEndTimeRequired
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {SHOW_SETUP_TEARDOWN_FIELDS ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`rentals.${index}.setupMinutesBefore`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelSetupTime}{" "}
                            <span className="text-muted-foreground font-normal text-xs">
                              ({CREATE_PROJECT_PAGE.setupDefault})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              name={field.name}
                              value={field.value ?? 30}
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
                      name={`rentals.${index}.teardownMinutesAfter`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {CREATE_PROJECT_PAGE.labelTeardownTime}{" "}
                            <span className="text-muted-foreground font-normal text-xs">
                              ({CREATE_PROJECT_PAGE.teardownDefault})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              name={field.name}
                              value={field.value ?? 30}
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
                  </div>
                ) : null}

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
                            name={field.name}
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
                            name={field.name}
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
                      // 已付款項
                      <FormItem>
                        <FormLabel>
                          {CREATE_PROJECT_PAGE.labelPaidAmount}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            name={field.name}
                            className="tabular-nums"
                          />
                        </FormControl>
                        {/* {index === 0 ? (
                          <FormDescription>
                            {CREATE_PROJECT_PAGE.hintPaidAmountSetsConfirmed}
                          </FormDescription>
                        ) : null} */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>
                      {CREATE_PROJECT_PAGE.labelPendingAmount}
                    </FormLabel>
                    <div
                      className={cn(
                        "flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm tabular-nums shadow-xs",
                      )}
                      aria-live="polite"
                    >
                      {computeProjectRentalPendingAmount(
                        watchedRentals?.[index] ?? {
                          rentalAmount: 0,
                          fnbAmount: 0,
                          paidAmount: 0,
                        },
                      )}
                    </div>
                  </FormItem>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ ...defaultRental })}
              className="w-fit gap-2"
            >
              <Plus className="size-4" aria-hidden />
              {CREATE_PROJECT_PAGE.addRental}
            </Button>
          </CardContent>
        </Card>

        {form.formState.errors.root?.message && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? CREATE_PROJECT_PAGE.submitting
              : CREATE_PROJECT_PAGE.submit}
          </Button>
        </div>
      </form>
    </Form>
  );
}
