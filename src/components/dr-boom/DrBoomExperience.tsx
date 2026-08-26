"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Zap,
} from "lucide-react";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { cn } from "@/lib/cn";
import {
  DR_BOOM_CONTACT,
  DR_BOOM_EVENT_TYPES,
  DR_BOOM_FAQS,
  DR_BOOM_IMAGES,
  DR_BOOM_MARQUEE,
  DR_BOOM_PACKAGES,
  DEFAULT_DR_BOOM_PACKAGE_ID,
  formatDrBoomPackageLabel,
  type DrBoomPackage,
} from "@/lib/content/dr-boom";

function packageCardStyles(pkg: DrBoomPackage, selected: boolean) {
  const base =
    "relative flex flex-col rounded-2xl border p-6 transition-all duration-300 backdrop-blur-sm";

  if (pkg.variant === "featured") {
    return cn(
      base,
      "border-explore-lime/60 bg-gradient-to-br from-explore-lime/15 via-[#1a2f1a] to-explore-charcoal shadow-[0_0_40px_rgba(184,239,36,0.2)]",
      selected && "ring-2 ring-explore-lime ring-offset-2 ring-offset-explore-black"
    );
  }

  if (pkg.variant === "premium") {
    return cn(
      base,
      "border-explore-orange/40 bg-gradient-to-br from-explore-orange/10 to-explore-charcoal/80",
      selected && "ring-2 ring-explore-orange ring-offset-2 ring-offset-explore-black"
    );
  }

  if (pkg.variant === "custom") {
    return cn(
      base,
      "border-explore-sky/40 bg-gradient-to-br from-explore-sky/10 to-explore-charcoal/80",
      selected && "ring-2 ring-explore-sky ring-offset-2 ring-offset-explore-black"
    );
  }

  return cn(
    base,
    "border-white/10 bg-white/5 hover:border-explore-lime/30 hover:bg-white/[0.07]",
    selected && "ring-2 ring-explore-teal ring-offset-2 ring-offset-explore-black"
  );
}

