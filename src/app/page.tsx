import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import {
  PROGRAM_PATHWAYS,
  CORE_PROGRAMS,
  DIFFERENTIATORS,
  HERO_IMAGES,
  BRAND_IMAGES,
  ADVENTURE_FEED_FALLBACK,
} from "@/lib/content/home";
import {
  getUpcomingEvents,
  getFeaturedCourses,
  getFeaturedBooks,
  getFeaturedGalleryImages,
  getFeaturedTestimonials,
  getFeaturedFAQs,
} from "@/lib/queries/public";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import type { PublicEvent, PublicCourse, PublicBook, PublicGalleryImage, PublicTestimonial, PublicFAQ } from "@/types/public";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventCard } from "@/components/cards/EventCard";
import { CourseCard } from "@/components/cards/CourseCard";
import { BookCard } from "@/components/cards/BookCard";
import { StaticProgramCard } from "@/components/cards/ProgramCard";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HomePage() {
  const show = createSectionChecker(await getPageSectionVisibility("home"));
  const [events, courses, books, gallery, testimonials, faqs] = await Promise.all([
    getUpcomingEvents(3).catch((): PublicEvent[] => []),
    getFeaturedCourses(4).catch((): PublicCourse[] => []),
    getFeaturedBooks(4).catch((): PublicBook[] => []),
    getFeaturedGalleryImages(6).catch((): PublicGalleryImage[] => []),
    getFeaturedTestimonials(3).catch((): PublicTestimonial[] => []),
    getFeaturedFAQs(4).catch((): PublicFAQ[] => []),
  ]);

  return (
    <>
      {show("hero") && (
      <section className="relative flex min-h-screen w-full items-center overflow-x-clip bg-explore-charcoal">
        <Image
          src={HERO_IMAGES.home}
          alt="Outdoor education adventure"
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-explore-black/70 via-explore-black/40 to-explore-charcoal" />
        <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 pt-32 pb-24 sm:px-4 sm:pt-36">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-explore-lime sm:text-xs sm:tracking-[0.2em] break-anywhere">
            {COMPANY.motto}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-8xl max-w-4xl break-anywhere">
            Learn Wild.
            <br />
            Live Big.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl md:text-2xl break-anywhere">
            {COMPANY.supportingLine}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 sm:gap-4">
            <Button href="/programs" size="lg" variant="primary">
              Explore Programs
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/events" size="lg" variant="outline" className="border-white/30 text-white hover:border-explore-lime hover:text-explore-lime">
              View Events
            </Button>
          </div>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-3 sm:mt-16 sm:gap-6">
            {[
              { label: "Programs", value: "6+" },
              { label: "Adventures", value: "100+" },
              { label: "Community", value: "Growing" },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="font-display text-2xl sm:text-3xl font-bold text-explore-lime">{stat.value}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-5 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="h-2 w-1 rounded-full bg-explore-lime" />
          </div>
        </div>
      </section>
      )}

      {show("pathways") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-cream topo-bg">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="Find Your Path"
            title="Program Pathways"
            description="Whether you're just starting out or ready to lead, there's a trail for every explorer."
            align="center"
            className="mb-12"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {PROGRAM_PATHWAYS.map((path) => (
              <Link
                key={path.title}
                href={path.href}
                className="group relative overflow-hidden rounded-2xl p-8 text-white transition-transform hover:-translate-y-1"
              >
                <div className={`absolute inset-0 ${path.color} opacity-90`} />
                <div className="relative">
                  <span className="text-4xl mb-4 block">{path.icon}</span>
                  <h3 className="font-display text-2xl font-bold">{path.title}</h3>
                  <p className="mt-2 text-white/80 text-sm leading-relaxed">{path.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-explore-lime group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {show("mission") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-forest text-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              eyebrow="Our Mission"
              title="Wild Minds. Bold Hearts. Limitless Futures."
              description={COMPANY.mission}
              dark
            />
            <Button href="/about" variant="lime" className="mt-8">
              Our Story
            </Button>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src={BRAND_IMAGES.outdoorEducation}
              alt="Students learning outdoors"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
      )}

      {show("core-programs") && (
      <section className="w-full overflow-x-clip py-20 bg-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="What We Offer"
            title="Six Core Programs"
            description="From nature labs to leadership trails — every program is designed for hands-on discovery."
            align="center"
            className="mb-12 mx-auto"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_PROGRAMS.map((program) => (
              <StaticProgramCard
                key={program.slug}
                slug={program.slug}
                title={program.title}
                tagline={program.tagline}
                description={program.description}
                image={program.image}
              />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button href="/programs" variant="secondary">
              View All Programs
            </Button>
          </div>
        </div>
      </section>
      )}

      {show("events") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-sand/50">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <SectionHeading eyebrow="Calendar" title="Upcoming Events" description="Join us for workshops, field trips, and seasonal adventures." />
            <Button href="/events" variant="outline">All Events</Button>
          </div>
          {events.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events yet"
              description="Check back soon — new adventures are always on the horizon."
              actionLabel="Browse Programs"
              actionHref="/programs"
            />
          )}
        </div>
      </section>
      )}

      {show("courses") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <SectionHeading eyebrow="Learn" title="Featured Courses" description="Multi-week journeys in science, art, leadership, and more." />
            <Button href="/courses" variant="outline">All Courses</Button>
          </div>
          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState title="Courses coming soon" actionLabel="Contact Us" actionHref="/contact" />
          )}
        </div>
      </section>
      )}

      {show("books") && (
      <section className="w-full overflow-x-clip py-20 bg-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <SectionHeading eyebrow="Shop" title="Bookstore" description="Curated books that inspire wild minds and bold hearts." />
            <Button href="/books" variant="outline">Visit Bookstore</Button>
          </div>
          {books.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyState title="Books coming soon" actionLabel="Contact Us" actionHref="/contact" />
          )}
        </div>
      </section>
      )}

      {show("adventure-feed") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-charcoal text-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="Gallery"
            title="Adventure Feed"
            description="Snapshots from the field — real learning, real places, real joy."
            dark
            align="center"
            className="mb-12 mx-auto"
          />
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((img) => (
                <div key={img._id} className="relative aspect-square overflow-hidden rounded-xl group">
                  <Image
                    src={img.imageUrl}
                    alt={img.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-explore-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-sm font-medium">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ADVENTURE_FEED_FALLBACK.map((item) => (
                <div key={item.src} className="relative aspect-square overflow-hidden rounded-xl group">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-explore-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-sm font-medium">{item.alt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button href="/gallery" variant="lime">Full Gallery</Button>
          </div>
        </div>
      </section>
      )}

      {show("differentiators") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-cream topo-bg">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="Why Explore More"
            title="What Makes Us Different"
            align="center"
            className="mb-12 mx-auto"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="rounded-2xl bg-white border border-explore-charcoal/8 p-6 shadow-sm">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold text-explore-charcoal">{item.title}</h3>
                <p className="mt-2 text-sm text-explore-charcoal/70 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {show("testimonials") && (
      <section className="w-full overflow-x-clip py-20 bg-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <SectionHeading
            eyebrow="Community Voices"
            title="What Families Say"
            align="center"
            className="mb-12 mx-auto"
          />
          {testimonials.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t._id} testimonial={t} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { authorName: "Parent", authorRole: "Homeschool Family", content: "Explore More Academy transformed how our kids see learning — every outing feels like an adventure.", rating: 5 },
                { authorName: "Educator", authorRole: "Community Partner", content: "The instructors bring genuine passion and safety to every program. Our students always come back energized.", rating: 5 },
                { authorName: "Volunteer", authorRole: "Sponsor", content: "Sponsoring a kid through EMA is the most meaningful investment I've made in our community.", rating: 5 },
              ].map((t, i) => (
                <TestimonialCard key={i} testimonial={t} />
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button href="/testimonials" variant="outline">More Stories</Button>
          </div>
        </div>
      </section>
      )}

      {show("sponsor-cta") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-orange text-white relative overflow-hidden">
        <div className="absolute inset-0 topo-bg opacity-20" />
        <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 text-center">
          <Compass className="h-12 w-12 mx-auto text-explore-lime mb-6" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Become a Sponsor</h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Your gift opens doors to outdoor education, mentorship, and life-changing experiences for youth who need it most.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/sponsor-a-kid" variant="dark">Learn About Sponsorship</Button>
            <Button href="/donate/sponsor-a-kid" variant="lime">Donate Now</Button>
          </div>
        </div>
      </section>
      )}

      {show("faqs") && (
      <section className="w-full overflow-x-clip py-20 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4">
          <SectionHeading eyebrow="Questions" title="FAQs" align="center" className="mb-10 mx-auto" />
          {faqs.length > 0 ? (
            <FAQAccordion items={faqs} />
          ) : (
            <FAQAccordion
              items={[
                { question: "What ages do you serve?", answer: "Our programs typically serve youth ages 6–18, with specific age ranges listed on each program and event page." },
                { question: "Do you offer homeschool-friendly programs?", answer: "Yes! Many of our programs are designed with homeschool families in mind, offering flexible schedules and curriculum-aligned activities." },
                { question: "How do I register for an event?", answer: "Browse our Events page, select an upcoming adventure, and follow the registration link. Some events require a parent account." },
                { question: "Can I request a custom program?", answer: "Absolutely. Visit any program page and submit a service request form — our team will follow up within 2 business days." },
              ]}
            />
          )}
          <div className="mt-8 text-center">
            <Button href="/faqs" variant="outline">All FAQs</Button>
          </div>
        </div>
      </section>
      )}

      {show("newsletter") && (
      <section className="w-full overflow-x-clip py-16 sm:py-20 bg-explore-teal text-white">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4 text-center">
          <SectionHeading
            eyebrow="Stay Connected"
            title="Join the Adventure"
            description="Get event updates, new course announcements, and inspiration delivered to your inbox."
            dark
            align="center"
            className="mb-8 mx-auto"
          />
          <NewsletterForm variant="inline" dark />
        </div>
      </section>
      )}

      {show("final-cta") && (
      <section className="w-full overflow-x-clip py-16 bg-explore-forest text-white text-center">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 sm:px-4">
          <h2 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to Explore More?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Your next adventure is one click away. Programs, events, courses — the trail starts here.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button href="/programs" variant="primary" size="lg">Browse Programs</Button>
            <Button href="/contact" variant="outline" size="lg" className="border-white/30 text-white hover:border-explore-lime hover:text-explore-lime">
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
      )}
    </>
  );
}
