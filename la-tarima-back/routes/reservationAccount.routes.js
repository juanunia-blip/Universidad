const router = require('express').Router()
const controller = require('../controllers/reservationAccount.controller')

router.get('/:reservation_id/account', controller.getAccount)

router.post('/:reservation_id/apply-coupon', controller.applyCoupon)

module.exports = router