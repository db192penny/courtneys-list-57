import { AdminCostManagement } from "@/components/admin/AdminCostManagement";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminCostManagementPage() {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Courtney's List | Admin Cost Management"
        description="Manage community cost submissions and data."
        canonical={canonical}
      />
      <section className="container py-6 md:py-10 max-w-7xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <AdminCostManagement />
      </section>
    </main>
  );
}