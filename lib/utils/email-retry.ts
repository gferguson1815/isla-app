import { TRPCError } from '@trpc/server';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export interface EmailQueueItem {
  id: string;
  to: string;
  data: any;
  attempts: number;
  nextRetry?: Date;
  lastError?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  createdAt: Date;
}

// In-memory queue for email retries (in production, use Redis or database)
const emailQueue = new Map<string, EmailQueueItem>();

/**
 * Send email with exponential backoff retry
 */
export async function sendEmailWithRetry<T>(
  emailFn: (data: T) => Promise<void>,
  data: T & { to: string },
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    backoffFactor = 2,
  } = options;

  let attempt = 0;
  let delay = initialDelay;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      // Attempt to send email
      await emailFn(data);

      // Success - log and return
      console.log(`Email sent successfully to ${data.to} on attempt ${attempt}`);

      // Store successful send in queue for monitoring
      const queueId = `${data.to}-${Date.now()}`;
      emailQueue.set(queueId, {
        id: queueId,
        to: data.to,
        data,
        attempts: attempt,
        status: 'sent',
        createdAt: new Date(),
      });

      // Clean up old entries periodically
      cleanupOldQueueEntries();

      return;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `Email send attempt ${attempt} failed for ${data.to}:`,
        error
      );

      if (attempt < maxAttempts) {
        // Calculate next delay with exponential backoff
        delay = Math.min(delay * backoffFactor, maxDelay);

        console.log(
          `Retrying email to ${data.to} in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`
        );

        // Store retry in queue
        const queueId = `${data.to}-${Date.now()}`;
        emailQueue.set(queueId, {
          id: queueId,
          to: data.to,
          data,
          attempts: attempt,
          nextRetry: new Date(Date.now() + delay),
          lastError: lastError.message,
          status: 'pending',
          createdAt: new Date(),
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed - store failure and throw
  const queueId = `${data.to}-${Date.now()}`;
  emailQueue.set(queueId, {
    id: queueId,
    to: data.to,
    data,
    attempts: attempt,
    lastError: lastError?.message,
    status: 'failed',
    createdAt: new Date(),
  });

  console.error(
    `Failed to send email to ${data.to} after ${maxAttempts} attempts`
  );

  // Don't throw error to prevent blocking the invitation process
  // The invitation is still created, just the email failed
}

/**
 * Process pending emails in queue (for background processing)
 */
export async function processEmailQueue<T>(
  emailFn: (data: T) => Promise<void>
): Promise<void> {
  const now = new Date();
  const pendingEmails = Array.from(emailQueue.values()).filter(
    item =>
      item.status === 'pending' &&
      item.nextRetry &&
      item.nextRetry <= now
  );

  for (const item of pendingEmails) {
    item.status = 'processing';

    try {
      await emailFn(item.data);
      item.status = 'sent';
      console.log(`Successfully sent queued email to ${item.to}`);
    } catch (error) {
      item.lastError = (error as Error).message;
      item.attempts++;

      if (item.attempts < 3) {
        // Schedule next retry
        const delay = Math.min(1000 * Math.pow(2, item.attempts), 60000);
        item.nextRetry = new Date(Date.now() + delay);
        item.status = 'pending';
      } else {
        item.status = 'failed';
        console.error(`Queued email to ${item.to} failed after ${item.attempts} attempts`);
      }
    }
  }
}

/**
 * Get email queue statistics
 */
export function getEmailQueueStats() {
  const items = Array.from(emailQueue.values());

  return {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    processing: items.filter(i => i.status === 'processing').length,
    sent: items.filter(i => i.status === 'sent').length,
    failed: items.filter(i => i.status === 'failed').length,
    items: items.slice(0, 100), // Return first 100 items for monitoring
  };
}

/**
 * Clean up old queue entries to prevent memory bloat
 */
function cleanupOldQueueEntries() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

  for (const [key, item] of emailQueue.entries()) {
    if (item.createdAt < cutoff && (item.status === 'sent' || item.status === 'failed')) {
      emailQueue.delete(key);
    }
  }
}

/**
 * Start background queue processor (call this on server startup)
 */
export function startEmailQueueProcessor<T>(
  emailFn: (data: T) => Promise<void>,
  intervalMs = 30000 // Process queue every 30 seconds
) {
  setInterval(() => {
    processEmailQueue(emailFn).catch(console.error);
  }, intervalMs);

  console.log(`Email queue processor started (interval: ${intervalMs}ms)`);
}