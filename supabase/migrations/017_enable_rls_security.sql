-- =============================================
-- MIGRACIÓN 017: Habilitar RLS en tablas expuestas
-- =============================================
-- Contexto: el advisor de seguridad de Supabase detectó que múltiples tablas
-- en el schema `public` tenían RLS DESHABILITADO. Como están expuestas vía
-- PostgREST con la anon key (que es pública, va en el bundle del navegador),
-- cualquiera en Internet podía leer/escribir esos datos directamente saltándose
-- la aplicación.
--
-- La app accede a estas tablas EXCLUSIVAMENTE mediante el service_role
-- (createAdminClient), que BYPASSEA RLS. Por tanto, habilitar RLS cierra la
-- exposición externa SIN romper la aplicación. No se agregan políticas para
-- anon/authenticated de forma intencional: el acceso directo vía REST con la
-- anon key queda denegado.
-- =============================================

ALTER TABLE public.invoice_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_consents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepalive              ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas permisivas USING(true) que efectivamente anulan RLS para
-- anon/authenticated. Estas tablas solo se acceden vía service_role, no afectadas.
DROP POLICY IF EXISTS "Service role full access"        ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Allow all for authenticated"     ON public.quotation_items;
DROP POLICY IF EXISTS "Allow all for authenticated"     ON public.quotations;
DROP POLICY IF EXISTS "Allow all access for service role" ON public.treatment_packages;
