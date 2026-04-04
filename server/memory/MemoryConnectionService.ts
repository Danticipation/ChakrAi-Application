// MEMORY CONNECTION SERVICE - Manages relationships between semantic memories
// Creates intelligent connections for better therapeutic context retrieval

import { db } from '../db.js';
import { memoryConnections, semanticMemories } from '../../shared/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import type { 
  IMemoryConnectionService, 
  MemoryConnection, 
  SemanticMemory 
} from './types.js';

export class MemoryConnectionService implements IMemoryConnectionService {

  /**
   * Create a connection between two memories
   */
  async createConnection(connection: Partial<MemoryConnection>): Promise<MemoryConnection> {
    console.log(`🔗 Creating memory connection: ${connection.fromMemoryId} -> ${connection.toMemoryId}`);
    
    try {
      const connectionData = {
        userId: connection.userId!,
        fromMemoryId: connection.fromMemoryId!,
        toMemoryId: connection.toMemoryId!,
        connectionType: connection.connectionType || 'relates_to',
        strength: connection.strength || '0.50',
        automaticConnection: connection.automaticConnection !== false,
        createdAt: new Date()
      };

      const [createdConnection] = await db.insert(memoryConnections).values(connectionData).returning();
      console.log(`✅ Created connection ${createdConnection?.id}`);
      return createdConnection as MemoryConnection;

    } catch (error) {
      console.error('Error creating memory connection:', error);
      throw error;
    }
  }

  /**
   * Find all connections for a specific memory
   */
  async findConnections(memoryId: number): Promise<MemoryConnection[]> {
    try {
      const connections = await db.select()
        .from(memoryConnections)
        .where(or(
          eq(memoryConnections.fromMemoryId, memoryId),
          eq(memoryConnections.toMemoryId, memoryId)
        ))
        .orderBy(desc(memoryConnections.strength));

      return connections as MemoryConnection[];
    } catch (error) {
      console.error('Error finding memory connections:', error);
      return [];
    }
  }

  /**
   * Suggest automatic connections for a memory based on content similarity
   */
  async suggestConnections(memoryId: number): Promise<MemoryConnection[]> {
    console.log(`🤖 Suggesting automatic connections for memory ${memoryId}`);
    
    try {
      // Get the source memory
      const [sourceMemory] = await db.select()
        .from(semanticMemories)
        .where(eq(semanticMemories.id, memoryId));

      if (!sourceMemory) {
        return [];
      }

      // Find potentially related memories
      const candidateMemories = await this.findCandidateMemories(sourceMemory);
      const suggestedConnections: MemoryConnection[] = [];

      for (const candidate of candidateMemories) {
        if (candidate.id === memoryId) continue;

        // Calculate connection strength and type
        const connectionInfo = this.analyzeConnection(sourceMemory, candidate);
        
        if (connectionInfo.strength > 0.3) {
          // Check if connection already exists
          const existingConnections = await db.select()
            .from(memoryConnections)
            .where(and(
              or(
                and(
                  eq(memoryConnections.fromMemoryId, memoryId),
                  eq(memoryConnections.toMemoryId, candidate.id)
                ),
                and(
                  eq(memoryConnections.fromMemoryId, candidate.id),
                  eq(memoryConnections.toMemoryId, memoryId)
                )
              )
            ));

          if (existingConnections.length === 0) {
            const connection = await this.createConnection({
              userId: sourceMemory.userId,
              fromMemoryId: memoryId,
              toMemoryId: candidate.id,
              connectionType: connectionInfo.type,
              strength: connectionInfo.strength.toString(),
              automaticConnection: true
            });
            suggestedConnections.push(connection);
          }
        }
      }

      console.log(`🔗 Created ${suggestedConnections.length} automatic connections for memory ${memoryId}`);
      return suggestedConnections;

    } catch (error) {
      console.error('Error suggesting connections:', error);
      return [];
    }
  }

  /**
   * Get memory graph for visualization and analysis
   */
  async getMemoryGraph(userId: number): Promise<{ memories: SemanticMemory[], connections: MemoryConnection[] }> {
    console.log(`📊 Building memory graph for user ${userId}`);
    
    try {
      // Get all active memories for the user
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      // Get all connections for these memories
      const memoryIds = memories.map((m: any) => m.id);
      const connections = await db.select()
        .from(memoryConnections)
        .where(eq(memoryConnections.userId, userId));

      // Filter connections to only include memories we have
      const filteredConnections = connections.filter((conn: any) => 
        memoryIds.includes(conn.fromMemoryId) && memoryIds.includes(conn.toMemoryId)
      );

      console.log(`📊 Graph built: ${memories.length} memories, ${filteredConnections.length} connections`);
      return { memories, connections: filteredConnections };

    } catch (error) {
      console.error('Error building memory graph:', error);
      return { memories: [], connections: [] };
    }
  }

