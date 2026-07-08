import express from "express";
import AutomationRule from "../models/AutomationRule.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/:channelId", requireAuth, async (req, res) => {
  try {
    const rules = await AutomationRule.find({ channelId: req.params.channelId }).sort({ createdAt: -1 });
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch automations", error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { channelId, keyword, response } = req.body;
    if (!channelId || !keyword?.trim() || !response?.trim()) {
      return res.status(400).json({ message: "channelId, keyword, and response are required" });
    }

    const rule = await AutomationRule.create({
      channelId,
      keyword: keyword.trim(),
      response: response.trim(),
      createdBy: req.user._id,
    });

    res.status(201).json({ rule });
  } catch (err) {
    res.status(500).json({ message: "Failed to create automation", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await AutomationRule.findByIdAndDelete(req.params.id);
    res.json({ message: "Automation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete automation", error: err.message });
  }
});

export default router;