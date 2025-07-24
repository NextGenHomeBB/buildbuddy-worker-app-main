import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface RelationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  srcTask: { id: string; title: string } | null
  destTask: { id: string; title: string } | null
  onConfirm: (relation: 'blocks' | 'relates' | 'duplicate') => void
  isLoading?: boolean
}

export function RelationDialog({ 
  open, 
  onOpenChange, 
  srcTask, 
  destTask, 
  onConfirm,
  isLoading = false
}: RelationDialogProps) {
  const [selectedRelation, setSelectedRelation] = useState<'blocks' | 'relates' | 'duplicate'>('relates')

  const handleConfirm = () => {
    onConfirm(selectedRelation)
    onOpenChange(false)
  }

  if (!srcTask || !destTask) return null

  const relationDescriptions = {
    blocks: `"${srcTask.title}" must be completed before "${destTask.title}" can start`,
    relates: `"${srcTask.title}" is related to "${destTask.title}"`,
    duplicate: `"${srcTask.title}" is a duplicate of "${destTask.title}"`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task Relationship</DialogTitle>
          <DialogDescription>
            Choose how these tasks are related to each other.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-1">From: {srcTask.title}</div>
            <div className="font-medium">To: {destTask.title}</div>
          </div>

          <RadioGroup 
            value={selectedRelation} 
            onValueChange={(value) => setSelectedRelation(value as typeof selectedRelation)}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="blocks" id="blocks" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="blocks" className="font-medium">Blocks</Label>
                  <p className="text-xs text-muted-foreground">
                    One task must be completed before the other can start
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="relates" id="relates" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="relates" className="font-medium">Related</Label>
                  <p className="text-xs text-muted-foreground">
                    Tasks are connected but don't block each other
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="duplicate" id="duplicate" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="duplicate" className="font-medium">Duplicate</Label>
                  <p className="text-xs text-muted-foreground">
                    Tasks represent the same work
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {relationDescriptions[selectedRelation]}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Relationship'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}