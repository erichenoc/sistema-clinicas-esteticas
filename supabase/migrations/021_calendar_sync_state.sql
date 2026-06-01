-- =============================================
-- MIGRACIÓN 021: Estado de sincronización de Google Calendar
-- =============================================
-- Soporta el pull automático (al abrir la agenda + cron) con throttle por usuario.
-- =============================================

ALTER TABLE public.google_calendar_tokens
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
