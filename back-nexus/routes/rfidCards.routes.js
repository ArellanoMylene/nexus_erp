import express from "express";
import RfidCardsController from "../controllers/rfidCards.controller.js";

const router = express.Router();

// GET all RFID cards
router.get("/", RfidCardsController.getAllRfidCards);

// GET RFID card by card number
router.get("/card/:cardNumber", RfidCardsController.getRfidCardByCardNumber);

// PATCH update card last used timestamp
router.patch("/usage/:cardNumber", RfidCardsController.updateCardLastUsed);

// GET RFID card by ID
router.get("/:id", RfidCardsController.getRfidCardById);

// POST create new RFID card
router.post("/", RfidCardsController.createRfidCard);

// PUT update RFID card
router.put("/:id", RfidCardsController.updateRfidCard);

// DELETE RFID card
router.delete("/:id", RfidCardsController.deleteRfidCard);

export default router;
