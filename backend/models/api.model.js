const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add an API name'],
      trim: true,
    },
    description: {
      type: String,
    },
    baseUrl: {
      type: String,
      required: [true, 'Please add a base URL'],
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Please add a valid URL',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on userId
apiSchema.index({ userId: 1 });

module.exports = mongoose.model('API', apiSchema);
