import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { ServerCard, ServerRow } from "@/components/ServerCard";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  server_count?: number;
}

const CategoryServers = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        const [categoryData, serversData] = await Promise.all([
          api.categories.getBySlug(slug),
          api.categories.getServersByCategory(slug)
        ]);

        setCategory(categoryData);
        setServers(serversData || []);
      } catch (err) {
        console.error("Error fetching category data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl h-32 shimmer mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-32 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-10 md:py-14">
        <div className="glass rounded-xl p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Category not found</h2>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Button variant="hero" asChild>
            <Link to="/categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>{category.name} Servers — VoteVault</title>
        <meta name="description" content={`Browse ${category.name} servers. ${category.description}`} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Categories
          </Link>
        </Button>

        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-crimson shrink-0">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
                {category.name}
              </h1>
              <p className="text-muted-foreground mb-3">
                {category.description}
              </p>
              <div className="text-sm font-mono-num text-primary-glow">
                {servers.length} {servers.length === 1 ? 'server' : 'servers'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {servers.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            No servers in this category yet.
          </div>
        ) : (
          servers.map((server, i) => (
            <ServerCard key={server.id} server={server} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryServers;
