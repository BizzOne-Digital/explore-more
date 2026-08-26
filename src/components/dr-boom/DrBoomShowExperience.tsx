"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Sparkles, Zap } from "lucide-react";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { DrBoomExcitementMeter } from "@/components/dr-boom/DrBoomExcitementMeter";
import { DrBoomSubNav } from "@/components/dr-boom/DrBoomSubNav";
import {
  DR_BOOM_CONTACT,
  DR_BOOM_DEMONSTRATIONS,
  DR_BOOM_DISCOVERY_STEPS,
  DR_BOOM_EXPERIENCE_ADDONS,
  DR_BOOM_IMAGES,
  DR_BOOM_JUNIOR_SCIENTIST,
  DR_BOOM_SCIENCE_TOPICS,
  DR_BOOM_SHOW_FAQS,
  DR_BOOM_SHOW_MARQUEE,
  DR_BOOM_VENUES,
} from "@/lib/content/dr-boom";

function SectionTitle({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-explore-lime">{eyebrow}</p>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 max-w-2xl text-white/65">{description}</p>}
    </div>
  );
}

export function DrBoomShowExperience() {
  return (
    <>
      <DrBoomSubNav />

      {/* Hero */}
      <section className="relative min-h-[90vh] overflow-hidden bg-explore-black text-white">
        <div className="absolute inset-0">
          <Image
            src={DR_BOOM_IMAGES.spectacular}
            alt=""
            fill
            priority
            className="object-cover object-center opacity-45"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-explore-black/80 via-explore-black/55 to-explore-black" />
        </div>

        <div className="relative mx-auto flex min-h-[90vh] w-full max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
          <p className="rounded-full border border-explore-orange/40 bg-explore-orange/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-explore-orange">
            ⚠️ CAUTION: EXTREME CURIOSITY AHEAD!
          </p>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-explore-lime">
            <Sparkles className="h-4 w-4" />
            Explore More Academy Presents
          </p>

          <div className="mt-6 font-display text-5xl font-black leading-none sm:text-7xl lg:text-8xl">
            <span className="text-explore-lime">DR.</span>
            <br />
            <span className="text-explore-orange drop-shadow-[0_0_30px_rgba(255,90,16,0.5)]">BOOM</span>
            <br />
            <span className="text-explore-sky text-4xl sm:text-5xl lg:text-6xl">SCIENCE</span>
          </div>

          <p className="mt-8 max-w-3xl text-base text-white/80 sm:text-lg">
            Get ready for a wild, hilarious, high-energy science adventure with Dr. Boom — Chief of
            Wacky Discoveries! Students experience bubbling reactions, air pressure, chemistry,
            physics, fog, flying objects, audience participation, laughter, and unforgettable
            discoveries.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dr-boom/book"
              className="inline-flex items-center gap-2 rounded-full bg-explore-orange px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,90,16,0.45)] transition hover:bg-explore-orange/90"
            >
              <Zap className="h-4 w-4" />
              Book Dr. Boom
            </Link>
            <a
              href="#show"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              See the Science Spectacular
            </a>
          </div>

          <div className="relative mt-12 w-full max-w-xs">
            <Image
              src={DR_BOOM_IMAGES.logo}
              alt="Dr. Boom Science logo"
              width={320}
              height={320}
              className="mx-auto drop-shadow-[0_0_40px_rgba(184,239,36,0.35)]"
            />
          </div>
        </div>

        <div className="dr-boom-marquee border-y border-explore-lime/20 bg-explore-black/90 py-3 text-sm font-bold uppercase tracking-widest text-explore-lime/90">
          <div className="dr-boom-marquee-track">
            <span>{DR_BOOM_SHOW_MARQUEE}</span>
            <span>{DR_BOOM_SHOW_MARQUEE}</span>
          </div>
        </div>
      </section>

      {/* Meet Dr. Boom */}
      <section id="meet" className="bg-explore-black py-20 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionTitle
              eyebrow="Meet Dr. Boom"
              title="Chief of Wacky Discoveries"
              description="Wild green hair. Giant goggles. Colorful experiments. Endless curiosity. Dr. Boom makes science feel like an adventure."
            />
            <p className="mt-4 inline-block rounded-full border border-explore-lime/40 bg-explore-lime/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-explore-lime">
              LAB LEVEL: WACKY
            </p>
            <h3 className="mt-8 font-display text-2xl font-bold text-white">
              Science Isn&apos;t Just Something You Read About.
            </h3>
            <p className="mt-4 text-white/70">
              It&apos;s something you experience. Dr. Boom travels to schools, libraries, camps,
              homeschool groups, and community events searching for the next great discovery and
              recruiting students to become Junior Scientists.
            </p>
            <blockquote className="mt-6 rounded-2xl border border-explore-orange/30 bg-explore-orange/10 p-5 font-display text-lg font-bold text-explore-orange">
              He asks one of the most important questions in science:
              <br />
              <span className="text-white">&ldquo;What do YOU think is going to happen?&rdquo;</span>
            </blockquote>
          </div>
          <DrBoomExcitementMeter />
        </div>

        <div className="mx-auto mt-16 grid w-full max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {DR_BOOM_DISCOVERY_STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition hover:border-explore-lime/30 hover:bg-white/[0.07]"
            >
              <span className="text-4xl">{step.emoji}</span>
              <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-white/65">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Show */}
      <section id="show" className="bg-gradient-to-b from-[#0d1410] to-explore-black py-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="The Science Spectacular"
            title="THIS IS NOT A NORMAL SCIENCE CLASS!"
            description="A 45–60 minute interactive STEM experience built for excitement, participation, and real learning."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DR_BOOM_VENUES.map((venue) => (
              <div
                key={venue.title}
                className="rounded-2xl border border-explore-teal/25 bg-explore-teal/10 p-6"
              >
                <span className="text-3xl">{venue.emoji}</span>
                <h3 className="mt-4 font-display text-lg font-bold">{venue.title}</h3>
                <p className="mt-2 text-sm text-white/70">{venue.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiments */}
      <section id="experiments" className="bg-explore-black py-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="Signature Demonstrations"
            title="WHAT WILL DR. BOOM BLOW YOUR MIND WITH?"
            description="Each performance can feature a selection of exciting, venue-appropriate demonstrations."
            className="text-center mx-auto"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DR_BOOM_DEMONSTRATIONS.map((demo) => (
              <article
                key={demo.title}
                className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 transition hover:border-explore-lime/40 hover:shadow-[0_0_25px_rgba(184,239,36,0.1)]"
              >
                <span className="text-2xl transition group-hover:scale-110">{demo.emoji}</span>
                <h3 className="mt-3 font-display font-bold text-explore-lime">{demo.title}</h3>
                <p className="mt-2 text-sm text-white/65">{demo.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* More than a show */}
      <section className="bg-explore-cream py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-explore-teal">More Than A Show</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-explore-charcoal sm:text-4xl">
              REAL SCIENCE. RIDICULOUS FUN.
            </h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {DR_BOOM_SCIENCE_TOPICS.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-explore-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-explore-charcoal shadow-sm"
              >
                {topic}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center font-display text-xl font-bold text-explore-charcoal">
            The goal is for a child to leave thinking:
            <br />
            <span className="text-explore-orange">&ldquo;I WANT TO KNOW WHY THAT HAPPENED!&rdquo;</span>
          </p>
        </div>
      </section>

      {/* Junior Scientists */}
      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="Junior Scientists"
            title="THE AUDIENCE BECOMES THE LAB CREW."
            description="Dr. Boom doesn't just perform for students — he brings them into the adventure."
            className="text-explore-charcoal [&_h2]:text-explore-charcoal [&_p]:text-explore-charcoal/70"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DR_BOOM_JUNIOR_SCIENTIST.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-explore-charcoal/10 bg-explore-cream p-6 text-center"
              >
                <span className="text-4xl">{item.emoji}</span>
                <h3 className="mt-4 font-display text-lg font-bold text-explore-charcoal">{item.title}</h3>
                <p className="mt-2 text-sm text-explore-charcoal/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-explore-black py-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Make It Bigger" title="Add to Your Dr. Boom Experience" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DR_BOOM_EXPERIENCE_ADDONS.map((addon) => (
              <div
                key={addon.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <span className="text-3xl">{addon.emoji}</span>
                <h3 className="mt-4 font-display font-bold text-explore-lime">{addon.title}</h3>
                <p className="mt-2 text-sm text-white/65">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-explore-orange via-explore-lime/80 to-explore-orange py-16">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)" }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-black uppercase text-explore-black sm:text-3xl">
            TURN YOUR SCHOOL INTO DR. BOOM&apos;S WACKY SCIENCE LAB!
          </h2>
          <p className="mt-4 text-sm font-medium text-explore-black/80">
            Warning: your gymnasium, cafeteria, auditorium, classroom, library, camp, or event space
            may experience uncontrollable laughter, giant reactions, wild predictions, flying
            science, and sudden outbreaks of curiosity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dr-boom/book"
              className="inline-flex items-center gap-2 rounded-full bg-explore-black px-8 py-3.5 text-sm font-bold uppercase text-white transition hover:bg-explore-charcoal"
            >
              <Zap className="h-4 w-4" />
              Request a Show
            </Link>
            <a
              href={`tel:${DR_BOOM_CONTACT.phoneTel}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-explore-black bg-white px-8 py-3.5 text-sm font-bold text-explore-black transition hover:bg-explore-cream"
            >
              <Phone className="h-4 w-4" />
              Call {DR_BOOM_CONTACT.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Sponsor */}
      <section className="bg-explore-cream py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-explore-teal">
            Community Partnership
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">
            Sponsor a Dr. Boom Science Spectacular
          </h2>
          <p className="mt-4 text-explore-charcoal/70">
            Businesses, organizations, and community leaders can help bring unforgettable STEM
            experiences to local students while supporting educational materials, equipment, school
            programs, and community outreach.
          </p>
          <Link
            href="/sponsor-a-kid"
            className="mt-8 inline-flex rounded-full bg-explore-teal px-8 py-3 text-sm font-bold text-white transition hover:bg-explore-teal/90"
          >
            Sponsor a School
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-explore-teal">Questions?</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-explore-charcoal">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mt-10">
            <FAQAccordion items={[...DR_BOOM_SHOW_FAQS]} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-explore-charcoal py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-xl font-bold text-explore-lime">
            Explore More Academy LLC
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            ARE YOU READY TO MAKE A DISCOVERY?
          </h2>
          <p className="mt-4 text-white/70">
            The experiments are ready. Dr. Boom has his goggles. Science is waiting.
          </p>
          <Link
            href="/dr-boom/book"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-explore-orange px-10 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_30px_rgba(255,90,16,0.4)] transition hover:bg-explore-orange/90"
          >
            <Zap className="h-4 w-4" />
            Book Dr. Boom Now
          </Link>
        </div>
      </section>

      {/* Contact strip */}
      <section className="border-t border-white/10 bg-explore-black py-10 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-display font-bold">Explore More Academy LLC</p>
            <p className="text-explore-lime text-sm">Explore • Discover • Thrive.</p>
            <p className="text-xs text-white/50">Learn Wild. Live Big.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/75">
            <a href={`tel:${DR_BOOM_CONTACT.phoneTel}`}>{DR_BOOM_CONTACT.phone}</a>
            <a href={`mailto:${DR_BOOM_CONTACT.email}`}>{DR_BOOM_CONTACT.email}</a>
            <a href={DR_BOOM_CONTACT.website}>ExploreMoreAcademy.com</a>
          </div>
        </div>
      </section>
    </>
  );
}
