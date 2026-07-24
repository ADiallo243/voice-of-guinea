import Image from "next/image";
import Link from "next/link";

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
          <Link href="/contact">Contact</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Voice of Guinea</span>
        <span>Conakry · Montréal · Le monde</span>
      </div>
    </footer>
  );
}
