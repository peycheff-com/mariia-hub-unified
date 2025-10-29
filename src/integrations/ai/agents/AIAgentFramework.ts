import { EventEmitter } from 'events';

import { getEnhancedAIService } from '../core/AIService';

// Types
interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
  tools: string[];
}

interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  input: any;
  output?: any;
  steps: AgentStep[];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  deadline?: Date;
}

interface AgentStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tool?: string;
  input?: any;
  output?: any;
  reasoning?: string;
  confidence?: number;
  duration?: number;
}

interface AgentPlan {
  goal: string;
  steps: Array<{
    action: string;
    tool: string;
    expectedOutcome: string;
    dependencies: string[];
  }>;
  estimatedDuration: number;
  confidence: number;
  alternatives?: Array<{
    steps: typeof AgentPlan.prototype.steps;
    confidence: number;
  }>;
}

interface AgentMemory {
  shortTerm: Map<string, any>;
  longTerm: Map<string, any>;
  episodic: Array<{
    event: string;
    timestamp: Date;
    context: any;
    outcome: any;
  }>;
}

// Advanced AI Agent Class
export class AdvancedAIAgent extends EventEmitter {
  private id: string;
  private name: string;
  private capabilities: AgentCapability[];
  private tools: Map<string, AgentTool>;
  private memory: AgentMemory;
  private currentTask: AgentTask | null = null;
  private taskQueue: AgentTask[] = [];
  private isProcessing = false;
  private planningEnabled = true;
  private learningEnabled = true;
  private aiService = getEnhancedAIService();

  constructor(config: {
    name: string;
    capabilities: AgentCapability[];
    tools?: AgentTool[];
  }) {
    super();
    this.id = crypto.randomUUID();
    this.name = config.name;
    this.capabilities = config.capabilities;
    this.tools = new Map();

    // Initialize tools
    if (config.tools) {
      config.tools.forEach(tool => {
        this.tools.set(tool.name, tool);
      });
    }

    // Initialize memory
    this.memory = {
      shortTerm: new Map(),
      longTerm: new Map(),
      episodic: [],
    };

    // Start processing loop
    this.startProcessingLoop();
  }

