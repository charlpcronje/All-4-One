// Path: backend/src/services/process-runner.service.ts
// CORRECTED VERSION

import { fx } from '@/core/fx.js';
import { FxNode, classRegistry } from '@/core/fx.js';
import { processRegistry } from './process-registry.service.js';
import { FxVfsService } from './fx-vfs.service.js';
import { createLogger } from '../logging/index.js';

const logger = createLogger('service:process-runner');


export class ProcessRunnerService {
  private vfs: FxVfsService;

  constructor(vfs: FxVfsService) {
    this.vfs = vfs;
  }

  /**
   * Executes a process defined on a requestFx node. This is the main
   * entry point for the runner and orchestrates the entire flow.
   * @param requestFx The main fx node for the entire request. It must
   *                  contain a `definition` sub-node that has been hydrated.
   */
  async run(requestFx: FxNode): Promise<void> {
    const definition = requestFx.definition;
    if (!definition || !definition.startNode.val()) {
      logger.error('ProcessRunner Error: requestFx node is missing a valid `definition` with a `startNode`.', { requestId: requestFx.__id });
      throw new Error('Invalid process definition provided.');
    }

    // 1. Create a new fx node for this specific execution attempt.
    const runFx = fx.createNode(requestFx.__id);
    runFx.timestamp.set(new Date().toISOString());
    runFx.status.set('running');
    runFx.steps.set({}); // Initialize the steps container

    // 2. Add this run to the request's history array.
    if (!requestFx.runs.val()) {
      requestFx.runs.set([]);
    }
    // We get the array and push to it, which mutates the underlying array held by the fx node.
    requestFx.runs.val().push(runFx);

    logger.info(`Starting new run for request.`, { requestId: requestFx.__id, runId: runFx.__id });

    // 3. Start the execution loop from the defined startNode.
    let currentStepId = definition.startNode.val();
    let loopGuard = 0; // To prevent infinite loops in malformed definitions.
    const MAX_STEPS = 100;

    while (currentStepId && loopGuard < MAX_STEPS) {
      loopGuard++;
      const stepDefNode = definition.nodes[currentStepId];

      if (!stepDefNode) {
        const errorMsg = `Process execution failed: Step ID "${currentStepId}" not found in definition.`;
        logger.error(errorMsg, { requestId: requestFx.__id, runId: runFx.__id });
        runFx.status.set('failed');
        runFx.error.set(errorMsg);
        break; // Exit the loop
      }

      // Create a node within the current run to log this step's execution details.
      const stepRunNode = runFx.steps[currentStepId] = fx.createNode(runFx.__id);
      stepRunNode.status.set('running');
      stepRunNode.startTime.set(new Date().toISOString());

      let nextStepId: string | null = null;

      try {
        // The executor's class name is stored in the `__proto` of the definition step.
        const executorClassName = stepDefNode.__proto;
        const ExecutorClass = classRegistry.get(executorClassName);

        if (!ExecutorClass) {
          throw new Error(`Executor class "${executorClassName}" is not registered in the fx.classRegistry.`);
        }

        const executorConfig = stepDefNode.config.val() || {};
        const executorInstance = new ExecutorClass(executorConfig);

        logger.debug(`Executing step: ${currentStepId} (${executorClassName})`, { runId: runFx.__id });

        // The executor's `run` method performs the actual work.
        const result = await executorInstance.run(requestFx);

        // Log success on the step's execution node.
        stepRunNode.status.set('completed');
        stepRunNode.result.set(result);
        logger.debug(`Step ${currentStepId} completed successfully.`, { runId: runFx.__id, result });
        
        // Follow the `onSuccess` connection to get the ID of the next step.
        nextStepId = stepDefNode.connections.onSuccess.val();

      } catch (error: any) {
        logger.error(`Step ${currentStepId} failed.`, { runId: runFx.__id, error: error.message });

        // Log failure on the step's execution node.
        stepRunNode.status.set('failed');
        stepRunNode.error.set({ message: error.message, stack: error.stack });

        // Mark the entire run as failed.
        runFx.status.set('failed');
        
        // Follow the `onFailure` connection. If it doesn't exist, terminate the loop.
        nextStepId = stepDefNode.connections.onFailure.val() || null;
      } finally {
        stepRunNode.endTime.set(new Date().toISOString());
        currentStepId = nextStepId;
      }
    }

    if (loopGuard >= MAX_STEPS) {
        const errorMsg = 'Process execution failed: Maximum step limit reached. Check for infinite loops in definition.';
        logger.error(errorMsg, { requestId: requestFx.__id, runId: runFx.__id });
        runFx.status.set('failed');
        runFx.error.set(errorMsg);
    }

    // If the loop finished and the status is still 'running', it means we completed successfully.
    if (runFx.status.val() === 'running') {
      runFx.status.set('completed');
    }
    
    logger.info(`Run finished with status: ${runFx.status.val()}`, { requestId: requestFx.__id, runId: runFx.__id });
  }
}