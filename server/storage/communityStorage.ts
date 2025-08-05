import { db } from "../db.js";
import { 
  supportForums, forumPosts,
  type SupportForum, type InsertSupportForum,
  type ForumPost, type InsertForumPost,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ICommunityStorage {
  getSupportForums(): Promise<SupportForum[]>;
  getForumPosts(forumId: number): Promise<ForumPost[]>;
  createForumPost(data: InsertForumPost): Promise<ForumPost>;
}

export class CommunityStorage implements ICommunityStorage {
  async getSupportForums(): Promise<SupportForum[]> {
    return await db.select().from(supportForums).orderBy(desc(supportForums.createdAt));
  }

  async getForumPosts(forumId: number): Promise<ForumPost[]> {
    return await db.select().from(forumPosts)
      .where(eq(forumPosts.forumId, forumId))
      .orderBy(desc(forumPosts.createdAt));
  }

  async createForumPost(data: InsertForumPost): Promise<ForumPost> {
    const result = await db.insert(forumPosts).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }
}