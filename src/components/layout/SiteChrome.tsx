import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { getSiteNavigation } from "@/lib/queries/navigation";

/** Public marketing chrome — hidden on admin and parent portal routes. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");
  const isParentPortal = pathname.startsWith("/parent");
  const isStudentPortal = pathname.startsWith("/student");
  const hidePublicChrome = isAdmin || isParentPortal || isStudentPortal;
  const navigation = hidePublicChrome ? null : await getSiteNavigation();

  if (hidePublicChrome) {
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
