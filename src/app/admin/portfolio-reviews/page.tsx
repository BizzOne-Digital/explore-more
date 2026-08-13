import { PortfolioReviewsManager } from "@/components/admin/PortfolioReviewsManager";

export default function AdminPortfolioReviewsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-2">Portfolio Reviews</h1>
      <p className="text-sm text-white/50 mb-6">Review submitted homeschool portfolios and request additional documentation.</p>
      <PortfolioReviewsManager />
    </div>
  );
}
