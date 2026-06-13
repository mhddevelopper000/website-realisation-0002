
-- ===== WILAYAS =====
CREATE TABLE public.wilayas (
  code INT PRIMARY KEY,
  name TEXT NOT NULL,
  home_fee INT NOT NULL DEFAULT 800,
  stopdesk_fee INT NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read wilayas" ON public.wilayas FOR SELECT USING (true);
CREATE POLICY "admin manage wilayas" ON public.wilayas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wilayas_updated BEFORE UPDATE ON public.wilayas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.wilayas(code,name,home_fee,stopdesk_fee) VALUES
(1,'Adrar',1400,900),(2,'Chlef',800,450),(3,'Laghouat',900,550),(4,'Oum El Bouaghi',800,450),
(5,'Batna',800,450),(6,'Béjaïa',700,400),(7,'Biskra',900,500),(8,'Béchar',1200,800),
(9,'Blida',500,350),(10,'Bouira',700,400),(11,'Tamanrasset',1600,1100),(12,'Tébessa',900,500),
(13,'Tlemcen',800,450),(14,'Tiaret',800,450),(15,'Tizi Ouzou',600,400),(16,'Alger',500,350),
(17,'Djelfa',900,500),(18,'Jijel',800,450),(19,'Sétif',700,400),(20,'Saïda',800,450),
(21,'Skikda',800,450),(22,'Sidi Bel Abbès',800,450),(23,'Annaba',800,450),(24,'Guelma',800,450),
(25,'Constantine',700,400),(26,'Médéa',700,400),(27,'Mostaganem',800,450),(28,'M''Sila',800,450),
(29,'Mascara',800,450),(30,'Ouargla',1000,600),(31,'Oran',700,400),(32,'El Bayadh',1000,600),
(33,'Illizi',1600,1100),(34,'Bordj Bou Arreridj',700,400),(35,'Boumerdès',600,400),(36,'El Tarf',800,500),
(37,'Tindouf',1600,1100),(38,'Tissemsilt',800,450),(39,'El Oued',1000,600),(40,'Khenchela',800,450),
(41,'Souk Ahras',800,450),(42,'Tipaza',600,400),(43,'Mila',800,450),(44,'Aïn Defla',700,400),
(45,'Naâma',1000,600),(46,'Aïn Témouchent',800,450),(47,'Ghardaïa',1000,600),(48,'Relizane',800,450),
(49,'Timimoun',1400,900),(50,'Bordj Badji Mokhtar',1600,1100),(51,'Ouled Djellal',1000,600),
(52,'Béni Abbès',1400,900),(53,'In Salah',1600,1100),(54,'In Guezzam',1800,1200),(55,'Touggourt',1000,600),
(56,'Djanet',1800,1200),(57,'El M''Ghair',1000,600),(58,'El Meniaa',1200,800),
(59,'Aflou',900,550),(60,'El Abiodh Sidi Cheikh',1000,600),(61,'El Aricha',900,550),(62,'El Kantara',900,500),
(63,'Barika',800,450),(64,'Bou Saâda',900,500),(65,'Bir El Ater',900,500),(66,'Ksar El Boukhari',800,450),
(67,'Ksar Chellala',800,450),(68,'Aïn Oussera',900,500),(69,'Messaâd',900,550);

-- ===== SETTINGS (singleton) =====
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  contact_email TEXT,
  contact_phone TEXT,
  contact_hours TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  whatsapp_number TEXT,
  store_name TEXT DEFAULT 'Fragrance & Essencia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "admin update settings" ON public.settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert settings" ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.settings(id, contact_email, contact_phone, contact_hours, whatsapp_number)
VALUES (1, 'contact@fragrance-essencia.dz', '+213 555 00 00 00', 'Lun – Sam · 9h – 19h', '+213555000000');

-- ===== PRODUCT MEDIA =====
CREATE TABLE public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_media_product ON public.product_media(product_id, sort_order);
GRANT SELECT ON public.product_media TO anon, authenticated;
GRANT ALL ON public.product_media TO service_role;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.product_media FOR SELECT USING (true);
CREATE POLICY "admin manage media" ON public.product_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== PRODUCT CLICKS =====
CREATE TABLE public.product_clicks (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clicks_product_time ON public.product_clicks(product_id, created_at DESC);
GRANT INSERT ON public.product_clicks TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.product_clicks_id_seq TO anon, authenticated;
GRANT ALL ON public.product_clicks TO service_role;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert click" ON public.product_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read clicks" ON public.product_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ===== ROLE confirmateur =====
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'confirmateur';

-- ===== CONFIRMER EARNINGS =====
CREATE TABLE public.confirmer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  confirmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);
GRANT SELECT, INSERT, UPDATE ON public.confirmer_earnings TO authenticated;
GRANT ALL ON public.confirmer_earnings TO service_role;
ALTER TABLE public.confirmer_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "confirmer read own" ON public.confirmer_earnings FOR SELECT TO authenticated
  USING (confirmer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage earnings" ON public.confirmer_earnings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_earnings_updated BEFORE UPDATE ON public.confirmer_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add confirmer_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmer_id UUID REFERENCES auth.users(id);
