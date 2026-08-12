import Link from "next/link";
import { Compass, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-x-clip bg-explore-charcoal text-white">
      <div className="absolute inset-0 topo-bg opacity-20" />
      <div className="relative w-full min-w-0 max-w-lg px-3 text-center sm:px-4">
        <Compass className="h-16 w-16 mx-auto text-explore-lime mb-6 animate-pulse" />
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-explore-lime sm:tracking-[0.3em]">404</p>
        <h1 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">Trail Not Found</h1>
        <p className="mt-4 text-white/70 leading-relaxed">
          Looks like this path doesn&apos;t exist on our map. The page may have moved, or the adventure hasn&apos;t been charted yet.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/" variant="primary">
            <MapPin className="h-4 w-4" />
            Back to Base Camp
          </Button>
          <Button href="/contact" variant="outline" className="border-white/30 text-white hover:border-explore-lime hover:text-explore-lime">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}
