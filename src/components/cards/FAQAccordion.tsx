"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface FAQItem {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item._id || index}
            className="overflow-hidden rounded-xl border border-explore-charcoal/10 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left font-medium text-explore-charcoal transition-colors hover:bg-explore-cream/50 sm:gap-4 sm:px-5"
              aria-expanded={isOpen}
            >
              <span className="min-w-0 break-anywhere">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-explore-teal transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="break-anywhere px-4 pb-4 text-sm leading-relaxed text-explore-charcoal/70 sm:px-5">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
