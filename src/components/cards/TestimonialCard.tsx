import Image from "next/image";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  testimonial: {
    authorName: string;
    authorRole?: string;
    content: string;
    rating?: number;
    imageUrl?: string;
  };
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <blockquote className="relative flex flex-col rounded-2xl bg-white border border-explore-charcoal/8 p-6 sm:p-8 shadow-sm h-full">
      <Quote className="absolute top-6 right-6 h-8 w-8 text-explore-lime/40" />
      {testimonial.rating && (
        <div className="mb-4 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < testimonial.rating! ? "fill-explore-orange text-explore-orange" : "text-explore-charcoal/20"}`}
            />
          ))}
        </div>
      )}
      <p className="flex-1 text-explore-charcoal/80 leading-relaxed italic">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      <footer className="mt-6 flex items-center gap-3 border-t border-explore-charcoal/8 pt-5">
        {testimonial.imageUrl ? (
          <Image
            src={testimonial.imageUrl}
            alt=""
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-explore-teal/15 font-display font-bold text-explore-teal">
            {testimonial.authorName.charAt(0)}
          </div>
        )}
        <div>
          <cite className="not-italic font-semibold text-explore-charcoal">{testimonial.authorName}</cite>
          {testimonial.authorRole && (
            <p className="text-xs text-explore-charcoal/50">{testimonial.authorRole}</p>
          )}
        </div>
      </footer>
    </blockquote>
  );
}
