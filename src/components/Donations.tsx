import { useEffect, useRef, useState } from 'react';
import { DollarSign, Heart, TrendingUp, Users, Calendar, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { donationsAPI } from '../services/api';
import { OptimizedImage } from './OptimizedImage';

interface DonationsProps {
  darkMode: boolean;
  currentUser?: any;
}

// Placeholder donation data - will be replaced with actual API calls
interface DonationCampaign {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  imageUrl?: string;
}

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  paymentMethod: string;
  campaign: string;
  status: 'Pending' | 'Verified' | 'Completed';
  timestamp: string;
}

export default function Donations({ darkMode, currentUser }: DonationsProps) {
  void darkMode;
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('General Fund');
  
  // Donation form state
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrAuditor = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Auditor');
  const [settings, setSettings] = useState<{ gcash?: any; paymaya?: any; methods?: any[] } | null>(null);
  useEffect(() => {
    fetchDonationData();
    fetchSettings();
  }, []);

  const fetchDonationData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // const campaignsResponse = await donationsAPI.getCampaigns();
      // const donationsResponse = await donationsAPI.getDonations();
      
      // Placeholder data
      setCampaigns([
        {
          id: 'CAMP-001',
          name: 'General Fund',
          description: 'Support our ongoing programs and operational costs',
          targetAmount: 50000,
          currentAmount: 12500,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          status: 'Active',
        },
        {
          id: 'CAMP-002',
          name: 'Youth Leadership Training',
          description: 'Fund leadership training workshops for youth members',
          targetAmount: 25000,
          currentAmount: 8000,
          startDate: '2025-10-01',
          endDate: '2025-12-31',
          status: 'Active',
        },
      ]);

      if (isAdminOrAuditor) {
        // Only load donation records for Admin/Auditor
        setDonations([
          {
            id: 'DON-001',
            donorName: 'Anonymous Donor',
            amount: 5000,
            paymentMethod: 'GCash',
            campaign: 'General Fund',
            status: 'Verified',
            timestamp: '2025-10-30 14:30:00',
          },
          {
            id: 'DON-002',
            donorName: 'Maria Santos',
            amount: 2500,
            paymentMethod: 'Bank Transfer',
            campaign: 'Youth Leadership Training',
            status: 'Pending',
            timestamp: '2025-10-31 09:15:00',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching donation data:', error);
      toast.error('Failed to load donation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      // Try loading settings from backend, if available
      try {
        const s = await donationsAPI.getSettings();
        if (s?.settings) setSettings(s.settings);
      } catch {
        // Backend might not be ready; keep defaults
      }
      // Ensure settings object exists
      setSettings(prev => prev ?? { gcash: {}, paymaya: {}, methods: [] });
    } catch (err) {
      console.error('Error loading donation settings:', err);
    }
  };

  const handleSubmitDonation = async () => {
    // Validation
    if (!donorName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!donorContact.trim()) {
      toast.error('Please enter your contact information');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }
    if (!referenceNumber.trim()) {
      toast.error('Please enter the payment reference number');
      return;
    }

    try {
      setSubmitting(true);
      
      // TODO: Replace with actual API call
      // const response = await donationsAPI.submitDonation({
      //   donorName,
      //   contact: donorContact,
      //   amount: parseFloat(amount),
      //   paymentMethod,
      //   campaign: selectedCampaign,
      //   referenceNumber,
      //   notes,
      //   receiptBase64,
      // });

      const payload = {
        donorName,
        contact: donorContact,
        amount: parseFloat(amount),
        paymentMethod,
        campaign: selectedCampaign,
        referenceNumber,
        notes,
        receiptBase64,
      };
      console.debug('Submitting donation (simulated)', payload);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Donation submitted successfully!', {
        description: 'Thank you for your generous support. Your donation will be verified shortly.',
      });

      // Reset form
      setDonorName('');
      setDonorContact('');
      setAmount('');
      setPaymentMethod('GCash');
      setReferenceNumber('');
      setNotes('');
      setReceiptBase64(null);
      setReceiptPreview(null);
      
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for receipt');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Receipt image must be less than 10MB');
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setReceiptBase64(base64);
    setReceiptPreview(base64);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'Completed':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'Pending':
        return <Clock size={18} className="text-yellow-500" />;
      case 'Cancelled':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        <div className="ysp-card">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="ysp-card bg-gradient-to-br from-[#f6421f] to-[#ee8724] text-white">
      <div className="ysp-card bg-gradient-to-br from-[#f6421f] to-[#ee8724] text-white">
          <Heart size={32} />
          <h1 className="text-white m-0">Support Our Mission</h1>
        </div>
        <p className="text-white/90 text-lg">
          Your donations help us continue our work in empowering youth and serving our community. 
          Every contribution makes a difference!
        </p>
      </div>

      {/* Payment Methods / QR Codes (Visible to everyone) */}
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <Heart size={24} />
          Donate via GCash / PayMaya
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2">GCash</h4>
            {settings?.gcash?.qrImageUrl ? (
              <OptimizedImage
                src={settings.gcash.qrImageUrl}
                alt="GCash QR"
                className="w-full max-w-xs rounded-lg"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <p className="text-sm text-gray-500">GCash QR not set yet.</p>
            )}
            {settings?.gcash?.accountName && (
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                Account: <strong>{settings.gcash.accountName}</strong>
              </p>
            )}
          </div>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2">PayMaya</h4>
            {settings?.paymaya?.qrImageUrl ? (
              <OptimizedImage
                src={settings.paymaya.qrImageUrl}
                alt="PayMaya QR"
                className="w-full max-w-xs rounded-lg"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <p className="text-sm text-gray-500">PayMaya QR not set yet.</p>
            )}
            {settings?.paymaya?.accountName && (
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                Account: <strong>{settings.paymaya.accountName}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Active Campaigns
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const progress = (campaign.currentAmount / campaign.targetAmount) * 100;
            
            return (
              <div
                key={campaign.id}
                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                  selectedCampaign === campaign.name
                    ? 'border-[#f6421f] bg-orange-50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedCampaign(campaign.name)}
              >
                <h3 className="text-[#f6421f] dark:text-[#ee8724] text-lg mb-2">{campaign.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{campaign.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      ₱{campaign.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ₱{campaign.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#f6421f] to-[#ee8724] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {progress.toFixed(1)}% of goal reached
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>Until {new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Form */}
      <div className="ysp-card">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
          <DollarSign size={24} />
          Make a Donation
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="donorName">Your Name</Label>
            <Input
              id="donorName"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="donorContact">Contact (Email or Phone)</Label>
            <Input
              id="donorContact"
              value={donorContact}
              onChange={(e) => setDonorContact(e.target.value)}
              placeholder="your.email@example.com or 09XX-XXX-XXXX"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="amount">Donation Amount (PHP)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayMaya">PayMaya</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="campaign">Select Campaign</Label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.name}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="referenceNumber">Reference/Transaction Number</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number"
              className="mt-1"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional message or dedication..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Receipt Upload */}
        <div className="mb-6">
          <Label>Upload Payment Receipt (Image)</Label>
          <div className="flex items-center gap-3 mt-2">
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptSelect}
              style={{ display: 'none' }}
            />
            <Button
              onClick={() => receiptInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload size={16} /> Choose Image
            </Button>
            {receiptPreview && <span className="text-sm text-gray-600 dark:text-gray-400">Image selected</span>}
          </div>
          {receiptPreview && (
            <img src={receiptPreview} alt="Receipt Preview" className="mt-3 w-40 h-40 object-cover rounded-lg border" />
          )}
          <p className="text-xs text-gray-500 mt-2">Max size: 10MB. Accepted: JPG/PNG.</p>
        </div>

        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Payment Instructions:</strong><br />
            • For GCash: Send to 0917-XXX-XXXX (YSP Tagum Chapter)<br />
            • For Bank Transfer: BDO Account #XXXX-XXXX-XXXX<br />
            • After payment, submit this form with your reference number
          </p>
        </div>

        <Button
          onClick={handleSubmitDonation}
          disabled={submitting}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] text-white"
        >
          {submitting ? (
            <>
              <Clock className="mr-2 animate-spin" size={18} />
              Submitting...
            </>
          ) : (
            <>
              <Heart className="mr-2" size={18} />
              Submit Donation
            </>
          )}
        </Button>
      </div>

      {/* Admin/Auditor Section - Donation Management */}
      {isAdminOrAuditor && (
        <>
          {/* Admin: Payment Method Settings */}
          <div className="ysp-card">
            <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Payment Method Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload or update QR codes for GCash and PayMaya.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {['GCash','PayMaya'].map((method) => (
                <QrUploadCard key={method} method={method} currentUser={currentUser} settings={settings} setSettings={setSettings} />
              ))}
            </div>
          </div>

          <div className="ysp-card">
            <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4 flex items-center gap-2">
              <Users size={24} />
              Donation Management (Admin/Auditor Only)
            </h2>

            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Donations</span>
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  ₱{campaigns.reduce((sum, c) => sum + c.currentAmount, 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</span>
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {campaigns.filter(c => c.status === 'Active').length}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</span>
                  <Clock size={20} className="text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {donations.filter(d => d.status === 'Pending').length}
                </p>
              </div>
            </div>

            {/* Recent Donations Table */}
            <h3 className="text-lg font-semibold mb-3">Recent Donations</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Donor</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Campaign</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Method</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm">{donation.id}</td>
                      <td className="px-4 py-3 text-sm">{donation.donorName}</td>
                      <td className="px-4 py-3 text-sm font-semibold">₱{donation.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{donation.campaign}</td>
                      <td className="px-4 py-3 text-sm">{donation.paymentMethod}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(donation.status)}
                          <span>{donation.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(donation.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {donations.length === 0 && (
              <p className="text-center text-gray-500 py-8">No donations recorded yet.</p>
            )}
          </div>
        </>
      )}

      {/* Thank You Message */}
      <div className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800 text-center">
        <Heart size={48} className="mx-auto mb-4 text-[#f6421f]" />
        <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Thank You for Your Support!</h3>
        <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Your generous donations enable us to continue our mission of empowering youth and serving our community. 
          Every contribution, no matter the size, makes a significant impact on the lives we touch.
        </p>
      </div>
    </div>
  );
}

// Admin helper card for uploading QR codes
function QrUploadCard({ method, currentUser, settings, setSettings }: { method: string; currentUser: any; settings: any; setSettings: (s: any) => void; }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    try {
      if (!currentUser?.id) {
        toast.error('User session invalid');
        return;
      }
      setUploading(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      // Attempt to upload via donationsAPI
      let imageUrl: string | undefined;
      try {
        const up = await donationsAPI.uploadPaymentQr(base64, file.name, file.type, method, currentUser.id);
        if (up.success && up.imageUrl) imageUrl = up.imageUrl;
      } catch (err) {
        // If backend not ready, simulate URL using base64 (temporary)
        imageUrl = base64;
      }
      // Update local settings state
      const methods = settings?.methods ? [...settings.methods] : [];
      const idx = methods.findIndex((m: any) => (m.method || '').toLowerCase() === method.toLowerCase());
      const updated = { method, qrImageUrl: imageUrl, active: true, accountName: settings?.[method.toLowerCase()]?.accountName || '' };
      if (idx >= 0) methods[idx] = { ...methods[idx], ...updated };
      else methods.push(updated);
      const newSettings = { ...settings, methods, [method.toLowerCase()]: updated };
      setSettings(newSettings);
      // Try save settings
      try {
        await donationsAPI.updateSettings({ methods }, currentUser.id);
        toast.success(`${method} QR updated`);
      } catch (err) {
        toast.info(`${method} QR set locally. Save to backend when available.`);
      }
    } catch (err: any) {
      console.error('QR upload error:', err);
      toast.error(err?.message || 'Failed to upload QR');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const current = settings?.[method.toLowerCase()];
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{method} QR</h4>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSelect} />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-2">
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload QR'}
        </Button>
      </div>
      {current?.qrImageUrl ? (
        <OptimizedImage src={current.qrImageUrl} alt={`${method} QR`} className="w-full max-w-xs rounded-lg" />
      ) : (
        <p className="text-sm text-gray-500">No QR uploaded yet.</p>
      )}
    </div>
  );
}
