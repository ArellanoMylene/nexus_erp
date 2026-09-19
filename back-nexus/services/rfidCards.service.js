import RfidCardsModel from "../model/rfidCards.model.js";

const RfidCardsService = {
  // Get all RFID cards
  async getAllRfidCards(filters) {
    try {
      return await RfidCardsModel.getAll(filters);
    } catch (error) {
      throw new Error(`Error fetching RFID cards: ${error.message}`);
    }
  },

  // Get RFID card by ID
  async getRfidCardById(id) {
    try {
      const card = await RfidCardsModel.getById(id);
      if (!card) {
        throw new Error("RFID card not found");
      }
      return card;
    } catch (error) {
      throw new Error(`Error fetching RFID card: ${error.message}`);
    }
  },

  // Get RFID card by card number
  async getRfidCardByCardNumber(cardNumber) {
    try {
      const card = await RfidCardsModel.getByCardNumber(cardNumber);
      if (!card) {
        throw new Error("RFID card not found");
      }
      return card;
    } catch (error) {
      throw new Error(`Error fetching RFID card: ${error.message}`);
    }
  },

  // Create RFID card
  async createRfidCard(data) {
    try {
      // Check if card number already exists
      const exists = await RfidCardsModel.cardNumberExists(data.card_number);
      if (exists) {
        throw new Error("Card number already exists");
      }

      const cardId = await RfidCardsModel.create(data);
      return await RfidCardsModel.getById(cardId);
    } catch (error) {
      throw new Error(`Error creating RFID card: ${error.message}`);
    }
  },

  // Update RFID card
  async updateRfidCard(id, data) {
    try {
      // Check if card number already exists (excluding current card)
      if (data.card_number) {
        const exists = await RfidCardsModel.cardNumberExists(
          data.card_number,
          id
        );
        if (exists) {
          throw new Error("Card number already exists");
        }
      }

      const affectedRows = await RfidCardsModel.update(id, data);
      if (affectedRows === 0) {
        throw new Error("RFID card not found");
      }
      return await RfidCardsModel.getById(id);
    } catch (error) {
      throw new Error(`Error updating RFID card: ${error.message}`);
    }
  },

  // Delete RFID card
  async deleteRfidCard(id) {
    try {
      const affectedRows = await RfidCardsModel.delete(id);
      if (affectedRows === 0) {
        throw new Error("RFID card not found");
      }
      return { message: "RFID card deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting RFID card: ${error.message}`);
    }
  },

  // Update last used timestamp
  async updateCardLastUsed(cardNumber) {
    try {
      await RfidCardsModel.updateLastUsed(cardNumber);
      return { message: "Card last used timestamp updated" };
    } catch (error) {
      throw new Error(`Error updating card usage: ${error.message}`);
    }
  },
};

export default RfidCardsService;
