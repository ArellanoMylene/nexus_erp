import db from "../config/db.js";

const Accounting = {
    // Chart of Accounts
    getChartOfAccounts: async () => {
        const query = "SELECT * FROM chart_of_accounts ORDER BY account_code";
        const [rows] = await db.query(query);
        return rows;
    },

    createAccount: async (data) => {
        const query = `
      INSERT INTO chart_of_accounts 
      (account_code, account_name, account_type, account_subtype, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.query(query, [
            data.account_code,
            data.account_name,
            data.account_type,
            data.account_subtype,
            data.description,
            data.is_active !== undefined ? data.is_active : true
        ]);
        return result;
    },

    // General Ledger
    getGeneralLedger: async (filters) => {
        let query = `
      SELECT gl.*, coa.account_name, coa.account_type
      FROM general_ledger gl
      INNER JOIN chart_of_accounts coa ON gl.account_id = coa.account_id
      WHERE 1=1
    `;
        const params = [];

        if (filters.account_id) {
            query += " AND gl.account_id = ?";
            params.push(filters.account_id);
        }
        if (filters.start_date && filters.end_date) {
            query += " AND gl.transaction_date BETWEEN ? AND ?";
            params.push(filters.start_date, filters.end_date);
        }

        query += " ORDER BY gl.transaction_date DESC, gl.created_at DESC";
        const [rows] = await db.query(query, params);
        return rows;
    },

    // Trial Balance
    getTrialBalance: async (academic_period_id) => {
        const query = `
      SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        SUM(gl.debit) as total_debit,
        SUM(gl.credit) as total_credit,
        SUM(gl.debit) - SUM(gl.credit) as balance
      FROM chart_of_accounts coa
      LEFT JOIN general_ledger gl ON coa.account_id = gl.account_id
      WHERE gl.academic_period_id = ? OR gl.academic_period_id IS NULL
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `;
        const [rows] = await db.query(query, [academic_period_id]);
        return rows;
    },

    // Balance Sheet
    getBalanceSheet: async (academic_period_id) => {
        const query = `
      SELECT 
        account_type,
        SUM(debit) - SUM(credit) as balance
      FROM general_ledger gl
      INNER JOIN chart_of_accounts coa ON gl.account_id = coa.account_id
      WHERE gl.academic_period_id = ?
      GROUP BY account_type
    `;
        const [rows] = await db.query(query, [academic_period_id]);
        return rows;
    }
};

export default Accounting;
