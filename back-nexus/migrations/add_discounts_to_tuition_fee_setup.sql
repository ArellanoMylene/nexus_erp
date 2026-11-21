-- Store setup-level discounts and scholarships and show the net fee total.
ALTER TABLE tuition_fee_setup
  ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER other_fees,
  ADD COLUMN scholarship_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_amount;

ALTER TABLE tuition_fee_setup
  MODIFY COLUMN total_fee DECIMAL(10,2) GENERATED ALWAYS AS (GREATEST(0.00,
    tuition_fee + laboratory_fee + library_fee + athletic_fee +
    registration_fee + id_fee + miscellaneous_fee + admission_fee +
    entrance_fee + guidance_fee + handbook_fee + medical_dental_fee +
    computer_fee + cultural_fee + development_fee + nstp_fee + other_fees -
    discount_amount - scholarship_amount
  )) STORED;
