// Quick data check
router.get('/data-status', async (req, res) => {
  try {
    const user19 = await storage.getJournalEntries(19, 50);
    const user107 = await storage.getJournalEntries(107, 50);
    const user4 = await storage.getJournalEntries(4, 50);
    
    res.json({
      user19: user19.length,
      user107: user107.length,
      user4: user4.length
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;