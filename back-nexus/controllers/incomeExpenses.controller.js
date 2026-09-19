import IncomeExpense from "../model/incomeExpenses.model.js";

const incomeExpenseController = {
  // Create new transaction
  createTransaction: async (req, res) => {
    try {
      const transactionType = req.body.transaction_type;

      // Generate transaction number
      const results = await IncomeExpense.generateTransactionNumber(transactionType);

      const prefix = transactionType === "Income" ? "INC" : "EXP";
      let transactionNumber = `${prefix}-000001`;

      if (results.length > 0 && results[0].transaction_number) {
        const lastNumber = parseInt(
          results[0].transaction_number.split("-")[1]
        );
        transactionNumber = `${prefix}-${String(lastNumber + 1).padStart(
          6,
          "0"
        )}`;
      }

      const data = {
        transaction_number: transactionNumber,
        ...req.body,
        requested_by: req.user.user_id,
      };

      const result = await IncomeExpense.create(data);

      res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        data: {
          transaction_id: result.insertId,
          transaction_number: transactionNumber,
        },
      });
    } catch (err) {
      console.error("Error creating transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create transaction",
        error: err.message,
      });
    }
  },

  // Get all transactions
  getAllTransactions: async (req, res) => {
    try {
      const filters = {
        transaction_type: req.query.transaction_type,
        category: req.query.category,
        status: req.query.status,
        department: req.query.department,
        academic_period_id: req.query.academic_period_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0,
      };

      const results = await IncomeExpense.getAll(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
        error: err.message,
      });
    }
  },

  // Get transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const results = await IncomeExpense.getById(id);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    } catch (err) {
      console.error("Error fetching transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch transaction",
        error: err.message,
      });
    }
  },

  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await IncomeExpense.update(id, data);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
      });
    } catch (err) {
      console.error("Error updating transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update transaction",
        error: err.message,
      });
    }
  },

  // Approve transaction
  approveTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const approved_by = req.user.user_id;

      const result = await IncomeExpense.approve(id, approved_by);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction approved successfully",
      });
    } catch (err) {
      console.error("Error approving transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to approve transaction",
        error: err.message,
      });
    }
  },

  // Process transaction (mark as paid)
  processTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const processed_by = req.user.user_id;

      const result = await IncomeExpense.process(id, processed_by);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction processed successfully",
      });
    } catch (err) {
      console.error("Error processing transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to process transaction",
        error: err.message,
      });
    }
  },

  // Delete transaction
  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await IncomeExpense.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting transaction:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
        error: err.message,
      });
    }
  },

  // Get financial summary
  getFinancialSummary: async (req, res) => {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        academic_period_id: req.query.academic_period_id,
      };

      const results = await IncomeExpense.getFinancialSummary(filters);

      res.status(200).json({
        success: true,
        data: results[0] || {},
      });
    } catch (err) {
      console.error("Error fetching financial summary:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial summary",
        error: err.message,
      });
    }
  },

  // Get category breakdown
  getCategoryBreakdown: async (req, res) => {
    try {
      const { transaction_type } = req.params;
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        academic_period_id: req.query.academic_period_id,
      };

      const results = await IncomeExpense.getCategoryBreakdown(
        transaction_type,
        filters
      );

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching category breakdown:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category breakdown",
        error: err.message,
      });
    }
  },

  // Get monthly trend
  getMonthlyTrend: async (req, res) => {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({
          success: false,
          message: "Year parameter is required",
        });
      }

      const results = await IncomeExpense.getMonthlyTrend(year);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching monthly trend:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch monthly trend",
        error: err.message,
      });
    }
  },

  // Get department expenses
  getDepartmentExpenses: async (req, res) => {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      };

      const results = await IncomeExpense.getDepartmentExpenses(filters);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (err) {
      console.error("Error fetching department expenses:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch department expenses",
        error: err.message,
      });
    }
  },
};

export default incomeExpenseController;
