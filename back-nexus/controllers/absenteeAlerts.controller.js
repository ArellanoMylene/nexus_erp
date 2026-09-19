/* import AbsenteeAlertsService from "../services/absenteeAlerts.service.js";

const AbsenteeAlertsController = {
  // GET /api/absentee-alerts - Get all absentee alerts
  async getAllAbsenteeAlerts(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        user_type: req.query.user_type,
        alert_type: req.query.alert_type,
        status: req.query.status,
        priority: req.query.priority,
        period_id: req.query.period_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      const alerts = await AbsenteeAlertsService.getAllAbsenteeAlerts(filters);
      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/absentee-alerts/:id - Get absentee alert by ID
  async getAbsenteeAlertById(req, res) {
    try {
      const alert = await AbsenteeAlertsService.getAbsenteeAlertById(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/absentee-alerts - Create absentee alert
  async createAbsenteeAlert(req, res) {
    try {
      const alert = await AbsenteeAlertsService.createAbsenteeAlert(req.body);
      res.status(201).json({
        success: true,
        message: "Absentee alert created successfully",
        data: alert,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/absentee-alerts/:id - Update absentee alert
  async updateAbsenteeAlert(req, res) {
    try {
      const alert = await AbsenteeAlertsService.updateAbsenteeAlert(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Absentee alert updated successfully",
        data: alert,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/absentee-alerts/:id - Delete absentee alert
  async deleteAbsenteeAlert(req, res) {
    try {
      const result = await AbsenteeAlertsService.deleteAbsenteeAlert(
        req.params.id
      );
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PATCH /api/absentee-alerts/:id/acknowledge - Acknowledge alert
  async acknowledgeAlert(req, res) {
    try {
      const { acknowledged_by, resolution_notes } = req.body;

      if (!acknowledged_by) {
        return res.status(400).json({
          success: false,
          message: "acknowledged_by is required",
        });
      }

      const alert = await AbsenteeAlertsService.acknowledgeAlert(
        req.params.id,
        acknowledged_by,
        resolution_notes
      );
      res.status(200).json({
        success: true,
        message: "Alert acknowledged successfully",
        data: alert,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PATCH /api/absentee-alerts/:id/resolve - Resolve alert
  async resolveAlert(req, res) {
    try {
      const { acknowledged_by, resolution_notes } = req.body;

      if (!acknowledged_by || !resolution_notes) {
        return res.status(400).json({
          success: false,
          message: "acknowledged_by and resolution_notes are required",
        });
      }

      const alert = await AbsenteeAlertsService.resolveAlert(
        req.params.id,
        acknowledged_by,
        resolution_notes
      );
      res.status(200).json({
        success: true,
        message: "Alert resolved successfully",
        data: alert,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/absentee-alerts/statistics - Get alert statistics
  async getAlertStatistics(req, res) {
    try {
      const filters = {
        period_id: req.query.period_id,
        user_type: req.query.user_type,
      };

      const statistics = await AbsenteeAlertsService.getAlertStatistics(
        filters
      );
      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default AbsenteeAlertsController;
 */
// absenteeAlerts.controller.js
import AbsenteeAlertsService from "../services/absenteeAlerts.service.js";

const AbsenteeAlertsController = {

  async getAllAbsenteeAlerts(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        user_type: req.query.user_type,
        alert_type: req.query.alert_type,
        status: req.query.status,
        priority: req.query.priority,
        period_id: req.query.period_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };
      const alerts = await AbsenteeAlertsService.getAllAbsenteeAlerts(filters);
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAbsenteeAlertById(req, res) {
    try {
      const alert = await AbsenteeAlertsService.getAbsenteeAlertById(req.params.id);
      res.status(200).json({ success: true, data: alert });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async createAbsenteeAlert(req, res) {
    try {
      // req.body already validated — just use it
      const alert = await AbsenteeAlertsService.createAbsenteeAlert(req.body);
      res.status(201).json({ success: true, message: "Absentee alert created successfully", data: alert });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updateAbsenteeAlert(req, res) {
    try {
      const alert = await AbsenteeAlertsService.updateAbsenteeAlert(req.params.id, req.body);
      res.status(200).json({ success: true, message: "Absentee alert updated successfully", data: alert });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteAbsenteeAlert(req, res) {
    try {
      const result = await AbsenteeAlertsService.deleteAbsenteeAlert(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async acknowledgeAlert(req, res) {
    try {
      // acknowledged_by presence already guaranteed by Zod — no manual check needed
      const { acknowledged_by, resolution_notes } = req.body;
      const alert = await AbsenteeAlertsService.acknowledgeAlert(req.params.id, acknowledged_by, resolution_notes);
      res.status(200).json({ success: true, message: "Alert acknowledged successfully", data: alert });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async resolveAlert(req, res) {
    try {
      // Both fields already guaranteed by Zod — no manual check needed
      const { acknowledged_by, resolution_notes } = req.body;
      const alert = await AbsenteeAlertsService.resolveAlert(req.params.id, acknowledged_by, resolution_notes);
      res.status(200).json({ success: true, message: "Alert resolved successfully", data: alert });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAlertStatistics(req, res) {
    try {
      const filters = {
        period_id: req.query.period_id,
        user_type: req.query.user_type,
      };
      const statistics = await AbsenteeAlertsService.getAlertStatistics(filters);
      res.status(200).json({ success: true, data: statistics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

export default AbsenteeAlertsController;