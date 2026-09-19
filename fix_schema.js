import pool from './back-nexus/config/db.js';

async function fixSchema() {
    try {
        console.log('Relaxing NULL constraints for scholarship_type_id...');

        await pool.query('ALTER TABLE scholarship_applications MODIFY scholarship_type_id INT NULL');
        console.log('- scholarship_applications updated');

        await pool.query('ALTER TABLE scholarship_beneficiaries MODIFY scholarship_type_id INT NULL');
        console.log('- scholarship_beneficiaries updated');

        await pool.query('ALTER TABLE scholarship_eligibility_screening MODIFY scholarship_type_id INT NULL');
        console.log('- scholarship_eligibility_screening updated');

        const [rows] = await pool.query("DESCRIBE scholarship_applications");
        console.log('\nUpdated Schema for scholarship_applications:');
        console.table(rows.filter(r => r.Field === 'scholarship_type_id'));

        process.exit(0);
    } catch (error) {
        console.error('Error fixing schema:', error);
        process.exit(1);
    }
}

fixSchema();
