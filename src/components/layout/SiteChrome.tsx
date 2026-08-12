import { headers } from "next/headers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CinematicIntro } from "@/components/intro/CinematicIntro";

/** Public marketing chrome — hidden on admin routes. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

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
      <Header />
      <main id="main-content" className="w-full min-w-0 overflow-x-clip">
        {children}
      </main>
      <Footer />
    </>
  );
}
