-- Keep program fee setups aligned with the fee fields available on invoices.
ALTER TABLE tuition_fee_setup
  ADD COLUMN admission_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER miscellaneous_fee,
  ADD COLUMN entrance_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER admission_fee,
  ADD COLUMN guidance_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER entrance_fee,
  ADD COLUMN handbook_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER guidance_fee,
  ADD COLUMN medical_dental_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER handbook_fee,
  ADD COLUMN computer_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER medical_dental_fee,
  ADD COLUMN cultural_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER computer_fee,
  ADD COLUMN development_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER cultural_fee,
  ADD COLUMN nstp_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER development_fee;

ALTER TABLE tuition_fee_setup
  MODIFY COLUMN total_fee DECIMAL(10,2) GENERATED ALWAYS AS (
    tuition_fee + laboratory_fee + library_fee + athletic_fee +
    registration_fee + id_fee + miscellaneous_fee + admission_fee +
    entrance_fee + guidance_fee + handbook_fee + medical_dental_fee +
    computer_fee + cultural_fee + development_fee + nstp_fee + other_fees
  ) STORED;
