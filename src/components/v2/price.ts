/** Whether a price line can show on the live site: {{SHRUG}} is fine, any other {{TOKEN}} isn't filled in yet. */
export const priceReady = (text?: string) => !!text && (import.meta.env.DEV || !/\{\{[A-Z_]+\}\}/.test(text.replaceAll("{{SHRUG}}", "")));
