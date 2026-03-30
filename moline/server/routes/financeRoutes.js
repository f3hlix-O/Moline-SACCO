const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const verifyToken = require('../middleware/verifyToken');

router.get('/insurance', financeController.getInsurance);
router.get('/loans', financeController.getLoans);
router.get('/payments', financeController.getPayments);
router.get('/userFinance', verifyToken, financeController.checkLoanEligibility);
router.post('/applyLoan', verifyToken, financeController.loanRequest);
router.post('/approveLoan', financeController.approveLoan);
router.get('/pendingLoans', verifyToken, financeController.getPendingLoans);
router.get('/allPendingLoans', financeController.getPendingLoans);
router.get('/loans/total', verifyToken, financeController.getTotalLoans);
router.get('/savings/total', verifyToken, financeController.getTotalSavings);
router.get('/payments/latest', verifyToken, financeController.latestPayments);
router.post('/payments/shareholder', verifyToken, financeController.shareholderPayment);
router.post('/processPayment', verifyToken, financeController.paymentProcessing);
router.post('/mpesaCallback', financeController.mpesaCallback);
router.get('/checkPaymentStatus', financeController.checkPaymentStatus);

module.exports = router; 