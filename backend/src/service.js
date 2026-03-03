import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { InputError, AccessError } from './error.js';
import User from './models/User.js';
import Thread from './models/Thread.js';
import Comment from './models/Comment.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'donthugmeimscared';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const requireObjectId = (id, label) => {
  if (!isValidObjectId(id)) {
    throw new InputError(`Invalid ${label} ${id}`);
  }
  return String(id);
};

const mapThread = (thread) => ({
  id: thread._id.toString(),
  creatorId: thread.creatorId?.toString(),
  title: thread.title,
  isPublic: thread.isPublic,
  content: thread.content,
  lock: thread.lock,
  createdAt: thread.createdAt,
  likes: (thread.likes || []).map((id) => id.toString()),
  watchees: (thread.watchees || []).map((id) => id.toString()),
});

const mapComment = (comment) => ({
  id: comment._id.toString(),
  creatorId: comment.creatorId?.toString(),
  threadId: comment.threadId?.toString(),
  parentCommentId: comment.parentCommentId ? comment.parentCommentId.toString() : null,
  content: comment.content,
  createdAt: comment.createdAt,
  likes: (comment.likes || []).map((id) => id.toString()),
});

const mapUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  image: user.image,
  admin: user.admin,
  threadsWatching: (user.threadsWatching || []).map((id) => id.toString()),
});

/**
 * @param {string} base64String
 * @returns {string | null}
 */
const saveImage = (base64String) => {
  if (!base64String) return null;
  if (!base64String.startsWith('data:image')) return base64String;
  return base64String;
};

/***************************************************************
                         State Management
***************************************************************/

export const save = async () => {};

export const reset = async () => {
  await Promise.all([
    User.deleteMany({}),
    Thread.deleteMany({}),
    Comment.deleteMany({}),
  ]);
};

/***************************************************************
                         Auth Functions
***************************************************************/

export const getUserIdFromAuthorization = (authorization) => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AccessError('Missing or invalid authorization header');
  }

  const token = authorization.replace('Bearer ', '');
  try {
    const { userId } = jwt.verify(token, getJwtSecret());
    return String(userId);
  } catch {
    throw new AccessError(`Invalid token ${token}`);
  }
};

export const getUserIdFromEmail = async (email) => {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('_id').lean();
  return user ? user._id.toString() : undefined;
};

export const login = async (email, password) => {
  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user || user.password !== password) {
    throw new InputError(`Invalid email ${email} or password ${password}`);
  }

  const userId = user._id.toString();
  return {
    token: jwt.sign({ userId }, getJwtSecret(), { algorithm: 'HS256' }),
    userId,
  };
};

export const register = async (email, password, name) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new InputError(`Email address ${email} is not valid`);
  }

  if (password.length < 6) {
    throw new InputError('Password must be at least 6 characters long');
  }

  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).select('_id').lean();
  if (existing) {
    throw new InputError(`Email address ${email} already registered`);
  }

  const isFirstUser = (await User.estimatedDocumentCount()) === 0;

  const user = await User.create({
    email: normalizedEmail,
    name,
    password,
    image: null,
    admin: isFirstUser,
    threadsWatching: [],
  });

  const userId = user._id.toString();

  return {
    token: jwt.sign({ userId }, getJwtSecret(), { algorithm: 'HS256' }),
    userId,
  };
};

/***************************************************************
                       Threads Functions
***************************************************************/

export const assertValidThread = async (threadId) => {
  const id = requireObjectId(threadId, 'thread post ID');
  const thread = await Thread.findById(id).select('_id').lean();
  if (!thread) {
    throw new InputError(`Invalid thread post ID ${threadId}`);
  }
};

export const assertValidComment = async (commentId, canBeNull = false) => {
  if (canBeNull && commentId === null) {
    return;
  }

  const id = requireObjectId(commentId, 'comment ID');
  const comment = await Comment.findById(id).select('_id').lean();
  if (!comment) {
    throw new InputError(`Invalid comment ID ${commentId}`);
  }
};

export const assertViewPermissionOfThread = async (userId, threadId) => {
  const uid = requireObjectId(userId, 'user ID');
  const tid = requireObjectId(threadId, 'thread ID');

  const [user, thread] = await Promise.all([
    User.findById(uid).select('admin').lean(),
    Thread.findById(tid).select('isPublic creatorId').lean(),
  ]);

  if (!user || !thread) {
    throw new InputError('User or thread not found');
  }

  if (!(thread.isPublic || user.admin || thread.creatorId.toString() === uid)) {
    throw new AccessError(`Authorised user ${userId} is not the creator of this thread ${threadId}`);
  }
};

export const assertUnlockedThread = async (threadId) => {
  const tid = requireObjectId(threadId, 'thread ID');
  const thread = await Thread.findById(tid).select('lock').lean();

  if (!thread) {
    throw new InputError(`Invalid thread ID ${threadId}`);
  }

  if (thread.lock) {
    throw new InputError(`This thread ${threadId} is locked`);
  }
};

