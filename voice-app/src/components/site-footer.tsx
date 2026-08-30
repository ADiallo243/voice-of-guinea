import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { NewsletterForm } from "./newsletter-form";
import { PrivacyPreferencesButton } from "./privacy-preferences-button";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Image src="/brand/logo.svg" alt="Voice of Guinea" width={128} height={66} />
          <p>Une voix indépendante pour raconter la Guinée, ses talents et ses transformations.</p>
        </div>
        <div>
          <h2>Explorer</h2>
          <Link href="/actualites">Actualités</Link>
          <Link href="/culture">Culture</Link>
          <Link href="/divertissement">Divertissement</Link>
        </div>
        <div>
          <h2>Voice of Guinea</h2>
          <Link href="/a-propos">À propos</Link>
          <Link href="/normes-editoriales">Normes éditoriales</Link>
          <Link href="/corrections">Corrections</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/contact">Contact</Link>
          <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>
        </div>
        <div className="footer-newsletter">
          <h2>Newsletter</h2>
          <p>Recevez notre sélection d’actualités directement dans votre boîte mail.</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Voice of Guinea</span>
        <div>
          <span>Conakry · Montréal · Le monde</span>
          <PrivacyPreferencesButton />
        </div>
      </div>
    </footer>
  );
}
