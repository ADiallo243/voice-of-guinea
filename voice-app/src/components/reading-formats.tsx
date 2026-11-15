import Link from "next/link";
import { readingFormats } from "@/lib/reading";

export function ReadingFormats() {
  return <section className="shell section-space" aria-labelledby="formats-title">
    <div className="section-title-row"><div><span className="section-kicker">Vos rendez-vous</span><h2 id="formats-title">Une autre façon de suivre la Guinée</h2></div></div>
    <div className="reading-formats">{readingFormats.map((format, index) => <Link className="reading-format" href={`/rendez-vous/${format.slug}`} key={format.slug} data-reading-format={format.slug}>
      <span className="section-kicker">0{index + 1} · {format.label}</span><h3>{format.title}</h3><p>{format.description}</p><strong>Découvrir la sélection →</strong>
    </Link>)}</div>
  </section>;
}
