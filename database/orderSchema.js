const mongoose = require('mongoose');
const mongooseSeq = require('mongoose-sequence');

//schema에 없어도 데이터는 가져오지만 조회가 안된다.
const orderSchema = new mongoose.Schema({
  orderId: { type: Number, require: true, unique: true },
  orderProduct: { type: Array, require: true },
  userId: { type: String, require: true },
  orderDate: { type: Date, require: true },
}, { collection: "order" });

orderSchema.plugin(mongooseSeq(mongoose), {inc_field: 'orderId'});


orderSchema.statics.createOrder = async function(userId, orderProduct, session){
  var result = await this.create([{
    orderProduct: orderProduct,
    userId: userId,
    orderDate: new Date()
  }], { session });
  return result;
}

module.exports = mongoose.model('order', orderSchema);