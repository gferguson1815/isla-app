import { sendMagicLinkFallback } from './email-service'

interface EmailQueueItem {
  email: string
  type: 'magic-link' | 'notification'
  attempts: number
  maxAttempts: number
  nextRetry: number
  data: {
    magicLink?: string
    subject?: string
    content?: string
  }
}

class EmailRetryQueue {
  private queue: Map<string, EmailQueueItem> = new Map()
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start processing queue every 30 seconds
    this.startProcessing()
  }

  async add(item: EmailQueueItem): Promise<void> {
    const key = `${item.email}-${item.type}`
    this.queue.set(key, item)
    console.log(`Added email to retry queue: ${key}`)
  }

  private async processQueue(): Promise<void> {
    const now = Date.now()
    const itemsToProcess: [string, EmailQueueItem][] = []

    // Find items ready for retry
    for (const [key, item] of this.queue.entries()) {
      if (item.nextRetry <= now && item.attempts < item.maxAttempts) {
        itemsToProcess.push([key, item])
      } else if (item.attempts >= item.maxAttempts) {
        // Remove items that exceeded max attempts
        this.queue.delete(key)
        console.error(`Email retry failed after ${item.maxAttempts} attempts: ${key}`)
      }
    }

    // Process items
    for (const [key, item] of itemsToProcess) {
      await this.processItem(key, item)
    }
  }

  private async processItem(key: string, item: EmailQueueItem): Promise<void> {
    console.log(`Retrying email: ${key} (attempt ${item.attempts + 1}/${item.maxAttempts})`)

    let success = false

    if (item.type === 'magic-link' && item.data.magicLink) {
      const result = await sendMagicLinkFallback(item.email, item.data.magicLink)
      success = result.success
    }

    if (success) {
      // Remove from queue on success
      this.queue.delete(key)
      console.log(`Email retry successful: ${key}`)
    } else {
      // Update item for next retry
      item.attempts++
      item.nextRetry = Date.now() + this.getRetryDelay(item.attempts)
      this.queue.set(key, item)
      console.log(`Email retry failed, will retry again: ${key}`)
    }
  }

  private getRetryDelay(attempts: number): number {
    // Exponential backoff: 1 minute, 2 minutes, 4 minutes
    return Math.min(60000 * Math.pow(2, attempts - 1), 240000)
  }

  private startProcessing(): void {
    if (!this.processingInterval) {
      this.processingInterval = setInterval(() => {
        this.processQueue().catch(error => {
          console.error('Error processing email retry queue:', error)
        })
      }, 30000) // Check every 30 seconds

      // Also process immediately on startup
      this.processQueue().catch(error => {
        console.error('Error processing email retry queue:', error)
      })
    }
  }

  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  public getQueueSize(): number {
    return this.queue.size
  }

  public getQueueStatus(): { size: number; items: EmailQueueItem[] } {
    return {
      size: this.queue.size,
      items: Array.from(this.queue.values())
    }
  }
}

// Create singleton instance
export const emailRetryQueue = new EmailRetryQueue()

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => emailRetryQueue.stop())
  process.on('SIGINT', () => emailRetryQueue.stop())
  process.on('SIGTERM', () => emailRetryQueue.stop())
}