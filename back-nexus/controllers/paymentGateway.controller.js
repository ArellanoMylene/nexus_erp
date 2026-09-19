import PaymentGateway from "../model/paymentGateway.model.js";

const paymentGatewayController = {
  // ========== GATEWAY CONFIGURATION ==========

  // Create gateway configuration
  createGatewayConfig: (req, res) => {
    const data = {
      ...req.body,
      created_by: req.user.user_id,
    };

    PaymentGateway.createConfig(data, (err, result) => {
      if (err) {
        console.error("Error creating gateway configuration:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to create gateway configuration",
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Gateway configuration created successfully",
        data: { gateway_id: result.insertId },
      });
    });
  },

  // Get all gateway configurations
  getAllGatewayConfigs: (req, res) => {
    const filters = {
      is_active: req.query.is_active,
      gateway_type: req.query.gateway_type,
    };

    PaymentGateway.getAllConfigs(filters, (err, results) => {
      if (err) {
        console.error("Error fetching gateway configurations:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch gateway configurations",
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    });
  },

  // Get active gateways (for student use)
  getActiveGateways: (req, res) => {
    PaymentGateway.getActiveGateways((err, results) => {
      if (err) {
        console.error("Error fetching active gateways:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch active gateways",
          error: err.message,
        });
      }

      // Remove sensitive information before sending to client
      const sanitizedResults = results.map((gateway) => ({
        gateway_id: gateway.gateway_id,
        gateway_name: gateway.gateway_name,
        gateway_type: gateway.gateway_type,
        transaction_fee_type: gateway.transaction_fee_type,
        transaction_fee_value: gateway.transaction_fee_value,
        supported_currencies: gateway.supported_currencies,
        min_amount: gateway.min_amount,
        max_amount: gateway.max_amount,
      }));

      res.status(200).json({
        success: true,
        data: sanitizedResults,
        count: sanitizedResults.length,
      });
    });
  },

  // Get gateway configuration by ID
  getGatewayConfigById: (req, res) => {
    const { id } = req.params;

    PaymentGateway.getConfigById(id, (err, results) => {
      if (err) {
        console.error("Error fetching gateway configuration:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch gateway configuration",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Gateway configuration not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    });
  },

  // Update gateway configuration
  updateGatewayConfig: (req, res) => {
    const { id } = req.params;
    const data = req.body;

    PaymentGateway.updateConfig(id, data, (err, result) => {
      if (err) {
        console.error("Error updating gateway configuration:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update gateway configuration",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Gateway configuration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Gateway configuration updated successfully",
      });
    });
  },

  // Toggle gateway active status
  toggleGatewayActive: (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: "is_active field is required",
      });
    }

    PaymentGateway.toggleActive(id, is_active, (err, result) => {
      if (err) {
        console.error("Error toggling gateway status:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to toggle gateway status",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Gateway configuration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Gateway ${
          is_active ? "activated" : "deactivated"
        } successfully`,
      });
    });
  },

  // Delete gateway configuration
  deleteGatewayConfig: (req, res) => {
    const { id } = req.params;

    PaymentGateway.deleteConfig(id, (err, result) => {
      if (err) {
        console.error("Error deleting gateway configuration:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete gateway configuration",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Gateway configuration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Gateway configuration deleted successfully",
      });
    });
  },

  // ========== GATEWAY TRANSACTIONS ==========

  // Create gateway transaction
  createGatewayTransaction: (req, res) => {
    // Generate transaction reference
    PaymentGateway.generateTransactionReference((err, results) => {
      if (err) {
        console.error("Error generating transaction reference:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to generate transaction reference",
          error: err.message,
        });
      }

      let transactionRef = "GT-000001";
      if (results.length > 0 && results[0].transaction_reference) {
        const lastNumber = parseInt(
          results[0].transaction_reference.split("-")[1]
        );
        transactionRef = `GT-${String(lastNumber + 1).padStart(6, "0")}`;
      }

      const data = {
        transaction_reference: transactionRef,
        ...req.body,
      };

      PaymentGateway.createTransaction(data, (err, result) => {
        if (err) {
          console.error("Error creating gateway transaction:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create gateway transaction",
            error: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "Gateway transaction created successfully",
          data: {
            gateway_transaction_id: result.insertId,
            transaction_reference: transactionRef,
          },
        });
      });
    });
  },

  // Get all gateway transactions
  getAllGatewayTransactions: (req, res) => {
    const filters = {
      gateway_id: req.query.gateway_id,
      student_id: req.query.student_id,
      payment_status: req.query.payment_status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0,
    };

    PaymentGateway.getAllTransactions(filters, (err, results) => {
      if (err) {
        console.error("Error fetching gateway transactions:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch gateway transactions",
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    });
  },

  // Get gateway transaction by ID
  getGatewayTransactionById: (req, res) => {
    const { id } = req.params;

    PaymentGateway.getTransactionById(id, (err, results) => {
      if (err) {
        console.error("Error fetching gateway transaction:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch gateway transaction",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Gateway transaction not found",
        });
      }

      res.status(200).json({
        success: true,
        data: results[0],
      });
    });
  },

  // Update gateway transaction status
  updateGatewayTransactionStatus: (req, res) => {
    const { id } = req.params;
    const { payment_status, gateway_response, error_message } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: "payment_status is required",
      });
    }

    PaymentGateway.updateTransactionStatus(
      id,
      payment_status,
      gateway_response,
      error_message,
      (err, result) => {
        if (err) {
          console.error("Error updating transaction status:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update transaction status",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Gateway transaction not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Transaction status updated successfully",
        });
      }
    );
  },

  // Get gateway transaction summary
  getGatewayTransactionSummary: (req, res) => {
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      gateway_id: req.query.gateway_id,
    };

    PaymentGateway.getTransactionSummary(filters, (err, results) => {
      if (err) {
        console.error("Error fetching transaction summary:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch transaction summary",
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    });
  },
};

export default paymentGatewayController;
