// Contact form: sends the enquiry to the Client Workspace as JSON, which puts it in
// the sales pipeline and notifies Shruggie. Without JavaScript the form does nothing,
// and the email address next to it still works.
const ENDPOINT = "https://workspace.shruggie.consulting/api/lead";

type Messages = { sending: string; sent: string; errors: Record<string, string> };

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector<HTMLElement>("[data-status]")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const messages = JSON.parse(form.querySelector("[data-messages]")?.textContent ?? "{}") as Messages;
  const startedAt = Date.now();

  const show = (text: string, kind: "info" | "ok" | "error") => {
    status.textContent = text;
    status.dataset.kind = kind;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? "").trim();
    if (!value("name") || !value("email") || !value("message")) return show(messages.errors.missing, "error");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value("email"))) return show(messages.errors.email, "error");
    if (!data.get("consent")) return show(messages.errors.consent, "error");

    button.disabled = true;
    show(messages.sending, "info");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: value("name"),
          company: value("company"),
          email: value("email"),
          phone: value("phone"),
          message: value("message"),
          website: value("website"),
          consent: true,
          lang: form.dataset.lang,
          t: startedAt,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || "generic");
      form.reset();
      form.classList.add("is-sent");
      show(messages.sent, "ok");
    } catch (err) {
      const key = err instanceof Error ? err.message : "generic";
      show(messages.errors[key] ?? messages.errors.generic, "error");
      button.disabled = false;
    }
  });
}
