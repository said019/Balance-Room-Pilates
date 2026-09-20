import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import api from "@/lib/api";
import { STUDIO } from "@/lib/studio";
import { fetchMyMembership } from "@/lib/memberships";
import { useAuthStore } from "@/stores/authStore";
import type { BookingClient } from "@/types/booking";
import type { Class } from "@/types/class";
import type { ClientMembership } from "@/types/membership";

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");
const key = "altitud2707-member-preview-v3";
export type PreviewProfile = {
  name: string;
  goal: number;
  reminders: boolean;
  news: boolean;
};
type PreviewState = { bookings: BookingClient[]; profile: PreviewProfile };

export function isLateCancellation(booking: BookingClient, now = Date.now()) {
  const begins = new Date(`${booking.date.slice(0, 10)}T${booking.start_time.slice(0, 5)}:00-06:00`).getTime();
  return begins - now < STUDIO.cancellationHours * 60 * 60 * 1000;
}
function initialState(): PreviewState {
  return { profile: { name: "Atleta Altitud", goal: 3, reminders: true, news: false }, bookings: [] };
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
    enabled: preview || enabled,
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
        plan_name: "12 clases",
        plan_price: 1399,
        plan_currency: "MXN",
        plan_duration_days: 30,
        start_date: dateKey(addDays(new Date(), -8)),
        end_date: dateKey(addDays(new Date(), 22)),
        classes_remaining: Math.max(0, 12 - used),
        class_limit: 12,
      }
    : membershipQuery.data || null;
  const classes = classesQuery.data || [];
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
          "Ya utilizaste tus créditos de muestra. Una cancelación con al menos 4 horas de anticipación devuelve el crédito.",
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
    if (preview) {
      if (isLateCancellation(b)) throw new Error("Cancela con al menos 4 horas de anticipación. Este plazo ya terminó; la clase se considera utilizada si no asistes.");
      save({
        ...demo,
        bookings: demo.bookings.map((x) =>
          x.booking_id === b.booking_id
            ? { ...x, booking_status: "cancelled" }
            : x,
        ),
      });
    } else {
      const response = await api.post(`/bookings/${b.booking_id}/cancel`);
      await refresh();
      return response.data as { requiresCreditReview?: boolean; message?: string };
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
    isLoading: classesQuery.isLoading || (!preview && (membershipQuery.isLoading || bookingsQuery.isLoading)),
    isError: classesQuery.isError || (!preview && (membershipQuery.isError || bookingsQuery.isError)),
    retry: refresh,
  };
}
