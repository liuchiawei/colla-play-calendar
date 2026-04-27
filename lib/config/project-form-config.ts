/**
 * 專案建立/編輯表單：欄位規格、schema 與 mapping（單一來源）
 *
 * - 以 create-project-form.client.tsx 的欄位/必填規則為主
 * - edit 端可額外 extend（例如 status）
 */

import { z } from "zod";

import { CREATE_PROJECT_PAGE } from "@/lib/message";
import type {
  CreateProjectInput,
  ProjectStatus,
  ProjectWithRentals,
  UpdateProjectInput,
} from "@/lib/types/project";
import { computeProjectRentalPendingAmount } from "@/lib/utils/project-rental-pending";
import {
  defaultEquipmentNeedsForm,
  parseEquipmentNeedsFromDb,
} from "@/lib/utils/project-equipment-needs";
import {
  intervalsOverlap,
  isValidRentalTimeWindow,
  rentalBoundsMs,
  spaceIdsIntersect,
} from "@/lib/utils/project-rental-interval";
import {
  PROJECT_ACTIVITY_CUSTOM_SENTINEL,
  PROJECT_ACTIVITY_TYPE_OTHER,
  isActivityTypePresetFieldValue,
  resolveEventTypeFromForm,
  splitActivityTypeForForm,
} from "@/lib/constants/project-form";
import {
  getTaipeiTodayYmd,
  getUiProjectStatus,
} from "@/lib/config/project-status";

export const rentalItemSchema = z
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
    fnbAmountPending: z.boolean().default(false),
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

export const equipmentNeedsFormSchema = z.object({
  microphone: z.boolean(),
  extensionCord: z.boolean(),
  projector: z.boolean(),
  whiteboard: z.boolean(),
  noOtherEquipmentNeeds: z.boolean(),
});

export const projectFormSchema = z
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
    eventOrVenueUse: z.string().trim().min(1, CREATE_PROJECT_PAGE.errorRequired),
    totalAttendees: z
      .string()
      .refine((s) => s.trim().length > 0, CREATE_PROJECT_PAGE.errorRequired),
    tables: z
      .string()
      .refine((s) => s.trim().length > 0, CREATE_PROJECT_PAGE.errorRequired),
    chairs: z
      .string()
      .refine((s) => s.trim().length > 0, CREATE_PROJECT_PAGE.errorRequired),
    equipmentNeeds: equipmentNeedsFormSchema.default(() =>
      defaultEquipmentNeedsForm(),
    ),
    fnbItems: z.string().optional(),
    collaPlayContactId: z.string().min(1, CREATE_PROJECT_PAGE.errorRequired),
    internalNotes: z.string().optional(),
    rentals: z.array(rentalItemSchema).min(1, CREATE_PROJECT_PAGE.errorRequired),
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

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type ProjectRentalFormValues = z.infer<typeof rentalItemSchema>;

export const DEFAULT_RENTAL_FORM_VALUES: ProjectFormValues["rentals"][0] = {
  spaceIds: [],
  date: "",
  endDate: "",
  startTime: "",
  endTime: "",
  setupMinutesBefore: 30,
  teardownMinutesAfter: 30,
  rentalAmount: 0,
  fnbAmount: 0,
  fnbAmountPending: false,
  paidAmount: 0,
};

export function defaultProjectFormValues(): ProjectFormValues {
  return {
    customerName: "",
    customerPhone: "",
    company: "",
    taxId: "",
    activityTypePreset: "",
    activityCustomDetail: "",
    eventOrVenueUse: "",
    totalAttendees: "",
    tables: "",
    chairs: "",
    equipmentNeeds: defaultEquipmentNeedsForm(),
    fnbItems: "",
    collaPlayContactId: "",
    internalNotes: "",
    rentals: [{ ...DEFAULT_RENTAL_FORM_VALUES }],
  };
}

export function projectToFormValues(project: ProjectWithRentals): ProjectFormValues {
  const { preset, customDetail } = splitActivityTypeForForm(project.eventType);
  return {
    customerName: project.customerName,
    customerPhone: project.customerPhone ?? "",
    company: project.company ?? "",
    taxId: project.taxId ?? "",
    activityTypePreset: preset,
    activityCustomDetail: customDetail,
    eventOrVenueUse: project.eventOrVenueUse,
    totalAttendees: project.totalAttendees ?? "",
    tables: project.tables ?? "",
    chairs: project.chairs ?? "",
    equipmentNeeds: parseEquipmentNeedsFromDb(
      project.equipmentNeeds,
    ) as ProjectFormValues["equipmentNeeds"],
    fnbItems: project.fnbItems ?? "",
    collaPlayContactId: project.collaPlayContactId,
    internalNotes: project.internalNotes ?? "",
    rentals:
      project.rentals.length > 0
        ? project.rentals.map((r) => ({
            spaceIds: r.spaceIds,
            date: r.date,
            endDate: r.endDate ?? "",
            startTime: r.startTime,
            endTime: r.endTime,
            setupMinutesBefore: r.setupMinutesBefore ?? 30,
            teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
            rentalAmount: r.rentalAmount,
            fnbAmount: r.fnbAmount,
            fnbAmountPending: r.fnbAmountPending ?? false,
            paidAmount: r.paidAmount,
          }))
        : [{ ...DEFAULT_RENTAL_FORM_VALUES }],
  };
}

function mapRentalsToPayload(
  rentals: ProjectFormValues["rentals"],
): CreateProjectInput["rentals"] {
  return rentals.map((r) => {
    const endDateTrim = r.endDate?.trim() ?? "";
    return {
      ...r,
      endDate: endDateTrim ? endDateTrim : undefined,
      setupMinutesBefore: r.setupMinutesBefore ?? 30,
      teardownMinutesAfter: r.teardownMinutesAfter ?? 30,
      pendingAmount: computeProjectRentalPendingAmount(r),
    };
  });
}

export function formValuesToCreateInput(values: ProjectFormValues): CreateProjectInput {
  const {
    activityTypePreset,
    activityCustomDetail,
    totalAttendees,
    tables,
    chairs,
    ...rest
  } = values;

  return {
    ...rest,
    totalAttendees: totalAttendees.trim(),
    tables: tables.trim(),
    chairs: chairs.trim(),
    eventType: resolveEventTypeFromForm(
      activityTypePreset,
      activityCustomDetail ?? "",
    ),
    customerPhone: values.customerPhone ?? "",
    rentals: mapRentalsToPayload(values.rentals),
  };
}

export function formValuesToUpdateInput(
  values: ProjectFormValues,
  preservedProjectNotes: string | null,
  options?: { status?: ProjectStatus | undefined },
): UpdateProjectInput {
  return {
    ...formValuesToCreateInput(values),
    projectNotes: preservedProjectNotes ?? undefined,
    status: options?.status,
  };
}

export const editProjectFormSchema = projectFormSchema.extend({
  status: z
    .enum(["negotiating", "confirmed", "cancelled", "completed"])
    .optional(),
});

export type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;

export function projectToEditFormValues(
  project: ProjectWithRentals,
): EditProjectFormValues {
  const base = projectToFormValues(project);
  const statusForUi = getUiProjectStatus(project, getTaipeiTodayYmd());
  return { ...base, status: statusForUi ?? undefined };
}