export function DrBoomExperience() {
  const [selectedPackageId, setSelectedPackageId] = useState(DEFAULT_DR_BOOM_PACKAGE_ID);
  const selectedPackage =
    DR_BOOM_PACKAGES.find((p) => p.id === selectedPackageId) ??
    DR_BOOM_PACKAGES.find((p) => p.id === DEFAULT_DR_BOOM_PACKAGE_ID)!;

  const packageOptions = useMemo(
    () =>
      DR_BOOM_PACKAGES.map((pkg) => ({
        value: pkg.id,
        label: formatDrBoomPackageLabel(pkg),
      })),
    []
  );

  function scrollToBooking(pkgId?: string) {
    if (pkgId) setSelectedPackageId(pkgId);
    document.getElementById("booking-lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const pkg =
      DR_BOOM_PACKAGES.find((p) => p.id === String(data.get("package"))) ?? selectedPackage;

    const eventType =
      DR_BOOM_EVENT_TYPES.find((t) => t.value === String(data.get("eventType")))?.label ??
      String(data.get("eventType") || "Not specified");

    const travelNote = data.get("travelRequired") ? "Yes — may require travel outside local area" : "No";

    const lines = [
      "DR. BOOM BOOKING REQUEST",
      "========================",
      "",
      `Package: ${formatDrBoomPackageLabel(pkg)}`,
      "",
      `Name: ${data.get("name")}`,
      `Organization: ${data.get("organization") || "—"}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone") || "—"}`,
      "",
      `Requested Date: ${data.get("eventDate")}`,
      `Requested Start Time: ${data.get("startTime") || "—"}`,
      `Event Type: ${eventType}`,
      `Estimated Attendance: ${data.get("attendance") || "—"}`,
      `Venue: ${data.get("venue") || "—"}`,
      `City / State: ${data.get("location")}`,
      `Travel outside local area: ${travelNote}`,
      "",
      "Event Details:",
      String(data.get("details") || "—"),
      "",
      "— Sent from Explore More Academy Dr. Boom Booking Lab",
    ];

    const subject = encodeURIComponent(`Dr. Boom Booking — ${pkg.name} — ${data.get("eventDate")}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${DR_BOOM_CONTACT.email}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[92vh] overflow-hidden bg-explore-black text-white">
        <div className="absolute inset-0">
          <Image
            src={DR_BOOM_IMAGES.stage}
            alt=""
            fill
            priority
            className="object-cover object-center opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-explore-black/70 via-explore-black/50 to-explore-black" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(184,239,36,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 20%, rgba(255,90,16,0.2) 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="relative mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-28 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-explore-lime/30 bg-explore-lime/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-explore-lime">
            <Sparkles className="h-3.5 w-3.5" />
            Official Dr. Boom Booking Lab
          </p>

          <div className="relative mt-8 w-full max-w-md">
            <div className="absolute -inset-4 rounded-full bg-explore-lime/20 blur-3xl" />
            <Image
              src={DR_BOOM_IMAGES.logo}
              alt="Dr. Boom Science logo"
              width={640}
              height={640}
              priority
              quality={100}
              unoptimized
              className="relative mx-auto h-auto w-full max-w-[min(100%,520px)]"
            />
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="text-explore-orange">BOOK</span>{" "}
            <span className="text-explore-lime">DR. BOOM</span>
          </h1>
          <p className="mt-2 font-display text-2xl font-bold text-white/90 sm:text-3xl">
            LET&apos;S MAKE SCIENCE!
          </p>

          <p className="mt-6 max-w-2xl text-base text-white/75 sm:text-lg">
            Bring Explore More Academy&apos;s Chief of Wacky Discoveries to your school, library, camp,
            festival, community event, birthday celebration, or special program. Pick your package,
            tell us about your event, and send your booking request straight to the Dr. Boom team.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => scrollToBooking()}
              className="inline-flex items-center gap-2 rounded-full bg-explore-orange px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,90,16,0.45)] transition hover:bg-explore-orange/90 hover:shadow-[0_0_40px_rgba(255,90,16,0.55)]"
            >
              <Zap className="h-4 w-4" />
              View Packages
            </button>
            <a
              href={`mailto:${DR_BOOM_CONTACT.email}?subject=Dr. Boom Booking Question`}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Mail className="h-4 w-4" />
              Ask a Booking Question
            </a>
          </div>
        </div>

        <div className="dr-boom-marquee border-y border-explore-lime/20 bg-explore-black/80 py-3 text-sm font-bold uppercase tracking-widest text-explore-lime/90">
          <div className="dr-boom-marquee-track">
            <span>{DR_BOOM_MARQUEE}</span>
            <span>{DR_BOOM_MARQUEE}</span>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="relative overflow-hidden bg-explore-black py-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(184,239,36,0.03) 48px, rgba(184,239,36,0.03) 49px)",
          }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-explore-lime">
              Choose Your Experiment
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
              DR. BOOM BOOKING PACKAGES
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/65">
              Choose the appearance length that best fits your event. The 60-minute Ultimate Meet &amp;
              Greet is our featured package.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {DR_BOOM_PACKAGES.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <article
                  key={pkg.id}
                  className={cn(
                    packageCardStyles(pkg, isSelected),
                    pkg.featured && "xl:scale-[1.02]"
                  )}
                >
                  {pkg.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-explore-lime px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-explore-black">
                      Featured Package
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                        {pkg.duration}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold">
                        <span className="mr-1">{pkg.emoji}</span>
                        {pkg.name}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        "font-display text-2xl font-bold",
                        pkg.variant === "featured" ? "text-explore-lime" : "text-explore-orange"
                      )}
                    >
                      {pkg.price}
                    </p>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-white/70">
                    {pkg.description.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-explore-lime">▸</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => scrollToBooking(pkg.id)}
                    className={cn(
                      "mt-6 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wide transition",
                      pkg.variant === "featured"
                        ? "bg-explore-lime text-explore-black hover:bg-explore-lime/90 shadow-[0_0_20px_rgba(184,239,36,0.35)]"
                        : pkg.variant === "premium"
                          ? "bg-explore-orange text-white hover:bg-explore-orange/90"
                          : pkg.variant === "custom"
                            ? "border border-explore-sky/50 bg-explore-sky/20 text-white hover:bg-explore-sky/30"
                            : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
                    )}
                  >
                    {pkg.cta}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking form */}
      <section
        id="booking-lab"
        className="relative overflow-hidden bg-gradient-to-b from-[#0d1410] to-explore-black py-20 text-white"
      >
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-explore-teal/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-explore-orange/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-explore-teal">
              Booking Laboratory
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">REQUEST DR. BOOM</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/65">
              Complete the form below. When you press Send Booking Request, your email app will open
              with the booking details addressed to Dr. Boom.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-explore-lime/25 bg-explore-lime/10 px-5 py-4 text-center text-sm text-explore-lime">
            <strong>Selected Package:</strong> {formatDrBoomPackageLabel(selectedPackage)}
          </div>

          <form
            onSubmit={handleBookingSubmit}
            className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(12,137,145,0.08)] backdrop-blur-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">
                  Your Name <span className="text-explore-orange">*</span>
                </span>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                  placeholder="Jane Smith"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">School / Organization</span>
                <input
                  name="organization"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                  placeholder="Waldorf Elementary"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">
                  Email <span className="text-explore-orange">*</span>
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                  placeholder="you@school.org"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">Phone</span>
                <input
                  name="phone"
                  type="tel"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                  placeholder="(240) 944-1959"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">
                  Requested Event Date <span className="text-explore-orange">*</span>
                </span>
                <input
                  name="eventDate"
                  type="date"
                  required
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">Requested Start Time</span>
                <input
                  name="startTime"
                  type="time"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">
                  Event Type <span className="text-explore-orange">*</span>
                </span>
                <select
                  name="eventType"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                >
                  {DR_BOOM_EVENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={!opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">Estimated Attendance</span>
                <input
                  name="attendance"
                  type="number"
                  min={1}
                  placeholder="150"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-white/80">
                  Package <span className="text-explore-orange">*</span>
                </span>
                <select
                  name="package"
                  required
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                >
                  {packageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">Venue Name</span>
                <input
                  name="venue"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                  placeholder="Community Center"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white/80">
                  Event City / State <span className="text-explore-orange">*</span>
                </span>
                <input
                  name="location"
                  required
                  placeholder="Waldorf, MD"
                  className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-white/80">Tell Dr. Boom About Your Event</span>
              <textarea
                name="details"
                rows={5}
                placeholder="Audience, age group, schedule, venue, special requests..."
                className="w-full rounded-xl border border-white/15 bg-explore-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-explore-lime focus:outline-none focus:ring-2 focus:ring-explore-lime/20"
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <input
                name="travelRequired"
                type="checkbox"
                className="mt-1 rounded border-white/30 bg-explore-black/60"
              />
              <span className="text-sm text-white/70">
                This event may require Dr. Boom to travel outside the local service area. Travel fees,
                if applicable, are quoted separately based on event location.
              </span>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-explore-orange py-4 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(255,90,16,0.4)] transition hover:bg-explore-orange/90"
            >
              <Zap className="h-4 w-4" />
              Send Booking Request
            </button>

            <p className="text-center text-xs text-white/45">
              Submitting this request does not automatically confirm your booking. The Dr. Boom team
              will review availability and contact you with confirmation and any applicable travel or
              custom-event charges.
            </p>
          </form>
        </div>
      </section>

      {/* Help CTA */}
      <section className="bg-explore-cream py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">
            NEED HELP CHOOSING?
          </h2>
          <p className="mt-4 text-explore-charcoal/70">
            Email the Dr. Boom booking team and tell us what kind of event you&apos;re planning.
            We&apos;ll help you select the best appearance option.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:${DR_BOOM_CONTACT.email}?subject=Dr. Boom Booking Help`}
              className="inline-flex items-center gap-2 rounded-full bg-explore-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-explore-teal/90"
            >
              <Mail className="h-4 w-4" />
              Email Dr. Boom
            </a>
            <a
              href={`tel:${DR_BOOM_CONTACT.phoneTel}`}
              className="inline-flex items-center gap-2 rounded-full border border-explore-charcoal/15 bg-white px-6 py-3 text-sm font-semibold text-explore-charcoal transition hover:border-explore-teal hover:text-explore-teal"
            >
              <Phone className="h-4 w-4" />
              Call {DR_BOOM_CONTACT.phone}
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-explore-teal">
              Booking Questions
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-explore-charcoal">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>
          <div className="mt-10">
            <FAQAccordion items={[...DR_BOOM_FAQS]} />
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="border-t border-white/10 bg-explore-charcoal py-12 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 sm:px-6 lg:flex-row lg:justify-between">
          <div className="text-center lg:text-left">
            <p className="font-display text-xl font-bold">Explore More Academy LLC</p>
            <p className="mt-1 text-explore-lime">Explore • Discover • Thrive.</p>
            <p className="text-sm text-white/60">Learn Wild. Live Big.</p>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="font-semibold text-explore-lime">Dr. Boom Booking</span>
              <a
                href={`mailto:${DR_BOOM_CONTACT.email}`}
                className="flex items-center gap-1.5 text-white/75 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                {DR_BOOM_CONTACT.email}
              </a>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="font-semibold text-explore-lime">Phone</span>
              <a
                href={`tel:${DR_BOOM_CONTACT.phoneTel}`}
                className="flex items-center gap-1.5 text-white/75 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                {DR_BOOM_CONTACT.phone}
              </a>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="font-semibold text-explore-lime">Website</span>
              <a
                href={DR_BOOM_CONTACT.website}
                className="flex items-center gap-1.5 text-white/75 hover:text-white"
              >
                <MapPin className="h-3.5 w-3.5" />
                ExploreMoreAcademy.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