  // Add a tool to the agent
  addTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
    this.emit('toolAdded', { agent: this.id, tool: tool.name });
  }

  // Remove a tool from the agent
  removeTool(toolName: string): void {
    this.tools.delete(toolName);
    this.emit('toolRemoved', { agent: this.id, tool: toolName });
  }

  // Assign a task to the agent
  async assignTask(task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'steps'>): Promise<string> {
    const fullTask: AgentTask = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [],
    };

    this.taskQueue.push(fullTask);
    this.emit('taskAssigned', { agent: this.id, taskId: fullTask.id });

    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return fullTask.id;
  }

  // Plan execution steps for a task
  private async createPlan(task: AgentTask): Promise<AgentPlan> {
    if (!this.planningEnabled) {
      // Create basic plan without AI
      return {
        goal: task.description,
        steps: [
          {
            action: 'Execute task directly',
            tool: 'direct',
            expectedOutcome: 'Task completion',
            dependencies: [],
          },
        ],
        estimatedDuration: 300,
        confidence: 0.5,
      };
    }

    // Use AI to create detailed plan
    const availableTools = Array.from(this.tools.keys()).join(', ');
    const capabilities = this.capabilities
      .filter(c => c.enabled)
      .map(c => c.name)
      .join(', ');

    const planningPrompt = `You are an AI agent named ${this.name} with these capabilities: ${capabilities}
    Available tools: ${availableTools}

    Create a detailed execution plan for this task: ${task.description}

    Task input: ${JSON.stringify(task.input)}

    Requirements:
    1. Break down the task into sequential steps
    2. For each step, specify which tool to use
    3. Define expected outcomes for each step
    4. Identify dependencies between steps
    5. Estimate total duration in seconds
    6. Provide confidence level (0-1)

    Respond with JSON:
    {
      "goal": "Overall goal",
      "steps": [
        {
          "action": "Specific action to take",
          "tool": "Tool name or 'reasoning'",
          "expectedOutcome": "Expected result",
          "dependencies": ["step_id_1", "step_id_2"]
        }
      ],
      "estimatedDuration": 300,
      "confidence": 0.85,
      "alternatives": []
    }`;

    try {
      const result = await this.aiService.generateContent(planningPrompt, {
        temperature: 0.3,
      });

      const plan = JSON.parse(result.content);

      // Store plan in memory
      this.memory.shortTerm.set(`plan_${task.id}`, plan);

      return plan;
    } catch (error) {
      console.error('Planning failed:', error);
      throw new Error(`Failed to create plan for task ${task.id}`);
    }
  }

  // Execute a step in the plan
  private async executeStep(step: AgentStep, task: AgentTask): Promise<any> {
    const startTime = Date.now();
    step.status = 'in_progress';

    this.emit('stepStarted', {
      agent: this.id,
      taskId: task.id,
      stepId: step.id,
    });

    try {
      let result: any;

      if (step.tool === 'reasoning') {
        // Use AI reasoning
        result = await this.aiService.complexReasoning(
          step.description,
          'business',
          JSON.stringify(task.input)
        );
      } else if (this.tools.has(step.tool)) {
        // Use available tool
        const tool = this.tools.get(step.tool)!;
        result = await tool.execute(step.input || {});
      } else {
        throw new Error(`Tool not found: ${step.tool}`);
      }

      step.output = result;
      step.status = 'completed';
      step.duration = Date.now() - startTime;
      step.confidence = 0.9; // Would calculate based on result quality

      // Learn from successful execution
      if (this.learningEnabled) {
        this.learnFromStep(step, task, true);
      }

      this.emit('stepCompleted', {
        agent: this.id,
        taskId: task.id,
        stepId: step.id,
        result,
      });

      return result;
    } catch (error) {
      step.status = 'failed';
      step.duration = Date.now() - startTime;
      step.confidence = 0.1;

      // Learn from failure
      if (this.learningEnabled) {
        this.learnFromStep(step, task, false);
      }

      this.emit('stepFailed', {
        agent: this.id,
        taskId: task.id,
        stepId: step.id,
        error: error.message,
      });

      throw error;
    }
  }

  // Learn from step execution
  private learnFromStep(step: AgentStep, task: AgentTask, success: boolean): void {
    const learning = {
      action: step.description,
      tool: step.tool,
      success,
      context: {
        taskType: task.type,
        input: step.input,
        duration: step.duration,
      },
      timestamp: new Date(),
    };

    // Store in episodic memory
    this.memory.episodic.push({
      event: `Step ${success ? 'completed' : 'failed'}: ${step.description}`,
      timestamp: new Date(),
      context: learning.context,
      outcome: success ? 'success' : 'failure',
    });

    // Update long-term memory with patterns
    const patternKey = `${step.tool}_${task.type}`;
    const currentPattern = this.memory.longTerm.get(patternKey) || {
      successes: 0,
      failures: 0,
      avgDuration: 0,
      lastUsed: new Date(),
    };

    if (success) {
      currentPattern.successes++;
    } else {
      currentPattern.failures++;
    }

    if (step.duration) {
      const totalExecutions = currentPattern.successes + currentPattern.failures;
      currentPattern.avgDuration =
        (currentPattern.avgDuration * (totalExecutions - 1) + step.duration) / totalExecutions;
    }

    currentPattern.lastUsed = new Date();
    this.memory.longTerm.set(patternKey, currentPattern);
  }

  // Execute a complete task
  private async executeTask(task: AgentTask): Promise<void> {
    this.currentTask = task;
    task.status = 'in_progress';

    this.emit('taskStarted', {
      agent: this.id,
      taskId: task.id,
      taskType: task.type,
    });

    try {
      // Create execution plan
      const plan = await this.createPlan(task);

      // Convert plan steps to agent steps
      task.steps = plan.steps.map((planStep, index) => ({
        id: `step_${index}`,
        description: planStep.action,
        status: 'pending' as const,
        tool: planStep.tool,
        expectedOutcome: planStep.expectedOutcome,
        dependencies: planStep.dependencies,
      }));

      // Execute steps in order
      for (const step of task.steps) {
        // Check dependencies
        if (step.dependencies && step.dependencies.length > 0) {
          const dependenciesMet = step.dependencies.every(depId => {
            const depStep = task.steps.find(s => s.id === depId);
            return depStep && depStep.status === 'completed';
          });

          if (!dependenciesMet) {
            throw new Error(`Dependencies not met for step: ${step.description}`);
          }
        }

        // Execute step
        await this.executeStep(step, task);
        task.updatedAt = new Date();
      }

      // Mark task as completed
      task.status = 'completed';
      task.output = {
        steps: task.steps,
        duration: Date.now() - task.createdAt.getTime(),
        confidence: plan.confidence,
      };

      this.emit('taskCompleted', {
        agent: this.id,
        taskId: task.id,
        result: task.output,
      });

    } catch (error) {
      task.status = 'failed';
      task.output = { error: error.message };

      this.emit('taskFailed', {
        agent: this.id,
        taskId: task.id,
        error: error.message,
      });
    } finally {
      this.currentTask = null;
    }
  }

  // Start the processing loop
  private startProcessingLoop(): void {
    setInterval(async () => {
      if (this.isProcessing || this.taskQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const task = this.taskQueue.shift();
        if (task) {
          await this.executeTask(task);
        }
      } catch (error) {
        console.error('Error in processing loop:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000);
  }

  // Get agent status
  getStatus(): {
    id: string;
    name: string;
    capabilities: AgentCapability[];
    currentTask: AgentTask | null;
    queueLength: number;
    memoryStats: {
      shortTerm: number;
      longTerm: number;
      episodic: number;
    };
    learningEnabled: boolean;
    planningEnabled: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      currentTask: this.currentTask,
      queueLength: this.taskQueue.length,
      memoryStats: {
        shortTerm: this.memory.shortTerm.size,
        longTerm: this.memory.longTerm.size,
        episodic: this.memory.episodic.length,
      },
      learningEnabled: this.learningEnabled,
      planningEnabled: this.planningEnabled,
    };
  }

  // Get task status
  getTaskStatus(taskId: string): AgentTask | null {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (task) return task;
    if (this.currentTask?.id === taskId) return this.currentTask;
    return null;
  }

  // Cancel a task
  cancelTask(taskId: string): boolean {
    const taskIndex = this.taskQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.taskQueue[taskIndex];
      task.status = 'cancelled';
      this.taskQueue.splice(taskIndex, 1);
      this.emit('taskCancelled', { agent: this.id, taskId });
      return true;
    }
    return false;
  }

  // Enable/disable learning
  setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
  }

  // Enable/disable planning
  setPlanningEnabled(enabled: boolean): void {
    this.planningEnabled = enabled;
  }

  // Clear memory
  clearMemory(type: 'short' | 'long' | 'episodic' | 'all'): void {
    switch (type) {
      case 'short':
        this.memory.shortTerm.clear();
        break;
      case 'long':
        this.memory.longTerm.clear();
        break;
      case 'episodic':
        this.memory.episodic = [];
        break;
      case 'all':
        this.memory.shortTerm.clear();
        this.memory.longTerm.clear();
        this.memory.episodic = [];
        break;
    }
  }
}

