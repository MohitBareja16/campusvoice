'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CreateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLink: (title: string) => void;
  isSubmitting: boolean;
}

export function CreateLinkModal({ open, onOpenChange, onCreateLink, isSubmitting }: CreateLinkModalProps) {
  const [title, setTitle] = useState('');
  const toast = useToast();

  const handleSubmit = () => {
    if (title.trim().length < 3) {
      toast.error('Title is too short', {
        description: 'Please enter a title with at least 3 characters.',
      });
      return;
    }
    onCreateLink(title);
    setTitle(''); // Reset title after creation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Feedback Link</DialogTitle>
          <DialogDescription>
            Give your new feedback link a descriptive title. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Lecture 5 Feedback"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
