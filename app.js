const express = require("express");
const Razorpay = require("razorpay");
const {sendMail} = require('./mailer')
const crypto = require("crypto");
const app = express();
const {Pool}=require("pg")
const dotenv = require('dotenv')


dotenv.config()

app.post("/webhook",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const secret = process.env.YOUR_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.body);
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
      const body = JSON.parse(req.body.toString());

      const payment = body.payload.payment.entity;

      const result = await pool.query(
        "SELECT * FROM orders WHERE razorpay_order_id=$1",
        [payment.order_id]
      );

      const order = result.rows[0];

      if (order) {
        await pool.query(
          "UPDATE orders SET status='PAID', razorpay_payment_id=$1 WHERE id=$2",
          [payment.id, order.id]
        );
        try{
          sendMail(order.email, {
          name: order.name,
          amount: order.amount,
          payment_id: payment.id
        });
        }catch(err){}
      }
    }
    console.log("processed")
    res.status(200).send("OK");
  }
);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.POSTGRESURI,
  ssl: {
    rejectUnauthorized: false
  }
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

pool.query("SELECT NOW()")
  .then(res => console.log(res.rows))
  .catch(err => console.error(err));


app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id");
    res.render("index", { products: result.rows });
  } catch (err) {
    console.error(err);
    res.send("Database error");
  }
});

app.get("/checkout/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );

    const product = result.rows[0];

    res.render("checkout", { product });
  } catch (err) {
    console.error(err);
    res.send("Error fetching product");
  }
});

app.post("/create-order", async (req, res) => {
  try {
    const { productId, name,email, address, lat, lng } = req.body;

    // 1. Get product
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    const product = result.rows[0];

    if (!product) {
      return res.send("Product not found");
    }

    // 2. Save order in DB
    const orderResult = await pool.query(
      `INSERT INTO orders (product_id, name,email, address, lat, lng, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'CREATED') RETURNING *`,
      [productId, name, email, address, lat, lng, product.price]
    );

    const order = orderResult.rows[0];

    // 3. Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: product.price * 100, // paisa
      currency: "INR",
      receipt: order.id.toString()
    });

    // 4. Save Razorpay order id
    await pool.query(
      "UPDATE orders SET razorpay_order_id=$1 WHERE id=$2",
      [rzpOrder.id, order.id]
    );

    // 5. Send to frontend
    res.json({
      orderId: rzpOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: product.price
    });

  } catch (err) {
    console.error(err);
    res.statusCode(500)
    res.send("Error");
  }
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Server running on http://localhost:"+PORT);
})