/**
 * Generate an .ics calendar file for a trip and trigger download
 */
export function downloadTripICS(trip: {
  title: string;
  startDate: string;
  days: number;
  mood?: string;
  query?: string;
}) {
  const start = new Date(trip.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + (trip.days || 1));

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const description = [
    `Trip planned with Planzo.ai`,
    trip.mood ? `Mood: ${trip.mood}` : "",
    trip.query ? `Route: ${trip.query}` : "",
    `Duration: ${trip.days} days`,
  ]
    .filter(Boolean)
    .join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Planzo.ai//Trip Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${start.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:🧳 ${trip.title}`,
    `DESCRIPTION:${description}`,
    `STATUS:CONFIRMED`,
    `TRANSP:OPAQUE`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Your trip to ${trip.title} starts tomorrow!`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Your trip to ${trip.title} is in 3 days — time to pack!`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${trip.title.replace(/[^a-zA-Z0-9]/g, "_")}_trip.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open Google Calendar with pre-filled trip event
 */
export function openGoogleCalendar(trip: {
  title: string;
  startDate: string;
  days: number;
  query?: string;
}) {
  const start = new Date(trip.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + (trip.days || 1));

  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `🧳 ${trip.title}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Trip planned with Planzo.ai\n${trip.query ? `Route: ${trip.query}` : ""}`,
    sf: "true",
  });

  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    "_blank"
  );
}
