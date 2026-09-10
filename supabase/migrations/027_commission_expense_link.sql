-- Enlaza cada comision pagada con el gasto que registro la salida de dinero.
-- Sin este enlace las comisiones se pagan sin dejar rastro en el flujo de caja
-- y no hay forma de revertir un pago hecho por error.
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_expense_id ON commissions(expense_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status_period ON commissions(status, period_end);
