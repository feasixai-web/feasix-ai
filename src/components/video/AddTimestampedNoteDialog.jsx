import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';

export default function AddTimestampedNoteDialog({ isOpen, onClose, onSave, currentTime }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState(currentTime || '00:00:00');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    
    onSave({
      timestamp,
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString()
    });
    
    // Reset form
    setTitle('');
    setContent('');
    setTimestamp('00:00:00');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTimestamp(currentTime || '00:00:00');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-zinc-100">Create timestamped note</DialogTitle>
            <button
              onClick={handleClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <Clock className="h-4 w-4 text-zinc-400" />
              <Input
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="00:00:00"
                className="w-24 bg-transparent border-none text-zinc-100 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <textarea
            placeholder="Add note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[200px] p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-y"
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}