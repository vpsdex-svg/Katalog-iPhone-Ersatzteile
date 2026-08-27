import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function ContactDialog({ open, onOpenChange, company }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    const to = company?.email || '';
    const subject = encodeURIComponent(`Kontaktanfrage von ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nE-Mail: ${form.email}\n\nNachricht:\n${form.message}`
    );
    if (to) {
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    }
    setTimeout(() => {
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      setSending(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(() => setSent(false), 200); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kontaktanfrage senden</DialogTitle>
          <DialogDescription>
            Schreiben Sie uns – wir melden uns schnellstmöglich zurück.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900">Nachricht gesendet!</p>
            <p className="text-sm text-slate-500 mt-1">Vielen Dank für Ihre Anfrage.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" value={form.name} onChange={handleChange('name')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-Mail</Label>
              <Input id="c-email" type="email" value={form.email} onChange={handleChange('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Nachricht</Label>
              <Textarea id="c-msg" value={form.message} onChange={handleChange('message')} rows={4} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={sending} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Wird geöffnet…' : 'Senden'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}