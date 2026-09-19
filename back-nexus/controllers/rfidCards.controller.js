import RfidCardsService from "../services/rfidCards.service.js";

const RfidCardsController = {
  // GET /api/rfid-cards - Get all RFID cards
  async getAllRfidCards(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        card_type: req.query.card_type,
        status: req.query.status,
        search: req.query.search,
      };

      const cards = await RfidCardsService.getAllRfidCards(filters);
      res.status(200).json({
        success: true,
        data: cards,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/rfid-cards/:id - Get RFID card by ID
  async getRfidCardById(req, res) {
    try {
      const card = await RfidCardsService.getRfidCardById(req.params.id);
      res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/rfid-cards/card/:cardNumber - Get RFID card by card number
  async getRfidCardByCardNumber(req, res) {
    try {
      const card = await RfidCardsService.getRfidCardByCardNumber(
        req.params.cardNumber
      );
      res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/rfid-cards - Create RFID card
  async createRfidCard(req, res) {
    try {
      const card = await RfidCardsService.createRfidCard(req.body);
      res.status(201).json({
        success: true,
        message: "RFID card created successfully",
        data: card,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/rfid-cards/:id - Update RFID card
  async updateRfidCard(req, res) {
    try {
      const card = await RfidCardsService.updateRfidCard(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "RFID card updated successfully",
        data: card,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/rfid-cards/:id - Delete RFID card
  async deleteRfidCard(req, res) {
    try {
      const result = await RfidCardsService.deleteRfidCard(req.params.id);
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

  // PATCH /api/rfid-cards/usage/:cardNumber - Update card last used timestamp
  async updateCardLastUsed(req, res) {
    try {
      const result = await RfidCardsService.updateCardLastUsed(
        req.params.cardNumber
      );
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default RfidCardsController;
