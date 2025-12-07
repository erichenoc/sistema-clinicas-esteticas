-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TIPOS ENUMERADOS
CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'vip', 'new');
CREATE TYPE fitzpatrick_type AS ENUM ('I', 'II', 'III', 'IV', 'V', 'VI');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'check', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded', 'cancelled');
CREATE TYPE document_type AS ENUM ('cedula', 'passport', 'rnc');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE currency AS ENUM ('DOP', 'USD');
CREATE TYPE ncf_type AS ENUM ('B01', 'B02', 'B14', 'B15', 'B16');
