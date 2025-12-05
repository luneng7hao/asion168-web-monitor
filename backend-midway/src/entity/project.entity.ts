import { prop, modelOptions } from '@typegoose/typegoose';

/**
 * 项目实体 - MongoDB
 * 存储项目基本信息
 */
@modelOptions({
  schemaOptions: {
    collection: 'projects',
    timestamps: true,
  },
})
export class Project {
  @prop({ required: true, unique: true })
  projectId: string;

  @prop({ required: true })
  name: string;

  @prop({ default: '' })
  description: string;

  @prop({ default: true })
  isActive: boolean;

  @prop()
  createdAt?: Date;

  @prop()
  updatedAt?: Date;
}

