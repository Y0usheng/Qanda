import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  image: { type: String, default: null },
  admin: { type: Boolean, default: false },
  threadsWatching: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
});

export default mongoose.model('User', userSchema);
