-- ============================================
-- ESQUEMA DE BASE DE DATOS - CLÍNICA ESTÉTICA
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

CREATE TYPE patient_status AS ENUM ('active', 'inactive', 'vip', 'new');
CREATE TYPE fitzpatrick_type AS ENUM ('I', 'II', 'III', 'IV', 'V', 'VI');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'check', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded', 'cancelled');
CREATE TYPE document_type AS ENUM ('cedula', 'passport', 'rnc');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE currency AS ENUM ('DOP', 'USD');
CREATE TYPE ncf_type AS ENUM ('B01', 'B02', 'B14', 'B15', 'B16');

-- ============================================
-- TABLAS DE CONFIGURACIÓN
-- ============================================

-- Clínicas
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  rnc VARCHAR(11),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sucursales
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_main BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles de usuario
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios/Profesionales (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  branch_id UUID REFERENCES branches(id),
  role_id UUID REFERENCES roles(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  specialty VARCHAR(255),
  license_number VARCHAR(100),
  is_professional BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE PACIENTES
-- ============================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  code VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  phone_secondary VARCHAR(20),
  document_type document_type DEFAULT 'cedula',
  document_number VARCHAR(20),
  gender gender,
  birth_date DATE,
  address TEXT,
  city VARCHAR(100),
  occupation VARCHAR(100),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  referral_source VARCHAR(100),
  referred_by UUID REFERENCES patients(id),
  status patient_status DEFAULT 'new',
  fitzpatrick_type fitzpatrick_type,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial médico del paciente
CREATE TABLE patient_medical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  allergies TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  previous_surgeries TEXT[] DEFAULT '{}',
  previous_aesthetic_treatments TEXT[] DEFAULT '{}',
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_breastfeeding BOOLEAN DEFAULT FALSE,
  uses_retinoids BOOLEAN DEFAULT FALSE,
  sun_exposure_level VARCHAR(50),
  additional_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imágenes del paciente (antes/después)
CREATE TABLE patient_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID,
  image_url TEXT NOT NULL,
  image_type VARCHAR(50) DEFAULT 'before',
  body_zone VARCHAR(100),
  notes TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos del paciente
CREATE TABLE patient_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  document_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE TRATAMIENTOS
-- ============================================

CREATE TABLE treatment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  category_id UUID REFERENCES treatment_categories(id),
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  price DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2) DEFAULT 0,
  currency currency DEFAULT 'DOP',
  requires_consent BOOLEAN DEFAULT FALSE,
  contraindications TEXT[] DEFAULT '{}',
  post_care_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_sessions INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency currency DEFAULT 'DOP',
  validity_days INT DEFAULT 365,
  is_active BOOLEAN DEFAULT TRUE,
  treatments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE AGENDA
-- ============================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE professional_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id),
  treatment_id UUID REFERENCES treatments(id),
  room_id UUID REFERENCES rooms(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE SESIONES CLÍNICAS
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id),
  treatment_id UUID REFERENCES treatments(id),
  session_date TIMESTAMPTZ DEFAULT NOW(),
  zones_treated TEXT[] DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  products_used JSONB DEFAULT '[]',
  observations TEXT,
  adverse_reactions TEXT,
  patient_signature_url TEXT,
  professional_signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id),
  note_type VARCHAR(50) DEFAULT 'general',
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE FACTURACIÓN
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  patient_id UUID REFERENCES patients(id),
  invoice_number VARCHAR(50) NOT NULL,
  ncf VARCHAR(20),
  ncf_type ncf_type,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency currency DEFAULT 'DOP',
  status payment_status DEFAULT 'pending',
  notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id),
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 18,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  patient_id UUID REFERENCES patients(id),
  quote_number VARCHAR(50) NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency currency DEFAULT 'DOP',
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id),
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 18,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference VARCHAR(100),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE INVENTARIO
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'unit',
  cost DECIMAL(12,2) DEFAULT 0,
  price DECIMAL(12,2) DEFAULT 0,
  min_stock INT DEFAULT 0,
  is_consumable BOOLEAN DEFAULT TRUE,
  is_for_sale BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, product_id)
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE CONSENTIMIENTOS
-- ============================================

CREATE TABLE consent_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  treatment_id UUID REFERENCES treatments(id),
  content TEXT NOT NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE signed_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES consent_templates(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  content_snapshot TEXT NOT NULL,
  patient_signature_url TEXT NOT NULL,
  witness_signature_url TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE AUDITORÍA
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_document ON patients(document_number);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Política básica para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
