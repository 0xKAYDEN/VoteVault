-- Categories table
CREATE TABLE public.categories (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON public.categories (slug);
CREATE INDEX idx_categories_active ON public.categories (is_active, display_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by all" ON public.categories FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Server categories junction table (many-to-many)
CREATE TABLE public.server_categories (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (server_id, category_id)
);

CREATE INDEX idx_server_categories_server ON public.server_categories (server_id);
CREATE INDEX idx_server_categories_category ON public.server_categories (category_id);

ALTER TABLE public.server_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Server categories viewable by all" ON public.server_categories FOR SELECT USING (true);
CREATE POLICY "Server owners manage their categories" ON public.server_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.servers WHERE id = server_id AND owner_id = auth.uid())
);
CREATE POLICY "Server owners delete their categories" ON public.server_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.servers WHERE id = server_id AND owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon, display_order) VALUES
  ('MMORPG', 'mmorpg', 'Massively Multiplayer Online Role-Playing Games', 'Swords', 1),
  ('Action', 'action', 'Fast-paced action and combat games', 'Zap', 2),
  ('PvP', 'pvp', 'Player vs Player focused servers', 'Crossed Swords', 3),
  ('PvE', 'pve', 'Player vs Environment focused servers', 'Shield', 4),
  ('Roleplay', 'roleplay', 'Roleplay and story-driven servers', 'Drama', 5),
  ('Survival', 'survival', 'Survival and crafting focused games', 'Tent', 6),
  ('Sandbox', 'sandbox', 'Open world sandbox games', 'Box', 7),
  ('Fantasy', 'fantasy', 'Fantasy themed games and servers', 'Wand', 8),
  ('Sci-Fi', 'sci-fi', 'Science fiction themed servers', 'Rocket', 9),
  ('Medieval', 'medieval', 'Medieval themed servers', 'Castle', 10),
  ('Anime', 'anime', 'Anime styled games and servers', 'Sparkles', 11),
  ('Hardcore', 'hardcore', 'Hardcore difficulty servers', 'Skull', 12),
  ('Casual', 'casual', 'Casual and relaxed gameplay', 'Coffee', 13),
  ('High Rate', 'high-rate', 'High experience and drop rates', 'TrendingUp', 14),
  ('Low Rate', 'low-rate', 'Low rates, classic experience', 'TrendingDown', 15),
  ('Custom', 'custom', 'Custom content and modifications', 'Wrench', 16),
  ('Classic', 'classic', 'Classic/Vanilla gameplay', 'Clock', 17),
  ('Free to Play', 'free-to-play', 'Completely free to play servers', 'DollarSign', 18),
  ('Pay to Win', 'pay-to-win', 'Pay to win mechanics', 'CreditCard', 19),
  ('International', 'international', 'International multi-language servers', 'Globe', 20);
