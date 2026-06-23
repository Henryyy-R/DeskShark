const SLARule = require('../models/SLARule');

const DEFAULT_SLA_RULES = [
  { priorityLevel: 'Critical', responseTargetMinutes: 15, resolutionTargetMinutes: 240 },
  { priorityLevel: 'High', responseTargetMinutes: 60, resolutionTargetMinutes: 480 },
  { priorityLevel: 'Medium', responseTargetMinutes: 240, resolutionTargetMinutes: 1440 },
  { priorityLevel: 'Low', responseTargetMinutes: 1440, resolutionTargetMinutes: 4320 }
];

// GET all SLA rules
const getSLARules = async (req, res) => {
  try {
    const rules = await SLARule.find();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch SLA rules', error: error.message });
  }
};

// PUT update SLA rule
const updateSLARule = async (req, res) => {
  try {
    const { responseTargetMinutes, resolutionTargetMinutes } = req.body;

    if (!responseTargetMinutes || !resolutionTargetMinutes) {
      return res.status(400).json({ message: 'responseTargetMinutes and resolutionTargetMinutes are required.' });
    }

    const rule = await SLARule.findByIdAndUpdate(
      req.params.id,
      { responseTargetMinutes, resolutionTargetMinutes },
      { new: true }
    );

    if (!rule) return res.status(404).json({ message: 'SLA rule not found' });
    res.status(200).json(rule);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update SLA rule', error: error.message });
  }
};

// POST initialize default SLA rules
const initSLARules = async (req, res) => {
  try {
    for (const rule of DEFAULT_SLA_RULES) {
      await SLARule.findOneAndUpdate(
        { priorityLevel: rule.priorityLevel },
        rule,
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ message: 'Default SLA rules initialized.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize SLA rules', error: error.message });
  }
};

module.exports = { getSLARules, updateSLARule, initSLARules };
