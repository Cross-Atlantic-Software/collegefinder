const creditService = require('../../services/credit/creditService');

function handleCreditError(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) {
    console.error('Credit API error:', error);
  }
  return res.status(status).json({
    success: false,
    message: error.message || 'Credit operation failed',
    code: error.code || undefined,
    details: error.details || undefined,
  });
}

exports.getBalance = async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.user.id);
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    handleCreditError(res, error);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await creditService.getTransactionHistory(req.user.id, { page, limit });
    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    handleCreditError(res, error);
  }
};

exports.purchaseCredits = async (req, res) => {
  try {
    const { amount, metadata } = req.body || {};
    const result = await creditService.purchaseCredits(req.user.id, amount, metadata);
    res.status(201).json({
      success: true,
      message: 'UT Credits purchased successfully',
      data: result,
    });
  } catch (error) {
    handleCreditError(res, error);
  }
};

exports.deductForRegistration = async (req, res) => {
  try {
    const { application_id } = req.body || {};
    const result = await creditService.deductCreditsForRegistration(req.user.id, application_id);
    res.json({
      success: true,
      message: result.skipped
        ? 'No UT service fee configured for this exam'
        : result.alreadyDeducted
          ? 'Credits were already deducted for this application'
          : 'Credits deducted successfully',
      data: result,
    });
  } catch (error) {
    handleCreditError(res, error);
  }
};

exports.refundForRegistration = async (req, res) => {
  try {
    const { application_id, reason } = req.body || {};
    const result = await creditService.refundCreditsForRegistration(
      req.user.id,
      application_id,
      reason
    );
    res.json({
      success: true,
      message: result.skipped
        ? 'No deduction found to refund'
        : result.alreadyRefunded
          ? 'Credits were already refunded for this application'
          : 'Credits refunded successfully',
      data: result,
    });
  } catch (error) {
    handleCreditError(res, error);
  }
};
