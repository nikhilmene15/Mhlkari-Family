'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { format, parseISO } from 'date-fns';
import {
  BsQrCode, BsPlus, BsXLg, BsCheckCircleFill, BsTrash
} from 'react-icons/bs';
import '@/styles/payments.css';

export default function PaymentsPage() {
  const supabase = getSupabaseClient();
  const [payments, setPayments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', description: '', upi_id: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchPayments();
    fetchProfiles();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*, creator:created_by(full_name)')
      .order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, full_name');
    setProfiles(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const qrData = `upi://pay?pa=${form.upi_id}&am=${form.amount}&tn=${encodeURIComponent(form.title)}`;
    const { error } = await supabase.from('payments').insert({
      ...form,
      amount: parseFloat(form.amount),
      qr_data: qrData,
      status: 'pending',
      paid_by: [],
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment request created!');
    setShowAdd(false);
    setForm({ title: '', amount: '', description: '', upi_id: '' });
    fetchPayments();
  }

  async function handleMarkPaid(payment) {
    if (!user) return;
    const updatedPaidBy = [...(payment.paid_by || [])];
    if (!updatedPaidBy.includes(user.id)) updatedPaidBy.push(user.id);
    const allPaid = profiles.length > 0 && updatedPaidBy.length >= profiles.length;
    await supabase.from('payments').update({
      paid_by: updatedPaidBy,
      status: allPaid ? 'paid' : 'partial',
    }).eq('id', payment.id);
    toast.success('Marked as paid!');
    fetchPayments();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this payment request?')) return;
    await supabase.from('payments').delete().eq('id', id);
    toast.success('Payment deleted');
    fetchPayments();
  }

  const getName = (id) => profiles.find((p) => p.id === id)?.full_name || 'Member';

  return (
    <div className="container section">
      <PageHeader
        icon={<BsQrCode />}
        title="QR Payments"
        subtitle="Share UPI QR codes for collections, contributions and fund-raising"
        badge="Payments"
        action={
          user && (
            <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
              <BsPlus style={{ fontSize: '1.2rem' }} /> Create Request
            </button>
          )
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<BsQrCode />}
          title="No payment requests yet"
          description="Create a payment request with a QR code for family members to scan"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
                <BsPlus /> Create Request
              </button>
            )
          }
        />
      ) : (
        <div className="payments-grid">
          {payments.map((payment) => {
            const hasPaid = user && (payment.paid_by || []).includes(user.id);
            return (
              <div key={payment.id} className="payment-card">
                <div className="payment-card-header">
                  <div>
                    <div className="payment-title">{payment.title}</div>
                    {payment.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {payment.description}
                      </p>
                    )}
                  </div>
                  <span className={`payment-status status-${payment.status}`}>
                    {payment.status === 'paid' ? '✓ Paid' : payment.status === 'partial' ? '~ Partial' : '⏳ Pending'}
                  </span>
                </div>

                <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                  <span className="payment-amount">{parseFloat(payment.amount).toLocaleString('en-IN')}</span>
                </div>

                {/* QR Code */}
                {payment.qr_data && (
                  <div className="qr-area">
                    <div className="qr-wrapper">
                      <QRCodeSVG
                        value={payment.qr_data}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                )}

                {/* Paid by */}
                {(payment.paid_by || []).length > 0 && (
                  <div className="payment-payers">
                    <div className="payment-payers-label">PAID BY</div>
                    <div className="payers-list">
                      {payment.paid_by.map((uid) => (
                        <span key={uid} className="payer-chip">
                          <BsCheckCircleFill style={{ fontSize: '0.7rem' }} /> {getName(uid)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="payment-card-footer">
                  <span className="payment-upi">{payment.upi_id}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {format(parseISO(payment.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {user && !hasPaid && payment.status !== 'paid' && (
                  <button className="mark-paid-btn" onClick={() => handleMarkPaid(payment)}>
                    <BsCheckCircleFill style={{ marginRight: 6 }} /> Mark as Paid
                  </button>
                )}
                {user && (
                  <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDelete(payment.id)}>
                      <BsTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Create Payment Request</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><BsXLg /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-custom">Title</label>
                <input className="input-custom" required placeholder="e.g. Diwali Fund Collection" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label-custom">Amount (₹)</label>
                <input className="input-custom" type="number" required min="1" step="0.01" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="label-custom">UPI ID</label>
                <input className="input-custom" required placeholder="name@upi" value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} />
              </div>
              <div>
                <label className="label-custom">Description (optional)</label>
                <textarea className="input-custom" rows={2} placeholder="What is this for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              {form.upi_id && form.amount && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
                  <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
                    <QRCodeSVG
                      value={`upi://pay?pa=${form.upi_id}&am=${form.amount}&tn=${encodeURIComponent(form.title || 'Payment')}`}
                      size={120}
                      level="M"
                    />
                  </div>
                </div>
              )}
              <button className="btn-primary-custom" style={{ justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Creating…' : 'Create Payment Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
