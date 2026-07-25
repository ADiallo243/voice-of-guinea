import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacter la rédaction",
  description: "Contactez la rédaction de Voice of Guinea pour proposer un sujet, signaler une correction ou discuter d’un partenariat.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="shell story-page">
      <span className="section-kicker">Parlons-nous</span>
      <h1>Une information ou une histoire à partager ?</h1>
      <div className="contact-box">
        <div>
          <h2>Écrivez à la rédaction</h2>
          <p>Pour une proposition de sujet, un partenariat ou une correction, notre équipe vous répondra dès que possible.</p>
        </div>
        <a className="button" href="mailto:voiceofguinea@gmail.com">voiceofguinea@gmail.com</a>
      </div>
    </div>
  );
}
