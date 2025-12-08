import { prop, modelOptions, index } from '@typegoose/typegoose';
import { Types } from 'mongoose';

/**
 * 错误详情实体 - MongoDB
 * 存储错误的详细信息（堆栈、上下文等）
 */
@modelOptions({
  schemaOptions: {
    collection: 'errors',
    timestamps: true,
  },
})
@index({ projectId: 1, timestamp: -1 })
@index({ projectId: 1, type: 1 })
@index({ errorHash: 1 })
export class ErrorLog {
  _id?: Types.ObjectId;
  @prop({ required: true })
  projectId: string;

  @prop({ required: true })
  type: string; // js, promise, resource

  @prop({ required: true })
  message: string;

  @prop()
  stack?: string;

  @prop()
  url: string;

  @prop()
  line?: number;

  @prop()
  col?: number;

  @prop()
  userAgent?: string;

  @prop()
  userId?: string;

  @prop()
  sessionId?: string;

  @prop({ required: true })
  timestamp: Date;

  // 错误指纹，用于聚合相同错误
  @prop()
  errorHash?: string;

  // 错误发生次数（聚合后）
  @prop({ default: 1 })
  count?: number;

  // 首次发生时间
  @prop()
  firstSeen?: Date;

  // 最后发生时间
  @prop()
  lastSeen?: Date;

  // 影响用户数
  @prop({ default: 0 })
  affectedUsers?: number;
}

