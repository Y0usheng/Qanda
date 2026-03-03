import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  isPublic: { type: Boolean, required: true },
  content: { type: String, required: true, maxlength: 2000 },
  lock: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  watchees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export default mongoose.model('Thread', threadSchema);
