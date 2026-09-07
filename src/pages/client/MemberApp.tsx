import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowTopRightIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckIcon,
  CalendarIcon,
  PersonIcon,
  PlusIcon,
  LockClosedIcon,
  GearIcon,
  ExitIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { AuthGuard } from "@/components/layout/AuthGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangePasswordDialog } from "@/components/client/ChangePasswordDialog";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/lib/api";
import {
  useMemberData,
  dateKey,
  type PreviewProfile,
} from "@/components/member/useMemberData";
import type { BookingClient } from "@/types/booking";
import type { Class } from "@/types/class";

type MemberData = ReturnType<typeof useMemberData>;
const classDate = (date: string, time: string) =>
  new Date(`${date.slice(0, 10)}T${time.slice(0, 8)}`);
const friendlyDate = (date: string) =>
  format(new Date(`${date.slice(0, 10)}T12:00:00`), "EEEE d MMM", {
    locale: es,
  });
const statusName: Record<string, string> = {
  confirmed: "Confirmada",
  checked_in: "Asististe",
  waitlist: "En espera",
  cancelled: "Cancelada",
  no_show: "Sin asistencia",
  active: "Activa",
  expired: "Vencida",
  paused: "Pausada",
  pending_payment: "Pago pendiente",
  pending_activation: "Por activar",
};
const isUpcoming = (b: BookingClient) =>
  b.booking_status !== "cancelled" &&
  classDate(b.date, b.end_time) > new Date();