  /**
   * Find paths between two memories through connections
   */
  async findMemoryPaths(fromMemoryId: number, toMemoryId: number): Promise<MemoryConnection[][]> {
    console.log(`🛤️ Finding paths from memory ${fromMemoryId} to ${toMemoryId}`);
    
    try {
      // Get all connections involving these memories
      const allConnections = await db.select()
        .from(memoryConnections)
        .where(or(
          eq(memoryConnections.fromMemoryId, fromMemoryId),
          eq(memoryConnections.toMemoryId, fromMemoryId),
          eq(memoryConnections.fromMemoryId, toMemoryId),
          eq(memoryConnections.toMemoryId, toMemoryId)
        ));

      // Use breadth-first search to find paths
      const paths = this.findPathsBFS(fromMemoryId, toMemoryId, allConnections);
      
      console.log(`🛤️ Found ${paths.length} paths between memories`);
      return paths;

    } catch (error) {
      console.error('Error finding memory paths:', error);
      return [];
    }
  }

  /**
   * Get strongest connections for a user
   */
  async getStrongestConnections(userId: number, limit: number = 10): Promise<MemoryConnection[]> {
    try {
      const connections = await db.select()
        .from(memoryConnections)
        .where(eq(memoryConnections.userId, userId))
        .orderBy(desc(memoryConnections.strength))
        .limit(limit);

      return connections as MemoryConnection[];
    } catch (error) {
      console.error('Error getting strongest connections:', error);
      return [];
    }
  }

  /**
   * Find candidate memories for potential connections
   */
  private async findCandidateMemories(sourceMemory: SemanticMemory): Promise<SemanticMemory[]> {
    // Get memories from the same user with similar topics or tags
    const candidates = await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, sourceMemory.userId),
        eq(semanticMemories.isActiveMemory, true)
      ))
      .orderBy(desc(semanticMemories.createdAt))
      .limit(50); // Limit for performance

    return candidates;
  }

  /**
   * Analyze connection between two memories
   */
  private analyzeConnection(memory1: SemanticMemory, memory2: SemanticMemory): {
    type: string;
    strength: number;
  } {
    let strength = 0;
    let connectionType: string = 'relates_to';

    // Check semantic tag overlap
    const memory1Tags = memory1.semanticTags || [];
    const memory2Tags = memory2.semanticTags || [];
    const sharedTags = memory1Tags.filter(tag => memory2Tags.includes(tag));
    strength += sharedTags.length * 0.2;

    // Check topic overlap
    const memory1Topics = memory1.relatedTopics || [];
    const memory2Topics = memory2.relatedTopics || [];
    const sharedTopics = memory1Topics.filter(topic => memory2Topics.includes(topic));
    strength += sharedTopics.length * 0.15;

    // Check emotional context similarity
    if (memory1.emotionalContext && memory2.emotionalContext &&
        memory1.emotionalContext === memory2.emotionalContext) {
      strength += 0.1;
    }

    // Check content similarity (simple keyword matching)
    const content1Words = (memory1.content || '').toLowerCase().split(' ');
    const content2Words = (memory2.content || '').toLowerCase().split(' ');
    const sharedWords = content1Words.filter(word =>
      word.length > 3 && content2Words.includes(word)
    );
    strength += Math.min(sharedWords.length * 0.05, 0.3);

    // Check memory types for connection type
    if (memory1.memoryType === 'goal' && memory2.memoryType === 'insight') {
      connectionType = 'builds_on';
      strength += 0.1;
    } else if (memory1.memoryType === 'pattern' && memory2.memoryType === 'insight') {
      connectionType = 'resolves';
      strength += 0.1;
    }

    // Check temporal proximity
    if (memory1.createdAt && memory2.createdAt) {
      const timeDiff = Math.abs(
        new Date(memory1.createdAt).getTime() - new Date(memory2.createdAt).getTime()
      );
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 1) {
        strength += 0.1; // Same day bonus
      } else if (daysDiff < 7) {
        strength += 0.05; // Same week bonus
      }
    }

    return { type: connectionType, strength: Math.min(strength, 1.0) };
  }

  /**
   * Breadth-first search for paths between memories
   */
  private findPathsBFS(fromId: number, toId: number, connections: MemoryConnection[]): MemoryConnection[][] {
    const paths: MemoryConnection[][] = [];
    const queue: { memoryId: number; path: MemoryConnection[] }[] = [{ memoryId: fromId, path: [] }];
    const visited = new Set<number>();
    const maxDepth = 3; // Limit path depth

    while (queue.length > 0 && paths.length < 5) { // Limit number of paths
      const { memoryId, path } = queue.shift()!;

      if (path.length >= maxDepth) continue;
      if (visited.has(memoryId)) continue;
      
      visited.add(memoryId);

      if (memoryId === toId && path.length > 0) {
        paths.push([...path]);
        continue;
      }

      // Find connections from current memory
      const nextConnections = connections.filter(conn => 
        conn.fromMemoryId === memoryId || conn.toMemoryId === memoryId
      );

      for (const conn of nextConnections) {
        const nextMemoryId = conn.fromMemoryId === memoryId ? conn.toMemoryId : conn.fromMemoryId;
        
        if (!visited.has(nextMemoryId)) {
          queue.push({
            memoryId: nextMemoryId,
            path: [...path, conn]
          });
        }
      }
    }

    return paths;
  }
}
