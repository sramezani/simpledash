/** The summary line above the numbers (docs/SPEC.md section 11.1). */
export function SummaryLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">
        Summary
      </h2>
      <p className="text-lg font-medium tracking-tight text-pretty sm:text-xl">{text}</p>
    </section>
  );
}
