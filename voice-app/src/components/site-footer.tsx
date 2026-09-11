import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { CookieSettingsButton } from "./cookie-settings-button";
import { NewsletterForm } from "./newsletter-form";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Image src="/brand/logo.svg" alt="Voice of Guinea" width={128} height={66} />
          <p>Le média qui raconte la Guinée d’aujourd’hui, en images et en voix.</p>
        </div>
        <div>
          <h2>Explorer</h2>
          <Link href="/actualites">L’essentiel</Link>
          <Link href="/divertissement">Talents & voix</Link>
          <Link href="/culture">Culture</Link>
        </div>
        <div>
          <h2>Voice of Guinea</h2>
          <Link href="/a-propos">À propos</Link>
          <Link href="/normes-editoriales">Normes éditoriales</Link>
          <Link href="/corrections">Corrections</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/accessibilite">Accessibilité</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <a href={siteConfig.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>
          <CookieSettingsButton />
        </div>
        <div className="footer-newsletter">
          <h2>Newsletter</h2>
          <p>La Guinée, expliquée clairement, sans bruit inutile.</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Voice of Guinea</span>
        <span>Conakry · Montréal · Le monde</span>
      </div>
    </footer>
  );
}
