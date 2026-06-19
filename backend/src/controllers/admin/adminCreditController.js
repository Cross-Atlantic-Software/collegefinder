const creditService = require('../../services/credit/creditService');

exports.getLedger = async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit ?? 10;
    const userId = req.query.user_id ?? req.query.userId ?? null;

    const result = await creditService.listAllTransactionsForAdmin({
      userId,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching credit ledger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit ledger',
    });
  }
};
