import Accounting from "../model/accounting.model.js";

const accountingController = {
    getChartOfAccounts: async (req, res) => {
        try {
            const results = await Accounting.getChartOfAccounts();
            res.status(200).json({
                success: true,
                data: results
            });
        } catch (err) {
            console.error("Error fetching chart of accounts:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch chart of accounts",
                error: err.message
            });
        }
    },

    createAccount: async (req, res) => {
        try {
            const result = await Accounting.createAccount(req.body);
            res.status(201).json({
                success: true,
                message: "Account created successfully",
                data: { account_id: result.insertId }
            });
        } catch (err) {
            console.error("Error creating account:", err);
            res.status(500).json({
                success: false,
                message: "Failed to create account",
                error: err.message
            });
        }
    },

    getGeneralLedger: async (req, res) => {
        try {
            const filters = {
                account_id: req.query.account_id,
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };
            const results = await Accounting.getGeneralLedger(filters);
            res.status(200).json({
                success: true,
                data: results
            });
        } catch (err) {
            console.error("Error fetching general ledger:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch general ledger",
                error: err.message
            });
        }
    },

    getTrialBalance: async (req, res) => {
        try {
            const { academic_period_id } = req.query;
            const results = await Accounting.getTrialBalance(academic_period_id);
            res.status(200).json({
                success: true,
                data: results
            });
        } catch (err) {
            console.error("Error fetching trial balance:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch trial balance",
                error: err.message
            });
        }
    },

    getFinancialStatements: async (req, res) => {
        try {
            const { academic_period_id } = req.query;
            const balanceSheet = await Accounting.getBalanceSheet(academic_period_id);
            res.status(200).json({
                success: true,
                data: { balanceSheet }
            });
        } catch (err) {
            console.error("Error fetching financial statements:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch financial statements",
                error: err.message
            });
        }
    }
};

export default accountingController;
