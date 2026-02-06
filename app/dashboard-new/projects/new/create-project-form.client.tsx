"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { ALL_SPACES } from "@/lib/config";
import { MOCK_CONTACT_OPTIONS } from "@/lib/types/project";
import type { CreateProjectInput } from "@/lib/types/project";
import { cn } from "@/lib/utils";

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

const createProjectSchema = z.object({
  contactName: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
  contactPhone: z
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
  rentals: z.array(rentalItemSchema).min(1, CREATE_PROJECT_PAGE.errorRequired),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const defaultRental: CreateProjectFormValues["rentals"][0] = {
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

export function CreateProjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      contactName: "",
      contactPhone: "",
      company: "",
      taxId: "",
      eventOrVenueUse: "",
      totalAttendees: undefined,
      tables: "",
      chairs: undefined,
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

  const onSubmit = form.handleSubmit(async (data: CreateProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateProjectInput = {
        ...data,
        rentals: data.rentals.map((r) => ({
          ...r,
          setupMinutesBefore: r.setupMinutesBefore ?? 30,
          teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
        })),
      };
      // TODO: replace with API call
      console.log("CreateProject payload", payload);
      router.push("/dashboard-new/projects");
    } finally {
      setIsSubmitting(false);
    }
  });

  const onError = React.useCallback(() => {
    const err = form.formState.errors as Record<string, unknown>;
    const getFirstPath = (obj: Record<string, unknown>, prefix = ""): string | null => {
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
              const next = getFirstPath(el as Record<string, unknown>, `${path}.${i}`);
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
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelContactNameRequired}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      name={field.name}
                      placeholder={CREATE_PROJECT_PAGE.placeholderContactName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelPhoneRequired}
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
                    <Input
                      {...field}
                      inputMode="numeric"
                      name={field.name}
                    />
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
              name="eventOrVenueUse"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel aria-required>
                    {CREATE_PROJECT_PAGE.labelEventOrVenueUseRequired}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      name={field.name}
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
                  <FormLabel>{CREATE_PROJECT_PAGE.labelTotalAttendees}</FormLabel>
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
                            : Number(e.target.value)
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
                            : Number(e.target.value)
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
                        aria-label={CREATE_PROJECT_PAGE.labelCollaPlayContactRequired}
                      >
                        <SelectValue
                          placeholder={
                            CREATE_PROJECT_PAGE.placeholderSelectContact
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOCK_CONTACT_OPTIONS.map((opt) => (
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
                  <FormLabel>{CREATE_PROJECT_PAGE.labelInternalNotes}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      name={field.name}
                      placeholder={
                        CREATE_PROJECT_PAGE.placeholderInternalNotes
                      }
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
                                      ? field.value.filter((id) => id !== space.id)
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                  !field.value && "text-muted-foreground"
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
                                      { locale: zhTW }
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
                                field.onChange(
                                  d
                                    ? format(d, "yyyy-MM-dd")
                                    : ""
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
                        <FormLabel aria-required>
                          {CREATE_PROJECT_PAGE.labelStartTimeRequired}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            step={900}
                            name={field.name}
                            aria-label={CREATE_PROJECT_PAGE.labelStartTimeRequired}
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
                            aria-label={CREATE_PROJECT_PAGE.labelEndTimeRequired}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                                  : Number(e.target.value)
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
                                  : Number(e.target.value)
                              )
                            }
                          />
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
                            name={field.name}
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
              <Plus className="size-4" aria-hidden />
              {CREATE_PROJECT_PAGE.addRental}
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? CREATE_PROJECT_PAGE.submitting
              : CREATE_PROJECT_PAGE.submit}
          </Button>
        </div>
      </form>
    </Form>
  );
}
