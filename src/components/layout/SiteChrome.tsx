import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { getSiteNavigation } from "@/lib/queries/navigation";

/** Public marketing chrome — hidden on admin routes. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");
  const navigation = isAdmin ? null : await getSiteNavigation();

  if (isAdmin) {
    return (
      <main id="main-content" className="w-full min-w-0 overflow-x-clip">
        {children}
      </main>
    );
  }

  return (
    <>
      <CinematicIntro />
      <Header navigation={navigation!} />
      <main id="main-content" className="w-full min-w-0 overflow-x-clip">
        {children}
      </main>
      <Footer footerLinks={navigation!.footerLinks} />
    </>
  );
}
