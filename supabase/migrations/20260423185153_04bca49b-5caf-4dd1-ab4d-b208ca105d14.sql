DO $$
DECLARE
  demo_uid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Create demo auth user if not exists (system seed account)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_uid) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES (
      demo_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'demo-seed@conquer-top100.local',
      crypt('seed-only-' || gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"demo","display_name":"Demo Seed"}'::jsonb,
      false
    );
  END IF;

  INSERT INTO public.servers (owner_id, name, slug, short_description, long_description, version, rate, region, exp_rate, is_online, vote_count, rating_avg, rating_count, player_count, is_featured)
  VALUES
    (demo_uid, 'Crimson Conquer', 'crimson-conquer', 'High-rate PvP server with custom items, daily events and active GM team.', 'Crimson Conquer is a long-running high-rate Conquer Online private server focused on intense PvP, balanced classes and weekly tournaments with real prizes. Custom gear, fair drop rates, anti-cheat protection.', '5165', '5000x', 'EU', 5000, true, 8420, 4.8, 312, 1240, true),
    (demo_uid, 'Obsidian Realm', 'obsidian-realm', 'Mid-rate classic experience. No pay-to-win, monthly seasons, active community.', 'Obsidian Realm brings back the classic feel. Mid rates, careful balance, no donation gear, fresh seasons every month with leaderboards.', '5517', '300x', 'NA', 300, true, 6210, 4.6, 245, 890, false),
    (demo_uid, 'Phoenix Online', 'phoenix-online', 'Long-term low-rate server with rich economy and player housing.', 'Phoenix Online prioritizes immersion: slow progression, deep economy, guild wars and unique player housing system.', '5516', '50x', 'EU', 50, true, 5980, 4.5, 198, 654, false),
    (demo_uid, 'Bloodmoon CO', 'bloodmoon-co', 'Hardcore server — permadeath cities, weekly castle sieges.', 'Not for the faint of heart. Hardcore mechanics including guild city raids and permadeath zones.', '5165', '1000x', 'AS', 1000, true, 4730, 4.3, 167, 512, false),
    (demo_uid, 'Imperial Dynasty', 'imperial-dynasty', 'Story-driven server with custom quests and a full Tang dynasty expansion.', 'Discover an entirely new questline crafted by our writers. Hundreds of hours of new content.', '5517', '100x', 'NA', 100, true, 3890, 4.4, 142, 430, false),
    (demo_uid, 'Shadow Strike', 'shadow-strike', 'Ninja-focused PvP with custom skills and clan war system.', 'Shadow Strike rebalances every class with a new emphasis on the Ninja meta. Weekly clan wars.', '5165', '500x', 'EU', 500, true, 2940, 4.1, 98, 312, false),
    (demo_uid, 'Iron Throne CO', 'iron-throne-co', 'Medieval-themed conversion mod with custom maps and bosses.', 'A complete visual conversion to a medieval fantasy theme. Custom maps, music and lore.', '5516', '250x', 'NA', 250, true, 1820, 3.9, 67, 198, false),
    (demo_uid, 'Newcomers Realm', 'newcomers-realm', 'Brand new server launched this week — fresh economy, double XP weekend.', 'Just opened. Get in early and dominate the leaderboards. Double XP all weekend.', '5517', '2000x', 'NA', 2000, true, 412, 4.0, 24, 89, false)
  ON CONFLICT (slug) DO NOTHING;
END $$;