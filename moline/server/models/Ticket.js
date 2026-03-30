let mongoose;
try {
  mongoose = require("mongoose");
} catch (err) {
  console.warn("mongoose not installed - Ticket model disabled");
  module.exports = null;
}

if (!mongoose) {
  // mongoose not available; export null to allow safe require()
  module.exports = null;
} else {
  const { Schema } = mongoose;

  const TicketSchema = new Schema(
    {
      subject: { type: String, required: true },
      category: { type: String, required: true },
      priority: { type: String, required: true },
      message: { type: String, required: true },
      attachment: { type: Schema.Types.Mixed, default: "" },
      user: { type: Schema.Types.ObjectId, ref: "User", required: false },
      status: { type: String, default: "open" },
    },
    { timestamps: true },
  );

  module.exports =
    mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
}
