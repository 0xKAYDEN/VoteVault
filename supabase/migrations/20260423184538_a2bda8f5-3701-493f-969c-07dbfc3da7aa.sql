-- Enums
CREATE TYPE public.app_role AS ENUM ('player', 'server_owner', 'admin');
CREATE TYPE public.server_status AS ENUM ('pending', 'approved', 'rejected', 'banned');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Servers
CREATE TABLE public.servers (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  long_description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  version TEXT,
  rate TEXT,
  region TEXT,
  exp_rate INTEGER DEFAULT 1,
  is_online BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status server_status NOT NULL DEFAULT 'approved',
  vote_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  player_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_servers_vote_count ON public.servers (vote_count DESC);
CREATE INDEX idx_servers_status ON public.servers (status);
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved servers viewable by all" ON public.servers FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own servers" ON public.servers FOR UPDATE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete own servers" ON public.servers FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Votes
CREATE TABLE public.votes (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  server_id BIGINT NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  voter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  voter_ip_hash TEXT,
  voter_user_agent TEXT,
  voter_fingerprint TEXT,
  voter_country TEXT,
  voter_city TEXT,
  challenge_type_passed TEXT,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_votes_server ON public.votes (server_id, voted_at DESC);
CREATE INDEX idx_votes_user ON public.votes (voter_user_id, voted_at DESC);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes counts public" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.votes FOR INSERT WITH CHECK (auth.uid() = voter_user_id);

-- Reviews
CREATE TABLE public.reviews (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  server_id BIGINT NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  owner_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (server_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- API keys
CREATE TABLE public.api_keys (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id BIGINT REFERENCES public.servers(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT,
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own api keys" ON public.api_keys FOR SELECT USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own api keys" ON public.api_keys FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update own api keys" ON public.api_keys FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners delete own api keys" ON public.api_keys FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_servers_updated BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + assign player role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-promote to server_owner when first server is created, and recompute vote_count + ratings
CREATE OR REPLACE FUNCTION public.on_server_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.owner_id, 'server_owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_server_owner_role AFTER INSERT ON public.servers FOR EACH ROW EXECUTE FUNCTION public.on_server_insert();

CREATE OR REPLACE FUNCTION public.on_vote_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_suspicious = false THEN
    UPDATE public.servers SET vote_count = vote_count + 1 WHERE id = NEW.server_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_vote_count AFTER INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.on_vote_insert();

CREATE OR REPLACE FUNCTION public.on_review_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid BIGINT;
BEGIN
  sid := COALESCE(NEW.server_id, OLD.server_id);
  UPDATE public.servers s SET
    rating_avg = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE server_id = sid), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE server_id = sid)
  WHERE s.id = sid;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_reviews_recalc AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.on_review_change();