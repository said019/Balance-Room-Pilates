import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import api from "@/lib/api";
import { fetchMyMembership } from "@/lib/memberships";
import { useAuthStore } from "@/stores/authStore";
import type { BookingClient } from "@/types/booking";
import type { Class } from "@/types/class";
import type { ClientMembership } from "@/types/membership";

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");
const key = "altitud2707-member-preview-v1";
export type PreviewProfile = {
  name: string;
  goal: number;
  reminders: boolean;
  news: boolean;
};
type PreviewState = { bookings: BookingClient[]; profile: PreviewProfile };
function initialState(): PreviewState {
  const tomorrow = dateKey(addDays(new Date(), 1));
  const previous = dateKey(addDays(new Date(), -1));
  return {
    profile: { name: "Atleta Altitud", goal: 3, reminders: true, news: false },
    bookings: [
      {
        booking_id: "preview-next",
        class_id: `${tomorrow}-0700`,
        date: tomorrow,
        start_time: "07:00",
        end_time: "07:50",
        class_type_name: "Híbrido",
        instructor_name: "Coach Altitud",
        booking_status: "confirmed",
      },
      {
        booking_id: "preview-history",
        class_id: `${previous}-0830`,
        date: previous,
        start_time: "08:30",
        end_time: "09:20",
        class_type_name: "Funcional",
        instructor_name: "Coach Altitud",
        booking_status: "checked_in",
      },
    ],
  };
}
function readPreview(): PreviewState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) || "null");
    if (
      raw &&
      typeof raw === "object" &&
      "profile" in raw &&
      "bookings" in raw
    ) {
      const value = raw as PreviewState;
      if (
        typeof value.profile?.name === "string" &&
        [2, 3, 4, 5].includes(value.profile.goal) &&
        Array.isArray(value.bookings) &&
        value.bookings.every(
          (b) =>
            typeof b.booking_id === "string" &&
            typeof b.class_id === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
            typeof b.start_time === "string" &&
            typeof b.end_time === "string" &&
            typeof b.booking_status === "string",
        )
      )
        return value;
    }
  } catch {
    /* Invalid local preview data starts a fresh preview. */
  }
  return initialState();
}
export function demoClasses(start: Date): Class[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i)).flatMap((d) =>
    d.getDay() === 0
      ? []
      : [
          ["07:00", "07:50", "Híbrido"],
          ["08:30", "09:20", "Funcional"],
          ["18:00", "18:50", "Híbrido"],
        ].map(([time, end, type], i) => ({
          id: `${dateKey(d)}-${time.replace(":", "")}`,
          class_type_id: type,
          instructor_id: "preview",
          date: dateKey(d),
          start_time: time,
          end_time: end,
          max_capacity: 8,
          current_bookings: [5, 3, 8][i],
          status: "scheduled" as const,
          class_type_name: type,
          instructor_name: "Coach Altitud",
          facility_name: "Studio Altitud",
        })),
  );
}
export function useMemberData(preview: boolean, start: Date) {
  const [demo, setDemo] = useState(readPreview);
  const [actionError, setActionError] = useState("");
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const enabled = !preview && Boolean(user);
  const membershipQuery = useQuery({
    queryKey: ["my-membership"],
    queryFn: fetchMyMembership,
    enabled,
  });
  const bookingsQuery = useQuery<BookingClient[]>({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get("/bookings/my-bookings")).data,
    enabled,
  });
  const classesQuery = useQuery<Class[]>({
    queryKey: ["classes-public", dateKey(start), dateKey(addDays(start, 6))],
    queryFn: async () =>
      (
        await api.get(
          `/classes?start=${dateKey(start)}&end=${dateKey(addDays(start, 6))}`,
        )
      ).data,
    enabled,
    staleTime: 0,
  });
  function save(next: PreviewState) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setDemo(next);
      setActionError("");
    } catch {
      throw new Error(
        "No pudimos guardar los cambios. Revisa que el navegador permita almacenamiento local.",
      );
    }
  }
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["my-membership"] }),
      queryClient.invalidateQueries({ queryKey: ["classes-public"] }),
    ]);
  }
  const bookings = preview ? demo.bookings : bookingsQuery.data || [];
  const used = demo.bookings.filter(
    (b) => b.booking_status !== "cancelled",
  ).length;
  const membership: ClientMembership | null = preview
    ? {
        id: "preview",
        status: "active",
        plan_name: "Constancia",
        plan_price: null,
        plan_currency: "MXN",
        plan_duration_days: 30,
        start_date: dateKey(addDays(new Date(), -8)),
        end_date: dateKey(addDays(new Date(), 22)),
        classes_remaining: Math.max(0, 12 - used),
        class_limit: 12,
      }
    : membershipQuery.data || null;
  const classes = preview
    ? demoClasses(start).map((c) => ({
        ...c,
        current_bookings: Math.min(
          c.max_capacity,
          c.current_bookings +
            Number(
              bookings.some(
                (b) => b.class_id === c.id && b.booking_status !== "cancelled",
              ),
            ),
        ),
      }))
    : classesQuery.data || [];
  async function book(c: Class) {
    if (preview) {
      if (
        bookings.some(
          (b) => b.class_id === c.id && b.booking_status !== "cancelled",
        )
      )
        throw new Error("Ya tienes un lugar en esta sesión.");
      if (c.current_bookings >= c.max_capacity)
        throw new Error("Esta sesión está completa. Elige otro horario.");
      if ((membership?.classes_remaining ?? 0) <= 0)
        throw new Error(
          "Ya utilizaste tus créditos de muestra. Cancela una reserva para seguir explorando.",
        );
      save({
        ...demo,
        bookings: [
          ...demo.bookings.filter((b) => b.class_id !== c.id),
          {
            booking_id: `preview-${c.id}`,
            class_id: c.id,
            date: c.date,
            start_time: c.start_time,
            end_time: c.end_time,
            class_type_name: c.class_type_name || "Entrenamiento",
            instructor_name: c.instructor_name || "Coach Altitud",
            booking_status: "confirmed",
          },
        ],
      });
    } else {
      await api.post("/bookings", { classId: c.id });
      await refresh();
    }
  }
  async function cancel(b: BookingClient) {
    if (preview)
      save({
        ...demo,
        bookings: demo.bookings.map((x) =>
          x.booking_id === b.booking_id
            ? { ...x, booking_status: "cancelled" }
            : x,
        ),
      });
    else {
      await api.post(`/bookings/${b.booking_id}/cancel`);
      await refresh();
    }
  }
  function saveProfile(profile: PreviewProfile) {
    save({ ...demo, profile });
  }
  return {
    bookings,
    classes,
    membership,
    profile: preview
      ? demo.profile
      : {
          name: user?.display_name || "Atleta",
          goal: 3,
          reminders: user?.receive_reminders ?? false,
          news: user?.receive_promotions ?? false,
        },
    book,
    cancel,
    saveProfile,
    actionError,
    setActionError,
    isLoading:
      !preview &&
      (membershipQuery.isLoading ||
        bookingsQuery.isLoading ||
        classesQuery.isLoading),
    isError:
      !preview &&
      (membershipQuery.isError ||
        bookingsQuery.isError ||
        classesQuery.isError),
    retry: refresh,
  };
}