// Agent Manager for managing multiple agents
export class AgentManager {
  private agents: Map<string, AdvancedAIAgent> = new Map();
  private taskAssignments: Map<string, string> = new Map(); // taskId -> agentId

  // Create and register a new agent
  createAgent(config: {
    name: string;
    capabilities: AgentCapability[];
    tools?: AgentTool[];
  }): AdvancedAIAgent {
    const agent = new AdvancedAIAgent(config);
    this.agents.set(agent.id, agent);
    return agent;
  }

  // Assign task to best suited agent
  async assignTask(
    task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'steps'>,
    preferredAgentId?: string
  ): Promise<string> {
    if (preferredAgentId && this.agents.has(preferredAgentId)) {
      const agent = this.agents.get(preferredAgentId)!;
      const taskId = await agent.assignTask(task);
      this.taskAssignments.set(taskId, preferredAgentId);
      return taskId;
    }

    // Find best agent for the task
    const bestAgent = this.findBestAgent(task);
    if (!bestAgent) {
      throw new Error('No suitable agent available for this task');
    }

    const taskId = await bestAgent.assignTask(task);
    this.taskAssignments.set(taskId, bestAgent.id);
    return taskId;
  }

  // Find best agent for a task
  private findBestAgent(
    task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'steps'>
  ): AdvancedAIAgent | null {
    let bestAgent: AdvancedAIAgent | null = null;
    let bestScore = -1;

    for (const agent of this.agents.values()) {
      const score = this.calculateAgentScore(agent, task);
      if (score > bestScore && agent.getStatus().queueLength < 5) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  // Calculate how suitable an agent is for a task
  private calculateAgentScore(
    agent: AdvancedAIAgent,
    task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'steps'>
  ): number {
    const status = agent.getStatus();
    let score = 0;

    // Check if agent has required capabilities
    const hasRequiredCapability = status.capabilities.some(cap =>
      task.type.toLowerCase().includes(cap.name.toLowerCase())
    );
    if (hasRequiredCapability) {
      score += 10;
    }

    // Factor in queue length (prefer less busy agents)
    score -= status.queueLength * 2;

    // Factor in learning (prefer experienced agents)
    if (status.learningEnabled && status.memoryStats.episodic > 10) {
      score += 5;
    }

    return score;
  }

  // Get all agents
  getAllAgents(): AdvancedAIAgent[] {
    return Array.from(this.agents.values());
  }

  // Get agent by ID
  getAgent(agentId: string): AdvancedAIAgent | undefined {
    return this.agents.get(agentId);
  }

  // Get task status
  getTaskStatus(taskId: string): { task: AgentTask | null; agentId: string | null } {
    const agentId = this.taskAssignments.get(taskId);
    if (!agentId) return { task: null, agentId: null };

    const agent = this.agents.get(agentId);
    const task = agent?.getTaskStatus(taskId) || null;

    return { task, agentId };
  }
}

// Factory function
export function createAgentManager(): AgentManager {
  return new AgentManager();
}

// Predefined tools
export const CommonTools: AgentTool[] = [
  {
    name: 'search_database',
    description: 'Search the database for information',
    parameters: { query: 'string', table: 'string' },
    execute: async (params) => {
      // Implementation for database search
      return { results: [] };
    },
  },
  {
    name: 'send_email',
    description: 'Send an email to a user',
    parameters: { to: 'string', subject: 'string', body: 'string' },
    execute: async (params) => {
      // Implementation for sending email
      return { sent: true };
    },
  },
  {
    name: 'schedule_appointment',
    description: 'Schedule an appointment in the system',
    parameters: { serviceId: 'string', dateTime: 'string', userId: 'string' },
    execute: async (params) => {
      // Implementation for scheduling
      return { scheduled: true };
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a business report',
    parameters: { type: 'string', dateRange: 'object' },
    execute: async (params) => {
      // Implementation for report generation
      return { reportUrl: '' };
    },
  },
];