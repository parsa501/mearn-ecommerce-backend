
import cron from "node-cron";
import Payment from "../Models/PaymentMd.js";
import Order from "../Models/OrderMd.js";

export const startOrderCron = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const expirationDate = new Date(
        Date.now() - 30 * 60 * 1000
      );

      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lte: expirationDate },
      }).select("orderId");

      await Payment.updateMany(
        {
          status: "pending",
          createdAt: { $lte: expirationDate },
        },
        {
          $set: {
            status: "failed",
            errorMessage: "Payment expired",
          },
        }
      );

      const orderIds = [
        ...new Set(
          expiredPayments.map((payment) =>
            payment.orderId.toString()
          )
        ),
      ];

      for (const orderId of orderIds) {
        const activePayment = await Payment.findOne({
          orderId,
          status: { $in: ["pending", "success"] },
        });

        if (!activePayment) {
          await Order.updateOne(
            {
              _id: orderId,
              status: "pending",
            },
            {
              $set: { status: "cancelled" },
            }
          );
        }
      }
    } catch (error) {
      console.error("Order Cron Error:", error);
    }
  });
};