export default function MemberApp({ preview = false }: { preview?: boolean }) {
  return preview ? (
    <MemberWorkspace preview />
  ) : (
    <AuthGuard requiredRoles={["client"]}>
      <MemberWorkspace preview={false} />
    </AuthGuard>
  );
}
function PageHeading({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="member-page-heading">
      <div>
        <span className="member-kicker">{label}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="member-empty">
      <CalendarIcon />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
function BookingLine({
  booking,
  base,
  preview,
  onCancel,
}: {
  booking: BookingClient;
  base: string;
  preview: boolean;
  onCancel?: (b: BookingClient) => void;
}) {
  const upcoming = isUpcoming(booking);
  const date = new Date(`${booking.date.slice(0, 10)}T12:00:00`);
  return (
    <article className="member-booking-line">
      <div className="member-date-tile">
        <span>{format(date, "MMM", { locale: es })}</span>
        <strong>{format(date, "dd")}</strong>
      </div>
      <div className="member-booking-name">
        <h3>{booking.class_type_name}</h3>
        <p>
          {friendlyDate(booking.date)} · {booking.start_time.slice(0, 5)}
        </p>
        <span>{booking.instructor_name}</span>
      </div>
      <span
        className={`member-pill ${booking.booking_status === "cancelled" ? "member-pill-muted" : ""}`}
      >
        {statusName[booking.booking_status] || booking.booking_status}
      </span>
      {upcoming && onCancel ? (
        <button
          className="member-subtle-button"
          onClick={() => onCancel(booking)}
        >
          Cancelar
        </button>
      ) : !preview ? (
        <Link
          className="member-icon-button"
          to={base + `/classes/${booking.booking_id}`}
          aria-label={`Detalle de ${booking.class_type_name}`}
        >
          <ArrowTopRightIcon />
        </Link>
      ) : null}
    </article>
  );
}
function MembershipCard({
  data,
  base,
  preview,
}: {
  data: MemberData;
  base: string;
  preview: boolean;
}) {
  const m = data.membership;
  return (
    <article className="member-membership-card">
      <div className="member-card-top">
        <span className="member-kicker">
          TU MEMBRESÍA{preview ? " · EJEMPLO" : ""}
        </span>
        <span className="member-card-status">
          {m ? statusName[m.status] : "Sin membresía"}
        </span>
      </div>
      <h3>{m?.plan_name || "Tu siguiente paso."}</h3>
      <div className="member-credits">
        <strong>{m ? (m.classes_remaining ?? "∞") : "—"}</strong>
        <span>
          créditos
          <br />
          disponibles
        </span>
      </div>
      <div className="member-credit-track">
        <span
          style={{
            width: `${m?.class_limit ? Math.max(0, Math.min(100, ((m.classes_remaining ?? 0) / m.class_limit) * 100)) : 0}%`,
          }}
        />
      </div>
      <div className="member-membership-meta">
        <span>
          {m?.class_limit
            ? `de ${m.class_limit} sesiones`
            : m
              ? "Sesiones ilimitadas"
              : "Encuentra tu ritmo"}
        </span>
        <span>
          {m?.end_date
            ? `Vence ${format(new Date(m.end_date.slice(0, 10) + "T12:00:00"), "d MMM", { locale: es })}`
            : "Planes por confirmar"}
        </span>
      </div>
      <Link to={base + "/profile/membership"} className="member-card-link">
        Ver mi membresía <ArrowTopRightIcon />
      </Link>
    </article>
  );
}
function MemberHome({
  data,
  base,
  preview,
  onCancel,
}: {
  data: MemberData;
  base: string;
  preview: boolean;
  onCancel: (b: BookingClient) => void;
}) {
  const upcoming = data.bookings
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        classDate(a.date, a.start_time).getTime() -
        classDate(b.date, b.start_time).getTime(),
    );
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const attended = data.bookings.filter(
    (b) => b.booking_status === "checked_in",
  );
  const thisWeek = attended.filter(
    (b) =>
      classDate(b.date, b.start_time) >= monday &&
      classDate(b.date, b.start_time) < addDays(monday, 7),
  );
  const greeting =
    data.profile.name === "Atleta Altitud"
      ? "atleta"
      : data.profile.name.split(" ")[0];
  return (
    <>
      <PageHeading
        label="CADA SESIÓN CUENTA"
        title={`Hola, ${greeting}.`}
        description="Un día más para descubrir de lo que eres capaz."
        action={
          <Link
            className="member-button"
            to={base + "/book"}
            aria-label="Reservar clase"
          >
            <PlusIcon /> Reservar clase
          </Link>
        }
      />
      <section className="member-welcome">
        <div>
          <span className="member-kicker">TU RITMO. TU CONSTANCIA.</span>
          <h2>
            EL SIGUIENTE NIVEL
            <br />
            LO CONSTRUYES <em>TÚ.</em>
          </h2>
          <p>
            Entrena con intención.
            <br />
            El progreso se siente, sesión a sesión.
          </p>
          <Link to={base + "/book"}>
            Encuentra tu entrenamiento <ArrowTopRightIcon />
          </Link>
        </div>
        <img
          src="/brand/hybrid-training.jpg"
          alt="Entrenamiento híbrido con trineo"
        />
        <span className="member-welcome-note">
          2707 M S. N. M. / ZINACANTEPEC
        </span>
      </section>
      <div className="member-overview">
        <section className="member-next">
          <div className="member-section-heading">
            <h2>Tu próxima sesión</h2>
            <Link to={base + "/classes"}>
              Ver todas <ArrowTopRightIcon />
            </Link>
          </div>
          {upcoming.length ? (
            <>
              <BookingLine
                booking={upcoming[0]}
                base={base}
                preview={preview}
                onCancel={onCancel}
              />
              <div className="member-next-note">
                <span className="member-small-icon">
                  <CheckIcon />
                </span>
                <div>
                  <strong>Tu lugar está listo.</strong>
                  <p>Agua, toalla y ganas de ir por más.</p>
                </div>
                <Link to={base + "/book"} aria-label="Ver más sesiones">
                  <ArrowTopRightIcon />
                </Link>
              </div>
            </>
          ) : (
            <Empty
              title="Tu próxima sesión empieza aquí."
              description="Elige un horario y haz espacio para ti."
            >
              <Link to={base + "/book"} className="member-text-link">
                Explorar clases <ArrowRightIcon />
              </Link>
            </Empty>
          )}
          <div className="member-section-heading member-week-title">
            <h2>Tu constancia, esta semana</h2>
            <span>
              {thisWeek.length} {thisWeek.length === 1 ? "sesión" : "sesiones"}
            </span>
          </div>
          <div className="member-week-strip">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(monday, i);
              const done = attended.some(
                (b) => b.date.slice(0, 10) === dateKey(d),
              );
              const booked = upcoming.some(
                (b) => b.date.slice(0, 10) === dateKey(d),
              );
              return (
                <div
                  key={i}
                  className={isSameDay(d, new Date()) ? "today" : ""}
                >
                  <span>{format(d, "EEEEE", { locale: es })}</span>
                  <div className={done ? "done" : booked ? "booked" : ""}>
                    {done ? <CheckIcon /> : format(d, "dd")}
                  </div>
                  <small>
                    {done
                      ? "Hecho"
                      : booked
                        ? "Reserva"
                        : isSameDay(d, new Date())
                          ? "Hoy"
                          : " "}
                  </small>
                </div>
              );
            })}
          </div>
          <div className="member-week-legend">
            <span>
              <i /> Asistencia
            </span>
            <span>
              <i /> Próxima sesión
            </span>
          </div>
        </section>
        <MembershipCard data={data} base={base} preview={preview} />
      </div>
      <section className="member-explore">
        <div className="member-section-heading">
          <h2>Encuentra tu impulso</h2>
          <span>ENTRENA A TU MANERA</span>
        </div>
        <div className="member-explore-grid">
          <Link to={base + "/book?tipo=Híbrido"}>
            <img src="/brand/hybrid-training.jpg" alt="Entrenamiento híbrido" />
            <div>
              <span>FUERZA + RESISTENCIA</span>
              <h3>Híbrido</h3>
              <p>Más allá de tu zona de confort.</p>
            </div>
            <ArrowTopRightIcon />
          </Link>
          <Link to={base + "/book?tipo=Funcional"}>
            <img
              src="/brand/community-training.jpg"
              alt="Trabajo funcional con cuerdas"
            />
            <div>
              <span>MOVIMIENTO + CONTROL</span>
              <h3>Funcional</h3>
              <p>Una base fuerte para todo lo demás.</p>
            </div>
            <ArrowTopRightIcon />
          </Link>
        </div>
      </section>
    </>
  );
}
function MemberWorkspace({ preview }: { preview: boolean }) {
  const location = useLocation();
  const base = preview ? "/app/preview" : "/app";
  const path = location.pathname.slice(base.length) || "/";
  const [start, setStart] = useState(() => new Date());
  const [day, setDay] = useState(() => (new Date().getDay() === 0 ? 1 : 0));
  const [filter, setFilter] = useState(
    () => new URLSearchParams(location.search).get("tipo") || "Todas",
  );
  const [tab, setTab] = useState("Próximas");
  const [chosen, setChosen] = useState<Class | null>(null);
  const [cancelled, setCancelled] = useState<BookingClient | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  useEffect(() => {
    setFilter(new URLSearchParams(location.search).get("tipo") || "Todas");
  }, [location.search]);
  const data = useMemberData(preview, start);
  const auth = useAuthStore();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const selectedDate = days[day];
  async function confirm() {
    if (!chosen) return;
    setBusy(true);
    data.setActionError("");
    try {
      await data.book(chosen);
      setSuccess(true);
    } catch (e) {
      data.setActionError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function confirmCancel() {
    if (!cancelled) return;
    setBusy(true);
    data.setActionError("");
    try {
      await data.cancel(cancelled);
      setCancelled(null);
      setMessage(
        preview
          ? "Reserva de muestra cancelada. Tu crédito de ejemplo vuelve a estar disponible."
          : "Reserva cancelada. Puedes consultar tu saldo actualizado.",
      );
    } catch (e) {
      data.setActionError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function openCancel(b: BookingClient) {
    data.setActionError("");
    setCancelled(b);
  }
  const membership = data.membership;
  const upcoming = data.bookings
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        classDate(a.date, a.start_time).getTime() -
        classDate(b.date, b.start_time).getTime(),
    );
  const history = data.bookings
    .filter((b) => !isUpcoming(b))
    .sort(
      (a, b) =>
        classDate(b.date, b.start_time).getTime() -
        classDate(a.date, a.start_time).getTime(),
    );
  const sessions = data.classes
    .filter(
      (c) =>
        c.status !== "cancelled" &&
        c.date.slice(0, 10) === dateKey(selectedDate) &&
        (filter === "Todas" || c.class_type_name === filter),
    )
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  let content: React.ReactNode;
  if (path === "/")
    content = (
      <MemberHome
        data={data}
        base={base}
        preview={preview}
        onCancel={openCancel}
      />
    );
  else if (path === "/book")
    content = (
      <>
        <PageHeading
          label="HAZ ESPACIO PARA TI"
          title="Vamos a entrenar."
          description="Elige el movimiento. Nosotros ponemos el impulso."
        />
        <div className="member-calendar-toolbar">
          <div className="member-tabs" aria-label="Tipo de entrenamiento">
            {[
              "Todas",
              ...new Set(
                data.classes.map((c) => c.class_type_name).filter(Boolean),
              ),
            ].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f!)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="member-week-picker">
            <button
              aria-label="Semana anterior"
              disabled={dateKey(start) <= dateKey(new Date())}
              onClick={() => {
                setStart(addDays(start, -7));
                setDay(0);
              }}
            >
              <ArrowLeftIcon />
            </button>
            <span>{format(start, "MMMM yyyy", { locale: es })}</span>
            <button
              aria-label="Semana siguiente"
              onClick={() => {
                setStart(addDays(start, 7));
                setDay(0);
              }}
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
        <div className="member-day-picker">
          {days.map((d, i) => (
            <button
              key={i}
              aria-pressed={day === i}
              aria-label={format(d, "EEEE d MMMM", { locale: es })}
              onClick={() => setDay(i)}
            >
              <span>{format(d, "EEE", { locale: es })}</span>
              <strong>{format(d, "dd")}</strong>
              <small>
                {isSameDay(d, new Date())
                  ? "HOY"
                  : format(d, "MMM", { locale: es })}
              </small>
            </button>
          ))}
        </div>
        <div className="member-section-heading member-calendar-heading">
          <h2>{friendlyDate(dateKey(selectedDate))}</h2>
          <span>
            {sessions.length} {sessions.length === 1 ? "SESIÓN" : "SESIONES"}
            {preview ? " DE EJEMPLO" : ""}
          </span>
        </div>
        <div className="member-session-list">
          {sessions.length ? (
            sessions.map((c) => {
              const booked = data.bookings.some(
                (b) => b.class_id === c.id && b.booking_status !== "cancelled",
              );
              const full = c.current_bookings >= c.max_capacity;
              const past = classDate(c.date, c.start_time) <= new Date();
              return (
                <article key={c.id}>
                  <div className="member-session-time">
                    {c.start_time.slice(0, 5)}
                    <span>
                      <ClockIcon />
                      {Math.round(
                        (classDate(c.date, c.end_time).getTime() -
                          classDate(c.date, c.start_time).getTime()) /
                          60000,
                      )}{" "}
                      min
                    </span>
                  </div>
                  <div className="member-session-name">
                    <span className="member-kicker">
                      {c.class_type_name === "Híbrido"
                        ? "FUERZA + RESISTENCIA"
                        : "MOVIMIENTO + CONTROL"}
                    </span>
                    <h3>{c.class_type_name}</h3>
                    <p>
                      {c.instructor_name} ·{" "}
                      {c.facility_name || "Studio Altitud"}
                    </p>
                  </div>
                  <span className="member-spots">
                    {booked
                      ? "Tu lugar está listo"
                      : past
                        ? "Sesión finalizada"
                        : full
                          ? "Clase completa"
                          : `${c.max_capacity - c.current_bookings} lugares disponibles`}
                  </span>
                  <button
                    className={
                      booked
                        ? "member-button member-button-light"
                        : "member-button"
                    }
                    disabled={booked || full || past}
                    onClick={() => {
                      setChosen(c);
                      setSuccess(false);
                      data.setActionError("");
                    }}
                  >
                    {booked ? (
                      <>
                        <CheckIcon />
                        Reservada
                      </>
                    ) : past ? (
                      "Finalizada"
                    ) : full ? (
                      "Completa"
                    ) : (
                      <>
                        Reservar <PlusIcon />
                      </>
                    )}
                  </button>
                </article>
              );
            })
          ) : (
            <Empty
              title="Un respiro en tu semana."
              description="No hay sesiones para esta fecha y filtro. Explora otro día."
            />
          )}
        </div>
        <p className="member-caption">
          {preview
            ? "Horarios, coaches, cupos y créditos ilustrativos. Las reservas no son reales."
            : "El cupo se confirma al completar la reserva."}
        </p>
      </>
    );
  else if (path === "/classes")
    content = (
      <>
        <PageHeading
          label="TU COMPROMISO CONTIGO"
          title="Mis sesiones."
          description="Cada entrenamiento es un paso más en tu camino."
          action={
            <Link
              className="member-button"
              to={base + "/book"}
              aria-label="Reservar clase"
            >
              Reservar clase <PlusIcon />
            </Link>
          }
        />
        <div className="member-tabs">
          {["Próximas", "Historial"].map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}{" "}
              <small>
                {t === "Próximas" ? upcoming.length : history.length}
              </small>
            </button>
          ))}
        </div>
        <section className="member-bookings-list">
          {(tab === "Próximas" ? upcoming : history).length ? (
            (tab === "Próximas" ? upcoming : history).map((b) => (
              <BookingLine
                key={b.booking_id}
                booking={b}
                base={base}
                preview={preview}
                onCancel={tab === "Próximas" ? openCancel : undefined}
              />
            ))
          ) : (
            <Empty
              title={
                tab === "Próximas"
                  ? "Tu agenda está abierta."
                  : "Tu historia está por empezar."
              }
              description={
                tab === "Próximas"
                  ? "Elige una sesión y reserva un momento para ti."
                  : "Aquí encontrarás tus sesiones anteriores."
              }
            >
              <Link to={base + "/book"} className="member-text-link">
                Encuentra tu próxima clase <ArrowTopRightIcon />
              </Link>
            </Empty>
          )}
        </section>
      </>
    );
  else if (path === "/profile/membership" || path === "/checkout")
    content = (
      <>
        <PageHeading
          label="DALE CONTINUIDAD A TU PROGRESO"
          title="Mi membresía."
          description="Tu entrenamiento, con un ritmo que va contigo."
        />
        <div className="member-membership-page">
          <MembershipCard data={data} base={base} preview={preview} />
          <section className="member-plan-details">
            <span className="member-kicker">TU PLAN, EN CLARO</span>
            <h2>{membership?.plan_name || "Encuentra tu ritmo"}</h2>
            <dl>
              <div>
                <dt>Estado</dt>
                <dd>
                  {membership ? statusName[membership.status] : "Sin membresía"}
                </dd>
              </div>
              <div>
                <dt>Sesiones incluidas</dt>
                <dd>
                  {membership?.class_limit ??
                    (membership ? "Ilimitadas" : "Por confirmar")}
                </dd>
              </div>
              <div>
                <dt>Créditos disponibles</dt>
                <dd>
                  {membership?.classes_remaining ??
                    (membership ? "Ilimitados" : "—")}
                </dd>
              </div>
              <div>
                <dt>Vigencia</dt>
                <dd>
                  {membership?.end_date
                    ? format(
                        new Date(
                          membership.end_date.slice(0, 10) + "T12:00:00",
                        ),
                        "d MMMM yyyy",
                        { locale: es },
                      )
                    : "Por confirmar"}
                </dd>
              </div>
            </dl>
            <p>
              {preview
                ? "Esta membresía es un ejemplo para explorar la app. Los planes y precios oficiales están por confirmar."
                : "Consulta la vigencia y los créditos de tu membresía antes de reservar."}
            </p>
            <Link
              className="member-button"
              to={preview ? base + "/book" : "/app/checkout"}
            >
              {preview ? "Usar créditos de muestra" : "Ver paquetes"}
              <ArrowTopRightIcon />
            </Link>
            <Link className="member-text-link" to={base + "/orders"}>
              Mis compras <ArrowRightIcon />
            </Link>
          </section>
        </div>
      </>
    );
  else if (path === "/profile")
    content = (
      <>
        <PageHeading
          label="TU ESPACIO PERSONAL"
          title="A tu manera."
          description="Tu información y preferencias, en un solo lugar."
        />
        <div className="member-profile-grid">
          <section className="member-profile-card">
            <div className="member-profile-avatar">
              {!preview && auth.user?.photo_url ? (
                <img src={auth.user.photo_url} alt="Tu foto de perfil" />
              ) : (
                data.profile.name
                  .split(" ")
                  .slice(0, 2)
                  .map((x) => x[0])
                  .join("")
              )}
            </div>
            <span className="member-kicker">
              {preview ? "PERFIL DE EJEMPLO" : "COMUNIDAD ALTITUD"}
            </span>
            <h2>{data.profile.name}</h2>
            <p>
              {preview
                ? "Tu siguiente versión empieza contigo."
                : auth.user?.email}
            </p>
            <Link
              className="member-button member-button-outline"
              to={base + "/profile/edit"}
            >
              Editar mi perfil <PersonIcon />
            </Link>
          </section>
          <section className="member-settings-list">
            <Link to={base + "/profile/membership"}>
              <div>
                <CalendarIcon />
                <span>
                  <strong>Mi membresía</strong>
                  <small>Créditos, vigencia y tu próximo paso</small>
                </span>
              </div>
              <ArrowTopRightIcon />
            </Link>
            <Link to={base + "/profile/preferences"}>
              <div>
                <GearIcon />
                <span>
                  <strong>Mis preferencias</strong>
                  <small>Recordatorios y novedades a tu ritmo</small>
                </span>
              </div>
              <ArrowTopRightIcon />
            </Link>
            <Link to={base + "/orders"}>
              <div>
                <DownloadIcon />
                <span>
                  <strong>Mis compras</strong>
                  <small>Consulta tus órdenes y pagos</small>
                </span>
              </div>
              <ArrowTopRightIcon />
            </Link>
            {!preview && (
              <button onClick={() => setPasswordOpen(true)}>
                <div>
                  <PersonIcon />
                  <span>
                    <strong>Seguridad de mi cuenta</strong>
                    <small>Cambiar mi contraseña</small>
                  </span>
                </div>
                <ArrowTopRightIcon />
              </button>
            )}
            <Link to="/privacy">
              <div>
                <LockClosedIcon />
                <span>
                  <strong>Privacidad</strong>
                  <small>El cuidado de tus datos</small>
                </span>
              </div>
              <ArrowTopRightIcon />
            </Link>
            <button
              onClick={() => {
                if (!preview) auth.logout();
                window.location.assign(preview ? "/" : "/login");
              }}
            >
              <div>
                <ExitIcon />
                <span>
                  {preview ? "Salir de la vista previa" : "Cerrar sesión"}
                </span>
              </div>
              <ArrowTopRightIcon />
            </button>
          </section>
        </div>
      </>
    );
  else if (
    preview &&
    (path === "/profile/edit" || path === "/profile/preferences")
  )
    content = (
      <PreviewEditor
        key={path}
        preferences={path.endsWith("preferences")}
        profile={data.profile}
        base={base}
        save={data.saveProfile}
      />
    );
  else if (path === "/events")
    content = (
      <>
        <PageHeading
          label="MÁS FUERTES, JUNTOS"
          title="Tu comunidad."
          description="La energía de entrenar va más allá de una clase."
        />
        <section className="member-community-banner">
          <img
            src="/brand/community-training.jpg"
            alt="Entrenamiento funcional"
          />
          <div>
            <span className="member-kicker">PERFORMANCE MEETS LIFESTYLE</span>
            <h2>
              EL IMPULSO
              <br />
              DE PERTENECER.
            </h2>
            <p>
              Entrenamiento, retos y experiencias compartidas.
              <br />
              Aquí nos movemos juntos.
            </p>
          </div>
        </section>
        <Empty
          title="Lo que viene, lo vivimos juntos."
          description="Los próximos eventos de 2707 Altitud aparecerán aquí cuando se confirmen."
        />
      </>
    );
  else if (path === "/notifications")
    content = (
      <>
        <PageHeading
          label="AL DÍA CON TU ALTITUD"
          title="Notificaciones."
          description="Lo importante para tu entrenamiento, en un solo lugar."
        />
        <Empty
          title="Estás al día."
          description="Aquí encontrarás avisos del studio y novedades de tus sesiones."
        />
      </>
    );
  else if (path === "/orders")
    content = (
      <>
        <PageHeading
          label="TU HISTORIAL"
          title="Mis compras."
          description="Tus planes y pagos, siempre a la mano."
        />
        <Empty
          title="Todavía no hay compras."
          description="La membresía de esta vista previa es ilustrativa. No se ha realizado ningún cobro."
        />
      </>
    );
  else
    content = (
      <Empty
        title="Retoma tu camino."
        description="Vuelve a tu espacio de entrenamiento."
      >
        <Link className="member-button" to={base}>
          Ir a mi inicio <ArrowRightIcon />
        </Link>
      </Empty>
    );
  return (
    <ClientLayout displayName={data.profile.name}>
      {message && (
        <div className="member-feedback" role="status">
          <CheckIcon />
          {message}
          <button onClick={() => setMessage("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}
      {data.isLoading ? (
        <div className="member-loading" role="status">
          <span>Cargando tu espacio…</span>
          <div />
          <div />
          <div />
        </div>
      ) : data.isError ? (
        <div role="alert">
          <Empty
            title="No pudimos cargar tu información."
            description="Revisa tu conexión e inténtalo de nuevo."
          >
            <button className="member-button" onClick={() => void data.retry()}>
              Volver a intentar
            </button>
          </Empty>
        </div>
      ) : (
        content
      )}
      <Dialog
        open={!!chosen}
        onOpenChange={(open) => {
          if (!open && !busy) setChosen(null);
        }}
      >
        <DialogContent className="member-dialog">
          <span className="member-kicker">
            {preview ? "RESERVA DE MUESTRA" : "2707 ALTITUD"}
          </span>
          <DialogTitle>
            {success ? "Tu lugar está listo." : "Tu próximo entrenamiento."}
          </DialogTitle>
          <DialogDescription>
            {success
              ? preview
                ? "Guardamos la muestra en este navegador. No es una reserva real."
                : "Tu reserva se confirmó. Nos vemos en Altitud."
              : preview
                ? "Prueba la experiencia. Se descontará un crédito de ejemplo, sin cargos."
                : "Confirma tu clase para reservar un lugar con tu membresía."}
          </DialogDescription>
          {chosen && (
            <div className="member-dialog-summary">
              <h3>{chosen.class_type_name}</h3>
              <p>
                {friendlyDate(chosen.date)} · {chosen.start_time.slice(0, 5)}
              </p>
              <span>{chosen.instructor_name}</span>
            </div>
          )}
          {data.actionError && (
            <p className="member-error" role="alert">
              {data.actionError}
            </p>
          )}
          {success ? (
            <Link
              to={base + "/classes"}
              className="member-button"
              onClick={() => setChosen(null)}
            >
              Ver mis sesiones <ArrowTopRightIcon />
            </Link>
          ) : (
            <button
              className="member-button"
              onClick={() => void confirm()}
              disabled={busy}
            >
              {busy
                ? "Confirmando…"
                : preview
                  ? "Confirmar muestra"
                  : "Confirmar reserva"}
              <CheckIcon />
            </button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!cancelled}
        onOpenChange={(open) => {
          if (!open && !busy) setCancelled(null);
        }}
      >
        <DialogContent className="member-dialog">
          <span className="member-kicker">UN CAMBIO DE PLANES</span>
          <DialogTitle>¿Cancelar esta sesión?</DialogTitle>
          <DialogDescription>
            {preview
              ? "La reserva de muestra pasará al historial y recuperarás tu crédito de ejemplo."
              : "La devolución de créditos depende de la política vigente y será confirmada por el studio."}
          </DialogDescription>
          {cancelled && (
            <div className="member-dialog-summary">
              <h3>{cancelled.class_type_name}</h3>
              <p>
                {friendlyDate(cancelled.date)} ·{" "}
                {cancelled.start_time.slice(0, 5)}
              </p>
            </div>
          )}
          {data.actionError && (
            <p className="member-error" role="alert">
              {data.actionError}
            </p>
          )}
          <button
            className="member-button"
            onClick={() => void confirmCancel()}
            disabled={busy}
          >
            {busy ? "Cancelando…" : "Sí, cancelar sesión"}
          </button>
          <button
            className="member-subtle-button"
            onClick={() => setCancelled(null)}
            disabled={busy}
          >
            Conservar mi lugar
          </button>
        </DialogContent>
      </Dialog>
      {!preview && (
        <ChangePasswordDialog
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      )}
    </ClientLayout>
  );
}
function PreviewEditor({
  preferences,
  profile,
  base,
  save,
}: {
  preferences: boolean;
  profile: PreviewProfile;
  base: string;
  save: (p: PreviewProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [reminders, setReminders] = useState(profile.reminders);
  const [news, setNews] = useState(profile.news);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Escribe al menos dos caracteres.");
      return;
    }
    try {
      save({ ...profile, name: name.trim(), reminders, news });
      setSaved(true);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        label="UN ESPACIO QUE SE ADAPTA A TI"
        title={preferences ? "Tus preferencias." : "Tu perfil."}
        description="Explora los ajustes con datos de ejemplo."
      />
      <form onSubmit={submit} className="member-edit-form">
        {preferences ? (
          <>
            <label className="member-toggle">
              <span>
                <strong>Recordatorios de clase</strong>
                <small>Ten presente tu próximo entrenamiento.</small>
              </span>
              <input
                type="checkbox"
                checked={reminders}
                onChange={(e) => {
                  setReminders(e.target.checked);
                  setSaved(false);
                }}
              />
            </label>
            <label className="member-toggle">
              <span>
                <strong>Novedades de la comunidad</strong>
                <small>Entérate de lo que viene en Altitud.</small>
              </span>
              <input
                type="checkbox"
                checked={news}
                onChange={(e) => {
                  setNews(e.target.checked);
                  setSaved(false);
                }}
              />
            </label>
          </>
        ) : (
          <div className="member-form-field">
            <label htmlFor="preview-name">Nombre de ejemplo</label>
            <input
              id="preview-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              required
              minLength={2}
              maxLength={60}
            />
            <small>
              Usa un nombre de prueba. Se guardará solo en este navegador.
            </small>
          </div>
        )}
        {error && (
          <p role="alert" className="member-error">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="member-feedback">
            Cambios guardados en esta vista previa.
          </p>
        )}
        <button type="submit" className="member-button">
          Guardar cambios <CheckIcon />
        </button>
        <Link to={base + "/profile"} className="member-text-link">
          Volver al perfil <ArrowRightIcon />
        </Link>
      </form>
    </>
  );
}
