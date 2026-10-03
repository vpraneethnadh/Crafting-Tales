import "dotenv/config";
import express from "express";
import cors from "cors";
import { Resend } from "resend";

const app = express();

const PORT = process.env.PORT || 5000;

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "vpraneethnadh@gmail.com";

const FROM_EMAIL =
  process.env.FROM_EMAIL || "Crafting Tales <onboarding@resend.dev>";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ============================================================
// RESEND
// ============================================================

if (!RESEND_API_KEY) {
  console.warn(
    "⚠️ RESEND_API_KEY is missing. Add it to your .env file."
  );
}

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Crafting Tales email server is running.",
  });
});

// ============================================================
// HELPERS
// ============================================================

const formatPrice = (amount) => {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ============================================================
// ORDER ITEMS HTML
// ============================================================

const createItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="
          padding: 20px;
          text-align: center;
          color: #777;
        ">
          No items found.
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const subtotal = quantity * price;

      return `
        <tr>
          <td style="
            padding: 14px 10px;
            border-bottom: 1px solid #eeeeee;
            color: #152d50;
            font-weight: 600;
          ">
            ${escapeHtml(item.name)}
          </td>

          <td style="
            padding: 14px 10px;
            border-bottom: 1px solid #eeeeee;
            text-align: center;
          ">
            ${quantity}
          </td>

          <td style="
            padding: 14px 10px;
            border-bottom: 1px solid #eeeeee;
            text-align: right;
          ">
            ${formatPrice(price)}
          </td>

          <td style="
            padding: 14px 10px;
            border-bottom: 1px solid #eeeeee;
            text-align: right;
            font-weight: 600;
          ">
            ${formatPrice(subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");
};

// ============================================================
// DELIVERY DETAILS HTML
// ============================================================

const createDeliveryHtml = (customer = {}) => {
  return `
    <div style="
      background: #fffaf8;
      border: 1px solid #eadfdb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    ">

      <h3 style="
        margin: 0 0 15px;
        color: #152d50;
        font-size: 18px;
      ">
        Delivery Details
      </h3>

      <p style="margin: 7px 0;">
        <strong>Name:</strong>
        ${escapeHtml(customer.fullName)}
      </p>

      <p style="margin: 7px 0;">
        <strong>Email:</strong>
        ${escapeHtml(customer.email)}
      </p>

      <p style="margin: 7px 0;">
        <strong>Phone:</strong>
        ${escapeHtml(customer.phone)}
      </p>

      <p style="margin: 7px 0;">
        <strong>Address:</strong>
        ${escapeHtml(customer.address)}
      </p>

      <p style="margin: 7px 0;">
        <strong>City:</strong>
        ${escapeHtml(customer.city)}
      </p>

      <p style="margin: 7px 0;">
        <strong>State:</strong>
        ${escapeHtml(customer.state)}
      </p>

      <p style="margin: 7px 0;">
        <strong>Pincode:</strong>
        ${escapeHtml(customer.pincode)}
      </p>

    </div>
  `;
};

// ============================================================
// ORDER ITEMS SECTION
// ============================================================

const createOrderItemsSection = (items = []) => {
  return `
    <h3 style="
      margin: 25px 0 12px;
      color: #152d50;
      font-size: 18px;
    ">
      Order Items
    </h3>

    <table style="
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border: 1px solid #eeeeee;
    ">

      <thead>
        <tr style="background: #fff5f7;">

          <th style="
            padding: 13px 10px;
            text-align: left;
            color: #152d50;
          ">
            Product
          </th>

          <th style="
            padding: 13px 10px;
            text-align: center;
            color: #152d50;
          ">
            Qty
          </th>

          <th style="
            padding: 13px 10px;
            text-align: right;
            color: #152d50;
          ">
            Price
          </th>

          <th style="
            padding: 13px 10px;
            text-align: right;
            color: #152d50;
          ">
            Subtotal
          </th>

        </tr>
      </thead>

      <tbody>
        ${createItemsHtml(items)}
      </tbody>

    </table>
  `;
};

// ============================================================
// ADMIN EMAIL
// ============================================================

const createAdminEmail = ({
  orderNumber,
  customer,
  items,
  total,
  paymentMethod,
  paymentStatus,
}) => {
  return `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin: 0;
  padding: 0;
  background: #f7f2f0;
  font-family: Arial, Helvetica, sans-serif;
  color: #333333;
">

  <div style="
    max-width: 700px;
    margin: 30px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #eadfdb;
  ">

    <!-- HEADER -->

    <div style="
      background: #152d50;
      padding: 28px;
      text-align: center;
    ">

      <h1 style="
        margin: 0;
        color: #ffffff;
        font-size: 26px;
      ">
        New Order Received
      </h1>

      <p style="
        margin: 8px 0 0;
        color: #f7dce3;
        font-size: 14px;
      ">
        Crafting Tales
      </p>

    </div>

    <!-- CONTENT -->

    <div style="padding: 30px;">

      <p style="
        margin-top: 0;
        font-size: 16px;
      ">
        A new order has been placed on your store.
      </p>

      <div style="
        background: #fff5f7;
        border-radius: 12px;
        padding: 18px;
        margin: 20px 0;
      ">

        <p style="margin: 5px 0;">
          <strong>Order Number:</strong>
          ${escapeHtml(orderNumber)}
        </p>

        <p style="margin: 5px 0;">
          <strong>Payment Method:</strong>
          ${escapeHtml(paymentMethod)}
        </p>

        <p style="margin: 5px 0;">
          <strong>Payment Status:</strong>
          ${escapeHtml(paymentStatus)}
        </p>

        <p style="margin: 5px 0;">
          <strong>Total:</strong>
          ${formatPrice(total)}
        </p>

      </div>

      ${createDeliveryHtml(customer)}

      ${createOrderItemsSection(items)}

      <div style="
        margin-top: 25px;
        padding: 18px;
        background: #152d50;
        border-radius: 10px;
        text-align: right;
      ">

        <span style="
          color: #ffffff;
          font-size: 16px;
        ">
          Order Total:
        </span>

        <strong style="
          color: #ffffff;
          font-size: 22px;
          margin-left: 10px;
        ">
          ${formatPrice(total)}
        </strong>

      </div>

      <p style="
        margin: 25px 0 0;
        color: #777777;
        font-size: 13px;
        line-height: 1.6;
      ">
        Please prepare the items above and verify the customer's
        delivery details before shipping.
      </p>

    </div>

  </div>

</body>
</html>
  `;
};

// ============================================================
// CUSTOMER EMAIL
// ============================================================

const createCustomerEmail = ({
  orderNumber,
  customer,
  items,
  total,
  paymentMethod,
  paymentStatus,
}) => {
  return `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin: 0;
  padding: 0;
  background: #f7f2f0;
  font-family: Arial, Helvetica, sans-serif;
  color: #333333;
">

  <div style="
    max-width: 700px;
    margin: 30px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #eadfdb;
  ">

    <!-- HEADER -->

    <div style="
      background: #fff5f7;
      padding: 30px;
      text-align: center;
    ">

      <p style="
        margin: 0 0 8px;
        color: #c95b78;
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 2px;
      ">
        ORDER CONFIRMATION
      </p>

      <h1 style="
        margin: 0;
        color: #152d50;
        font-size: 28px;
      ">
        Thank You, ${escapeHtml(customer.fullName)}
      </h1>

      <p style="
        margin: 12px 0 0;
        color: #756b68;
      ">
        Your Crafting Tales order has been placed successfully.
      </p>

    </div>

    <!-- CONTENT -->

    <div style="padding: 30px;">

      <div style="
        padding: 18px;
        background: #f8fafc;
        border-radius: 12px;
        margin-bottom: 25px;
      ">

        <p style="margin: 5px 0;">
          <strong>Order Number:</strong>
          ${escapeHtml(orderNumber)}
        </p>

        <p style="margin: 5px 0;">
          <strong>Payment Method:</strong>
          ${escapeHtml(paymentMethod)}
        </p>

        <p style="margin: 5px 0;">
          <strong>Payment Status:</strong>
          ${escapeHtml(paymentStatus)}
        </p>

      </div>

      ${createOrderItemsSection(items)}

      <div style="
        margin-top: 25px;
        padding: 20px;
        background: #152d50;
        border-radius: 10px;
        text-align: right;
      ">

        <span style="
          color: #ffffff;
          font-size: 16px;
        ">
          Total:
        </span>

        <strong style="
          color: #ffffff;
          font-size: 23px;
          margin-left: 10px;
        ">
          ${formatPrice(total)}
        </strong>

      </div>

      ${createDeliveryHtml(customer)}

      <div style="
        margin-top: 25px;
        padding: 18px;
        border-left: 4px solid #c95b78;
        background: #fffaf8;
      ">

        <p style="
          margin: 0;
          color: #625a57;
          font-size: 14px;
          line-height: 1.7;
        ">
          We have received your order and will start preparing it.
          You will receive further updates as your order progresses.
        </p>

      </div>

      <p style="
        margin: 30px 0 0;
        text-align: center;
        color: #999999;
        font-size: 12px;
      ">
        Thank you for choosing Crafting Tales.
      </p>

    </div>

  </div>

</body>
</html>
  `;
};

// ============================================================
// SEND ORDER EMAILS
// ============================================================

app.post("/api/send-order-email", async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({
        success: false,
        message:
          "Resend is not configured. Add RESEND_API_KEY to .env.",
      });
    }

    const {
      orderNumber,
      customer,
      items,
      total,
      paymentMethod = "Cash on Delivery",
      paymentStatus = "Pending",
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required.",
      });
    }

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer details are required.",
      });
    }

    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required.",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Order items are required.",
      });
    }

    // --------------------------------------------------------
    // ADMIN EMAIL
    // --------------------------------------------------------

    let adminResult = null;
    let customerResult = null;

    try {
      adminResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🛍️ New Order ${orderNumber} — ${formatPrice(total)}`,
        html: createAdminEmail({
          orderNumber,
          customer,
          items,
          total,
          paymentMethod,
          paymentStatus,
        }),
      });
    } catch (error) {
      console.error("Admin email failed:", error);

      return res.status(500).json({
        success: false,
        message: "Admin email failed.",
        error: error.message || error,
      });
    }

    // --------------------------------------------------------
    // CUSTOMER EMAIL
    // --------------------------------------------------------

    try {
      customerResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject: `Crafting Tales — Order ${orderNumber} Confirmed`,
        html: createCustomerEmail({
          orderNumber,
          customer,
          items,
          total,
          paymentMethod,
          paymentStatus,
        }),
      });
    } catch (error) {
      console.error("Customer email failed:", error);

      return res.status(500).json({
        success: false,
        message: "Customer email failed.",
        adminEmailSent: true,
        error: error.message || error,
      });
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.json({
      success: true,
      message: "Order emails sent successfully.",
      adminEmail: {
        sent: true,
        id: adminResult?.data?.id || null,
      },
      customerEmail: {
        sent: true,
        id: customerResult?.data?.id || null,
      },
    });
  } catch (error) {
    console.error("Order email error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send order emails.",
      error: error.message || error,
    });
  }
});

// ============================================================
// TEST EMAIL
// ============================================================

app.post("/api/test-email", async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({
        success: false,
        message: "Resend API key is missing.",
      });
    }

    const email = req.body?.email || ADMIN_EMAIL;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Crafting Tales — Test Email",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          padding: 30px;
        ">
          <h1 style="color:#152d50;">
            Crafting Tales
          </h1>

          <p>
            Your email server is working correctly.
          </p>

          <p>
            This is a test email from your Crafting Tales
            email server.
          </p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "Test email sent successfully.",
      id: result?.data?.id || null,
    });
  } catch (error) {
    console.error("Test email failed:", error);

    return res.status(500).json({
      success: false,
      message: "Test email failed.",
      error: error.message || error,
    });
  }
});

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("🚀 Crafting Tales Email Server");
  console.log("======================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log(
    `Resend API: ${RESEND_API_KEY ? "Configured ✓" : "Missing ✗"}`
  );
  console.log("======================================");
  console.log("");
});