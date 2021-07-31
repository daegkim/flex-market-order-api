const express = require('express');
const mongoose = require('mongoose');

const manageSession = require('../database/manageSession');
const orderSchema = require('../database/orderSchema');
const router = express.Router();

const isNullOrEmpty = (str) => {
  let result = false;
  if (str === undefined || str === null || str === '') {
    result = true;
  }
  return result;
}

const getOrders = async (userId) => {
  const result = {
    isSuccess: false,
    reason: "Please contact the customer service center.",
    orders: null
  }

  try{
    const orders = await orderSchema.getOrders(userId);
    result.isSuccess = true;
    result.reason = null;
    result.orders = orders;
  }
  catch(err){
    result.isSuccess = false;
    result.reason = "Please contact the customer service center.";
  }
  finally{
    return result;
  }
}

router.post('/orders', async function(req, res, next) {
  const result = {
    isSuccess: false,
    reason: "Please contact the customer service center.",
    orders: null
  }

  try{
    const userId = req.body.userId;
    const ordersData = await getOrders(userId);
    Object.keys(result).forEach((key) => {
      result[key] = ordersData[key];
    });
  }
  catch(err){
    console.log(err);
    result.isSuccess = false;
    result.reason = "Please contact the customer service center.";
  }
  finally{
    res.send(result);
  }
})

router.post('/create_order', async function (req, res, next) {
  var session = null;
  var sessionId = 0;

  try {
    var userId = req.body.userId;
    var orderProduct = req.body.orderProduct;
    var result = {
      isSuccess: false,
      reason: "고객센터에 문의하세요.",
      sessionId: sessionId
    };

    //Validations
    if (isNullOrEmpty(orderProduct)) {
      result.reason = "주문하려는 제품을 선택하세요.";
      res.send(result);
      return;
    }

    if (isNullOrEmpty(userId)) {
      result.reason = "user id가 null입니다.";
      res.send(result);
      return;
    }

    session = await mongoose.startSession();
    session.startTransaction();
    sessionId = manageSession.getSessionId();
    manageSession.insertSession(sessionId, session);
    //api gateway는 이 세션ID를 받고 성공적으로 끝났다고 판단되면
    //이 sessionId를 commit하라고 다시 명령한다.
    result.sessionId = sessionId;

    var isSuccessCreateOrder = await orderSchema.createOrder(userId, orderProduct, session);

    result.isSuccess = true;
    result.reason = null;

    res.send(result);
  }
  catch (err) {
    result.isSuccess = false;
    result.reason = "고객센터에 문의하세요.";

    res.send(result);
  }
});

router.post('/commit_session', async function(req, res, next) {
  var session = null;
  try {
    var result = {
      isSuccess: true
    }
    var sessionId = req.body.sessionId;
    session = manageSession.getSession(sessionId);

    if(session !== null && session.inTransaction()){
      await session.commitTransaction();
      session.endSession();
    }
    manageSession.deleteSession(sessionId);
    res.send(result);
  }
  catch(err) {
    if (session !== null && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    manageSession.deleteSession(sessionId);

    result.isSuccess = false;
    res.send(result);
  }
})

router.post('/rollback_session', async function(req, res, next) {
  var session = null;
  try {
    var result = {
      isSuccess: true
    }
    var sessionId = req.body.sessionId;
    session = manageSession.getSession(sessionId);

    if(session !== null && session.inTransaction()){
      await session.abortTransaction();
      session.endSession();
    }
    manageSession.deleteSession(sessionId);
    res.send(result);
  }
  catch(err) {
    result.isSuccess = false;
    res.send(result);
  }
})

module.exports = router;