export const assertEditPermissionOfThread = async (userId, threadId) => {
  const uid = requireObjectId(userId, 'user ID');
  const tid = requireObjectId(threadId, 'thread ID');

  const [user, thread] = await Promise.all([
    User.findById(uid).select('admin').lean(),
    Thread.findById(tid).select('creatorId').lean(),
  ]);

  if (!user || !thread) {
    throw new InputError('User or thread not found');
  }

  if (thread.creatorId.toString() !== uid && !user.admin) {
    throw new AccessError(`Authorised user ${userId} is not the creator of this thread ${threadId}`);
  }
};

export const threadsGet = async (authUserId, start, limit = 10, sortBy = 'recent') => {
  if (Number.isNaN(start)) {
    throw new InputError(`Invalid start value of ${start}`);
  }

  if (start < 0) {
    throw new InputError(`Start value of ${start} cannot be negative`);
  }

  if (Number.isNaN(limit) || limit <= 0) {
    limit = 10;
  }

  const uid = requireObjectId(authUserId, 'user ID');
  const authUser = await User.findById(uid).select('admin').lean();
  if (!authUser) {
    throw new AccessError(`Invalid authenticated user ${authUserId}`);
  }

  const filter = authUser.admin
    ? {}
    : {
        $or: [
          { isPublic: true },
          { creatorId: uid },
        ],
      };

  let threads = await Thread.find(filter).lean();

  if (sortBy === 'likes') {
    threads.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  } else {
    threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return threads.slice(start, start + limit).map((thread) => thread._id.toString());
};

export const threadGet = async (authUserId, threadId) => {
  const tid = requireObjectId(threadId, 'thread ID');
  const thread = await Thread.findById(tid).lean();

  if (!thread) {
    throw new InputError(`Invalid thread ID ${threadId}`);
  }

  return mapThread(thread);
};

export const threadNew = async (authUserId, title, isPublic, content) => {
  if (title === undefined || title.trim() === '' || content === undefined || content.trim() === '' || isPublic === undefined || ![true, false].includes(isPublic)) {
    throw new InputError(`Please enter all relevant fields, you entered title(${title}), isPublic(${isPublic}), content(${content})`);
  }

  if (content.length > 2000) {
    throw new InputError('Thread content cannot exceed 2000 characters');
  }

  if (title.length > 100) {
    throw new InputError('Thread title cannot exceed 100 characters');
  }

  const uid = requireObjectId(authUserId, 'user ID');

  const thread = await Thread.create({
    creatorId: uid,
    title,
    isPublic,
    content,
    lock: false,
    likes: [],
    watchees: [],
  });

  return thread._id.toString();
};

export const threadUpdate = async (authUserId, threadId, title, isPublic, content, lock) => {
  const tid = requireObjectId(threadId, 'thread ID');
  const thread = await Thread.findById(tid);

  if (!thread) {
    throw new InputError(`Invalid thread ID ${threadId}`);
  }

  if (title !== undefined) {
    if (title.trim() === '') {
      throw new InputError('Thread title cannot be empty');
    }
    if (title.length > 100) {
      throw new InputError('Thread title cannot exceed 100 characters');
    }
    thread.title = title;
  }

  if (content !== undefined) {
    if (content.trim() === '') {
      throw new InputError('Thread content cannot be empty');
    }
    if (content.length > 2000) {
      throw new InputError('Thread content cannot exceed 2000 characters');
    }
    thread.content = content;
  }

  if (isPublic !== undefined) {
    thread.isPublic = isPublic;
  }

  if (lock !== undefined) {
    thread.lock = lock;
  }

  await thread.save();
  return mapThread(thread);
};

export const threadLikeToggle = async (authUserId, threadId, turnon) => {
  const uid = requireObjectId(authUserId, 'user ID');
  const tid = requireObjectId(threadId, 'thread ID');

  if (turnon) {
    await Thread.findByIdAndUpdate(tid, { $addToSet: { likes: uid } });
  } else {
    await Thread.findByIdAndUpdate(tid, { $pull: { likes: uid } });
  }

  return Thread.findById(tid).lean();
};

export const threadDelete = async (authUserId, threadId) => {
  const tid = requireObjectId(threadId, 'thread ID');

  await Promise.all([
    Thread.findByIdAndDelete(tid),
    Comment.deleteMany({ threadId: tid }),
    User.updateMany({}, { $pull: { threadsWatching: tid } }),
  ]);
};

export const threadWatchToggle = async (authUserId, threadId, turnon) => {
  const uid = requireObjectId(authUserId, 'user ID');
  const tid = requireObjectId(threadId, 'thread ID');

  if (turnon) {
    await Promise.all([
      Thread.findByIdAndUpdate(tid, { $addToSet: { watchees: uid } }),
      User.findByIdAndUpdate(uid, { $addToSet: { threadsWatching: tid } }),
    ]);
  } else {
    await Promise.all([
      Thread.findByIdAndUpdate(tid, { $pull: { watchees: uid } }),
      User.findByIdAndUpdate(uid, { $pull: { threadsWatching: tid } }),
    ]);
  }

  return Thread.findById(tid).lean();
};

/***************************************************************
                       Comments Functions
***************************************************************/

export const assertEditPermissionOfComment = async (userId, commentId) => {
  const uid = requireObjectId(userId, 'user ID');
  const cid = requireObjectId(commentId, 'comment ID');

  const [user, comment] = await Promise.all([
    User.findById(uid).select('admin').lean(),
    Comment.findById(cid).select('creatorId').lean(),
  ]);

  if (!user || !comment) {
    throw new InputError('User or comment not found');
  }

  if (comment.creatorId.toString() !== uid && !user.admin) {
    throw new AccessError(`Authorised user ${userId} is not permitted to edit comment ${commentId}`);
  }
};

export const assertLikePermissionOfComment = async (userId, commentId) => {
  const cid = requireObjectId(commentId, 'comment ID');
  const comment = await Comment.findById(cid).select('threadId').lean();

  if (!comment) {
    throw new InputError(`Invalid comment ID ${commentId}`);
  }

  await assertViewPermissionOfThread(userId, comment.threadId.toString());
};

export const commentsGet = async (authUserId, threadId) => {
  const tid = requireObjectId(threadId, 'thread ID');

  const comments = await Comment.find({ threadId: tid }).sort({ createdAt: 1 }).lean();
  return comments.map(mapComment);
};

export const commentNew = async (authUserId, threadId, parentCommentId, content) => {
  if (threadId === undefined || parentCommentId === undefined || content === undefined) {
    throw new InputError(`Please enter all relevant fields, you entered threadId(${threadId}), parentCommentId(${parentCommentId}), content(${content})`);
  }

  const uid = requireObjectId(authUserId, 'user ID');
  const tid = requireObjectId(threadId, 'thread ID');

  const payload = {
    creatorId: uid,
    threadId: tid,
    parentCommentId: parentCommentId === null ? null : requireObjectId(parentCommentId, 'parent comment ID'),
    content,
    likes: [],
  };

  const comment = await Comment.create(payload);
  return comment._id.toString();
};

export const commentUpdate = async (authUserId, commentId, content) => {
  const cid = requireObjectId(commentId, 'comment ID');
  const comment = await Comment.findById(cid);

  if (!comment) {
    throw new InputError(`Invalid comment ID ${commentId}`);
  }

  if (content) {
    comment.content = content;
  }

  await comment.save();
  return mapComment(comment);
};

export const commentLikeToggle = async (authUserId, commentId, turnon) => {
  const uid = requireObjectId(authUserId, 'user ID');
  const cid = requireObjectId(commentId, 'comment ID');

  if (turnon) {
    await Comment.findByIdAndUpdate(cid, { $addToSet: { likes: uid } });
  } else {
    await Comment.findByIdAndUpdate(cid, { $pull: { likes: uid } });
  }

  return Comment.findById(cid).lean();
};

export const commentDelete = async (authUserId, commentId) => {
  const cid = requireObjectId(commentId, 'comment ID');
  await Comment.findByIdAndDelete(cid);
};

/***************************************************************
                         User Functions
***************************************************************/

export const assertValidUserId = async (userId) => {
  const uid = requireObjectId(userId, 'user ID');
  const user = await User.findById(uid).select('_id').lean();
  if (!user) {
    throw new InputError(`Invalid user ID ${userId}`);
  }
};

export const assertAdminUserId = async (userId) => {
  const uid = requireObjectId(userId, 'admin user ID');
  const user = await User.findById(uid).select('admin').lean();

  if (!user || !user.admin) {
    throw new InputError(`Invalid admin user ID ${userId}`);
  }
};

export const userGet = async (userId) => {
  const uid = requireObjectId(userId, 'user ID');
  const user = await User.findById(uid).lean();

  if (!user) {
    throw new InputError(`Invalid user ID ${userId}`);
  }

  return mapUser(user);
};

export const userAdminChange = async (authUserId, userId, turnon) => {
  if (turnon === undefined) {
    throw new InputError('turnon property is missing');
  }

  const uid = requireObjectId(userId, 'user ID');
  await User.findByIdAndUpdate(uid, { admin: !!turnon });
};

export const userUpdate = async (authUserId, email, password, name, image) => {
  const uid = requireObjectId(authUserId, 'user ID');
  const user = await User.findById(uid);

  if (!user) {
    throw new InputError(`Invalid user ID ${authUserId}`);
  }

  if (name) {
    user.name = name;
  }

  if (password) {
    user.password = password;
  }

  if (image) {
    const imagePath = saveImage(image);
    if (imagePath) {
      user.image = imagePath;
    }
  }

  if (email) {
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).select('_id').lean();

    if (existing && existing._id.toString() !== uid) {
      throw new InputError(`Email address ${email} already taken`);
    }

    user.email = normalizedEmail;
  }

  await user.save();
};
