import localforage from 'localforage'
import { supabase } from './supabase'

export interface QueuedMutation {
  id: string
  table: string
  recordId: string
  patch: Record<string, any>
  timestamp: number
}

const mutationQueue = localforage.createInstance({
  name: 'mutations'
})

export async function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
  const queuedMutation: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  }

  try {
    // Get existing queue
    const existingQueue: QueuedMutation[] = await mutationQueue.getItem('queue') || []
    
    // Add new mutation
    const updatedQueue = [...existingQueue, queuedMutation]
    
    // Save updated queue
    await mutationQueue.setItem('queue', updatedQueue)
    
    console.log('Mutation queued:', queuedMutation)
    return queuedMutation
  } catch (error) {
    console.error('Failed to queue mutation:', error)
    throw error
  }
}

export async function flushMutationQueue(): Promise<{ success: number; failed: number }> {
  try {
    const queue: QueuedMutation[] = await mutationQueue.getItem('queue') || []
    
    if (queue.length === 0) {
      return { success: 0, failed: 0 }
    }

    console.log(`Flushing ${queue.length} queued mutations...`)
    
    let successCount = 0
    let failedCount = 0
    const remainingQueue: QueuedMutation[] = []

    // Process mutations sequentially to maintain order
    for (const mutation of queue) {
      try {
        console.log('Processing mutation:', mutation)
        
        const { error } = await supabase
          .from(mutation.table)
          .update(mutation.patch)
          .eq('id', mutation.recordId)

        if (error) {
          console.error('Mutation failed:', error)
          remainingQueue.push(mutation) // Keep failed mutations in queue
          failedCount++
        } else {
          console.log('Mutation succeeded:', mutation.id)
          successCount++
        }
      } catch (error) {
        console.error('Mutation error:', error)
        remainingQueue.push(mutation) // Keep failed mutations in queue
        failedCount++
      }
    }

    // Update queue with only failed mutations
    await mutationQueue.setItem('queue', remainingQueue)
    
    console.log(`Queue flush complete: ${successCount} success, ${failedCount} failed`)
    return { success: successCount, failed: failedCount }
  } catch (error) {
    console.error('Failed to flush mutation queue:', error)
    return { success: 0, failed: 0 }
  }
}

export async function getQueueLength(): Promise<number> {
  try {
    const queue: QueuedMutation[] = await mutationQueue.getItem('queue') || []
    return queue.length
  } catch (error) {
    console.error('Failed to get queue length:', error)
    return 0
  }
}

// Set up online/offline listeners
let isOnlineListenerRegistered = false

export function registerOnlineListener() {
  if (isOnlineListenerRegistered || typeof window === 'undefined') return
  
  isOnlineListenerRegistered = true
  
  window.addEventListener('online', async () => {
    console.log('Coming back online, flushing mutation queue...')
    try {
      const result = await flushMutationQueue()
      if (result.success > 0) {
        console.log(`Successfully synced ${result.success} queued mutations`)
      }
    } catch (error) {
      console.error('Failed to flush queue on coming online:', error)
    }
  })

  window.addEventListener('offline', () => {
    console.log('Gone offline, mutations will be queued')
  })
}